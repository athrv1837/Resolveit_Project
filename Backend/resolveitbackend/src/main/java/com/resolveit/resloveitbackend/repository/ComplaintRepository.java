package com.resolveit.resloveitbackend.repository;

import com.resolveit.resloveitbackend.Model.Complaint;
import com.resolveit.resloveitbackend.Model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    List<Complaint> findByUser(User user);

    List<Complaint> findBySubmittedBy(String submittedBy);

    List<Complaint> findByAssignedTo(String assignedTo);

    List<Complaint> findByStatus(String status);
}