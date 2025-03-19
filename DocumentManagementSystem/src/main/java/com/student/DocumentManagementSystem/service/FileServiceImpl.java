package com.student.DocumentManagementSystem.service;

import com.student.DocumentManagementSystem.exception.DirectoryNotFoundException;
import com.student.DocumentManagementSystem.exception.FileAlreadyExistsException;
import com.student.DocumentManagementSystem.exception.FileNotFoundException;
import com.student.DocumentManagementSystem.models.Directory;
import com.student.DocumentManagementSystem.models.FileEntity;
import com.student.DocumentManagementSystem.models.User;
import com.student.DocumentManagementSystem.payload.response.FileResponse;
import com.student.DocumentManagementSystem.repository.DirectoryRepository;
import com.student.DocumentManagementSystem.repository.FileRepository;
import com.student.DocumentManagementSystem.repository.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class FileServiceImpl implements FileService {

    private final FileRepository fileRepository;
    private final DirectoryRepository directoryRepository;
    private final UserRepository userRepository;

    public FileServiceImpl(FileRepository fileRepository, DirectoryRepository directoryRepository, UserRepository userRepository) {
        this.fileRepository = fileRepository;
        this.directoryRepository = directoryRepository;
        this.userRepository = userRepository;
    }

    @Override
    public FileResponse uploadFile(Long directoryId, MultipartFile file, String username) {
        return uploadFile(directoryId, file, username, null);
    }

    @Override
    public FileResponse uploadFile(Long directoryId, MultipartFile file, String username, String relativePath) {
        Directory targetDirectory = getOrCreateDirectory(directoryId, relativePath);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        fileRepository.findByFileNameAndFileSizeAndDirectory(file.getOriginalFilename(), file.getSize(), targetDirectory)
                .ifPresent(existing -> {
                    throw new FileAlreadyExistsException("A file with the same name and size already exists in this directory");
                });

        FileEntity fileEntity = new FileEntity();
        fileEntity.setFileName(file.getOriginalFilename());
        fileEntity.setFileType(file.getContentType());
        fileEntity.setFileSize(file.getSize());
        fileEntity.setDirectory(targetDirectory);
        fileEntity.setUploadedBy(user);
        fileEntity.setUploadDate(LocalDateTime.now());

        try {
            fileEntity.setFileData(file.getBytes());
        } catch (IOException e) {
            throw new RuntimeException("Error processing file", e);
        }

        fileRepository.save(fileEntity);

        return new FileResponse(
                fileEntity.getFileId(),
                fileEntity.getFileName(),
                fileEntity.getFileType(),
                fileEntity.getFileSize(),
                java.util.Base64.getEncoder().encodeToString(fileEntity.getFileData()),
                fileEntity.getUploadDate(),
                fileEntity.getUploadedBy().getUsername(),
                fileEntity.getComments()
        );
    }

    @Override
    public FileResponse addComment(UUID fileId, String comment, String username) {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new FileNotFoundException("File not found"));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        file.getComments().add(user.getUsername() + ": " + comment + " (" + LocalDateTime.now() + ")");
        fileRepository.save(file);

        return new FileResponse(
                file.getFileId(),
                file.getFileName(),
                file.getFileType(),
                file.getFileSize(),
                java.util.Base64.getEncoder().encodeToString(file.getFileData()),
                file.getUploadDate(),
                file.getUploadedBy().getUsername(),
                file.getComments()
        );
    }

    @Override
    public FileResponse getFile(UUID fileId) {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new FileNotFoundException("File not found"));
        return new FileResponse(
                file.getFileId(),
                file.getFileName(),
                file.getFileType(),
                file.getFileSize(),
                java.util.Base64.getEncoder().encodeToString(file.getFileData()), // Encode to Base64
                file.getUploadDate(),
                file.getUploadedBy().getUsername(),
                file.getComments()
        );
    }

    @Override
    public FileResponse updateFile(UUID fileId, MultipartFile file) {
        FileEntity existingFile = fileRepository.findById(fileId)
                .orElseThrow(() -> new FileNotFoundException("File not found"));

        existingFile.setFileName(file.getOriginalFilename());
        existingFile.setFileType(file.getContentType());
        existingFile.setFileSize(file.getSize());
        existingFile.setUploadDate(LocalDateTime.now());

        try {
            existingFile.setFileData(file.getBytes());
        } catch (IOException e) {
            throw new RuntimeException("Error processing file", e);
        }

        fileRepository.save(existingFile);
        return new FileResponse(
                existingFile.getFileId(),
                existingFile.getFileName(),
                existingFile.getFileType(),
                existingFile.getFileSize()
        );
    }

    @Override
    public void deleteFile(UUID fileId) {
        if (!fileRepository.existsById(fileId)) {
            throw new FileNotFoundException("File not found");
        }
        fileRepository.deleteById(fileId);
    }

    @Override
    public List<FileResponse> listFilesByDirectory(Long directoryId) {
        Directory directory = directoryRepository.findById(directoryId)
                .orElseThrow(() -> new DirectoryNotFoundException("Directory not found"));
        List<FileEntity> files = fileRepository.findAllByDirectory(directory);
        return files.stream()
                .map(file -> new FileResponse(file.getFileId(), file.getFileName(), file.getFileType(), file.getFileSize()))
                .collect(Collectors.toList());
    }

    @Override
    public FileEntity getFileEntity(UUID fileId) {
        return fileRepository.findById(fileId)
                .orElseThrow(() -> new FileNotFoundException("File not found"));
    }

    private Directory getOrCreateDirectory(Long parentId, String relativePath) {
        Directory currentDirectory = directoryRepository.findById(parentId)
                .orElseThrow(() -> new DirectoryNotFoundException("Parent directory not found"));

        if (relativePath == null || relativePath.trim().isEmpty()) {
            return currentDirectory;
        }

        String[] pathParts = relativePath.split("/|\\\\"); // Handle both / and \ separators
        for (int i = 0; i < pathParts.length - 1; i++) { // Skip the last part (file name)
            String dirName = pathParts[i];
            if (dirName.isEmpty()) continue;

            Optional<Directory> subDirOpt = directoryRepository.findByNameAndParent(dirName, currentDirectory);
            if (subDirOpt.isPresent()) {
                currentDirectory = subDirOpt.get();
            } else {
                Directory newDir = new Directory();
                newDir.setName(dirName);
                newDir.setParent(currentDirectory); // Set parent as Directory entity
                newDir.setPath((currentDirectory.getPath() != null ? currentDirectory.getPath() : "") + "/" + dirName);
                newDir.setCreatedBy(currentDirectory.getCreatedBy()); // Inherit creator (adjust as needed)
                newDir.setCreatedAt(LocalDateTime.now());
                newDir.setUpdatedAt(LocalDateTime.now());
                currentDirectory = directoryRepository.save(newDir);
            }
        }

        return currentDirectory;
    }
}