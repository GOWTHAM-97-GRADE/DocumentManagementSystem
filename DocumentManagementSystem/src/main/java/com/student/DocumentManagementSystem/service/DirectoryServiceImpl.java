package com.student.DocumentManagementSystem.service;

import com.student.DocumentManagementSystem.exception.DirectoryAlreadyExistsException;
import com.student.DocumentManagementSystem.exception.DirectoryNotFoundException;
import com.student.DocumentManagementSystem.models.Directory;
import com.student.DocumentManagementSystem.models.User;
import com.student.DocumentManagementSystem.payload.request.CreateDirectoryRequest;
import com.student.DocumentManagementSystem.payload.request.RenameDirectoryRequest;
import com.student.DocumentManagementSystem.payload.response.DirectoryResponse;
import com.student.DocumentManagementSystem.repository.DirectoryRepository;
import com.student.DocumentManagementSystem.repository.UserRepository;
import org.hibernate.Hibernate;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DirectoryServiceImpl implements DirectoryService {
    private final DirectoryRepository directoryRepository;
    private final UserRepository userRepository;

    private static final Long ROOT_DIRECTORY_ID = 1L;
    private static final String SYSTEM_USERNAME = "system";

    public DirectoryServiceImpl(DirectoryRepository directoryRepository, UserRepository userRepository) {
        this.directoryRepository = directoryRepository;
        this.userRepository = userRepository;
    }

    @PostConstruct
    @Transactional
    public void initRootDirectory() {
        if (directoryRepository.findById(ROOT_DIRECTORY_ID).isEmpty()) {
            // Ensure a system user exists
            User systemUser = userRepository.findByUsername(SYSTEM_USERNAME)
                    .orElseGet(() -> {
                        User newUser = new User();
                        newUser.setUsername(SYSTEM_USERNAME);
                        newUser.setEmail("system@domain.com");
                        newUser.setPassword("defaultPassword"); // Set a secure default or encode it
                        newUser.setEnabled(1);
                        // Add roles or other required fields as per your User model
                        return userRepository.save(newUser);
                    });

            Directory root = new Directory();
            root.setId(ROOT_DIRECTORY_ID);
            root.setName("root");
            root.setCreatedAt(LocalDateTime.now());
            root.setUpdatedAt(LocalDateTime.now());
            root.setCreatedBy(systemUser);
            root.setParent(null); // Root has no parent
            root.updatePath();
            directoryRepository.save(root);
        }
    }

    @Override
    @Transactional
    public DirectoryResponse createDirectory(CreateDirectoryRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        Long parentId = request.getParentId() != null ? request.getParentId() : ROOT_DIRECTORY_ID;
        Directory parent = directoryRepository.findById(parentId)
                .orElseThrow(() -> new DirectoryNotFoundException("Parent directory not found: " + parentId));

        if (directoryRepository.findByNameAndParent(request.getName(), parent).isPresent()) {
            throw new DirectoryAlreadyExistsException("Directory '" + request.getName() + "' already exists under parent ID " + parentId);
        }

        Directory directory = new Directory();
        directory.setName(request.getName());
        directory.setCreatedBy(user);
        directory.setCreatedAt(LocalDateTime.now());
        directory.setUpdatedAt(LocalDateTime.now());
        directory.setParent(parent);
        directory.updatePath();

        parent.addSubdirectory(directory);
        directoryRepository.save(directory);
        return mapToResponse(directory);
    }

    @Override
    @Transactional
    public DirectoryResponse renameDirectory(Long id, RenameDirectoryRequest request) {
        Directory directory = directoryRepository.findById(id)
                .orElseThrow(() -> new DirectoryNotFoundException("Directory not found: " + id));

        String newName = request.getNewName();
        if (newName == null || newName.trim().isEmpty()) {
            throw new IllegalArgumentException("New name cannot be null or empty");
        }

        Directory parent = directory.getParent();
        if (directoryRepository.findByNameAndParent(newName, parent)
                .filter(d -> !d.getId().equals(id)).isPresent()) {
            throw new DirectoryAlreadyExistsException("Directory '" + newName + "' already exists under parent ID " + (parent != null ? parent.getId() : ROOT_DIRECTORY_ID));
        }

        directory.setName(newName);
        directory.setUpdatedAt(LocalDateTime.now());
        directory.updatePath();

        directoryRepository.save(directory);
        return mapToResponse(directory);
    }

    @Override
    @Transactional
    public void deleteDirectory(Long id) {
        Directory directory = directoryRepository.findById(id)
                .orElseThrow(() -> new DirectoryNotFoundException("Directory not found: " + id));

        if (id.equals(ROOT_DIRECTORY_ID)) {
            throw new IllegalArgumentException("Cannot delete the root directory");
        }

        Directory parent = directory.getParent();
        if (parent != null) {
            parent.removeSubdirectory(directory);
            directoryRepository.save(parent);
        }
        directoryRepository.delete(directory);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DirectoryResponse> getAllDirectories() {
        List<Directory> directories = directoryRepository.findAll();
        directories.forEach(d -> Hibernate.initialize(d.getSubdirectories()));
        return directories.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DirectoryResponse> getSubdirectories(Long parentId) {
        Directory parent = directoryRepository.findById(parentId)
                .orElseThrow(() -> new DirectoryNotFoundException("Directory not found: " + parentId));
        Hibernate.initialize(parent.getSubdirectories());
        return parent.getSubdirectories().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public DirectoryResponse moveDirectory(Long id, Long newParentId) {
        Directory directory = directoryRepository.findById(id)
                .orElseThrow(() -> new DirectoryNotFoundException("Directory not found: " + id));

        if (id.equals(ROOT_DIRECTORY_ID)) {
            throw new IllegalArgumentException("Cannot move the root directory");
        }

        checkForCycle(directory, newParentId);

        Directory oldParent = directory.getParent();
        Long effectiveNewParentId = newParentId != null ? newParentId : ROOT_DIRECTORY_ID;
        Directory newParent = directoryRepository.findById(effectiveNewParentId)
                .orElseThrow(() -> new DirectoryNotFoundException("New parent directory not found: " + effectiveNewParentId));

        if (directoryRepository.findByNameAndParent(directory.getName(), newParent)
                .filter(d -> !d.getId().equals(id)).isPresent()) {
            throw new DirectoryAlreadyExistsException("Directory '" + directory.getName() + "' already exists under parent ID " + effectiveNewParentId);
        }

        if (oldParent != null) {
            oldParent.removeSubdirectory(directory);
            directoryRepository.save(oldParent);
        }
        directory.setParent(newParent);
        newParent.addSubdirectory(directory);
        directory.updatePath();
        directory.setUpdatedAt(LocalDateTime.now());

        directoryRepository.save(directory);
        directoryRepository.save(newParent);
        return mapToResponse(directory);
    }

    @Override
    @Transactional(readOnly = true)
    public DirectoryResponse getDirectory(Long id) {
        Directory directory = directoryRepository.findById(id)
                .orElseThrow(() -> new DirectoryNotFoundException("Directory not found: " + id));
        Hibernate.initialize(directory.getSubdirectories());
        return mapToResponse(directory);
    }

    private DirectoryResponse mapToResponse(Directory directory) {
        return new DirectoryResponse(
                directory.getId(),
                directory.getName(),
                directory.getPath(),
                directory.getCreatedBy().getUsername()
        );
    }

    private void checkForCycle(Directory directory, Long newParentId) {
        if (newParentId != null && newParentId.equals(directory.getId())) {
            throw new IllegalArgumentException("Cannot move directory into itself");
        }
        Directory current = directory.getParent();
        while (current != null) {
            if (current.getId().equals(newParentId)) {
                throw new IllegalArgumentException("Cannot move directory into its own subdirectory");
            }
            current = current.getParent();
        }
    }
}