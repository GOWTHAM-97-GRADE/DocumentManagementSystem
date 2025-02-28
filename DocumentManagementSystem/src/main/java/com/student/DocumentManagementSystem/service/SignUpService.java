package com.student.DocumentManagementSystem.service;

import com.student.DocumentManagementSystem.models.ERole;
import com.student.DocumentManagementSystem.models.Role;
import com.student.DocumentManagementSystem.models.User;
import com.student.DocumentManagementSystem.payload.request.SignupRequest;
import com.student.DocumentManagementSystem.payload.response.MessageResponse;
import com.student.DocumentManagementSystem.repository.UserRepository;
import com.student.DocumentManagementSystem.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Service
public class SignUpService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private OTPService otpService;

    public ResponseEntity<?> sendOTP(String email) {
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Email is already in use!"));
        }
        otpService.generateAndSendOTP(email);
        return ResponseEntity.ok(new MessageResponse("OTP sent to email for verification."));
    }

    public ResponseEntity<?> verifyEmail(String email, String otp) {
        if (otpService.verifyOTP(email, otp)) {
            return ResponseEntity.ok(new MessageResponse("Email verified successfully! You can now complete signup."));
        }
        return ResponseEntity.badRequest().body(new MessageResponse("Error: Invalid OTP or OTP expired!"));
    }

    public ResponseEntity<?> completeRegistration(SignupRequest signUpRequest) {
        if (!otpService.isEmailVerified(signUpRequest.getEmail())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Email not verified. Please verify your email first."));
        }

        Set<Role> roles = new HashSet<>();
        Set<String> strRoles = signUpRequest.getRole(); // Fetch roles from request

        if (strRoles == null || strRoles.isEmpty()) {
            // If no roles provided, default to USER
            Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                    .orElseThrow(() -> new RuntimeException("Error: Role not found."));
            roles.add(userRole);
        } else {
            for (String roleName : strRoles) {
                ERole eRole;
                switch (roleName.toLowerCase()) {
                    case "admin":
                        eRole = ERole.ROLE_ADMIN;
                        break;
                    case "mod":
                        eRole = ERole.ROLE_MODERATOR;
                        break;
                    default:
                        eRole = ERole.ROLE_USER;
                }

                Role role = roleRepository.findByName(eRole)
                        .orElseThrow(() -> new RuntimeException("Error: Role not found: " + roleName));
                roles.add(role);
            }
        }

        User user = new User(signUpRequest.getUsername(),
                signUpRequest.getEmail(),
                passwordEncoder.encode(signUpRequest.getPassword()));

        user.setRoles(roles);
        userRepository.save(user);
        otpService.clearVerifiedEmail(signUpRequest.getEmail());

        return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
    }




}
