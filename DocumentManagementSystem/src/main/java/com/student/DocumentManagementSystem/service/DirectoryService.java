package com.student.DocumentManagementSystem.service;

import com.student.DocumentManagementSystem.payload.request.CreateDirectoryRequest;
import com.student.DocumentManagementSystem.payload.request.RenameDirectoryRequest;
import com.student.DocumentManagementSystem.payload.response.DirectoryResponse;

import java.util.List;

public interface DirectoryService {
    DirectoryResponse createDirectory(CreateDirectoryRequest request, String username);
    DirectoryResponse renameDirectory(Long id, RenameDirectoryRequest request);
    void deleteDirectory(Long id);
    List<DirectoryResponse> getAllDirectories();
    List<DirectoryResponse> getSubdirectories(Long parentId);
    DirectoryResponse moveDirectory(Long id, Long newParentId);
    DirectoryResponse getDirectory(Long id);
}