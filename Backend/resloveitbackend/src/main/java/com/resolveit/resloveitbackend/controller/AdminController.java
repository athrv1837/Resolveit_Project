package com.resolveit.resloveitbackend.controller;

import com.resolveit.resloveitbackend.Model.Complaint;
import com.resolveit.resloveitbackend.Model.ComplaintStatus;
import com.resolveit.resloveitbackend.Model.Officer;
import com.resolveit.resloveitbackend.Model.PendingOfficer;
import com.resolveit.resloveitbackend.repository.ComplaintRepository;
import com.resolveit.resloveitbackend.repository.OfficerRepository;
import com.resolveit.resloveitbackend.repository.PendingOfficerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*") // Better than empty @CrossOrigin
public class AdminController {

    @Autowired
    private PendingOfficerRepository pendingRepo;

    @Autowired
    private OfficerRepository officerRepo;

    @Autowired
    private ComplaintRepository complaintRepository; // Required for assignment

    // === EXISTING: Approve Officer ===
    @PostMapping("/approve/{id}")
    public ResponseEntity<String> approveOfficer(@PathVariable Long id) {
        PendingOfficer pending = pendingRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Pending officer not found"));

        pending.setApproved(true);

        Officer newOfficer = Officer.builder()
                .name(pending.getName())
                .email(pending.getEmail())
                .password(pending.getPassword())
                .department(pending.getDepartment())
                .build();

        officerRepo.save(newOfficer);
        pendingRepo.delete(pending);
        return ResponseEntity.ok("Officer approved successfully.");
    }

    // === EXISTING: Reject Officer ===
    @PostMapping("/reject/{id}")
    public ResponseEntity<String> rejectOfficer(@PathVariable Long id) {
        pendingRepo.deleteById(id);
        return ResponseEntity.ok("Officer request rejected.");
    }

    // === NEW: Assign Officer to Complaint ===
    @PostMapping("/complaints/{complaintId}/assign")
    public ResponseEntity<?> assignOfficerToComplaint(
            @PathVariable Long complaintId,
            @RequestBody Map<String, String> request) {

        String officerEmail = request.get("officerEmail");

        if (officerEmail == null || officerEmail.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("officerEmail is required");
        }

        Optional<Complaint> complaintOpt = complaintRepository.findById(complaintId);
        if (complaintOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Complaint not found with ID: " + complaintId);
        }

        Optional<Officer> officerOpt = officerRepo.findByEmail(officerEmail);
        if (officerOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("No approved officer found with email: " + officerEmail);
        }

        Complaint complaint = complaintOpt.get();
        complaint.setAssignedTo(officerEmail);
        complaint.setStatus(ComplaintStatus.ASSIGNED); // Auto-set to ASSIGNED
        complaintRepository.save(complaint);

        return ResponseEntity.ok("Officer " + officerOpt.get().getName() + " assigned successfully.");
    }
}