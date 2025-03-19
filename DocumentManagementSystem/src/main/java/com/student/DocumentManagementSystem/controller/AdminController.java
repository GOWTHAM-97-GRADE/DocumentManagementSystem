package com.student.DocumentManagementSystem.controller;

import com.student.DocumentManagementSystem.payload.response.MessageResponse;
import com.student.DocumentManagementSystem.payload.response.UserResponse;
import com.student.DocumentManagementSystem.repository.UserRepository;
import com.student.DocumentManagementSystem.models.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;

    @Autowired
    public AdminController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/delete-all-users")
    public ResponseEntity<?> deleteAllUsers(@RequestParam boolean confirm) {
        if (!confirm) {
            return ResponseEntity.badRequest().body(new MessageResponse("Operation requires confirmation."));
        }
        userRepository.deleteAll();
        return ResponseEntity.ok(new MessageResponse("All users have been deleted successfully."));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/delete-user/{id}")
    public ResponseEntity<?> deleteUserById(@PathVariable Long id) {
        Optional<User> user = userRepository.findById(id);
        if (user.isPresent()) {
            userRepository.deleteById(id);
            return ResponseEntity.ok(new MessageResponse("User with ID " + id + " has been deleted successfully."));
        } else {
            return ResponseEntity.badRequest().body(new MessageResponse("User with ID " + id + " not found."));
        }
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<UserResponse> userResponses = users.stream().map(user -> {
            Set<String> roleNames = user.getRoles().stream()
                    .map(role -> role.getName().name()) // Convert ERole to String (e.g., "ROLE_ADMIN")
                    .collect(Collectors.toSet());
            return new UserResponse(user.getId(), user.getUsername(), user.getEmail(), user.isEnabled(), roleNames);
        }).collect(Collectors.toList());
        return ResponseEntity.ok(userResponses);
    }
}