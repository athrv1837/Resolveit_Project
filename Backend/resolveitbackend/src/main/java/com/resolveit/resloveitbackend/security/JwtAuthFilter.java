package com.resolveit.resloveitbackend.security;

import com.resolveit.resloveitbackend.Model.Officer;
import com.resolveit.resloveitbackend.Model.User;
import com.resolveit.resloveitbackend.repository.OfficerRepository;
import com.resolveit.resloveitbackend.repository.UserRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final OfficerRepository officerRepository;

    public JwtAuthFilter(JwtUtil jwtUtil, UserRepository userRepository, OfficerRepository officerRepository) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.officerRepository = officerRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        String token = null;
        boolean hasBearer = StringUtils.hasText(header) && header.startsWith("Bearer ");
        if (hasBearer) {
            token = header.substring(7);
        }

        // Debugging logs: show incoming request and auth header presence
        System.out.println("[JWT] Incoming " + request.getMethod() + " " + request.getRequestURI() + " Authorization header present=" + hasBearer + " tokenPresent=" + (token != null));

        if (token != null && jwtUtil.validate(token)
                && SecurityContextHolder.getContext().getAuthentication() == null) {

            Claims claims = jwtUtil.getClaims(token);
            String email = claims.getSubject();
            String roleFromToken = claims.get("role", String.class);

            System.out.println("[JWT] token valid for subject=" + email + " roleFromToken=" + roleFromToken);

            var details = new WebAuthenticationDetailsSource().buildDetails(request);

            // 1. CITIZEN / ADMIN from users table
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                String role = (roleFromToken != null) ? roleFromToken : "ROLE_" + user.getRole().name();
                System.out.println("[JWT] Authenticated as User: " + email + " role=" + role);
                GrantedAuthority authority = new SimpleGrantedAuthority(role);

                var auth = new UsernamePasswordAuthenticationToken(user.getEmail(), null, List.of(authority));
                auth.setDetails(details);
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
            // 2. OFFICER from officer table
            else {
                Optional<Officer> officerOpt = officerRepository.findByEmail(email);
                if (officerOpt.isPresent()) {
                    Officer officer = officerOpt.get();
                    String role = officer.getRole();
                    if (role == null || role.isEmpty()) {
                        role = "ROLE_OFFICER";
                    }
                    if (roleFromToken != null) {
                        role = roleFromToken; // JWT wins
                    }

                    System.out.println("[JWT] Authenticated as Officer: " + officer.getEmail() + " role=" + role);

                    GrantedAuthority authority = new SimpleGrantedAuthority(role);
                    var auth = new UsernamePasswordAuthenticationToken(officer.getEmail(), null, List.of(authority));
                    auth.setDetails(details);
                    SecurityContextHolder.getContext().setAuthentication(auth);
                } else {
                    System.out.println("[JWT] No user or officer found for email=" + email);
                }
            }
        } else if (token != null) {
            System.out.println("[JWT] Token present but invalid or authentication already set: valid=" + jwtUtil.validate(token) + " authAlready=" + (SecurityContextHolder.getContext().getAuthentication() != null));
        } else {
            // no token found
            // System.out.println("[JWT] No token provided"); // keep quiet to reduce logs on static assets
        }

        filterChain.doFilter(request, response);
    }
}