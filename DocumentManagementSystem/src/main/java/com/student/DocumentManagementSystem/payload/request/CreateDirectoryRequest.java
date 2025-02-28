package com.student.DocumentManagementSystem.payload.request;

import lombok.Data;

@Data
public class CreateDirectoryRequest {
    private String name;
    private String path;
}
