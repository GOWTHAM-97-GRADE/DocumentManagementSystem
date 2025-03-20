package com.student.DocumentManagementSystem.repository;

import com.student.DocumentManagementSystem.models.Directory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DirectoryRepository extends JpaRepository<Directory, Long> {
    Optional<Directory> findByName(String name);
    Optional<Directory> findByNameAndParent(String name, Directory parent);
    Optional<Directory> findByNameAndParentIsNull(String name);
    Optional<Directory> findByPath(String path); // New: For path uniqueness checks
}