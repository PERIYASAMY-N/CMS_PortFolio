package com.portfolio.service;

import com.portfolio.entity.Media;
import com.portfolio.repository.MediaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class MediaService {

    private final MediaRepository mediaRepository;

    @Transactional(readOnly = true)
    public List<Media> getAll() {
        return mediaRepository.findAllByOrderByUploadedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<Media> getByCategory(String category) {
        return mediaRepository.findByCategoryOrderByUploadedAtDesc(category);
    }

    @Transactional
    public Media upload(MultipartFile file, String category) throws IOException {
        Media media = Media.builder()
                .fileName(generateFileName(file.getOriginalFilename()))
                .originalName(file.getOriginalFilename())
                .fileType(file.getContentType())
                .fileSize(file.getSize())
                .category(category)
                .data(file.getBytes())
                .build();
        
        media = mediaRepository.save(media);
        
        // Update the fileUrl to point to the new DB endpoint
        media.setFileUrl("/api/public/media/" + media.getId() + "/download");
        return mediaRepository.save(media);
    }

    @Transactional
    public void delete(Long id) {
        mediaRepository.findById(id).ifPresent(mediaRepository::delete);
    }

    @Transactional(readOnly = true)
    public Media getMedia(Long id) {
        return mediaRepository.findById(id).orElse(null);
    }

    private String generateFileName(String original) {
        return original != null ? original : "unknown";
    }
}
