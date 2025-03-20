import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DmsService, CreateDirectoryRequest, DirectoryContentResponse, FileResponse } from '../../services/dms.service';
import { AuthService } from '../../services/auth.service';

interface DmsItem {
  type: 'directory' | 'file';
  id: number | string; // number for directories, string (UUID) for files
  name: string;
  comments?: string[];
}

@Component({
  selector: 'app-dms',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './dms.component.html',
  styleUrls: ['./dms.component.css'],
})
export class DmsComponent implements OnInit {
  isDarkTheme: boolean = false;
  items: DmsItem[] = [];
  filteredItems: DmsItem[] = [];
  currentDirectory: number | null = null; // null for root as per backend
  currentPath: string[] = ['Home'];
  currentPathIds: (number | null)[] = [null];
  errorMessage: string = '';
  selectedFiles: File[] = [];
  isLoading: boolean = false;
  searchQuery: string = '';
  viewMode: 'grid' | 'list' = 'grid';

  constructor(
    private router: Router,
    private dmsService: DmsService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const savedTheme = localStorage.getItem('isDarkTheme');
    this.isDarkTheme = savedTheme === 'true';
    this.loadItems();
  }

  loadItems() {
    this.isLoading = true;
    this.dmsService.getDirectoryContents(this.currentDirectory ?? 0).subscribe({
      next: (response: DirectoryContentResponse) => {
        // Ensure response and its properties are valid before mapping
        if (response && Array.isArray(response.subdirectories) && Array.isArray(response.files)) {
          this.items = [
            ...response.subdirectories.map(dir => ({
              type: 'directory' as const,
              id: dir.id,
              name: dir.name,
            })),
            ...response.files.map(file => ({
              type: 'file' as const,
              id: file.id,
              name: file.name,
              comments: file.comments || [],
            })),
          ];
          this.filteredItems = [...this.items];
          this.errorMessage = '';
        } else {
          this.errorMessage = 'Invalid response from server';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.message || 'Failed to load items';
        this.isLoading = false;
      },
    });
  }

  toggleTheme(newTheme: boolean) {
    this.isDarkTheme = newTheme;
    localStorage.setItem('isDarkTheme', newTheme.toString());
  }

  navigateToDirectory(id: number, name: string) {
    this.currentDirectory = id;
    this.currentPath.push(name);
    this.currentPathIds.push(id);
    this.searchQuery = '';
    this.loadItems();
  }

  navigateBack(index?: number) {
    if (this.currentPath.length > 1) {
      if (index !== undefined) {
        this.currentPath = this.currentPath.slice(0, index + 1);
        this.currentPathIds = this.currentPathIds.slice(0, index + 1);
      } else {
        this.currentPath.pop();
        this.currentPathIds.pop();
      }
      this.currentDirectory = this.currentPathIds[this.currentPathIds.length - 1];
      this.searchQuery = '';
      this.loadItems();
    }
  }

  onItemClick(item: DmsItem) {
    if (item.type === 'directory') {
      this.navigateToDirectory(item.id as number, item.name);
    }
  }

  createDirectory() {
    const name = prompt('Enter directory name:');
    if (name && name.trim()) {
      this.isLoading = true;
      const request: CreateDirectoryRequest = {
        name: name.trim(),
        parentId: this.currentDirectory ?? undefined,
      };
      this.dmsService.createDirectory(request).subscribe({
        next: (response) => {
          this.items.push({ type: 'directory', id: response.id, name: response.name });
          this.filteredItems = [...this.items];
          this.errorMessage = '';
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = err.message || 'Failed to create directory';
          this.isLoading = false;
        },
      });
    }
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles = Array.from(input.files);
      this.uploadFiles();
    }
  }

  uploadFiles() {
    if (this.selectedFiles.length > 0) {
      this.isLoading = true;
      const directoryId = this.currentDirectory ?? 0;
      const username = this.authService.getCurrentUser()?.username || 'anonymous';

      // Capture original file names for reliability
      const originalFileNames = this.selectedFiles.map(file => file.name);

      this.dmsService.uploadFiles(directoryId, this.selectedFiles, username).subscribe({
        next: (responses: FileResponse[]) => {
          responses.forEach((response, index) => {
            const originalName = originalFileNames[index];
            this.items.push({
              type: 'file',
              id: response.id,
              name: response.name || originalName, // Fallback to original name if API doesn't provide it
              comments: response.comments || [],
            });
          });
          this.filteredItems = [...this.items];
          this.selectedFiles = [];
          this.errorMessage = '';
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = err.message || 'Failed to upload files';
          this.isLoading = false;
        },
      });
    }
  }

  renameItem(item: DmsItem) {
    if (item.type !== 'directory' || !this.isAdminUser() || !item.id) {
      this.errorMessage = 'Invalid directory or insufficient permissions';
      return;
    }
    const newName = prompt('Enter new name:', item.name);
    if (newName && newName.trim()) {
      this.isLoading = true;
      this.dmsService.renameDirectory(item.id as number, { name: newName }).subscribe({
        next: (response) => {
          item.name = response.name;
          this.filteredItems = [...this.items];
          this.errorMessage = '';
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = err.message || 'Failed to rename directory';
          this.isLoading = false;
        },
      });
    }
  }

  moveDirectory(item: DmsItem) {
    if (item.type !== 'directory' || !this.isAdminUser() || !item.id) {
      this.errorMessage = 'Invalid directory or insufficient permissions';
      return;
    }
    const newParentIdStr = prompt('Enter new parent directory ID (leave blank for root):');
    const newParentId = newParentIdStr ? parseInt(newParentIdStr, 10) : undefined;
    if (newParentIdStr && isNaN(newParentId!)) {
      this.errorMessage = 'Invalid directory ID';
      return;
    }
    this.isLoading = true;
    this.dmsService.moveDirectory(item.id as number, newParentId).subscribe({
      next: () => {
        this.loadItems();
      },
      error: (err) => {
        this.errorMessage = err.message || 'Failed to move directory';
        this.isLoading = false;
      },
    });
  }

  updateFile(item: DmsItem) {
    if (item.type !== 'file' || !this.isModeratorOrAdmin() || !item.id) {
      this.errorMessage = 'Invalid file or insufficient permissions';
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        this.isLoading = true;
        this.dmsService.updateFile(item.id as string, file).subscribe({
          next: (response) => {
            item.name = response.name;
            this.filteredItems = [...this.items];
            this.errorMessage = '';
            this.isLoading = false;
          },
          error: (err) => {
            this.errorMessage = err.message || 'Failed to update file';
            this.isLoading = false;
          },
        });
      }
    };
    input.click();
  }

  deleteItem(item: DmsItem) {
    if (!this.isAdminUser() || !item.id) {
      this.errorMessage = 'Invalid item or insufficient permissions';
      return;
    }
    if (confirm(`Delete ${item.type} "${item.name}"?`)) {
      this.isLoading = true;
      const serviceCall = item.type === 'directory'
        ? this.dmsService.deleteDirectory(item.id as number)
        : this.dmsService.deleteFile(item.id as string);
      serviceCall.subscribe({
        next: () => {
          this.items = this.items.filter(i => i.id !== item.id);
          this.filteredItems = [...this.items];
          this.errorMessage = '';
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = err.message || `Failed to delete ${item.type}`;
          this.isLoading = false;
        },
      });
    }
  }

  downloadFile(item: DmsItem) {
    if (item.type !== 'file' || !item.id) {
      this.errorMessage = 'Invalid file';
      return;
    }
    this.isLoading = true;
    this.dmsService.downloadFile(item.id as string).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.errorMessage = '';
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.message || 'Failed to download file';
        this.isLoading = false;
      },
    });
  }

  addComment(item: DmsItem) {
    if (item.type !== 'file' || !item.id) {
      this.errorMessage = 'Invalid file';
      return;
    }
    const comment = prompt('Add a comment:');
    if (comment && comment.trim()) {
      this.isLoading = true;
      this.dmsService.addComment(item.id as string, comment).subscribe({
        next: (response) => {
          item.comments = response.comments || [];
          this.filteredItems = [...this.items];
          this.errorMessage = '';
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = err.message || 'Failed to add comment';
          this.isLoading = false;
        },
      });
    }
  }

  searchDocuments() {
    if (this.searchQuery.trim() === '') {
      this.filteredItems = [...this.items];
    } else {
      this.filteredItems = this.items.filter(item =>
        item.name.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }
  }

  setView(mode: 'grid' | 'list') {
    this.viewMode = mode;
  }

  getFileIcon(fileName: string | undefined): string {
    // Handle undefined or null fileName gracefully
    if (!fileName) return '📄'; // Default icon
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return '📕';
      case 'doc': case 'docx': return '📘';
      case 'xls': case 'xlsx': return '📗';
      case 'jpg': case 'jpeg': case 'png': case 'gif': return '🖼️';
      default: return '📄';
    }
  }

  isAdminUser(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.roles?.includes('ROLE_ADMIN') || false;
  }

  isModeratorOrAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.roles?.some(role => ['ROLE_MODERATOR', 'ROLE_ADMIN'].includes(role)) || false;
  }
}