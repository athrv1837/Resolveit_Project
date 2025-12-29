package com.resolveit.resloveitbackend.serviceImpl;

import com.resolveit.resloveitbackend.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl implements EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Override
    @org.springframework.scheduling.annotation.Async
    public void sendSimpleMessage(String to, String subject, String text) {
        if (mailSender == null) {
            log.info("MailSender not configured; skipping sending email to {} subject={}", to, subject);
            log.debug("Email body: {}", text);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            // send asynchronously via configured mailSender (may still block in some implementations)
            mailSender.send(message);
            log.info("Sent email to {} subject={}", to, subject);
        } catch (Exception ex) {
            log.error("Failed to send email to {}: {}", to, ex.getMessage());
        }
    }

    @Override
    @org.springframework.scheduling.annotation.Async
    public void sendRegistrationEmail(String to, String name) {
        String subject = "Welcome to ResolveIt";
        String body = "Hello " + name + ",\n\nThank you for registering with ResolveIt.\n\nRegards,\nResolveIt Team";
        sendSimpleMessage(to, subject, body);
    }

    @Override
    @org.springframework.scheduling.annotation.Async
    public void sendPasswordResetEmail(String to, String token) {
        String subject = "ResolveIt Password Reset";
        String link = "http://localhost:5173/?token=" + token;
        String body = "Use the following token to reset your password: " + token + "\n\n" +
                "Or click the following link to open the app and pre-fill the token: " + link + "\n\nIf you did not request this, ignore this email.";
        // ensure token is visible in logs when SMTP is not configured
        log.info("Password reset requested for {}. token={}", to, token);
        sendSimpleMessage(to, subject, body);
    }

    @Override
    @org.springframework.scheduling.annotation.Async
    public void sendStatusUpdateEmail(String to, String referenceNumber, String status) {
        String subject = "Complaint " + referenceNumber + " status updated";
        String body = "The status of complaint " + referenceNumber + " has been updated to: " + status + ".";
        sendSimpleMessage(to, subject, body);
    }

    @Override
    @org.springframework.scheduling.annotation.Async
    public void sendEscalationEmail(String to, String referenceNumber, int level, String reason) {
        String subject = "Complaint " + referenceNumber + " escalated";
        String body = "Complaint " + referenceNumber + " has been escalated to level " + level + ". Reason: " + reason + ".";
        sendSimpleMessage(to, subject, body);
    }
}
