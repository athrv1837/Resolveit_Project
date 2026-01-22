package com.resolveit.resloveitbackend.Model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.resolveit.resloveitbackend.enums.ComplaintStatus;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "complaint_status_history")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ComplaintStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complaint_id", nullable = false)
    @JsonIgnoreProperties({"statusHistory", "user", "replies", "hibernateLazyInitializer", "handler"})
    private Complaint complaint;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ComplaintStatus status;

    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt = LocalDateTime.now();

    @Column(name = "changed_by")
    private String changedBy;

    @Column(name = "notes")
    private String notes;

    // Constructors
    public ComplaintStatusHistory() {}

    public ComplaintStatusHistory(Complaint complaint, ComplaintStatus status, String changedBy, String notes) {
        this.complaint = complaint;
        this.status = status;
        this.changedBy = changedBy;
        this.notes = notes;
        this.changedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Complaint getComplaint() {
        return complaint;
    }

    public void setComplaint(Complaint complaint) {
        this.complaint = complaint;
    }

    public ComplaintStatus getStatus() {
        return status;
    }

    public void setStatus(ComplaintStatus status) {
        this.status = status;
    }

    public LocalDateTime getChangedAt() {
        return changedAt;
    }

    public void setChangedAt(LocalDateTime changedAt) {
        this.changedAt = changedAt;
    }

    public String getChangedBy() {
        return changedBy;
    }

    public void setChangedBy(String changedBy) {
        this.changedBy = changedBy;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
