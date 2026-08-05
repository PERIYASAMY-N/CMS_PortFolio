package com.portfolio.util;

import com.portfolio.service.CloudinaryService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * File storage abstraction.
 * - When Cloudinary is configured (production): uploads to Cloudinary CDN.
 * - When Cloudinary is not configured (local dev): saves to local disk.
 *
 * All services call storeFile(file, category) and get back a URL string.
 * No service code needs to change.
 */
@Component
public class FileStorageUtil {

    @Value("${app.upload.dir:uploads/}")
    private String uploadDir;

    private final CloudinaryService cloudinaryService;

    private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList(
            "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"
    );
    private static final List<String> ALLOWED_PDF_TYPES = List.of("application/pdf");
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    public FileStorageUtil(CloudinaryService cloudinaryService) {
        this.cloudinaryService = cloudinaryService;
    }

    /**
     * Store a file and return its public URL.
     * Uses Cloudinary in production, local disk in development.
     */
    public String storeFile(MultipartFile file, String category) throws IOException {
        validateFile(file);
        boolean isPdf = isPdf(file);

        if (cloudinaryService.isEnabled()) {
            // Production: upload to Cloudinary, returns a full https:// URL
            return cloudinaryService.upload(file, category, isPdf);
        } else {
            // Local development: save to disk, returns /uploads/category/filename
            return storeLocally(file, category);
        }
    }

    /**
     * Delete a file. Works for both Cloudinary URLs and local paths.
     */
    public void deleteFile(String fileUrl) {
        if (fileUrl == null) return;

        if (fileUrl.startsWith("https://res.cloudinary.com")) {
            // Extract public_id from Cloudinary URL and delete
            // URL format: https://res.cloudinary.com/<cloud>/image/upload/v123/portfolio/folder/filename.ext
            try {
                String[] parts = fileUrl.split("/upload/");
                if (parts.length == 2) {
                    String withVersion = parts[1]; // v123/portfolio/folder/file.ext
                    // Remove version segment if present
                    String publicId = withVersion.replaceFirst("^v\\d+/", "");
                    // Remove file extension
                    publicId = publicId.replaceFirst("\\.[^.]+$", "");
                    boolean isPdf = fileUrl.endsWith(".pdf");
                    cloudinaryService.delete(publicId, isPdf);
                }
            } catch (Exception ignored) {}
        } else if (fileUrl.startsWith("/uploads/")) {
            // Local file
            try {
                Path filePath = Paths.get(fileUrl.substring(1));
                Files.deleteIfExists(filePath);
            } catch (IOException ignored) {}
        }
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private String storeLocally(MultipartFile file, String category) throws IOException {
        Path uploadPath = Paths.get(uploadDir, category);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        String extension = getExtension(file.getOriginalFilename());
        String fileName  = UUID.randomUUID() + "." + extension;
        Path   filePath  = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        return "/uploads/" + category + "/" + fileName;
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new RuntimeException("File size exceeds 10MB limit");
        }
        String contentType = file.getContentType();
        if (contentType == null ||
                (!ALLOWED_IMAGE_TYPES.contains(contentType) && !ALLOWED_PDF_TYPES.contains(contentType))) {
            throw new RuntimeException("Unsupported file type: " + contentType);
        }
    }

    private boolean isPdf(MultipartFile file) {
        String ct = file.getContentType();
        return ct != null && ct.equals("application/pdf");
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "bin";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}
