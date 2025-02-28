package com.student.DocumentManagementSystem.controller;

import com.student.DocumentManagementSystem.payload.response.MessageResponse;
import com.student.DocumentManagementSystem.repository.UserRepository;
import com.student.DocumentManagementSystem.models.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

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
}