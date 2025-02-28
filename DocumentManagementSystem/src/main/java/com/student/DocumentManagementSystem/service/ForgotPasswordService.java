package com.student.DocumentManagementSystem.service;

import com.student.DocumentManagementSystem.models.User;
import com.student.DocumentManagementSystem.payload.request.ForgotPasswordRequest;
import com.student.DocumentManagementSystem.payload.request.ResetPasswordRequest;
import com.student.DocumentManagementSystem.payload.response.MessageResponse;
import com.student.DocumentManagementSystem.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class ForgotPasswordService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OTPService otpService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public ResponseEntity<?> handleForgotPassword(ForgotPasswordRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());

        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("User not found!"));
        }

        otpService.generateAndSendOTP(request.getEmail());
        return ResponseEntity.ok(new MessageResponse("OTP sent successfully! Please check your email."));
    }

    public ResponseEntity<?> handleResetPassword(ResetPasswordRequest request) {
        if (!otpService.verifyOTP(request.getEmail(), request.getOtp())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid or expired OTP!"));
        }

        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("User not found!"));
        }

        User user = userOpt.get();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        otpService.deleteOTP(request.getEmail());

        return ResponseEntity.ok(new MessageResponse("Password reset successful!"));
    }
}
