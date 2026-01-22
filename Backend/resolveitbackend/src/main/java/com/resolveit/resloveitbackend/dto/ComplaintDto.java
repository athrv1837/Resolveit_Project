package com.resolveit.resloveitbackend.dto;

import com.resolveit.resloveitbackend.enums.ComplaintPriority;
import com.resolveit.resloveitbackend.enums.ComplaintStatus;

import java.time.LocalDateTime;
import java.util.List;
import com.resolveit.resloveitbackend.dto.ReplyDto;

public class ComplaintDto {
    private Long id;
    private String referenceNumber;        
    private String title;
    private String description;
    private String category;
    private ComplaintStatus status;
    private ComplaintPriority priority;
    private String assignedTo;
    private String assignedDepartment;      
    private boolean isAnonymous;
    private String submittedBy;
    private LocalDateTime submittedAt;
    private LocalDateTime lastUpdatedAt;       
    private String lastUpdatedBy;             
    private List<String> attachments;
    private int attachmentCount;               
    // Escalation info
    private boolean escalated;
    private Integer escalationLevel;
    private String escalationReason;
    private LocalDateTime escalatedAt;

    // Replies
    private java.util.List<ReplyDto> replies;

    // Status History
    private java.util.List<StatusHistoryDto> statusHistory;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getReferenceNumber() { return referenceNumber; }
    public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }
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
    public String getAssignedDepartment() { return assignedDepartment; }
    public void setAssignedDepartment(String assignedDepartment) { this.assignedDepartment = assignedDepartment; }
    public boolean getIsAnonymous() { return isAnonymous; }
    public void setIsAnonymous(boolean isAnonymous) { this.isAnonymous = isAnonymous; }
    public String getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(String submittedBy) { this.submittedBy = submittedBy; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
    public LocalDateTime getLastUpdatedAt() { return lastUpdatedAt; }
    public void setLastUpdatedAt(LocalDateTime lastUpdatedAt) { this.lastUpdatedAt = lastUpdatedAt; }
    public String getLastUpdatedBy() { return lastUpdatedBy; }
    public void setLastUpdatedBy(String lastUpdatedBy) { this.lastUpdatedBy = lastUpdatedBy; }
    public List<String> getAttachments() { return attachments; }
    public void setAttachments(List<String> attachments) { this.attachments = attachments; }
    public int getAttachmentCount() { return attachmentCount; }
    public void setAttachmentCount(int attachmentCount) { this.attachmentCount = attachmentCount; }
    public boolean isEscalated() { return escalated; }
    public void setEscalated(boolean escalated) { this.escalated = escalated; }
    public Integer getEscalationLevel() { return escalationLevel; }
    public void setEscalationLevel(Integer escalationLevel) { this.escalationLevel = escalationLevel; }
    public String getEscalationReason() { return escalationReason; }
    public void setEscalationReason(String escalationReason) { this.escalationReason = escalationReason; }
    public LocalDateTime getEscalatedAt() { return escalatedAt; }
    public void setEscalatedAt(LocalDateTime escalatedAt) { this.escalatedAt = escalatedAt; }
    public java.util.List<ReplyDto> getReplies() { return replies; }
    public void setReplies(java.util.List<ReplyDto> replies) { this.replies = replies; }
    public java.util.List<StatusHistoryDto> getStatusHistory() { return statusHistory; }
    public void setStatusHistory(java.util.List<StatusHistoryDto> statusHistory) { this.statusHistory = statusHistory; }
}
