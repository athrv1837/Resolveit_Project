package com.resolveit.resloveitbackend.controller;

import com.resolveit.resloveitbackend.Model.Complaint;
import com.resolveit.resloveitbackend.dto.ComplaintRequest;
import com.resolveit.resloveitbackend.service.ComplaintService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/complaints")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:8081"})
public class ComplaintController {

    @Autowired
    private ComplaintService complaintService;

    /**
     * ✅ Citizen submits a new complaint.
     * Example POST: /api/complaints/submit?email=citizen@example.com
     */
    @PostMapping("/submit")
    public Complaint submitComplaint(
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

    /**
     * ✅ Citizen views all their complaints.
     * Example GET: /api/complaints/user?email=citizen@example.com
     */
    @GetMapping("/user")
    public List<Complaint> getUserComplaints(@RequestParam String email) {
        return complaintService.getUserComplaints(email);
    }

    /**
     * ✅ Admin (and optionally officers) can view all complaints.
     * Example GET: /api/complaints
     */
    @GetMapping
    public List<Complaint> getAllComplaints() {
        return complaintService.getAllComplaints();
    }
}
