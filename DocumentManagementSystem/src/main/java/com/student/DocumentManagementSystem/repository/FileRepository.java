package com.student.DocumentManagementSystem.repository;

import com.student.DocumentManagementSystem.models.FileEntity;
import com.student.DocumentManagementSystem.models.Directory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FileRepository extends JpaRepository<FileEntity, UUID> {
    // Check for duplicate file based on name and size within the same directory
    Optional<FileEntity> findByFileNameAndFileSizeAndDirectory(String fileName, long fileSize, Directory directory);

    // List all files under a specific directory
    List<FileEntity> findAllByDirectory(Directory directory);
}
