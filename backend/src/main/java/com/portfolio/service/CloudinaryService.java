package com.portfolio.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryService {

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${cloudinary.api-key:}")
    private String apiKey;

    @Value("${cloudinary.api-secret:}")
    private String apiSecret;

    private Cloudinary cloudinary;
    private boolean enabled = false;

    @PostConstruct
    public void init() {
        if (!cloudName.isBlank() && !apiKey.isBlank() && !apiSecret.isBlank()) {
            cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key",    apiKey,
                "api_secret", apiSecret,
                "secure",     true
            ));
            enabled = true;
            System.out.println("CloudinaryService: enabled (cloud=" + cloudName + ")");
        } else {
            System.out.println("CloudinaryService: disabled - using local storage fallback");
        }
    }

    public boolean isEnabled() {
        return enabled;
    }

    /**
     * Upload any file to Cloudinary.
     * @param file     the multipart file
     * @param folder   Cloudinary folder name (e.g. "profile", "projects")
     * @param isPdf    true for PDF files (uses raw resource type)
     * @return         the secure Cloudinary URL
     */
    @SuppressWarnings("unchecked")
    public String upload(MultipartFile file, String folder, boolean isPdf) throws IOException {
        if (!enabled) {
            throw new IllegalStateException("Cloudinary is not configured");
        }
        Map<String, Object> options = ObjectUtils.asMap(
            "folder",        "portfolio/" + folder,
            "resource_type", isPdf ? "raw" : "image",
            "overwrite",     true
        );
        Map<String, Object> result = cloudinary.uploader().upload(file.getBytes(), options);
        return (String) result.get("secure_url");
    }

    /**
     * Delete a file from Cloudinary by its public_id.
     */
    @SuppressWarnings("unchecked")
    public void delete(String publicId, boolean isPdf) {
        if (!enabled || publicId == null) return;
        try {
            cloudinary.uploader().destroy(publicId,
                ObjectUtils.asMap("resource_type", isPdf ? "raw" : "image"));
        } catch (Exception ignored) {}
    }
}
