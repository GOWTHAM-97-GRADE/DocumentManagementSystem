import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DmsService, UserResponse } from '../../services/dms.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  users: UserResponse[] = [];
  errorMessage: string = '';

  constructor(private dmsService: DmsService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.dmsService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.errorMessage = '';
      },
      error: (err) => {
        this.errorMessage = err.message || 'Failed to load users';
        console.error('Failed to load users:', err);
      }
    });
  }

  deleteUser(userId: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.dmsService.deleteUserById(userId).subscribe({
        next: () => {
          this.loadUsers();
          this.errorMessage = '';
        },
        error: (err) => {
          this.errorMessage = err.message || 'Failed to delete user';
          console.error('Failed to delete user:', err);
        }
      });
    }
  }

  deleteAllUsers() {
    if (confirm('Are you sure you want to delete all users?')) {
      this.dmsService.deleteAllUsers(true).subscribe({
        next: () => {
          this.users = [];
          this.errorMessage = '';
        },
        error: (err) => {
          this.errorMessage = err.message || 'Failed to delete all users';
          console.error('Failed to delete all users:', err);
        }
      });
    }
  }

  isUserEnabled(enabled: boolean): string {
    return enabled ? 'Yes' : 'No';
  }
}