package com.student.DocumentManagementSystem.controller;

import com.student.DocumentManagementSystem.payload.request.CreateDirectoryRequest;
import com.student.DocumentManagementSystem.payload.request.RenameDirectoryRequest;
import com.student.DocumentManagementSystem.payload.response.DirectoryContentResponse;
import com.student.DocumentManagementSystem.payload.response.DirectoryResponse;
import com.student.DocumentManagementSystem.payload.response.FileResponse;
import com.student.DocumentManagementSystem.security.services.UserDetailsImpl;
import com.student.DocumentManagementSystem.service.DirectoryService;
import com.student.DocumentManagementSystem.service.FileService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/directories")
public class DirectoryController {

    private final DirectoryService directoryService;
    private final FileService fileService;

    public DirectoryController(DirectoryService directoryService, FileService fileService) {
        this.directoryService = directoryService;
        this.fileService = fileService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<DirectoryResponse> createDirectory(@RequestBody CreateDirectoryRequest request, Authentication authentication) {
        return ResponseEntity.ok(directoryService.createDirectory(request, authentication.getName()));
    }

    @PutMapping("/{id}/rename")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DirectoryResponse> renameDirectory(@PathVariable Long id, @RequestBody RenameDirectoryRequest request, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Long userId = userDetails.getId();
        String username = userDetails.getUsername();
        return ResponseEntity.ok(directoryService.renameDirectory(id, request, userId, username));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteDirectory(@PathVariable Long id, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Long userId = userDetails.getId();
        String username = userDetails.getUsername();
        directoryService.deleteDirectory(id, userId, username);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<List<DirectoryResponse>> getAllDirectories() {
        return ResponseEntity.ok(directoryService.getAllDirectories());
    }

    @GetMapping("/{id}/subdirectories")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<List<DirectoryResponse>> getSubdirectories(@PathVariable Long id) {
        return ResponseEntity.ok(directoryService.getSubdirectories(id));
    }

    @PutMapping("/{id}/move")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DirectoryResponse> moveDirectory(@PathVariable Long id, @RequestParam(required = false) Long newParentId, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Long userId = userDetails.getId();
        String username = userDetails.getUsername();
        return ResponseEntity.ok(directoryService.moveDirectory(id, newParentId, userId, username));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<DirectoryResponse> getDirectory(@PathVariable Long id) {
        return ResponseEntity.ok(directoryService.getDirectory(id));
    }

    @GetMapping("/{id}/contents")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<DirectoryContentResponse> getDirectoryContents(@PathVariable Long id) {
        List<DirectoryResponse> subdirectories = directoryService.getSubdirectories(id);
        List<FileResponse> files = fileService.listFilesByDirectory(id);
        return ResponseEntity.ok(new DirectoryContentResponse(subdirectories, files));
    }
}