package com.resolveit.resloveitbackend;

import com.resolveit.resloveitbackend.Model.Role;
import com.resolveit.resloveitbackend.Model.User;
import com.resolveit.resloveitbackend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class ResloveitbackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(ResloveitbackendApplication.class, args);
    }

    /**
     * ✅ This CommandLineRunner ensures that a default admin user exists.
     * It will only create the admin if not found in the database.
     * If the admin already exists, it will update the password to ensure
     * it matches the configured BCryptPasswordEncoder.
     */
    @Bean
    public CommandLineRunner createAdminUser(UserRepository userRepo, PasswordEncoder encoder) {
        return args -> {
            String adminEmail = "admin@123.io";
            String adminPassword = "admin@123";

            userRepo.findByEmail(adminEmail).ifPresentOrElse(user -> {
                // Update existing admin password (ensures it’s encoded properly)
                user.setPassword(encoder.encode(adminPassword));
                userRepo.save(user);
                System.out.println("🔁 Admin password updated for: " + adminEmail);
            }, () -> {
                // Create new admin user
                User admin = new User();
                admin.setName("System Admin");
                admin.setEmail(adminEmail);
                admin.setPassword(encoder.encode(adminPassword));
                admin.setRole(Role.ROLE_ADMIN);
                userRepo.save(admin);
                System.out.println("✅ Admin user created: " + adminEmail + " / " + adminPassword);
            });
        };
    }
}
