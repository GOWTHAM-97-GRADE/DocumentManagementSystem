import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgotpassword.component.html',
  styleUrls: ['./forgotpassword.component.css']
})
export class ForgotPasswordComponent implements OnInit {
  email: string = '';
  otp: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  otpSent: boolean = false;
  loading: boolean = false;
  message: string = '';
  emailError: string = '';
  passwordError: string = '';
  confirmPasswordError: string = '';
  isDarkTheme: boolean = false; // Theme support

  passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.isDarkTheme = localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  sendOTP(): void {
    if (!this.email.includes('@') || !this.email.includes('.')) {
      this.emailError = 'Please enter a valid email address.';
      return;
    }
    this.emailError = '';
    this.loading = true;

    this.authService.forgotPassword(this.email).subscribe({
      next: (response) => {
        this.otpSent = true;
        this.message = response.message;
        this.loading = false;
      },
      error: (err) => {
        this.emailError = err.error.message || 'Failed to send OTP. Try again.';
        this.loading = false;
      }
    });
  }

  validatePassword(): void {
    if (!this.passwordPattern.test(this.newPassword)) {
      this.passwordError = 'Password must have 6+ chars, 1 uppercase, 1 number, and 1 special char.';
    } else {
      this.passwordError = '';
    }
  }

  validateConfirmPassword(): void {
    if (this.newPassword !== this.confirmPassword) {
      this.confirmPasswordError = 'Passwords do not match.';
    } else {
      this.confirmPasswordError = '';
    }
  }

  changePassword(): void {
    this.validatePassword();
    this.validateConfirmPassword();
    if (this.passwordError || this.confirmPasswordError) {
      return;
    }
    this.loading = true;

    this.authService.resetPassword(this.email, this.otp, this.newPassword).subscribe({
      next: (response) => {
        this.message = response.message;
        this.loading = false;
        alert('Password reset successful! Redirecting to login...');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.message = '';
        this.passwordError = err.error.message || 'Failed to reset password.';
        this.loading = false;
      }
    });
  }

  toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;
    localStorage.setItem('theme', this.isDarkTheme ? 'dark' : 'light');
  }
}