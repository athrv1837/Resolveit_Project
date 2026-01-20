package com.resolveit.resloveitbackend.Model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.resolveit.resloveitbackend.enums.ComplaintPriority;
import com.resolveit.resloveitbackend.enums.ComplaintStatus;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
import com.resolveit.resloveitbackend.Model.ComplaintReply;


@Entity
@Table(name = "complaints")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ✅ NEW: Government reference number format (GRV-YYYYMMDD-XXXXX)
    @Column(name = "reference_number", unique = true, nullable = false)
    private String referenceNumber;

    private String title;
    @Lob
    @Column(columnDefinition = "TEXT")
    private String description;
    private String category;

    // Status as Enum
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, columnDefinition = "VARCHAR(20)")
    private ComplaintStatus status = ComplaintStatus.PENDING;

    // Priority as Enum
    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, columnDefinition = "VARCHAR(20)")
    private ComplaintPriority priority = ComplaintPriority.MEDIUM;

    // Assigned officer email
    @Column(name = "assigned_to")
    private String assignedTo;

    // ✅ NEW: Department of assigned officer for tracking
    @Column(name = "assigned_department")
    private String assignedDepartment;

    private boolean isAnonymous;
    private String submittedBy;
    
    // ✅ UPDATED: Initial submission timestamp
    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt = LocalDateTime.now();

    // ✅ NEW: Audit tracking - last modification
    @Column(name = "last_updated_at")
    private LocalDateTime lastUpdatedAt;

    // ✅ NEW: Audit tracking - who modified
    @Column(name = "last_updated_by")
    private String lastUpdatedBy;

    // ✅ NEW: Escalation tracking
    private boolean escalated = false;
    @Column(name = "escalation_level")
    private Integer escalationLevel = 0; // use wrapper to allow nulls from DB
    @Column(name = "escalation_reason")
    private String escalationReason;
    @Column(name = "escalated_at")
    private LocalDateTime escalatedAt;

    // Citizen who submitted
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"password", "role", "createdAt", "hibernateLazyInitializer", "handler"})
    private User user;

    // Attachments (simple list of file names/URLs)
    @ElementCollection
    private List<String> attachments;

    // Replies (public conversation between citizen and authority)
    @OneToMany(mappedBy = "complaint", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ComplaintReply> replies;

    // Constructors
    public Complaint() {}

    // === Getters & Setters ===
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


    public boolean isEscalated() { return escalated; }
    public void setEscalated(boolean escalated) { this.escalated = escalated; }

    public Integer getEscalationLevel() { return escalationLevel; }
    public void setEscalationLevel(Integer escalationLevel) { this.escalationLevel = escalationLevel; }

    public String getEscalationReason() { return escalationReason; }
    public void setEscalationReason(String escalationReason) { this.escalationReason = escalationReason; }

    public LocalDateTime getEscalatedAt() { return escalatedAt; }
    public void setEscalatedAt(LocalDateTime escalatedAt) { this.escalatedAt = escalatedAt; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public List<String> getAttachments() { return attachments; }
    public void setAttachments(List<String> attachments) { this.attachments = attachments; }

    public java.util.List<ComplaintReply> getReplies() { return replies; }
    public void setReplies(java.util.List<ComplaintReply> replies) { this.replies = replies; }
}