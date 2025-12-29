package com.resolveit.resloveitbackend.service;

import com.resolveit.resloveitbackend.Model.Complaint;
import com.resolveit.resloveitbackend.dto.ComplaintDto;

import java.util.List;

public interface ComplaintService {
    ComplaintDto submitComplaint(Complaint complaint, String email);
    List<ComplaintDto> getUserComplaints(String email);
    List<ComplaintDto> getAllComplaints();
    ComplaintDto escalateComplaint(Long id, int level, String reason, String requestedBy);
    ComplaintDto updateComplaintStatus(Long id, String status, String requestedBy);
    ComplaintDto updateComplaintPriority(Long id, String priority, String requestedBy);
    com.resolveit.resloveitbackend.Model.ComplaintNote addNote(Long id, String content, boolean isPrivate, String createdBy);
    com.resolveit.resloveitbackend.Model.ComplaintReply addReply(Long id, String content, boolean isAdminReply, String createdBy);

    // Get a single complaint by id
    ComplaintDto getComplaintById(Long id);
}
