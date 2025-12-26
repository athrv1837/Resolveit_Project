package com.resolveit.resloveitbackend.service;

public interface EmailService {
    void sendSimpleMessage(String to, String subject, String text);
    void sendRegistrationEmail(String to, String name);
    void sendPasswordResetEmail(String to, String token);
    void sendStatusUpdateEmail(String to, String referenceNumber, String status);
    void sendEscalationEmail(String to, String referenceNumber, int level, String reason);
}
