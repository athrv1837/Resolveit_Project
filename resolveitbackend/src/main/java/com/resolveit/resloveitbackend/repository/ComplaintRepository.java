package com.resolveit.resloveitbackend.repository;

import com.resolveit.resloveitbackend.Model.Complaint;
import com.resolveit.resloveitbackend.Model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    /**
     * Find all complaints submitted by a specific citizen (User entity)
     */
    List<Complaint> findByUser(User user);

    /**
     * Backup: Find complaints by submittedBy email (in case User is null)
     */
    List<Complaint> findBySubmittedBy(String submittedBy);

    /**
     * NEW: Find all complaints assigned to a specific officer by email
     * Critical for Officer Dashboard: GET /api/officer/complaints?email=...
     */
    List<Complaint> findByAssignedTo(String assignedTo);

    /**
     * Optional: Find complaints by status (useful for stats/filters later)
     */
    List<Complaint> findByStatus(String status);
}