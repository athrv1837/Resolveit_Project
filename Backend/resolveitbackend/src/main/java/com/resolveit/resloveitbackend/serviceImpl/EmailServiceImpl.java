package com.resolveit.resloveitbackend.serviceImpl;

import com.resolveit.resloveitbackend.service.EmailService;
import com.resolveit.resloveitbackend.exception.EmailSendingException;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;


@Service
public class EmailServiceImpl implements EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);
    private static final String EMAIL_LOGO = "🔧";
    private static final String PRIMARY_COLOR = "#2563eb";
    private static final String SUCCESS_COLOR = "#10b981";
    private static final String WARNING_COLOR = "#f59e0b";

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
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(to);
            helper.setSubject(subject);
            
            String htmlContent = getGenericTemplate(text);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            log.info("Sent email to {} subject={}", to, subject);
        } catch (MessagingException ex) {
            log.error("Failed to send email to {}: {}", to, ex.getMessage());
        }
    }

    @Override
    @org.springframework.scheduling.annotation.Async
    public void sendRegistrationEmail(String to, String name) {
        if (mailSender == null) {
            log.info("MailSender not configured; skipping registration email to {}", to);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(to);
            helper.setSubject("🎉 Welcome to ResolveIt!");
            
            String htmlContent = getRegistrationTemplate(name);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            log.info("Sent registration email to {} name={}", to, name);
        } catch (MessagingException ex) {
            log.error("Failed to send registration email to {}: {}", to, ex.getMessage());
        }
    }

    @Override
    @org.springframework.scheduling.annotation.Async
    public void sendPasswordResetEmail(String to, String token) {
        if (mailSender == null) {
            log.info("MailSender not configured; skipping password reset email to {}", to);
            log.info("Password reset token for {}: {}", to, token);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(to);
            helper.setSubject("🔐 Reset Your ResolveIt Password");
            
            String resetLink = "http://localhost:5173/?token=" + token;
            String htmlContent = getPasswordResetTemplate(token, resetLink);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            log.info("Sent password reset email to {}", to);
        } catch (jakarta.mail.MessagingException ex) {
            log.error("Failed to send password reset email to {}: {}", to, ex.getMessage());
        }
    }

    @Override
    @org.springframework.scheduling.annotation.Async
    public void sendStatusUpdateEmail(String to, String referenceNumber, String status) {
        if (mailSender == null) {
            log.info("MailSender not configured; skipping status update email to {}", to);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(to);
            helper.setSubject("📋 Complaint " + referenceNumber + " - Status Updated");
            
            String htmlContent = getStatusUpdateTemplate(referenceNumber, status);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            log.info("Sent status update email to {} referenceNumber={} status={}", to, referenceNumber, status);
        } catch (MessagingException ex) {
            log.error("Failed to send status update email to {}: {}", to, ex.getMessage());
        }
    }

    @Override
    @org.springframework.scheduling.annotation.Async
    public void sendEscalationEmail(String to, String referenceNumber, int level, String reason) {
        if (mailSender == null) {
            log.info("MailSender not configured; skipping escalation email to {}", to);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(to);
            helper.setSubject("⚠️ Complaint " + referenceNumber + " - Escalated to Level " + level);
            
            String htmlContent = getEscalationTemplate(referenceNumber, level, reason);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            log.info("Sent escalation email to {} referenceNumber={} level={}", to, referenceNumber, level);
        } catch (MessagingException ex) {
            log.error("Failed to send escalation email to {}: {}", to, ex.getMessage());
        }
    }

    // ===== Email Template Methods =====

    private String getGenericTemplate(String content) {
        return getEmailTemplate(
            "Message from ResolveIt",
            content,
            "#6B7280"
        );
    }

    private String getRegistrationTemplate(String name) {
        return getEmailTemplate(
            "Welcome to ResolveIt!",
            "<p>Hi <strong>" + name + "</strong>,</p>" +
            "<p>We're thrilled to have you join the ResolveIt community! 🎉</p>" +
            "<p>Your account has been successfully created and is ready to use.</p>" +
            "<h3>What's Next?</h3>" +
            "<ul>" +
            "<li>Log in to your account</li>" +
            "<li>Complete your profile</li>" +
            "<li>Start submitting or managing complaints</li>" +
            "</ul>" +
            "<p>If you have any questions, feel free to reach out to our support team.</p>" +
            "<p style='margin-top: 30px; font-size: 12px; color: #9CA3AF;'>" +
            "Thank you for choosing ResolveIt!<br>" +
            "Best regards, <strong>The ResolveIt Team</strong>" +
            "</p>",
            SUCCESS_COLOR
        );
    }

    private String getPasswordResetTemplate(String token, String resetLink) {
        return getEmailTemplate(
            "Reset Your Password",
            "<p>Hi there,</p>" +
            "<p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>" +
            "<h3>Your Reset Token:</h3>" +
            "<div style='background-color: #F3F4F6; padding: 15px; border-radius: 5px; font-family: monospace; margin: 20px 0;'>" +
            "<strong>" + token + "</strong>" +
            "</div>" +
            "<p>Or use this link to reset your password directly:</p>" +
            "<p><a href='" + resetLink + "' style='display: inline-block; padding: 12px 30px; background-color: " + PRIMARY_COLOR + "; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;'>Reset Password</a></p>" +
            "<p style='margin-top: 20px; font-size: 12px; color: #9CA3AF;'>" +
            "This link will expire in 24 hours for security reasons." +
            "</p>",
            WARNING_COLOR
        );
    }

    private String getStatusUpdateTemplate(String referenceNumber, String status) {
        String statusEmoji = getStatusEmoji(status);
        String statusColor = getStatusColor(status);
        
        return getEmailTemplate(
            "Complaint Status Updated",
            "<p>Hi there,</p>" +
            "<p>Your complaint <strong>#" + referenceNumber + "</strong> has been updated.</p>" +
            "<h3>New Status:</h3>" +
            "<div style='background-color: " + statusColor + "20; padding: 15px; border-left: 4px solid " + statusColor + "; border-radius: 5px; margin: 20px 0;'>" +
            "<p style='color: " + statusColor + "; font-weight: bold; font-size: 16px;'>" +
            statusEmoji + " " + formatStatus(status) +
            "</p>" +
            "</div>" +
            "<p>Log in to your account to view more details.</p>" +
            "<p style='margin-top: 20px; font-size: 12px; color: #9CA3AF;'>" +
            "Reference: " + referenceNumber +
            "</p>",
            statusColor
        );
    }

    private String getEscalationTemplate(String referenceNumber, int level, String reason) {
        return getEmailTemplate(
            "Complaint Escalated",
            "<p>Hi there,</p>" +
            "<p>Your complaint <strong>#" + referenceNumber + "</strong> has been escalated to <strong>Level " + level + "</strong>.</p>" +
            "<h3>Escalation Details:</h3>" +
            "<div style='background-color: #FEF3C7; padding: 15px; border-left: 4px solid " + WARNING_COLOR + "; border-radius: 5px; margin: 20px 0;'>" +
            "<p><strong>Reason:</strong></p>" +
            "<p style='margin: 10px 0;'>" + reason + "</p>" +
            "</div>" +
            "<p>Our team will prioritize this matter and provide you with an update soon.</p>" +
            "<p>Thank you for your patience!</p>" +
            "<p style='margin-top: 20px; font-size: 12px; color: #9CA3AF;'>" +
            "Reference: " + referenceNumber +
            "</p>",
            WARNING_COLOR
        );
    }

    // ===== Template Builder =====

    private String getEmailTemplate(String title, String body, String accentColor) {
        return "<!DOCTYPE html>" +
            "<html lang='en'>" +
            "<head>" +
            "<meta charset='UTF-8'>" +
            "<meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
            "<title>" + title + "</title>" +
            "<style>" +
            "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #374151; background-color: #F9FAFB; margin: 0; padding: 0; }" +
            ".container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }" +
            ".header { background: linear-gradient(135deg, " + accentColor + " 0%, " + lightenColor(accentColor) + " 100%); padding: 40px 20px; text-align: center; color: white; }" +
            ".header h1 { margin: 0; font-size: 28px; font-weight: 700; }" +
            ".header .logo { font-size: 32px; margin-bottom: 10px; }" +
            ".content { padding: 40px 30px; }" +
            ".content p { margin: 15px 0; }" +
            ".content h3 { color: " + accentColor + "; margin-top: 25px; margin-bottom: 15px; font-size: 16px; }" +
            ".content ul { margin: 15px 0; padding-left: 25px; }" +
            ".content li { margin: 8px 0; }" +
            ".footer { background-color: #F3F4F6; padding: 20px 30px; text-align: center; font-size: 12px; color: #9CA3AF; border-top: 1px solid #E5E7EB; }" +
            ".footer a { color: " + accentColor + "; text-decoration: none; }" +
            "a { color: " + accentColor + "; }" +
            "</style>" +
            "</head>" +
            "<body>" +
            "<div class='container'>" +
            "<div class='header'>" +
            "<div class='logo'>" + EMAIL_LOGO + "</div>" +
            "<h1>" + title + "</h1>" +
            "</div>" +
            "<div class='content'>" +
            body +
            "</div>" +
            "<div class='footer'>" +
            "<p>© 2026 ResolveIt. All rights reserved.<br>" +
            "This is an automated email. Please do not reply to this message.</p>" +
            "</div>" +
            "</div>" +
            "</body>" +
            "</html>";
    }

    // ===== Helper Methods =====

    private String getStatusEmoji(String status) {
        return switch (status.toLowerCase().replace(" ", "_").replace("-", "_")) {
            case "PENDING", "pending" -> "⏳";
            case "IN_PROGRESS", "in_progress", "in-progress" -> "🔄";
            case "UNDER_REVIEW", "under_review", "under-review" -> "👀";
            case "RESOLVED", "resolved" -> "✅";
            case "CLOSED", "closed" -> "🔒";
            case "REJECTED", "rejected" -> "❌";
            case "ASSIGNED", "assigned" -> "👤";
            default -> "📋";
        };
    }

    private String getStatusColor(String status) {
        return switch (status.toLowerCase().replace(" ", "_").replace("-", "_")) {
            case "PENDING", "pending" -> "#F59E0B";
            case "IN_PROGRESS", "in_progress", "in-progress" -> "#3B82F6";
            case "UNDER_REVIEW", "under_review", "under-review" -> "#8B5CF6";
            case "RESOLVED", "resolved" -> "#10B981";
            case "CLOSED", "closed" -> "#6B7280";
            case "REJECTED", "rejected" -> "#EF4444";
            case "ASSIGNED", "assigned" -> "#06B6D4";
            default -> "#6B7280";
        };
    }

    private String formatStatus(String status) {
        String normalized = status.toLowerCase()
            .replace("_", " ")
            .replace("-", " ");
        
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\b(\\w)");
        java.util.regex.Matcher matcher = pattern.matcher(normalized);
        return matcher.replaceAll(m -> m.group(1).toUpperCase());
    }

    private String lightenColor(String hexColor) {
        // Lighten color by 20% for gradient
        if (!hexColor.startsWith("#") || hexColor.length() < 7) {
            return hexColor;
        }
        
        try {
            int r = Integer.parseInt(hexColor.substring(1, 3), 16);
            int g = Integer.parseInt(hexColor.substring(3, 5), 16);
            int b = Integer.parseInt(hexColor.substring(5, 7), 16);
            
            r = Math.min(255, (int) (r * 1.2));
            g = Math.min(255, (int) (g * 1.2));
            b = Math.min(255, (int) (b * 1.2));
            
            return String.format("#%02x%02x%02x", r, g, b);
        } catch (NumberFormatException e) {
            return hexColor;
        }
    }
}
