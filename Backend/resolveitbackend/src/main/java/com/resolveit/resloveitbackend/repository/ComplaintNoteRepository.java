package com.resolveit.resloveitbackend.repository;

import com.resolveit.resloveitbackend.Model.ComplaintNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ComplaintNoteRepository extends JpaRepository<ComplaintNote, Long> {
}
