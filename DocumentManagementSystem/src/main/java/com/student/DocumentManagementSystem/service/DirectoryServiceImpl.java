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

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DirectoryServiceImpl implements DirectoryService {
    private final DirectoryRepository directoryRepository;
    private final UserRepository userRepository;

    public DirectoryServiceImpl(DirectoryRepository directoryRepository, UserRepository userRepository) {
        this.directoryRepository = directoryRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public DirectoryResponse createDirectory(CreateDirectoryRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        Directory parent = null;
        if (request.getParentId() != null) {
            parent = directoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new DirectoryNotFoundException("Parent directory not found: " + request.getParentId()));
            if (directoryRepository.findByNameAndParent(request.getName(), parent).isPresent()) {
                throw new DirectoryAlreadyExistsException("Directory '" + request.getName() + "' already exists under parent ID " + parent.getId());
            }
        } else {
            if (directoryRepository.findByNameAndParentIsNull(request.getName()).isPresent()) {
                throw new DirectoryAlreadyExistsException("Directory '" + request.getName() + "' already exists at root level");
            }
        }

        Directory directory = new Directory();
        directory.setName(request.getName());
        directory.setCreatedBy(user);
        directory.setCreatedAt(LocalDateTime.now());
        directory.setUpdatedAt(LocalDateTime.now());
        directory.setParent(parent);
        directory.updatePath();

        if (parent != null) {
            parent.addSubdirectory(directory);
        }

        directoryRepository.save(directory);
        return mapToResponse(directory);
    }

    @Override
    @Transactional
    public DirectoryResponse renameDirectory(Long id, RenameDirectoryRequest request) {
        Directory directory = directoryRepository.findById(id)
                .orElseThrow(() -> new DirectoryNotFoundException("Directory not found: " + id));

        if (request.getNewName() == null || request.getNewName().trim().isEmpty()) {
            throw new IllegalArgumentException("New name cannot be null or empty");
        }

        Directory parent = directory.getParent();
        if (parent != null && directoryRepository.findByNameAndParent(request.getNewName(), parent)
                .filter(d -> !d.getId().equals(id)).isPresent()) {
            throw new DirectoryAlreadyExistsException("Directory '" + request.getNewName() + "' already exists under parent ID " + parent.getId());
        } else if (parent == null && directoryRepository.findByNameAndParentIsNull(request.getNewName())
                .filter(d -> !d.getId().equals(id)).isPresent()) {
            throw new DirectoryAlreadyExistsException("Directory '" + request.getNewName() + "' already exists at root level");
        }

        directory.setName(request.getNewName());
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

        Directory parent = directory.getParent();
        if (parent != null) {
            parent.removeSubdirectory(directory);
            directoryRepository.save(parent);
        }
        directoryRepository.delete(directory);
    }

    @Override
    @Transactional(readOnly = true) // Transactional to keep session open
    public List<DirectoryResponse> getAllDirectories() {
        List<Directory> directories = directoryRepository.findAll();
        directories.forEach(d -> Hibernate.initialize(d.getSubdirectories())); // Initialize lazy collection
        return directories.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true) // Transactional to keep session open
    public List<DirectoryResponse> getSubdirectories(Long parentId) {
        Directory parent = directoryRepository.findById(parentId)
                .orElseThrow(() -> new DirectoryNotFoundException("Directory not found: " + parentId));
        Hibernate.initialize(parent.getSubdirectories()); // Initialize lazy collection
        return parent.getSubdirectories().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public DirectoryResponse moveDirectory(Long id, Long newParentId) {
        Directory directory = directoryRepository.findById(id)
                .orElseThrow(() -> new DirectoryNotFoundException("Directory not found: " + id));

        checkForCycle(directory, newParentId);

        Directory oldParent = directory.getParent();
        Directory newParent = null;
        if (newParentId != null) {
            newParent = directoryRepository.findById(newParentId)
                    .orElseThrow(() -> new DirectoryNotFoundException("New parent directory not found: " + newParentId));
            if (directoryRepository.findByNameAndParent(directory.getName(), newParent)
                    .filter(d -> !d.getId().equals(id)).isPresent()) {
                throw new DirectoryAlreadyExistsException("Directory '" + directory.getName() + "' already exists under parent ID " + newParentId);
            }
        } else if (directoryRepository.findByNameAndParentIsNull(directory.getName())
                .filter(d -> !d.getId().equals(id)).isPresent()) {
            throw new DirectoryAlreadyExistsException("Directory '" + directory.getName() + "' already exists at root level");
        }

        if (oldParent != null) {
            oldParent.removeSubdirectory(directory);
            directoryRepository.save(oldParent);
        }
        directory.setParent(newParent);
        if (newParent != null) {
            newParent.addSubdirectory(directory);
        }
        directory.updatePath();
        directory.setUpdatedAt(LocalDateTime.now());

        directoryRepository.save(directory);
        if (newParent != null) {
            directoryRepository.save(newParent);
        }
        return mapToResponse(directory);
    }

    @Override
    @Transactional(readOnly = true) // Transactional to keep session open
    public DirectoryResponse getDirectory(Long id) {
        Directory directory = directoryRepository.findById(id)
                .orElseThrow(() -> new DirectoryNotFoundException("Directory not found: " + id));
        Hibernate.initialize(directory.getSubdirectories()); // Initialize lazy collection
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