package com.student.DocumentManagementSystem.controller;

import com.student.DocumentManagementSystem.payload.response.FileResponse;
import com.student.DocumentManagementSystem.security.services.UserDetailsImpl;
import com.student.DocumentManagementSystem.service.FileService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private static final Logger logger = LoggerFactory.getLogger(FileController.class);
    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    @PreAuthorize("hasAnyRole('USER', 'MODERATOR', 'ADMIN')")
    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ResponseEntity<List<FileResponse>> uploadFiles(
            @RequestParam("directoryId") Long directoryId,
            @RequestParam("file") MultipartFile[] files,
            @RequestParam(value = "relativePath", required = false) String[] relativePaths,
            Authentication authentication) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            String username = userDetails.getUsername();
            logger.info("Uploading {} files to directory {} by user {}", files.length, directoryId, username);

            List<FileResponse> responses = new ArrayList<>();
            if (files.length == 0) {
                logger.warn("No files provided for upload");
                return ResponseEntity.badRequest().body(responses);
            }

            for (int i = 0; i < files.length; i++) {
                String relativePath = (relativePaths != null && i < relativePaths.length) ? relativePaths[i] : null;
                FileResponse response = fileService.uploadFile(directoryId, files[i], username, relativePath);
                responses.add(response);
            }

            logger.info("Successfully uploaded {} files", files.length);
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            logger.error("Error uploading files: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ArrayList<>());
        }
    }

    @PreAuthorize("hasAnyRole('USER', 'MODERATOR', 'ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<FileResponse> getFile(@PathVariable UUID id) {
        FileResponse file = fileService.getFile(id);
        return ResponseEntity.ok(file);
    }

    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    @PutMapping(value = "/{id}/update", consumes = "multipart/form-data")
    public ResponseEntity<FileResponse> updateFile(@PathVariable UUID id, @RequestParam("file") MultipartFile file, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Long userId = userDetails.getId();
        String username = userDetails.getUsername();
        return ResponseEntity.ok(fileService.updateFile(id, file, userId, username));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteFile(@PathVariable UUID id, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Long userId = userDetails.getId();
        String username = userDetails.getUsername();
        fileService.deleteFile(id, userId, username);
        return ResponseEntity.ok("File deleted successfully.");
    }

    @PreAuthorize("hasAnyRole('USER', 'MODERATOR', 'ADMIN')")
    @PostMapping("/{id}/comments")
    public ResponseEntity<FileResponse> addComment(@PathVariable UUID id, @RequestBody Map<String, String> request, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String username = userDetails.getUsername();
        String comment = request.get("comment");
        if (comment == null || comment.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        FileResponse response = fileService.addComment(id, comment, username);
        return ResponseEntity.ok(response);
    }
}