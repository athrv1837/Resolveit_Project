package com.resolveit.resloveitbackend.serviceImpl;

import com.resolveit.resloveitbackend.dto.AuthResponse;
import com.resolveit.resloveitbackend.dto.RegisterRequest;
import com.resolveit.resloveitbackend.enums.Role;
import com.resolveit.resloveitbackend.Model.*;
import com.resolveit.resloveitbackend.repository.*;
import com.resolveit.resloveitbackend.security.JwtUtil;
import com.resolveit.resloveitbackend.service.AuthService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.time.LocalDateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

import com.resolveit.resloveitbackend.Model.PasswordResetToken;
import com.resolveit.resloveitbackend.repository.PasswordResetTokenRepository;
import com.resolveit.resloveitbackend.service.EmailService;
import com.resolveit.resloveitbackend.exception.InvalidCredentialsException;
import com.resolveit.resloveitbackend.exception.EmailAlreadyRegisteredException;
import com.resolveit.resloveitbackend.exception.PendingApprovalException;
import com.resolveit.resloveitbackend.exception.ResourceNotFoundException;

@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final UserRepository userRepository;
    private final OfficerRepository officerRepository;
    private final PendingOfficerRepository pendingOfficerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;

    public AuthServiceImpl(UserRepository userRepository,
                           OfficerRepository officerRepository,
                           PendingOfficerRepository pendingOfficerRepository,
                           PasswordEncoder passwordEncoder,
                           JwtUtil jwtUtil,
                           PasswordResetTokenRepository tokenRepository,
                           EmailService emailService) {
        this.userRepository = userRepository;
        this.officerRepository = officerRepository;
        this.pendingOfficerRepository = pendingOfficerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.tokenRepository = tokenRepository;
        this.emailService = emailService;
    }

    @Override
    public AuthResponse login(String email, String rawPassword) {
        Optional<User> optionalUser = userRepository.findByEmail(email);

        if (optionalUser.isEmpty()) {
            Optional<Officer> officerOpt = officerRepository.findByEmail(email);
            if (officerOpt.isPresent()) {
                Officer officer = officerOpt.get();

                if (!passwordEncoder.matches(rawPassword, officer.getPassword())) {
                    throw new InvalidCredentialsException("Invalid password. Please try again.");
                }

                String token = jwtUtil.generateToken(officer.getEmail(), "ROLE_OFFICER");
                return new AuthResponse(
                        token,
                        officer.getId(),
                        officer.getEmail(),
                        officer.getName(),
                        "ROLE_OFFICER"
                );
            }

            throw new ResourceNotFoundException("No user found with this email. Please register first.");
        }

        User user = optionalUser.get();

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new InvalidCredentialsException("Invalid password. Please try again.");
        }

        if (user.getRole() == Role.ROLE_OFFICER) {
            boolean approved = officerRepository.findByEmail(user.getEmail()).isPresent();
            if (!approved) {
                throw new PendingApprovalException(
                        "Your officer account is pending admin approval. Please wait until approved."
                );
            }
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(
                token,
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getRole().name()
        );
    }

    @Override
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new EmailAlreadyRegisteredException("This email is already registered. Please use a different email.");
        }

        Role role;
        switch (req.getRole().toLowerCase()) {
            case "officer":
                role = Role.ROLE_OFFICER;
                break;
            case "admin":
                role = Role.ROLE_ADMIN;
                break;
            default:
                role = Role.ROLE_CITIZEN;
                break;
        }

        if (role == Role.ROLE_OFFICER) {
            if (pendingOfficerRepository.findByEmail(req.getEmail()).isPresent()) {
                throw new PendingApprovalException("Your officer registration is already pending approval.");
            }

            PendingOfficer pending = PendingOfficer.builder()
                    .name(req.getName())
                    .email(req.getEmail())
                    .password(passwordEncoder.encode(req.getPassword()))
                    .department("Unassigned")
                    .approved(false)
                    .build();

            pendingOfficerRepository.save(pending);
            throw new PendingApprovalException(
                    "Officer registration submitted for admin approval. You cannot log in yet."
            );
        }

        User newUser = new User(
                req.getName(),
                req.getEmail(),
                passwordEncoder.encode(req.getPassword()),
                role
        );

        userRepository.save(newUser);

        // Send welcome email (non-blocking)
        try { emailService.sendRegistrationEmail(newUser.getEmail(), newUser.getName()); } catch (Exception ignored) {}

        String token = jwtUtil.generateToken(newUser.getEmail(), newUser.getRole().name());
        return new AuthResponse(
                token,
                newUser.getId(),
                newUser.getEmail(),
                newUser.getName(),
                newUser.getRole().name()
        );
    }

    @Override
    public void requestPasswordReset(String email) {
        // Only generate if an account exists
        boolean exists = userRepository.existsByEmail(email) || officerRepository.existsByEmail(email);
        if (!exists) return; // silently ignore to avoid leaking accounts

        String token = UUID.randomUUID().toString();
        PasswordResetToken t = new PasswordResetToken(token, email, LocalDateTime.now().plusHours(1));
        tokenRepository.save(t);
        emailService.sendPasswordResetEmail(email, token);
    }

    @Override
    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken t = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired token"));

        if (t.getExpiresAt().isBefore(LocalDateTime.now())) {
            // remove expired token within transaction
            tokenRepository.deleteByToken(token);
            throw new RuntimeException("Token expired");
        }

        String email = t.getEmail();
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User u = userOpt.get();
            u.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(u);
            // delete token within same transaction
            tokenRepository.deleteByToken(token);
            log.info("Password reset successfully for user {}", email);
            return;
        }

        Optional<Officer> officerOpt = officerRepository.findByEmail(email);
        if (officerOpt.isPresent()) {
            Officer o = officerOpt.get();
            o.setPassword(passwordEncoder.encode(newPassword));
            officerRepository.save(o);
            tokenRepository.deleteByToken(token);
            log.info("Password reset successfully for officer {}", email);
            return;
        }

        throw new RuntimeException("No account associated with token");
    }
}
