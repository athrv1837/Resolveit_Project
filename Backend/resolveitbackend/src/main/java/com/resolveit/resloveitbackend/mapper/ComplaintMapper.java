package com.resolveit.resloveitbackend.mapper;

import com.resolveit.resloveitbackend.Model.Complaint;
import com.resolveit.resloveitbackend.dto.ComplaintDto;

import java.util.ArrayList;
import java.util.List;

/**
 * Maps Complaint entity to ComplaintDto with government audit fields
 */
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
        return d;
    }

    public static List<ComplaintDto> toDtoList(List<Complaint> list) {
        List<ComplaintDto> out = new ArrayList<>();
        if (list == null) return out;
        for (Complaint c : list) out.add(toDto(c));
        return out;
    }
}
