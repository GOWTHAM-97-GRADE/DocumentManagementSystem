import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuditLogService } from '../../services/audit-log.service';
import { AuditLogResponse } from '../../models/audit-log-response';
import { AuthService } from '../../services/auth.service';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './audit-log.component.html',
  styleUrls: ['./audit-log.component.css'],
})
export class AuditLogComponent implements OnInit, OnDestroy {
  userId: number | null = null;
  operation: string = '';
  entityType: string = '';
  startDate: string = ''; // Format: YYYY-MM-DD
  endDate: string = '';   // Format: YYYY-MM-DD
  logs: AuditLogResponse[] = [];
  isDarkTheme: boolean = false;
  errorMessage: string = '';
  isLoading: boolean = false;
  private pollingSubscription: Subscription | null = null;

  constructor(
    private auditLogService: AuditLogService,
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
    this.fetchLogs();
    this.startPolling();
  }

  ngOnDestroy() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
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

  fetchLogs() {
    if (!this.authService.getToken()) {
      this.router.navigate(['/login']);
      return;
    }
    const params: any = {
      userId: this.userId ? this.userId.toString() : null,
      operation: this.operation || null,
      entityType: this.entityType || null,
    };

    // Ensure full date range is sent correctly
    if (this.startDate) {
      const start = new Date(this.startDate);
      start.setHours(0, 0, 0, 0); // Start of day
      params.startDate = start.toISOString();
    }
    if (this.endDate) {
      const end = new Date(this.endDate);
      end.setHours(23, 59, 59, 999); // End of day
      params.endDate = end.toISOString();
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.auditLogService.getAuditLogs(params).subscribe({
      next: (logs: AuditLogResponse[]) => {
        this.logs = logs;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Fetch logs error:', { status: err.status, message: err.message });
        this.errorMessage = `Failed to fetch logs: ${err.message}`;
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
        this.isLoading = false;
      },
    });
  }

  startPolling() {
    this.pollingSubscription = interval(30000) // Poll every 30 seconds
      .pipe(
        switchMap(() => {
          const params: any = {
            userId: this.userId ? this.userId.toString() : null,
            operation: this.operation || null,
            entityType: this.entityType || null,
          };
          if (this.startDate) {
            const start = new Date(this.startDate);
            start.setHours(0, 0, 0, 0);
            params.startDate = start.toISOString();
          }
          if (this.endDate) {
            const end = new Date(this.endDate);
            end.setHours(23, 59, 59, 999);
            params.endDate = end.toISOString();
          }
          return this.auditLogService.getAuditLogs(params);
        })
      )
      .subscribe({
        next: (logs: AuditLogResponse[]) => {
          this.logs = logs;
        },
        error: (err: any) => {
          console.error('Polling error:', err);
          if (err.status === 401) {
            this.pollingSubscription?.unsubscribe();
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        },
      });
  }

  exportToPdf() {
    if (!this.authService.getToken()) {
      this.router.navigate(['/login']);
      return;
    }
    const params: any = {
      userId: this.userId ? this.userId.toString() : null,
      operation: this.operation || null,
      entityType: this.entityType || null,
    };
    if (this.startDate) {
      const start = new Date(this.startDate);
      start.setHours(0, 0, 0, 0);
      params.startDate = start.toISOString();
    }
    if (this.endDate) {
      const end = new Date(this.endDate);
      end.setHours(23, 59, 59, 999);
      params.endDate = end.toISOString();
    }
    this.isLoading = true;
    this.errorMessage = '';
    this.auditLogService.exportAuditLogsToPdf(params).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'audit_logs.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Export PDF error:', { status: err.status, message: err.message });
        this.errorMessage = `Failed to export logs: ${err.message}`;
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
        this.isLoading = false;
      },
    });
  }
}