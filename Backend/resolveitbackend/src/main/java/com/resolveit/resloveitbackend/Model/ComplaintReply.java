package com.resolveit.resloveitbackend.Model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "complaint_replies")
public class ComplaintReply {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String content;

    private String createdBy;

    private LocalDateTime createdAt = LocalDateTime.now();

    private boolean isAdminReply = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complaint_id")
    @JsonIgnoreProperties({"replies", "notes", "attachments", "user", "hibernateLazyInitializer", "handler"})
    private Complaint complaint;

    public ComplaintReply() {}

    public ComplaintReply(String content, String createdBy, boolean isAdminReply, Complaint complaint) {
        this.content = content;
        this.createdBy = createdBy;
        this.isAdminReply = isAdminReply;
        this.complaint = complaint;
    }

    public Long getId() { return id; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public boolean isAdminReply() { return isAdminReply; }
    public void setAdminReply(boolean adminReply) { isAdminReply = adminReply; }
    public Complaint getComplaint() { return complaint; }
    public void setComplaint(Complaint complaint) { this.complaint = complaint; }
}
