package com.resolveit.resloveitbackend.controller;

import com.resolveit.resloveitbackend.Model.Complaint;
import com.resolveit.resloveitbackend.dto.ComplaintRequest;
import com.resolveit.resloveitbackend.dto.StatusUpdateDto;
import com.resolveit.resloveitbackend.dto.ComplaintDto;

import com.resolveit.resloveitbackend.service.ComplaintService;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.neo4j.Neo4jProperties.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/complaints")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:8081" })
public class ComplaintController {

    @Autowired
    private ComplaintService complaintService;

    private final Path uploadRoot = Paths.get("uploads/complaints");

    public ComplaintController() {
        try {
            Files.createDirectories(uploadRoot);
        } catch (IOException ignored) {
        }
    }

    @PostMapping("/submit")
    public ComplaintDto submitComplaint(
            @RequestBody ComplaintRequest request,
            @RequestParam String email) {
        Complaint complaint = new Complaint();
        complaint.setTitle(request.getTitle());
        complaint.setDescription(request.getDescription());
        complaint.setCategory(request.getCategory());
        complaint.setIsAnonymous(request.getIsAnonymous());
        return complaintService.submitComplaint(complaint, email);
    }

    @PostMapping(value = "/submit-with-files", consumes = { "multipart/form-data" })
    public ResponseEntity<?> submitWithFiles(
            @RequestPart("data") ComplaintRequest request,
            @RequestParam String email,
            @RequestPart(value = "files", required = false) MultipartFile[] files) {
        Complaint complaint = new Complaint();
        complaint.setTitle(request.getTitle());
        complaint.setDescription(request.getDescription());
        complaint.setCategory(request.getCategory());
        complaint.setIsAnonymous(request.getIsAnonymous());

        List<String> savedNames = new ArrayList<>();
        if (files != null) {
            for (MultipartFile f : files) {
                String original = f.getOriginalFilename();
                if (original == null)
                    continue;
                try {
                    Path dest = uploadRoot.resolve(System.currentTimeMillis() + "_" + original);
                    Files.copy(f.getInputStream(), dest);
                    savedNames.add(dest.toString());
                } catch (IOException e) {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body("Failed to store file: " + original);
                }
            }
            complaint.setAttachments(savedNames);
        }

        ComplaintDto dto = complaintService.submitComplaint(complaint, email);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/user")
    public List<ComplaintDto> getUserComplaints(@RequestParam String email) {
        return complaintService.getUserComplaints(email);
    }

    @GetMapping
    public List<ComplaintDto> getAllComplaints() {
        return complaintService.getAllComplaints();
    }

    // Escalate a complaint (officer/admin)
    @PostMapping("/{id}/escalate")
    public ResponseEntity<?> escalateComplaint(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        try {
            int level = Integer.parseInt(body.getOrDefault("level", "1"));
            String reason = body.getOrDefault("reason", "Escalated by officer");
            String requestedBy = body.getOrDefault("requestedBy", "system");
            ComplaintDto dto = complaintService.escalateComplaint(id, level, reason, requestedBy);
            return ResponseEntity.ok(dto);
        } catch (NumberFormatException ex) {
            return ResponseEntity.badRequest().body("level must be an integer");
        } catch (RuntimeException ex) {
            return ResponseEntity.status(404).body(ex.getMessage());
        }
    }

    // Add a note (internal)
    @PostMapping("/{id}/notes")
    public ResponseEntity<?> addNote(@PathVariable Long id, @RequestBody Map<String, Object> body,
            Authentication auth) {
        String content = (String) body.getOrDefault("content", "");
        boolean isPrivate = Boolean.parseBoolean(String.valueOf(body.getOrDefault("isPrivate", "true")));
        String createdBy = auth != null ? auth.getUsername() : "system";
        if (content == null || content.isBlank())
            return ResponseEntity.badRequest().body("content required");
        try {
            var note = complaintService.addNote(id, content, isPrivate, createdBy);
            return ResponseEntity.ok(note);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(404).body(ex.getMessage());
        }
    }

    // Add a public reply to citizen
    @PostMapping("/{id}/replies")
    public ResponseEntity<?> addReply(@PathVariable Long id, @RequestBody java.util.Map<String, Object> body,
            org.springframework.security.core.Authentication auth) {
        String content = (String) body.getOrDefault("content", "");
        boolean isAdminReply = Boolean.parseBoolean(String.valueOf(body.getOrDefault("isAdminReply", "false")));
        String createdBy = auth != null ? auth.getName() : "system";
        if (content == null || content.isBlank())
            return ResponseEntity.badRequest().body("content required");
        try {
            var reply = complaintService.addReply(id, content, isAdminReply, createdBy);
            return ResponseEntity.ok(reply);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(404).body(ex.getMessage());
        }
    }

    // Update priority
    @PostMapping("/{id}/priority")
    public ResponseEntity<?> updatePriority(@PathVariable Long id, @RequestBody java.util.Map<String, String> body,
            org.springframework.security.core.Authentication auth) {
        String priority = body.get("priority");
        String requestedBy = auth != null ? auth.getName() : "system";
        if (priority == null || priority.isBlank())
            return ResponseEntity.badRequest().body("priority is required");
        try {
            ComplaintDto dto = complaintService.updateComplaintPriority(id, priority, requestedBy);
            return ResponseEntity.ok(dto);
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    // Update complaint status (officer/admin)
    // @PostMapping("/{id}/status")
    // public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody
    // java.util.Map<String, String> body) {
    // String status = body.get("status");
    // String requestedBy = body.getOrDefault("requestedBy", "system");
    // if (status == null || status.isBlank()) return
    // ResponseEntity.badRequest().body("status is required");
    // try {
    // ComplaintDto dto = complaintService.updateComplaintStatus(id, status,
    // requestedBy);
    // return ResponseEntity.ok(dto);
    // } catch (RuntimeException ex) {
    // return ResponseEntity.badRequest().body(ex.getMessage());
    // }
    // }

    @PostMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody StatusUpdateDto request) {
        //System.out.println(request.toString());
        String status = request.getStatus().toUpperCase();
        String requestedBy = request.getRequestedBy();
        if (status == null || status.isBlank()) {
            return ResponseEntity.badRequest().body("status is required");
        }
        try {
            ComplaintDto dto = complaintService.updateComplaintStatus(id, status,
                    requestedBy != null ? requestedBy : "system");
            //System.out.println(dto);
            return ResponseEntity.ok(dto);
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    // Get a single complaint by id
    @GetMapping("/{id}")
    public ResponseEntity<?> getComplaint(@PathVariable Long id) {
        try {
            ComplaintDto dto = complaintService.getComplaintById(id);
            return ResponseEntity.ok(dto);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
        }
    }
}
