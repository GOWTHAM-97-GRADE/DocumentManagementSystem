package com.student.DocumentManagementSystem.controller;

import com.student.DocumentManagementSystem.payload.request.FileUploadRequest;
import com.student.DocumentManagementSystem.payload.response.FileResponse;
import com.student.DocumentManagementSystem.service.FileService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.core.Authentication; // Added import

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    @PreAuthorize("hasAnyRole('USER', 'MODERATOR', 'ADMIN')")
    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ResponseEntity<List<FileResponse>> uploadFiles(
            @RequestParam("directoryId") Long directoryId,
            @RequestParam("file") MultipartFile[] files, // Accept multiple files
            @RequestParam("username") String username,
            @RequestParam(value = "relativePath", required = false) String[] relativePaths) { // Optional paths
        List<FileResponse> responses = new ArrayList<>();

        if (files.length == 0) {
            return ResponseEntity.badRequest().body(responses);
        }

        // Handle single or multiple files with optional relative paths
        for (int i = 0; i < files.length; i++) {
            String relativePath = (relativePaths != null && i < relativePaths.length) ? relativePaths[i] : null;
            FileResponse response = fileService.uploadFile(directoryId, files[i], username, relativePath);
            responses.add(response);
        }

        return ResponseEntity.ok(responses);
    }

    @PreAuthorize("hasAnyRole('USER', 'MODERATOR', 'ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<FileResponse> getFile(@PathVariable UUID id) {
        FileResponse file = fileService.getFile(id);
        return ResponseEntity.ok(file);
    }

    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    @PutMapping("/{id}/update")
    public ResponseEntity<FileResponse> updateFile(@PathVariable UUID id, @RequestParam MultipartFile file) {
        return ResponseEntity.ok(fileService.updateFile(id, file));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFile(@PathVariable UUID id) {
        fileService.deleteFile(id);
        return ResponseEntity.ok("File deleted successfully.");
    }

    @PreAuthorize("hasAnyRole('USER', 'MODERATOR', 'ADMIN')")
    @PostMapping("/{id}/comments")
    public ResponseEntity<FileResponse> addComment(@PathVariable UUID id, @RequestBody Map<String, String> request, Authentication authentication) {
        String comment = request.get("comment");
        if (comment == null || comment.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        FileResponse response = fileService.addComment(id, comment, authentication.getName());
        return ResponseEntity.ok(response);
    }
}