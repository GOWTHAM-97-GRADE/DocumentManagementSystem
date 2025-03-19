package com.student.DocumentManagementSystem.payload.request;

import lombok.Data;

@Data
public class CreateDirectoryRequest {
    private String name;
    private String path; // Used for root-level directories if no parent is provided
    private Long parentId; // Optional: If provided, the new directory will be created as a subfolder.
}
