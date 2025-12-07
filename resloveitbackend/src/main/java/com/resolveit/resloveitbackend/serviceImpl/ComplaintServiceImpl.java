package com.resolveit.resloveitbackend.serviceImpl;

import com.resolveit.resloveitbackend.Model.Complaint;
import com.resolveit.resloveitbackend.Model.Officer;
import com.resolveit.resloveitbackend.Model.User;
import com.resolveit.resloveitbackend.dto.ComplaintDto;
import com.resolveit.resloveitbackend.enums.ComplaintPriority;
import com.resolveit.resloveitbackend.enums.ComplaintStatus;
import com.resolveit.resloveitbackend.exception.ResourceNotFoundException;
import com.resolveit.resloveitbackend.mapper.ComplaintMapper;
import com.resolveit.resloveitbackend.repository.ComplaintRepository;
import com.resolveit.resloveitbackend.repository.OfficerRepository;
import com.resolveit.resloveitbackend.repository.UserRepository;
import com.resolveit.resloveitbackend.service.ComplaintService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ComplaintServiceImpl implements ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final OfficerRepository officerRepository;

    public ComplaintServiceImpl(ComplaintRepository complaintRepository, UserRepository userRepository, OfficerRepository officerRepository) {
        this.complaintRepository = complaintRepository;
        this.userRepository = userRepository;
        this.officerRepository = officerRepository;
    }

    @Transactional
    @Override
    public ComplaintDto submitComplaint(Complaint complaint, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        complaint.setUser(user);
        complaint.setSubmittedBy(email);

        if (complaint.getStatus() == null) {
            complaint.setStatus(ComplaintStatus.PENDING);
        }

        if (complaint.getSubmittedAt() == null) {
            complaint.setSubmittedAt(LocalDateTime.now());
        }

        Complaint saved = complaintRepository.save(complaint);

        // Auto-assign if HIGH priority and at least one officer exists
        if (saved.getPriority() == ComplaintPriority.HIGH) {
            List<Officer> officers = officerRepository.findAll();
            if (!officers.isEmpty()) {
                // Find officer with least assigned complaints (simple availability heuristic)
                Officer best = officers.stream()
                        .min(Comparator.comparingInt(o -> complaintRepository.findByAssignedTo(o.getEmail()).size()))
                        .orElse(null);

                if (best != null) {
                    saved.setAssignedTo(best.getEmail());
                    saved.setStatus(ComplaintStatus.ASSIGNED);
                    saved = complaintRepository.save(saved);
                }
            }
        }

        return ComplaintMapper.toDto(saved);
    }

    @Transactional(readOnly = true)
    @Override
    public List<ComplaintDto> getUserComplaints(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        return complaintRepository.findByUser(user).stream()
                .map(ComplaintMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    @Override
    public List<ComplaintDto> getAllComplaints() {
        return complaintRepository.findAll().stream()
                .map(ComplaintMapper::toDto)
                .collect(Collectors.toList());
    }
}
