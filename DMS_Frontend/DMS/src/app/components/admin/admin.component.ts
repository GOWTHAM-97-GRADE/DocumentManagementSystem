import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DmsService } from '../../services/dms.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  users: Array<{ id: number; username: string; email: string; enabled: number; roles: string[] }> = [];
  errorMessage: string = '';

  constructor(private dmsService: DmsService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.dmsService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          enabled: user.enabled,
          roles: user.roles // Already an array from backend JSON
        }));
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
    if (confirm('Are you sure you want to delete all users? This action cannot be undone.')) {
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
}