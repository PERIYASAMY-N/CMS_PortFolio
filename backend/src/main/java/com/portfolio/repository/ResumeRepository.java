package com.portfolio.repository;

import com.portfolio.entity.Resume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import java.util.Optional;

public interface ResumeRepository extends JpaRepository<Resume, Long> {

    // Use findFirst to avoid NonUniqueResultException when multiple rows have isActive=true
    Optional<Resume> findFirstByIsActiveTrueOrderByUploadedAtDesc();

    @Modifying
    @Query("UPDATE Resume r SET r.isActive = false")
    void deactivateAll();

    @Modifying
    @Query("UPDATE Resume r SET r.isActive = true WHERE r.id = :id")
    void activateById(Long id);
}
