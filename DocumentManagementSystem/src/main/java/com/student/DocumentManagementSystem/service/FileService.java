package com.student.DocumentManagementSystem.service;

import com.student.DocumentManagementSystem.models.FileEntity;
import com.student.DocumentManagementSystem.payload.response.FileResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface FileService {
    FileResponse uploadFile(Long directoryId, MultipartFile file, String username);
    FileResponse uploadFile(Long directoryId, MultipartFile file, String username, String relativePath);
    FileResponse addComment(UUID fileId, String comment, String username);
    FileResponse getFile(UUID fileId);
    FileResponse updateFile(UUID fileId, MultipartFile file, Long userId, String username);
    void deleteFile(UUID fileId, Long userId, String username);
    List<FileResponse> listFilesByDirectory(Long directoryId);
    FileEntity getFileEntity(UUID fileId);
}