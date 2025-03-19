package com.student.DocumentManagementSystem.payload.request;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class FileUploadRequest {
    private Long directoryId;
    private String username;
    private MultipartFile file;
}
