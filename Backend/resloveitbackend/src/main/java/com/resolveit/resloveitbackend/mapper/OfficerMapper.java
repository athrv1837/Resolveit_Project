package com.resolveit.resloveitbackend.mapper;

import com.resolveit.resloveitbackend.Model.Officer;
import com.resolveit.resloveitbackend.dto.OfficerDto;

public class OfficerMapper {
    public static OfficerDto toDto(Officer o) {
        if (o == null) return null;
        OfficerDto d = new OfficerDto();
        d.setId(o.getId());
        d.setName(o.getName());
        d.setEmail(o.getEmail());
        d.setDepartment(o.getDepartment());
        return d;
    }
}
