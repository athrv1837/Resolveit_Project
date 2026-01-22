package com.resolveit.resloveitbackend.mapper;

import com.resolveit.resloveitbackend.Model.Complaint;
import com.resolveit.resloveitbackend.dto.ComplaintDto;

import java.util.ArrayList;
import java.util.List;

public class ComplaintMapper {
    public static ComplaintDto toDto(Complaint c) {
        if (c == null) return null;
        ComplaintDto d = new ComplaintDto();
        d.setId(c.getId());
        d.setReferenceNumber(c.getReferenceNumber());  // ✅ NEW
        d.setTitle(c.getTitle());
        d.setDescription(c.getDescription());
        d.setCategory(c.getCategory());
        d.setStatus(c.getStatus());
        d.setPriority(c.getPriority());
        d.setAssignedTo(c.getAssignedTo());
        d.setAssignedDepartment(c.getAssignedDepartment());  // ✅ NEW
        d.setIsAnonymous(c.getIsAnonymous());
        d.setSubmittedBy(c.getSubmittedBy());
        d.setSubmittedAt(c.getSubmittedAt());
        d.setLastUpdatedAt(c.getLastUpdatedAt());            // ✅ NEW
        d.setLastUpdatedBy(c.getLastUpdatedBy());            // ✅ NEW
        d.setAttachments(c.getAttachments());
        if (c.getAttachments() != null) {
            d.setAttachmentCount(c.getAttachments().size()); // ✅ NEW
        }

        // Replies mapping
        if (c.getReplies() != null) {
            java.util.List<com.resolveit.resloveitbackend.dto.ReplyDto> replies = new java.util.ArrayList<>();
            for (com.resolveit.resloveitbackend.Model.ComplaintReply r : c.getReplies()) {
                com.resolveit.resloveitbackend.dto.ReplyDto rd = new com.resolveit.resloveitbackend.dto.ReplyDto();
                rd.setId(r.getId());
                rd.setContent(r.getContent());
                rd.setCreatedBy(r.getCreatedBy());
                rd.setCreatedAt(r.getCreatedAt());
                rd.setAdminReply(r.isAdminReply());
                replies.add(rd);
            }
            d.setReplies(replies);
        }

        // Status History mapping
        if (c.getStatusHistory() != null) {
            java.util.List<com.resolveit.resloveitbackend.dto.StatusHistoryDto> history = new java.util.ArrayList<>();
            for (com.resolveit.resloveitbackend.Model.ComplaintStatusHistory h : c.getStatusHistory()) {
                com.resolveit.resloveitbackend.dto.StatusHistoryDto hd = new com.resolveit.resloveitbackend.dto.StatusHistoryDto();
                hd.setId(h.getId());
                hd.setStatus(h.getStatus());
                hd.setChangedAt(h.getChangedAt());
                hd.setChangedBy(h.getChangedBy());
                hd.setNotes(h.getNotes());
                history.add(hd);
            }
            d.setStatusHistory(history);
        }

        // Escalation
        d.setEscalated(c.isEscalated());
        d.setEscalationLevel(c.getEscalationLevel());
        d.setEscalationReason(c.getEscalationReason());
        d.setEscalatedAt(c.getEscalatedAt());
        return d;
    }

    public static List<ComplaintDto> toDtoList(List<Complaint> list) {
        List<ComplaintDto> out = new ArrayList<>();
        if (list == null) return out;
        for (Complaint c : list) out.add(toDto(c));
        return out;
    }
}
