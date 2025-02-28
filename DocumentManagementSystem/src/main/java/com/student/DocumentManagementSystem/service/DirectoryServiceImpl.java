package com.student.DocumentManagementSystem.service;

import com.student.DocumentManagementSystem.payload.request.CreateDirectoryRequest;
import com.student.DocumentManagementSystem.payload.request.RenameDirectoryRequest;
import com.student.DocumentManagementSystem.payload.response.DirectoryResponse;
import com.student.DocumentManagementSystem.exception.DirectoryNotFoundException;
import com.student.DocumentManagementSystem.models.Directory;
import com.student.DocumentManagementSystem.models.User;
import com.student.DocumentManagementSystem.repository.DirectoryRepository;
import com.student.DocumentManagementSystem.service.DirectoryService;
import com.student.DocumentManagementSystem.repository.UserRepository;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DirectoryServiceImpl implements DirectoryService{
    private final DirectoryRepository directoryRepository;
    private final UserRepository userRepository;

    public DirectoryServiceImpl(DirectoryRepository directoryRepository,UserRepository userRepository)
    {
        this.directoryRepository=directoryRepository;
        this.userRepository=userRepository;
    }

    @Override
    public DirectoryResponse createDirectory(CreateDirectoryRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        Directory directory = new Directory();
        directory.setName(request.getName());
        directory.setPath(request.getPath());
        directory.setCreatedBy(user);
        directory.setCreatedAt(LocalDateTime.now());
        directory.setUpdatedAt(LocalDateTime.now());

        directoryRepository.save(directory);
        return new DirectoryResponse(directory.getId(), directory.getName(), directory.getPath(), username);
    }

    @Override
    public DirectoryResponse renameDirectory(Long id, RenameDirectoryRequest request) {
        Directory directory = directoryRepository.findById(id)
                .orElseThrow(() -> new DirectoryNotFoundException("Directory not found"));

        directory.setName(request.getNewName());
        directory.setUpdatedAt(LocalDateTime.now());

        directoryRepository.save(directory);
        return new DirectoryResponse(directory.getId(), directory.getName(), directory.getPath(), directory.getCreatedBy().getUsername());
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
                .map(dir -> new DirectoryResponse(dir.getId(), dir.getName(), dir.getPath(), dir.getCreatedBy().getUsername()))
                .collect(Collectors.toList());
    }


}
