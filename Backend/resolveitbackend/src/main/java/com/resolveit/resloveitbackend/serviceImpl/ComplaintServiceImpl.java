package com.resolveit.resloveitbackend.serviceImpl;

import com.resolveit.resloveitbackend.Model.Complaint;
import com.resolveit.resloveitbackend.Model.ComplaintNote;
import com.resolveit.resloveitbackend.Model.ComplaintReply;
import com.resolveit.resloveitbackend.Model.ComplaintStatusHistory;
import com.resolveit.resloveitbackend.Model.Officer;
import com.resolveit.resloveitbackend.Model.User;
import com.resolveit.resloveitbackend.dto.ComplaintDto;
import com.resolveit.resloveitbackend.enums.ComplaintPriority;
import com.resolveit.resloveitbackend.enums.ComplaintStatus;
import com.resolveit.resloveitbackend.exception.ResourceNotFoundException;
import com.resolveit.resloveitbackend.exception.InvalidStatusException;
import com.resolveit.resloveitbackend.exception.InvalidPriorityException;
import com.resolveit.resloveitbackend.mapper.ComplaintMapper;
import com.resolveit.resloveitbackend.repository.ComplaintRepository;
import com.resolveit.resloveitbackend.repository.ComplaintNoteRepository;
import com.resolveit.resloveitbackend.repository.ComplaintReplyRepository;
import com.resolveit.resloveitbackend.repository.ComplaintStatusHistoryRepository;
import com.resolveit.resloveitbackend.repository.OfficerRepository;
import com.resolveit.resloveitbackend.repository.UserRepository;
import com.resolveit.resloveitbackend.service.ComplaintService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ComplaintServiceImpl implements ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final ComplaintNoteRepository noteRepository;
    private final ComplaintReplyRepository replyRepository;
    private final ComplaintStatusHistoryRepository statusHistoryRepository;
    private final UserRepository userRepository;
    private final OfficerRepository officerRepository;
    private final com.resolveit.resloveitbackend.service.EmailService emailService;

    public ComplaintServiceImpl(ComplaintRepository complaintRepository, ComplaintNoteRepository noteRepository,
            ComplaintReplyRepository replyRepository, ComplaintStatusHistoryRepository statusHistoryRepository,
            UserRepository userRepository,
            OfficerRepository officerRepository, com.resolveit.resloveitbackend.service.EmailService emailService) {
        this.complaintRepository = complaintRepository;
        this.noteRepository = noteRepository;
        this.replyRepository = replyRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.userRepository = userRepository;
        this.officerRepository = officerRepository;
        this.emailService = emailService;
    }

    // Generate government reference number (GRV-YYYYMMDD-XXXXX)
    // Generates a unique reference without relying on DB id (date + random 5-digit)
    private String generateReferenceNumber() {
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyyMMdd");
        String datePart = LocalDateTime.now().format(dateFormatter);
        int random = java.util.concurrent.ThreadLocalRandom.current().nextInt(0, 100000);
        String idPart = String.format("%05d", random);
        return "GRV-" + datePart + "-" + idPart;
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

        // Generate reference number before saving to satisfy NOT NULL constraint
        complaint.setReferenceNumber(generateReferenceNumber());

        Complaint saved = complaintRepository.save(complaint);

        // Save initial status history (PENDING)
        ComplaintStatusHistory initialHistory = new ComplaintStatusHistory(saved, saved.getStatus(), email, "Initial submission");
        statusHistoryRepository.save(initialHistory);

        // Auto-assign if HIGH or URGENT priority and at least one officer exists
        if (saved.getPriority() == ComplaintPriority.HIGH || saved.getPriority() == ComplaintPriority.URGENT) {
            List<Officer> officers = officerRepository.findAll();
            if (!officers.isEmpty()) {
                // Find officer with least assigned complaints (simple availability heuristic)
                Officer best = officers.stream()
                        .min(Comparator.comparingInt(o -> complaintRepository.findByAssignedTo(o.getEmail()).size()))
                        .orElse(null);

                if (best != null) {
                    saved.setAssignedTo(best.getEmail());
                    saved.setAssignedDepartment(best.getDepartment()); //Set department
                    saved.setStatus(ComplaintStatus.ASSIGNED);
                    saved = complaintRepository.save(saved);
                    
                    // Save status history for ASSIGNED
                    ComplaintStatusHistory assignedHistory = new ComplaintStatusHistory(saved, ComplaintStatus.ASSIGNED, "system", "Auto-assigned to " + best.getName());
                    statusHistoryRepository.save(assignedHistory);
                }
            }
        } else {
            saved = complaintRepository.save(saved);
        }
        // Notify submitter that complaint was created (best-effort)
        try {
            emailService.sendStatusUpdateEmail(saved.getSubmittedBy(), saved.getReferenceNumber(),
                    saved.getStatus().name());
        } catch (Exception ignored) {
        }
        return ComplaintMapper.toDto(saved);
    }

    @Override
    public ComplaintDto escalateComplaint(Long id, int level, String reason, String requestedBy) {
        Complaint c = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));
        c.setEscalated(true);
        c.setEscalationLevel(level);
        c.setEscalationReason(reason);
        c.setEscalatedAt(LocalDateTime.now());
        c.setLastUpdatedAt(LocalDateTime.now());
        c.setLastUpdatedBy(requestedBy);
        Complaint saved = complaintRepository.save(c);

        // Send emails to submitter and assigned officer (if any)
        try {
            if (saved.getSubmittedBy() != null)
                emailService.sendEscalationEmail(saved.getSubmittedBy(), saved.getReferenceNumber(), level, reason);
            if (saved.getAssignedTo() != null)
                emailService.sendEscalationEmail(saved.getAssignedTo(), saved.getReferenceNumber(), level, reason);
        } catch (Exception ignored) {
        }

        return ComplaintMapper.toDto(saved);
    }

    @Override
    public ComplaintDto updateComplaintStatus(Long id, String status, String requestedBy) {
        Complaint c = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));
        try {
            ComplaintStatus newStatus = ComplaintStatus.valueOf(status);
            c.setStatus(newStatus);
            c.setLastUpdatedAt(LocalDateTime.now());
            c.setLastUpdatedBy(requestedBy);
            Complaint saved = complaintRepository.save(c);
            
            // Save status history
            ComplaintStatusHistory history = new ComplaintStatusHistory(saved, newStatus, requestedBy, "Status updated to " + newStatus.name());
            statusHistoryRepository.save(history);
            
            try {
                if (saved.getSubmittedBy() != null)
                    emailService.sendStatusUpdateEmail(saved.getSubmittedBy(), saved.getReferenceNumber(),
                            saved.getStatus().name());
            } catch (Exception ignored) {
            }
            return ComplaintMapper.toDto(saved);
        } catch (IllegalArgumentException ex) {
            throw new InvalidStatusException("Invalid status value: " + status);
        }
    }

    @Override
    public ComplaintDto updateComplaintPriority(Long id, String priority, String requestedBy) {
        Complaint c = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));
        try {
            c.setPriority(ComplaintPriority.valueOf(priority.toUpperCase()));
        } catch (IllegalArgumentException ex) {
            throw new InvalidPriorityException("Invalid priority value: " + priority);
        }
        c.setLastUpdatedAt(LocalDateTime.now());
        c.setLastUpdatedBy(requestedBy);
        Complaint saved = complaintRepository.save(c);
        return ComplaintMapper.toDto(saved);
    }

    @Override
    public ComplaintNote addNote(Long id, String content, boolean isPrivate, String createdBy) {
        Complaint c = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));
        ComplaintNote note = new ComplaintNote(content, createdBy, isPrivate, c);
        return noteRepository.save(note);
    }

    @Override
    public ComplaintReply addReply(Long id, String content, boolean isAdminReply,
            String createdBy) {
        Complaint c = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));
        ComplaintReply reply = new ComplaintReply(
                content, createdBy, isAdminReply, c);
        return replyRepository.save(reply);
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

    @Transactional(readOnly = true)
    @Override
    public ComplaintDto getComplaintById(Long id) {
        Complaint c = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));
        return ComplaintMapper.toDto(c);
    }
}
