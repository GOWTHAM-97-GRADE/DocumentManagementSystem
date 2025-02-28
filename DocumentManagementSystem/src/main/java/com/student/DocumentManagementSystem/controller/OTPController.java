package com.student.DocumentManagementSystem.controller;

import com.student.DocumentManagementSystem.payload.request.VerifyOTPRequest;
import com.student.DocumentManagementSystem.payload.response.MessageResponse;
import com.student.DocumentManagementSystem.service.OTPService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

@RestController
@RequestMapping("/api/otp")
public class OTPController {

    @Autowired
    private OTPService otpService;

    @PostMapping("/generate")
    public ResponseEntity<?> generateOTP(@RequestParam String email) {
        otpService.generateAndSendOTP(email);
        return ResponseEntity.ok(new MessageResponse("OTP sent to email for verification."));
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyOTP(@Valid @RequestBody VerifyOTPRequest request) {
        boolean isValid = otpService.validateOTP(request.getEmail(), request.getOtp());

        if (isValid) {
            otpService.deleteOTP(request.getEmail());
            return ResponseEntity.ok(new MessageResponse("OTP verified successfully! You can now complete your registration."));
        }
        return ResponseEntity.badRequest().body(new MessageResponse("Invalid OTP or OTP expired!"));
    }
}
