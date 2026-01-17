package com.resolveit.resloveitbackend.repository;

import com.resolveit.resloveitbackend.Model.Officer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OfficerRepository extends JpaRepository<Officer, Long> {

    boolean existsByEmail(String email);

    Optional<Officer> findByEmail(String email);

}