package com.portfolio.controller;

import com.portfolio.entity.Media;
import com.portfolio.service.MediaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/media")
@RequiredArgsConstructor
public class PublicMediaController {

    private final MediaService mediaService;

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadMedia(@PathVariable Long id) {
        Media media = mediaService.getMedia(id);
        if (media == null || media.getData() == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        HttpHeaders headers = new HttpHeaders();
        String fileType = media.getFileType();
        if (fileType != null) {
            headers.setContentType(MediaType.parseMediaType(fileType));
        }
        
        return new ResponseEntity<>(media.getData(), headers, HttpStatus.OK);
    }
}
