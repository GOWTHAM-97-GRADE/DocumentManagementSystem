package com.student.DocumentManagementSystem.controller;

import com.student.DocumentManagementSystem.payload.request.CreateDirectoryRequest;
import com.student.DocumentManagementSystem.payload.request.RenameDirectoryRequest;
import com.student.DocumentManagementSystem.payload.response.DirectoryContentResponse;
import com.student.DocumentManagementSystem.payload.response.DirectoryResponse;
import com.student.DocumentManagementSystem.payload.response.FileResponse;
import com.student.DocumentManagementSystem.service.DirectoryService;
import com.student.DocumentManagementSystem.service.FileService;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/directories")
public class DirectoryController {

    private final DirectoryService directoryService;
    private final FileService fileService; // Add FileService dependency

    public DirectoryController(DirectoryService directoryService, FileService fileService) {
        this.directoryService = directoryService;
        this.fileService = fileService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public DirectoryResponse createDirectory(@RequestBody CreateDirectoryRequest request, Authentication authentication) {
        return directoryService.createDirectory(request, authentication.getName());
    }

    @PutMapping("/{id}/rename")
    @PreAuthorize("hasRole('ADMIN')")
    public DirectoryResponse renameDirectory(@PathVariable Long id, @RequestBody RenameDirectoryRequest request) {
        return directoryService.renameDirectory(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteDirectory(@PathVariable Long id) {
        directoryService.deleteDirectory(id);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public List<DirectoryResponse> getAllDirectories() {
        return directoryService.getAllDirectories();
    }

    @GetMapping("/{id}/subdirectories")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public List<DirectoryResponse> getSubdirectories(@PathVariable Long id) {
        return directoryService.getSubdirectories(id);
    }

    @PutMapping("/{id}/move")
    @PreAuthorize("hasRole('ADMIN')")
    public DirectoryResponse moveDirectory(@PathVariable Long id,
                                           @RequestParam(required = false) Long newParentId) {
        return directoryService.moveDirectory(id, newParentId);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public DirectoryResponse getDirectory(@PathVariable Long id) {
        return directoryService.getDirectory(id);
    }

    // New endpoint: List files and subdirectories in a directory
    @GetMapping("/{id}/contents")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public DirectoryContentResponse getDirectoryContents(@PathVariable Long id) {
        List<DirectoryResponse> subdirectories = directoryService.getSubdirectories(id);
        List<FileResponse> files = fileService.listFilesByDirectory(id);
        return new DirectoryContentResponse(subdirectories, files);
    }
}