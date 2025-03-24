package com.student.DocumentManagementSystem.service;

import com.student.DocumentManagementSystem.payload.request.CreateDirectoryRequest;
import com.student.DocumentManagementSystem.payload.request.RenameDirectoryRequest;
import com.student.DocumentManagementSystem.payload.response.DirectoryResponse;

import java.util.List;

public interface DirectoryService {
    DirectoryResponse createDirectory(CreateDirectoryRequest request, String username);
    DirectoryResponse renameDirectory(Long id, RenameDirectoryRequest request, Long userId, String username);
    void deleteDirectory(Long id, Long userId, String username);
    List<DirectoryResponse> getAllDirectories();
    List<DirectoryResponse> getSubdirectories(Long parentId);
    DirectoryResponse moveDirectory(Long id, Long newParentId, Long userId, String username);
    DirectoryResponse getDirectory(Long id);
}