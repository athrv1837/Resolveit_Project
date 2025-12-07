package com.resolveit.resloveitbackend.dto;

import com.resolveit.resloveitbackend.enums.ComplaintPriority;
import com.resolveit.resloveitbackend.enums.ComplaintStatus;

import java.time.LocalDateTime;
import java.util.List;

public class ComplaintDto {
    private Long id;
    private String title;
    private String description;
    private String category;
    private ComplaintStatus status;
    private ComplaintPriority priority;
    private String assignedTo;
    private boolean isAnonymous;
    private String submittedBy;
    private LocalDateTime submittedAt;
    private List<String> attachments;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public ComplaintStatus getStatus() { return status; }
    public void setStatus(ComplaintStatus status) { this.status = status; }
    public ComplaintPriority getPriority() { return priority; }
    public void setPriority(ComplaintPriority priority) { this.priority = priority; }
    public String getAssignedTo() { return assignedTo; }
    public void setAssignedTo(String assignedTo) { this.assignedTo = assignedTo; }
    public boolean getIsAnonymous() { return isAnonymous; }
    public void setIsAnonymous(boolean isAnonymous) { this.isAnonymous = isAnonymous; }
    public String getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(String submittedBy) { this.submittedBy = submittedBy; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
    public List<String> getAttachments() { return attachments; }
    public void setAttachments(List<String> attachments) { this.attachments = attachments; }
}
