import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DmsService, UserResponse } from '../../services/dms.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit {
  users: UserResponse[] = [];
  errorMessage: string = '';
  isDarkTheme: boolean = false;

  constructor(
    private dmsService: DmsService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    if (!this.authService.getToken()) {
      this.router.navigate(['/login']);
      return;
    }
    const savedTheme = localStorage.getItem('isDarkTheme');
    this.isDarkTheme = savedTheme === 'true';
    this.loadUsers();
  }

  toggleTheme(newTheme: boolean) {
    this.isDarkTheme = newTheme;
    localStorage.setItem('isDarkTheme', newTheme.toString());
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  loadUsers() {
    this.dmsService.getAllUsers().subscribe({
      next: (users) => {
        // Filter out user with id = 1
        this.users = users.filter(user => user.id !== 1);
        this.errorMessage = '';
      },
      error: (err) => {
        this.errorMessage = err.message || 'Failed to load users';
        console.error('Failed to load users:', err);
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      },
    });
  }

  deleteUser(userId: number) {
    if (userId === 1) {
      this.errorMessage = 'Cannot delete user with ID 1';
      return;
    }
    if (confirm('Are you sure you want to delete this user?')) {
      this.dmsService.deleteUserById(userId).subscribe({
        next: () => {
          this.loadUsers();
          this.errorMessage = '';
        },
        error: (err) => {
          this.errorMessage = err.message || 'Failed to delete user';
          console.error('Failed to delete user:', err);
        },
      });
    }
  }

  deleteAllUsers() {
    if (confirm('Are you sure you want to delete all users except ID 1?')) {
      this.dmsService.deleteAllUsers(true).subscribe({
        next: () => {
          // After deleting all, reload users to reflect the filter (id !== 1)
          this.loadUsers();
          this.errorMessage = '';
        },
        error: (err) => {
          this.errorMessage = err.message || 'Failed to delete all users';
          console.error('Failed to delete all users:', err);
        },
      });
    }
  }

  isUserEnabled(enabled: boolean): string {
    return enabled ? 'Yes' : 'No';
  }
}