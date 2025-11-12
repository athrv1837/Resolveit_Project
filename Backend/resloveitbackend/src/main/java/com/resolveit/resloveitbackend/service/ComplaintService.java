package com.resolveit.resloveitbackend.service;

import com.resolveit.resloveitbackend.Model.Complaint;
import com.resolveit.resloveitbackend.Model.ComplaintStatus;  // <-- ADD THIS IMPORT
import com.resolveit.resloveitbackend.Model.User;
import com.resolveit.resloveitbackend.repository.ComplaintRepository;
import com.resolveit.resloveitbackend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;

    public ComplaintService(ComplaintRepository complaintRepository, UserRepository userRepository) {
        this.complaintRepository = complaintRepository;
        this.userRepository = userRepository;
    }

    /**
     * ✅ Submit a new complaint linked to the citizen user.
     */
    @Transactional
    public Complaint submitComplaint(Complaint complaint, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        // Link complaint to user
        complaint.setUser(user);
        complaint.setSubmittedBy(email);

        // Set default status using ENUM (not String)
        if (complaint.getStatus() == null) {
            complaint.setStatus(ComplaintStatus.PENDING);
        }

        // Set submission time
        if (complaint.getSubmittedAt() == null) {
            complaint.setSubmittedAt(java.time.LocalDateTime.now());
        }

        return complaintRepository.save(complaint);
    }

    /**
     * ✅ Fetch all complaints for a citizen by email.
     */
    @Transactional(readOnly = true)
    public List<Complaint> getUserComplaints(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        return complaintRepository.findByUser(user);
    }

    /**
     * ✅ Fetch all complaints (for admin).
     */
    @Transactional(readOnly = true)
    public List<Complaint> getAllComplaints() {
        return complaintRepository.findAll();
    }
}