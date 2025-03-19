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
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

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
    public DirectoryResponse createDirectory(CreateDirectoryRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        Directory parent = null;
        if(request.getParentId() != null) {
            parent = directoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new DirectoryNotFoundException("Parent directory not found"));
            // Check duplicate under the same parent
            if(directoryRepository.findByNameAndParent(request.getName(), parent).isPresent()){
                throw new DirectoryAlreadyExistsException("Directory with this name already exists under the parent directory");
            }
        } else {
            if(directoryRepository.findByNameAndParentIsNull(request.getName()).isPresent()){
                throw new DirectoryAlreadyExistsException("Directory with this name already exists at root level");
            }
        }

        Directory directory = new Directory();
        directory.setName(request.getName());
        // Set path: if a parent exists, build the path using parent's path
        if(parent != null) {
            directory.setPath(parent.getPath() + "/" + request.getName());
        } else {
            directory.setPath(request.getPath() != null ? request.getPath() : request.getName());
        }
        directory.setCreatedBy(user);
        directory.setCreatedAt(LocalDateTime.now());
        directory.setUpdatedAt(LocalDateTime.now());
        directory.setParent(parent);

        directoryRepository.save(directory);
        return new DirectoryResponse(directory.getId(), directory.getName(), directory.getPath(), username);
    }

    @Override
    public DirectoryResponse renameDirectory(Long id, RenameDirectoryRequest request) {
        Directory directory = directoryRepository.findById(id)
                .orElseThrow(() -> new DirectoryNotFoundException("Directory not found"));

        // (Optionally, add duplicate check here if renaming would conflict with an existing folder.)
        directory.setName(request.getNewName());
        directory.setUpdatedAt(LocalDateTime.now());

        directoryRepository.save(directory);
        return new DirectoryResponse(directory.getId(), directory.getName(), directory.getPath(),
                directory.getCreatedBy().getUsername());
    }

    @Override
    public void deleteDirectory(Long id) {
        if (!directoryRepository.existsById(id)) {
            throw new DirectoryNotFoundException("Directory not found");
        }
        directoryRepository.deleteById(id);
    }

    @Override
    public List<DirectoryResponse> getAllDirectories() {
        return directoryRepository.findAll().stream()
                .map(dir -> new DirectoryResponse(dir.getId(), dir.getName(), dir.getPath(),
                        dir.getCreatedBy().getUsername()))
                .collect(Collectors.toList());
    }

    // New: Get subdirectories (folders inside a given directory)
    @Override
    public List<DirectoryResponse> getSubdirectories(Long parentId) {
        Directory parent = directoryRepository.findById(parentId)
                .orElseThrow(() -> new DirectoryNotFoundException("Directory not found"));
        List<Directory> subdirs = parent.getSubdirectories();
        return subdirs.stream()
                .map(dir -> new DirectoryResponse(dir.getId(), dir.getName(), dir.getPath(),
                        dir.getCreatedBy().getUsername()))
                .collect(Collectors.toList());
    }

    // New: Move a directory to a new parent
    @Override
    public DirectoryResponse moveDirectory(Long id, Long newParentId) {
        Directory directory = directoryRepository.findById(id)
                .orElseThrow(() -> new DirectoryNotFoundException("Directory not found"));

        Directory newParent = null;
        if(newParentId != null) {
            newParent = directoryRepository.findById(newParentId)
                    .orElseThrow(() -> new DirectoryNotFoundException("New parent directory not found"));
            // Check for duplicate in the new parent directory
            if(directoryRepository.findByNameAndParent(directory.getName(), newParent).isPresent()){
                throw new DirectoryAlreadyExistsException("A directory with the same name exists under the new parent");
            }
            directory.setParent(newParent);
            directory.setPath(newParent.getPath() + "/" + directory.getName());
        } else {
            // Moving to root level: check for duplicates at root
            if(directoryRepository.findByNameAndParentIsNull(directory.getName()).isPresent()){
                throw new DirectoryAlreadyExistsException("A directory with the same name exists at the root level");
            }
            directory.setParent(null);
            directory.setPath(directory.getName());
        }
        directory.setUpdatedAt(LocalDateTime.now());
        directoryRepository.save(directory);
        return new DirectoryResponse(directory.getId(), directory.getName(), directory.getPath(),
                directory.getCreatedBy().getUsername());
    }

    // New: Get details of a single directory
    @Override
    public DirectoryResponse getDirectory(Long id) {
        Directory directory = directoryRepository.findById(id)
                .orElseThrow(() -> new DirectoryNotFoundException("Directory not found"));
        return new DirectoryResponse(directory.getId(), directory.getName(), directory.getPath(),
                directory.getCreatedBy().getUsername());
    }
}
