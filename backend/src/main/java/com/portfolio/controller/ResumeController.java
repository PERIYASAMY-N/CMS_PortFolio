package com.portfolio.controller;

import com.portfolio.dto.ApiResponse;
import com.portfolio.entity.Resume;
import com.portfolio.service.ResumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequiredArgsConstructor
@SuppressWarnings("null")
public class ResumeController {

    private final ResumeService resumeService;

    /**
     * Public resume download.
     * If the stored URL is a Cloudinary URL (https://), redirect to it directly.
     * If it's a local path (/uploads/...), serve it from disk (local dev only).
     */
    @GetMapping("/api/public/resume")
    public ResponseEntity<?> download() throws Exception {
        Resume resume = resumeService.getActiveResume();
        String fileUrl = resume.getFileUrl();

        // Cloudinary URL — redirect browser to download directly from CDN
        if (fileUrl != null && fileUrl.startsWith("https://")) {
            return ResponseEntity
                    .status(302)
                    .location(URI.create(fileUrl))
                    .build();
        }

        // Local path — serve from disk (development only)
        Path filePath = Paths.get(fileUrl.substring(1));
        Resource resource = new UrlResource(filePath.toAbsolutePath().toUri());
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + resume.getFileName() + "\"")
                .body(resource);
    }

    @GetMapping("/api/admin/resume")
    public ResponseEntity<ApiResponse<Resume>> getActive() {
        return ResponseEntity.ok(ApiResponse.success(resumeService.getActiveResume()));
    }

    @GetMapping("/api/admin/resume/all")
    public ResponseEntity<ApiResponse<List<Resume>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(resumeService.getAllResumes()));
    }

    @PostMapping("/api/admin/resume/upload")
    public ResponseEntity<ApiResponse<Resume>> upload(@RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(ApiResponse.success("Resume uploaded", resumeService.uploadResume(file)));
    }

    @PutMapping("/api/admin/resume/{id}/activate")
    public ResponseEntity<ApiResponse<Void>> activate(@PathVariable Long id) {
        resumeService.setActive(id);
        return ResponseEntity.ok(ApiResponse.success("Resume activated", null));
    }
}
