package com.resolveit.resloveitbackend.enums;

public enum ComplaintStatus {
    PENDING,           // Grievance received, awaiting assignment
    ASSIGNED,          // Assigned to an officer/authority
    UNDER_REVIEW,      // Being reviewed by the assigned officer
    IN_PROGRESS,       // Action is being taken to resolve
    ESCALATED,         // Escalated to higher authority
    RESOLVED,          // Issue resolved
    CLOSED             // Grievance closed
}