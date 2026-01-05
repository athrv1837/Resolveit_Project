package com.resolveit.resloveitbackend.controller;

import com.resolveit.resloveitbackend.Model.Complaint;
import com.resolveit.resloveitbackend.Model.Officer;
import com.resolveit.resloveitbackend.Model.PendingOfficer;
import com.resolveit.resloveitbackend.repository.ComplaintRepository;
import com.resolveit.resloveitbackend.repository.OfficerRepository;
import com.resolveit.resloveitbackend.repository.PendingOfficerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:8081"})
public class OfficerController {

    @Autowired
    private PendingOfficerRepository pendingRepo;

    @Autowired
    private OfficerRepository officerRepo;

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    
    @PostMapping(value = "/officers/register", consumes = {"multipart/form-data"})
    public ResponseEntity<String> registerOfficer(
            @RequestPart("name") String name,
            @RequestPart("email") String email,
            @RequestPart("password") String password,
            @RequestPart(value = "department", required = false) String department,
            @RequestPart(value = "certificate", required = false) MultipartFile certificate
    ) {
        try {
            if (pendingRepo.findByEmail(email).isPresent() || officerRepo.findByEmail(email).isPresent()) {
                return ResponseEntity.badRequest().body("Email already in use.");
            }

            String encodedPassword = passwordEncoder.encode(password);

            PendingOfficer officer = PendingOfficer.builder()
                    .name(name)
                    .email(email)
                    .password(encodedPassword)
                    .department(department != null && !department.isEmpty() ? department : "Unassigned")
                    .approved(false)
                    .build();

            // Save certificate if provided
            if (certificate != null && !certificate.isEmpty()) {
                String uploadDir = System.getProperty("user.dir") + "/uploads/officers/";
                new File(uploadDir).mkdirs();
                String safeFilename = email.replaceAll("[^a-zA-Z0-9.@_-]", "_") + "_" + certificate.getOriginalFilename();
                File dest = new File(uploadDir + safeFilename);
                certificate.transferTo(dest);
                System.out.println("Certificate saved: " + dest.getAbsolutePath());
            }

            pendingRepo.save(officer);
            return ResponseEntity.ok("Registration submitted. Await admin approval.");
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Failed to upload certificate.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Registration failed.");
        }
    }

    @GetMapping("/officers/pending")
    public ResponseEntity<List<PendingOfficer>> getPendingOfficers() {
        List<PendingOfficer> pending = pendingRepo.findAll().stream()
                .filter(o -> !o.isApproved())
                .collect(Collectors.toList());
        return ResponseEntity.ok(pending);
    }

   
    @GetMapping("/officers")
    public ResponseEntity<List<Officer>> getAllApprovedOfficers() {
        return ResponseEntity.ok(officerRepo.findAll());
    }

    @GetMapping("/officer/complaints")
    public ResponseEntity<List<Complaint>> getAssignedComplaints(@RequestParam String email) {
        if (email == null || email.isEmpty()) {
            System.out.println("[Officer Complaints] Email parameter is empty");
            return ResponseEntity.badRequest().body(null);
        }

        System.out.println("[Officer Complaints] Fetching complaints for email: " + email);
        
        // Don't fail if officer is not found in officer table; return empty list so frontend handles it gracefully
        List<Complaint> assignedComplaints = complaintRepository.findByAssignedTo(email);
        
        System.out.println("[Officer Complaints] Query result: " + (assignedComplaints == null ? "null" : assignedComplaints.size() + " complaints"));
        
        if (assignedComplaints == null || assignedComplaints.isEmpty()) {
            // log for diagnostics
            System.out.println("[Officer Complaints] No complaints found assigned to: " + email);
            
            // DEBUG: Check all complaints in database
            long totalComplaints = complaintRepository.count();
            System.out.println("[Officer Complaints] Total complaints in DB: " + totalComplaints);
            
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }

        System.out.println("[Officer Complaints] Found " + assignedComplaints.size() + " complaints for " + email);
        return ResponseEntity.ok(assignedComplaints);
    }
}