package com.resolveit.resloveitbackend.controller;

import com.resolveit.resloveitbackend.Model.Complaint;
import com.resolveit.resloveitbackend.Model.Officer;
import com.resolveit.resloveitbackend.Model.PendingOfficer;
import com.resolveit.resloveitbackend.enums.ComplaintStatus;
import com.resolveit.resloveitbackend.repository.ComplaintRepository;
import com.resolveit.resloveitbackend.repository.OfficerRepository;
import com.resolveit.resloveitbackend.repository.PendingOfficerRepository;
import com.resolveit.resloveitbackend.service.EmailService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*") // Better than empty @CrossOrigin
public class AdminController {

    @Autowired
    private PendingOfficerRepository pendingRepo;

    @Autowired
    private EmailService emailService;

    @Autowired
    private OfficerRepository officerRepo;

    @Autowired
    private ComplaintRepository complaintRepository; // Required for assignment

    @Autowired
    private OfficerRepository officerRepository;
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
            .certificateUrl(pending.getCertificateUrl())
            .role("ROLE_OFFICER")
                .build();

        officerRepo.save(newOfficer);
        pendingRepo.delete(pending);
        try { emailService.sendSimpleMessage(newOfficer.getEmail(), "Officer Approved", "Your officer account has been approved."); } catch (Exception ignored) {}
        return ResponseEntity.ok("Officer approved successfully.");
    }

    // === EXISTING: Reject Officer ===
    @PostMapping("/reject/{id}")
    public ResponseEntity<String> rejectOfficer(@PathVariable Long id) {
        // notify if email exists
        PendingOfficer p = pendingRepo.findById(id).orElse(null);
        if (p != null) {
            try { emailService.sendSimpleMessage(p.getEmail(), "Officer Registration Rejected", "Your officer registration was rejected by admin."); } catch (Exception ignored) {}
        }
        pendingRepo.deleteById(id);
        return ResponseEntity.ok("Officer request rejected.");
    }

    // === NEW: Assign Officer to Complaint ===
    @PostMapping("/complaints/{complaintId}/assign")
    public ResponseEntity<?> assignOfficerToComplaint(
            @PathVariable Long complaintId,
            @RequestBody Map<String, String> request) {

        long start = System.currentTimeMillis();
        String officerEmail = request.get("officerEmail");

        System.out.println("[Admin Assign] Attempting to assign complaint " + complaintId + " to officer: " + officerEmail);

        if (officerEmail == null || officerEmail.trim().isEmpty()) {
            System.out.println("[Admin Assign] Error: officerEmail is null or empty");
            return ResponseEntity.badRequest().body("officerEmail is required");
        }

        // Simple analytics for admin dashboard
        Optional<Complaint> complaintOpt = complaintRepository.findById(complaintId);
        if (complaintOpt.isEmpty()) {
            System.out.println("[Admin Assign] Error: Complaint not found with ID: " + complaintId);
            return ResponseEntity.status(404).body("Complaint not found with ID: " + complaintId);
        }

        Optional<Officer> officerOpt = officerRepo.findByEmail(officerEmail);
        if (officerOpt.isEmpty()) {
            System.out.println("[Admin Assign] Error: No approved officer found with email: " + officerEmail);
            return ResponseEntity.badRequest().body("No approved officer found with email: " + officerEmail);
        }

        Complaint complaint = complaintOpt.get();
        complaint.setAssignedTo(officerEmail);
        complaint.setStatus(ComplaintStatus.ASSIGNED); // Auto-set to ASSIGNED
        complaintRepository.save(complaint);
        long afterSave = System.currentTimeMillis();
        System.out.println("[Admin Assign] ✅ Successfully assigned complaint " + complaintId + " to " + officerEmail + " (assignedTo=" + complaint.getAssignedTo() + ") in " + (afterSave - start) + "ms");

        // Notify officer and submitter (fire-and-forget async now)
        try {
            emailService.sendSimpleMessage(officerEmail, "New Assignment: " + complaint.getReferenceNumber(), "You have been assigned complaint " + complaint.getReferenceNumber());
            if (complaint.getSubmittedBy() != null) emailService.sendStatusUpdateEmail(complaint.getSubmittedBy(), complaint.getReferenceNumber(), complaint.getStatus().name());
        } catch (Exception ignored) {}

        long end = System.currentTimeMillis();
        System.out.println("[Admin Assign] completed handler for " + complaintId + " total=" + (end - start) + "ms");
        return ResponseEntity.ok("Officer " + officerOpt.get().getName() + " assigned successfully.");
    }

    //Simple analytics for admin dashboard
    @GetMapping("/analytics/overview")
    public ResponseEntity<?> getAnalyticsOverview() {
        long totalComplaints = complaintRepository.count();
        java.util.List<Complaint> all = complaintRepository.findAll();

        long pending = all.stream().filter(c -> c.getStatus().name().equals("PENDING")).count();
        long assigned = all.stream().filter(c -> c.getStatus().name().equals("ASSIGNED")).count();
        long inProgress = all.stream().filter(c -> c.getStatus().name().equals("IN_PROGRESS") || c.getStatus().name().equals("UNDER_REVIEW")).count();
        long resolved = all.stream().filter(c -> c.getStatus().name().equals("RESOLVED")).count();
        long escalated = all.stream().filter(c -> c.getStatus().name().equals("ESCALATED")).count();
        long closed = all.stream().filter(c -> c.getStatus().name().equals("CLOSED")).count();
        long highPriority = all.stream().filter(c -> c.getPriority().name().equals("HIGH")).count();
        long officers = officerRepository.count();

        // Workload per officer
        Map<String, Integer> workload = new HashMap<>();
        officerRepository.findAll().forEach(o -> workload.put(o.getEmail(), complaintRepository.findByAssignedTo(o.getEmail()).size()));

        // Priority breakdown
        Map<String, Long> priorityBreakdown = new HashMap<>();
        priorityBreakdown.put("low", all.stream().filter(c -> c.getPriority().name().equalsIgnoreCase("LOW")).count());
        priorityBreakdown.put("medium", all.stream().filter(c -> c.getPriority().name().equalsIgnoreCase("MEDIUM")).count());
        priorityBreakdown.put("high", all.stream().filter(c -> c.getPriority().name().equalsIgnoreCase("HIGH")).count());
        priorityBreakdown.put("urgent", all.stream().filter(c -> c.getPriority().name().equalsIgnoreCase("URGENT")).count());

        // Status breakdown - use hyphenated keys to match frontend normalization
        Map<String, Long> statusBreakdown = new HashMap<>();
        statusBreakdown.put("pending", pending);
        statusBreakdown.put("assigned", assigned);
        statusBreakdown.put("in-progress", inProgress);
        statusBreakdown.put("resolved", resolved);
        statusBreakdown.put("escalated", escalated);
        statusBreakdown.put("closed", closed);

        Map<String, Object> out = new HashMap<>();
        out.put("totalComplaints", totalComplaints);
        out.put("pending", pending);
        out.put("assigned", assigned);
        out.put("inProgress", inProgress);
        out.put("resolved", resolved);
        out.put("highPriority", highPriority);
        out.put("officers", officers);
        out.put("workload", workload);
        out.put("priorityBreakdown", priorityBreakdown);
        out.put("statusBreakdown", statusBreakdown);

        return ResponseEntity.ok(out);
    }
}