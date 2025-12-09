package com.resolveit.resloveitbackend.controller;

import com.resolveit.resloveitbackend.Model.Complaint;
import com.resolveit.resloveitbackend.dto.ComplaintRequest;
import com.resolveit.resloveitbackend.dto.ComplaintDto;

import com.resolveit.resloveitbackend.service.ComplaintService;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/complaints")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:8081"})
public class ComplaintController {

    @Autowired
    private ComplaintService complaintService;

    private final Path uploadRoot = Paths.get("uploads/complaints");

    public ComplaintController() {
        try { Files.createDirectories(uploadRoot); } catch (IOException ignored) {}
    }

    @PostMapping("/submit")
    public ComplaintDto submitComplaint(
            @RequestBody ComplaintRequest request,
            @RequestParam String email
    ) {
        Complaint complaint = new Complaint();
        complaint.setTitle(request.getTitle());
        complaint.setDescription(request.getDescription());
        complaint.setCategory(request.getCategory());
        complaint.setIsAnonymous(request.getIsAnonymous());
        return complaintService.submitComplaint(complaint, email);
    }

    @PostMapping(value = "/submit-with-files", consumes = {"multipart/form-data"})
    public ResponseEntity<?> submitWithFiles(
            @RequestPart("data") ComplaintRequest request,
            @RequestParam String email,
            @RequestPart(value = "files", required = false) MultipartFile[] files
    ) {
        Complaint complaint = new Complaint();
        complaint.setTitle(request.getTitle());
        complaint.setDescription(request.getDescription());
        complaint.setCategory(request.getCategory());
        complaint.setIsAnonymous(request.getIsAnonymous());

        List<String> savedNames = new ArrayList<>();
        if (files != null) {
            for (MultipartFile f : files) {
                String original = f.getOriginalFilename();
                if (original == null) continue;
                try {
                    Path dest = uploadRoot.resolve(System.currentTimeMillis() + "_" + original);
                    Files.copy(f.getInputStream(), dest);
                    savedNames.add(dest.toString());
                } catch (IOException e) {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to store file: " + original);
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
}
