package com.portfolio.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "media")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Media {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fileName;
    private String originalName;
    private String fileUrl;
    private String fileType;
    private Long fileSize;
    private String category; // profile, project, certificate, hero
    private LocalDateTime uploadedAt;

    @Lob
    @Basic(fetch = FetchType.LAZY)
    private byte[] data;

    @PrePersist
    public void prePersist() {
        uploadedAt = LocalDateTime.now();
    }
}
