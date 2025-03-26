import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DmsService, CreateDirectoryRequest, DirectoryContentResponse, FileResponse } from '../../services/dms.service';
import { AuthService } from '../../services/auth.service';

interface DmsItem {
  type: 'directory' | 'file';
  id: number | string;
  name: string;
  fileType?: string;
  fileSize?: number;
  uploadedBy?: string;
  uploadDate?: string;
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
  currentDirectory: number = 1;
  currentPath: string[] = ['Home'];
  currentPathIds: number[] = [1];
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
    if (!this.authService.getToken()) {
      this.errorMessage = 'Please log in to access the Document Management System';
      this.router.navigate(['/login']);
      return;
    }
    this.loadItems();
  }

  loadItems() {
    this.isLoading = true;
    this.dmsService.getDirectoryContents(this.currentDirectory).subscribe({
      next: (response: DirectoryContentResponse) => {
        if (response && Array.isArray(response.subdirectories) && Array.isArray(response.files)) {
          this.items = [
            ...response.subdirectories.map(dir => ({
              type: 'directory' as const,
              id: dir.id,
              name: dir.name,
            })),
            ...response.files.map(file => ({
              type: 'file' as const,
              id: file.fileId,
              name: file.fileName,
              fileType: file.fileType,
              fileSize: file.fileSize,
              uploadedBy: file.uploadedBy,
              uploadDate: file.uploadDate,
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
        console.error('Load items error:', { status: err.status, message: err.message, error: err.error });
        this.errorMessage = `Failed to load items: ${err.status === 500 ? 'Server error' : err.message}`;
        if (err.status === 401) {
          this.router.navigate(['/login']);
        }
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
        parentId: this.currentDirectory,
      };
      this.dmsService.createDirectory(request).subscribe({
        next: () => {
          this.loadItems();
        },
        error: (err) => {
          console.error('Create directory error:', { status: err.status, message: err.message, error: err.error });
          this.errorMessage = `Failed to create directory: ${err.status === 500 ? 'Server error' : err.message}`;
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
      const directoryId = this.currentDirectory;
      console.log('Uploading to directory:', directoryId);
      this.dmsService.uploadFiles(directoryId, this.selectedFiles).subscribe({
        next: () => {
          this.loadItems();
          this.selectedFiles = [];
          this.errorMessage = '';
        },
        error: (err) => {
          console.error('Upload files error:', { status: err.status, message: err.message, error: err.error });
          this.errorMessage = `Failed to upload files: ${err.status === 500 ? 'Server error' : err.message}`;
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
      this.dmsService.renameDirectory(item.id as number, { newName: newName.trim() }).subscribe({
        next: () => {
          this.loadItems();
          this.errorMessage = '';
        },
        error: (err) => {
          console.error('Rename directory error:', { status: err.status, message: err.message, error: err.error });
          this.errorMessage = `Failed to rename directory: ${err.status === 500 ? 'Server error' : err.message}`;
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
    const newParentId = newParentIdStr ? parseInt(newParentIdStr, 10) : 1;
    if (newParentIdStr && isNaN(newParentId)) {
      this.errorMessage = 'Invalid directory ID';
      return;
    }
    this.isLoading = true;
    this.dmsService.moveDirectory(item.id as number, newParentId).subscribe({
      next: () => {
        this.loadItems();
      },
      error: (err) => {
        console.error('Move directory error:', { status: err.status, message: err.message, error: err.error });
        this.errorMessage = `Failed to move directory: ${err.status === 500 ? 'Server error' : err.message}`;
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
          next: (response: FileResponse) => {
            // Update the local item immediately
            const index = this.items.findIndex(i => i.id === item.id);
            if (index !== -1) {
              this.items[index] = {
                type: 'file',
                id: response.fileId,
                name: response.fileName,
                fileType: response.fileType,
                fileSize: response.fileSize,
                uploadedBy: response.uploadedBy,
                uploadDate: response.uploadDate,
                comments: response.comments || [],
              };
              this.filteredItems = [...this.items];
            }
            this.loadItems(); // Still refresh from server to ensure consistency
            this.errorMessage = '';
          },
          error: (err) => {
            console.error('Update file error:', { status: err.status, message: err.message, error: err.error });
            this.errorMessage = `Failed to update file: ${err.status === 500 ? 'Server error' : err.message}`;
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
          this.loadItems();
        },
        error: (err) => {
          console.error('Delete item error:', { status: err.status, message: err.message, error: err.error });
          this.errorMessage = `Failed to delete ${item.type}: ${err.status === 500 ? 'Server error' : err.message}`;
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
        console.error('Download file error:', { status: err.status, message: err.message, error: err.error });
        this.errorMessage = `Failed to download file: ${err.status === 500 ? 'Server error' : err.message}`;
        this.isLoading = false;
      },
    });
  }

  addComment(item: DmsItem) {
    if (item.type !== 'file' || !item.id) {
      this.errorMessage = 'Invalid file';
      return;
    }
    const comment = prompt('Add a comment (max 500 chars):');
    if (comment && comment.trim()) {
      if (comment.length > 500) {
        this.errorMessage = 'Comment exceeds 500 characters';
        return;
      }
      this.isLoading = true;
      this.dmsService.addComment(item.id as string, comment).subscribe({
        next: (response) => {
          item.comments = response.comments || [];
          this.filteredItems = [...this.items];
          this.errorMessage = '';
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Add comment error:', err.message);
          this.errorMessage = `Failed to add comment: ${err.message}`;
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
    if (!fileName) return '📄';
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return '📕';
      case 'doc': 
      case 'docx': return '📘';
      case 'xls': 
      case 'xlsx': return '📗';
      case 'jpg': 
      case 'jpeg': 
      case 'png': 
      case 'gif': return '🖼️';
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