import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  username: string = '';
  password: string = '';
  loginError: string = '';
  isLoading: boolean = false;
  isDarkTheme: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.isDarkTheme = localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  onLogin(event: Event) {
    event.preventDefault();
    if (!this.username || !this.password) {
      this.loginError = 'Please enter username and password.';
      return;
    }

    const loginData = { username: this.username, password: this.password };
    this.isLoading = true;

    this.authService.signin(loginData).subscribe({
      next: (response: { accessToken: string }) => {
        localStorage.setItem('jwt', response.accessToken);
        this.isLoading = false;
        alert('Logged in successfully!');
        this.router.navigate(['/dms']).then(success => {
          if (!success) {
            console.error('Navigation to /dms failed');
          }
        });
      },
      error: (err: any) => {
        this.loginError = err.error.message || 'Login failed';
        this.isLoading = false;
      }
    });
  }

  goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }

  goToSignup() {
    this.router.navigate(['/signup']);
  }

  toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;
    localStorage.setItem('theme', this.isDarkTheme ? 'dark' : 'light');
  }
}