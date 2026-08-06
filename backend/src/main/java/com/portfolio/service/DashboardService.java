package com.portfolio.service;

import com.portfolio.repository.*;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ProjectRepository projectRepository;
    private final CertificationRepository certificationRepository;
    private final SkillRepository skillRepository;
    private final MessageRepository messageRepository;
    private final ResumeRepository resumeRepository;
    private final MediaRepository mediaRepository;

    public DashboardStats getStats() {
        DashboardStats stats = new DashboardStats();
        stats.setTotalProjects(projectRepository.count());
        stats.setTotalCertificates(certificationRepository.count());
        stats.setTotalSkills(skillRepository.count());
        stats.setTotalMessages(messageRepository.countByIsReadFalseAndIsArchivedFalse());
        stats.setTotalMedia(mediaRepository.count());
        stats.setHasActiveResume(resumeRepository.findFirstByIsActiveTrueOrderByUploadedAtDesc().isPresent());
        return stats;
    }

    @Data
    public static class DashboardStats {
        private long totalProjects;
        private long totalCertificates;
        private long totalSkills;
        private long totalMessages;
        private long totalMedia;
        private boolean hasActiveResume;
    }
}
