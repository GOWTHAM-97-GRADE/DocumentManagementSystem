import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  user: any;
  isDarkTheme: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.user = this.authService.getCurrentUser();
    const savedTheme = localStorage.getItem('isDarkTheme');
    this.isDarkTheme = savedTheme === 'true';
  }

  toggleTheme(newTheme: boolean) {
    this.isDarkTheme = newTheme;
    localStorage.setItem('isDarkTheme', newTheme.toString());
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  isAdminUser(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.roles?.includes('ROLE_ADMIN') || false;
  }
}