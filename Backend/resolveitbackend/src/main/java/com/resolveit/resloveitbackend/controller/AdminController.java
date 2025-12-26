package com.resolveit.resloveitbackend.controller;

import com.resolveit.resloveitbackend.Model.Complaint;
import com.resolveit.resloveitbackend.Model.Officer;
import com.resolveit.resloveitbackend.Model.PendingOfficer;
import com.resolveit.resloveitbackend.enums.ComplaintStatus;
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
    private com.resolveit.resloveitbackend.service.EmailService emailService;

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

        String officerEmail = request.get("officerEmail");

        if (officerEmail == null || officerEmail.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("officerEmail is required");
        }

        // Simple analytics for admin dashboard
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

        // Notify officer and submitter
        try {
            emailService.sendSimpleMessage(officerEmail, "New Assignment: " + complaint.getReferenceNumber(), "You have been assigned complaint " + complaint.getReferenceNumber());
            if (complaint.getSubmittedBy() != null) emailService.sendStatusUpdateEmail(complaint.getSubmittedBy(), complaint.getReferenceNumber(), complaint.getStatus().name());
        } catch (Exception ignored) {}

        return ResponseEntity.ok("Officer " + officerOpt.get().getName() + " assigned successfully.");
    }

    //Simple analytics for admin dashboard
    @GetMapping("/analytics/overview")
    public ResponseEntity<?> getAnalyticsOverview() {
        long totalComplaints = complaintRepository.count();
        long pending = complaintRepository.findAll().stream().filter(c -> c.getStatus().name().equals("PENDING")).count();
        long assigned = complaintRepository.findAll().stream().filter(c -> c.getStatus().name().equals("ASSIGNED")).count();
        long resolved = complaintRepository.findAll().stream().filter(c -> c.getStatus().name().equals("RESOLVED")).count();
        long highPriority = complaintRepository.findAll().stream().filter(c -> c.getPriority().name().equals("HIGH")).count();
        long officers = officerRepository.count();

        // Workload per officer
        java.util.Map<String, Integer> workload = new java.util.HashMap<>();
        officerRepository.findAll().forEach(o -> workload.put(o.getEmail(), complaintRepository.findByAssignedTo(o.getEmail()).size()));

        // Priority breakdown
        java.util.Map<String, Long> priorityBreakdown = new java.util.HashMap<>();
        priorityBreakdown.put("low", complaintRepository.findAll().stream().filter(c -> c.getPriority().name().equalsIgnoreCase("LOW")).count());
        priorityBreakdown.put("medium", complaintRepository.findAll().stream().filter(c -> c.getPriority().name().equalsIgnoreCase("MEDIUM")).count());
        priorityBreakdown.put("high", complaintRepository.findAll().stream().filter(c -> c.getPriority().name().equalsIgnoreCase("HIGH")).count());
        priorityBreakdown.put("urgent", complaintRepository.findAll().stream().filter(c -> c.getPriority().name().equalsIgnoreCase("URGENT")).count());

        // Status breakdown
        java.util.Map<String, Long> statusBreakdown = new java.util.HashMap<>();
        statusBreakdown.put("pending", pending);
        statusBreakdown.put("assigned", assigned);
        statusBreakdown.put("resolved", resolved);
        // include other statuses as computed
        statusBreakdown.put("other", totalComplaints - (pending + assigned + resolved));

        java.util.Map<String, Object> out = new java.util.HashMap<>();
        out.put("totalComplaints", totalComplaints);
        out.put("pending", pending);
        out.put("assigned", assigned);
        out.put("resolved", resolved);
        out.put("highPriority", highPriority);
        out.put("officers", officers);
        out.put("workload", workload);
        out.put("priorityBreakdown", priorityBreakdown);
        out.put("statusBreakdown", statusBreakdown);

        return ResponseEntity.ok(out);
    }
}