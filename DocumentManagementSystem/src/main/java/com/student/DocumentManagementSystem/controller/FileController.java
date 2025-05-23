package com.student.DocumentManagementSystem.controller;

import com.student.DocumentManagementSystem.payload.response.FileResponse;
import com.student.DocumentManagementSystem.security.services.UserDetailsImpl;
import com.student.DocumentManagementSystem.service.FileService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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

    // Existing endpoints remain unchanged...

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
        try {
            FileResponse file = fileService.getFile(id);
            return ResponseEntity.ok(file);
        } catch (Exception e) {
            logger.error("Error fetching file {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    @PutMapping(value = "/{id}/update", consumes = "multipart/form-data")
    public ResponseEntity<FileResponse> updateFile(@PathVariable UUID id, @RequestParam("file") MultipartFile file, Authentication authentication) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Long userId = userDetails.getId();
            String username = userDetails.getUsername();
            FileResponse response = fileService.updateFile(id, file, userId, username);
            if (response == null) {
                logger.error("FileService returned null for file update: {}", id);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
            }
            logger.info("Update file response for ID {}: {}", id, response);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON) // Explicitly set Content-Type
                    .body(response);
        } catch (Exception e) {
            logger.error("Error updating file {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteFile(@PathVariable UUID id, Authentication authentication) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Long userId = userDetails.getId();
            String username = userDetails.getUsername();
            fileService.deleteFile(id, userId, username);
            return ResponseEntity.ok("File deleted successfully.");
        } catch (Exception e) {
            logger.error("Error deleting file {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error deleting file");
        }
    }

    @PreAuthorize("hasAnyRole('USER', 'MODERATOR', 'ADMIN')")
    @PostMapping("/{id}/comments")
    public ResponseEntity<FileResponse> addComment(@PathVariable UUID id, @RequestBody Map<String, String> request, Authentication authentication) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            String username = userDetails.getUsername();
            String comment = request.get("comment");
            if (comment == null || comment.trim().isEmpty()) {
                logger.warn("Empty comment received for file {}", id);
                return ResponseEntity.badRequest().body(null);
            }
            FileResponse response = fileService.addComment(id, comment, username);
            logger.info("Comment added to file {} by {}", id, username);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.error("Invalid comment for file {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(null);
        } catch (Exception e) {
            logger.error("Error adding comment to file {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    // New download endpoint
    @PreAuthorize("hasAnyRole('USER', 'MODERATOR', 'ADMIN')")
    @GetMapping("/{id}/download")
    public ResponseEntity<ByteArrayResource> downloadFile(@PathVariable UUID id) {
        try {
            logger.info("Request to download file with ID: {}", id);
            FileResponse fileResponse = fileService.getFile(id);

            // Get the raw file bytes
            byte[] fileData = fileService.getFileEntity(id).getFileData();

            // Set headers for file download
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(fileResponse.getFileType() != null ? fileResponse.getFileType() : "application/octet-stream"));
            headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileResponse.getFileName() + "\"");
            headers.setContentLength(fileData.length);

            ByteArrayResource resource = new ByteArrayResource(fileData);

            logger.info("Successfully prepared file {} for download", fileResponse.getFileName());
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(resource);
        } catch (Exception e) {
            logger.error("Error downloading file {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }
}