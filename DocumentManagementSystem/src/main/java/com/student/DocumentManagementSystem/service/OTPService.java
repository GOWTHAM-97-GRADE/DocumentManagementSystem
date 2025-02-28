package com.student.DocumentManagementSystem.service;

import com.student.DocumentManagementSystem.models.OTP;
import com.student.DocumentManagementSystem.models.User;
import com.student.DocumentManagementSystem.repository.OTPRepository;
import com.student.DocumentManagementSystem.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;
import org.springframework.transaction.annotation.Transactional;
@Service
public class OTPService {

    @Autowired
    private OTPRepository otpRepository;

    @Autowired
    private UserRepository userRepository;  // Add this line to inject UserRepository

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final int OTP_EXPIRY_MINUTES = 10; // OTP expires in 10 minutes

    @Transactional  // Ensure all operations happen within a single transaction
    public String generateOTP(String email) {
        otpRepository.deleteByEmail(email);  // This requires a transaction

        String otp = String.format("%06d", new Random().nextInt(1000000));
        String hashedOTP = passwordEncoder.encode(otp);

        OTP otpEntity = new OTP(email, hashedOTP, LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
        otpRepository.save(otpEntity);

        return otp; // This should be sent via email
    }


    @Transactional  // Ensures all operations are within a transaction
    public boolean verifyOTP(String email, String otp) {
        Optional<OTP> storedOTP = otpRepository.findByEmail(email);

        if (storedOTP.isPresent() && LocalDateTime.now().isBefore(storedOTP.get().getExpiryDate())) {
            boolean isMatch = passwordEncoder.matches(otp, storedOTP.get().getOtp());
            if (isMatch) {
                Optional<User> userOpt = userRepository.findByEmail(email);
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    user.setEnabled(1);
                    userRepository.save(user);
                }

                //otpRepository.deleteByEmail(email);
                return true;
            }
        }
        return false;
    }

    public void storeVerifiedEmail(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setEnabled(1);
            userRepository.save(user);
        }
        otpRepository.deleteByEmail(email);  // Remove the OTP after verification
    }

    @Transactional
    public void deleteOTP(String email) {
        otpRepository.deleteByEmail(email);
    }

    public boolean isEmailVerified(String email) {
        return otpRepository.findByEmail(email).isEmpty();
    }

    public void clearVerifiedEmail(String email) {
        otpRepository.deleteByEmail(email);
    }

    @Autowired
    private EmailService emailService;

    public void generateAndSendOTP(String email) {
        String otp = generateOTP(email);
        emailService.sendEmail(email, "Your OTP Code", "Your OTP code is: " + otp);
    }


    public boolean validateOTP(String email, String otp) {
        return verifyOTP(email, otp);
    }
}
