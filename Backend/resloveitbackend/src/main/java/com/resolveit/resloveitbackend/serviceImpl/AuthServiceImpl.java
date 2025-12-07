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

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final OfficerRepository officerRepository;
    private final PendingOfficerRepository pendingOfficerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthServiceImpl(UserRepository userRepository,
                           OfficerRepository officerRepository,
                           PendingOfficerRepository pendingOfficerRepository,
                           PasswordEncoder passwordEncoder,
                           JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.officerRepository = officerRepository;
        this.pendingOfficerRepository = pendingOfficerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public AuthResponse login(String email, String rawPassword) {
        Optional<User> optionalUser = userRepository.findByEmail(email);

        if (optionalUser.isEmpty()) {
            Optional<Officer> officerOpt = officerRepository.findByEmail(email);
            if (officerOpt.isPresent()) {
                Officer officer = officerOpt.get();

                if (!passwordEncoder.matches(rawPassword, officer.getPassword())) {
                    throw new RuntimeException("Invalid password. Please try again.");
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

            throw new RuntimeException("No user found with this email. Please register first.");
        }

        User user = optionalUser.get();

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new RuntimeException("Invalid password. Please try again.");
        }

        if (user.getRole() == Role.ROLE_OFFICER) {
            boolean approved = officerRepository.findByEmail(user.getEmail()).isPresent();
            if (!approved) {
                throw new RuntimeException(
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
            throw new RuntimeException("This email is already registered. Please use a different email.");
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
                throw new RuntimeException("Your officer registration is already pending approval.");
            }

            PendingOfficer pending = PendingOfficer.builder()
                    .name(req.getName())
                    .email(req.getEmail())
                    .password(passwordEncoder.encode(req.getPassword()))
                    .department("Unassigned")
                    .approved(false)
                    .build();

            pendingOfficerRepository.save(pending);
            throw new RuntimeException(
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

        String token = jwtUtil.generateToken(newUser.getEmail(), newUser.getRole().name());
        return new AuthResponse(
                token,
                newUser.getId(),
                newUser.getEmail(),
                newUser.getName(),
                newUser.getRole().name()
        );
    }
}
