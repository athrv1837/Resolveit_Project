package com.resolveit.resloveitbackend.service;

import com.resolveit.resloveitbackend.Model.Complaint;
import com.resolveit.resloveitbackend.dto.ComplaintDto;

import java.util.List;

public interface ComplaintService {
    ComplaintDto submitComplaint(Complaint complaint, String email);
    List<ComplaintDto> getUserComplaints(String email);
    List<ComplaintDto> getAllComplaints();
}
