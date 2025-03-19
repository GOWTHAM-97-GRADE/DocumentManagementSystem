import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DmsService } from '../../services/dms.service';
import { AuthService } from '../../services/auth.service';

interface DmsItem {
  type: 'directory' | 'file';
  id: string | number;
  name: string;
  comments?: string[];
}

@Component({
  selector: 'app-dms',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './dms.component.html',
  styleUrls: ['./dms.component.css']
})
export class DmsComponent implements OnInit {
  isDarkTheme: boolean = false;
  items: DmsItem[] = [];
  currentDirectory: number | null = null;
  currentPath: string[] = ['Home'];
  currentPathIds: (number | null)[] = [null];
  errorMessage: string = '';
  selectedFileForUpdate: DmsItem | null = null;

  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('updateFileInput') updateFileInput!: ElementRef;

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
    const directoryId = this.currentDirectory !== null ? this.currentDirectory : 0; // Root is 0
    this.dmsService.getDirectoryContents(directoryId).subscribe({
      next: (response) => {
        this.items = [
          ...response.subdirectories.map(dir => ({ type: 'directory' as const, id: dir.id, name: dir.name })),
          ...response.files.map(file => ({ type: 'file' as const, id: file.id, name: file.name, comments: file.comments || [] }))
        ];
        this.errorMessage = '';
      },
      error: (err) => {
        this.errorMessage = err.message || 'Failed to load items';
        console.error('Failed to load items:', err);
      }
    });
  }

  toggleTheme(newTheme: boolean) {
    this.isDarkTheme = newTheme;
    localStorage.setItem('isDarkTheme', newTheme.toString());
  }

  navigateToDirectory(id: number, name: string) {
    this.currentPathIds.push(id);
    this.currentPath.push(name);
    this.currentDirectory = id;
    this.loadItems();
  }

  navigateBack() {
    if (this.currentPath.length > 1) {
      this.currentPath.pop();
      this.currentPathIds.pop();
      this.currentDirectory = this.currentPathIds[this.currentPathIds.length - 1];
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
      const request: CreateDirectoryRequest = {
        name: name.trim(),
        parentId: this.currentDirectory !== null ? this.currentDirectory : undefined
      };
      this.dmsService.createDirectory(request).subscribe({
        next: (response) => {
          this.items.push({ type: 'directory', id: response.id, name: response.name });
          this.errorMessage = '';
        },
        error: (err) => {
          this.errorMessage = err.message || 'Failed to create directory';
          console.error('Failed to create directory:', err);
        }
      });
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);
      const username = this.dmsService.getCurrentUsername();
      if (!username) {
        this.errorMessage = 'Username not found';
        return;
      }
      this.dmsService.uploadFiles(this.currentDirectory || 0, files, username).subscribe({
        next: (responses) => {
          responses.forEach(response => {
            this.items.push({ type: 'file', id: response.id, name: response.name, comments: response.comments || [] });
          });
          this.errorMessage = '';
          input.value = ''; // Reset file input
        },
        error: (err) => {
          this.errorMessage = err.message || 'Failed to upload files';
          console.error('Failed to upload files:', err);
        }
      });
    }
  }

  updateFile(item: DmsItem) {
    if (item.type === 'file') {
      this.selectedFileForUpdate = item;
      this.updateFileInput.nativeElement.click();
    }
  }

  onUpdateFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0 && this.selectedFileForUpdate) {
      const file = input.files[0];
      this.dmsService.updateFile(this.selectedFileForUpdate.id as string, file).subscribe({
        next: (response) => {
          this.selectedFileForUpdate.name = response.name;
          this.errorMessage = '';
          input.value = ''; // Reset file input
        },
        error: (err) => {
          this.errorMessage = err.message || 'Failed to update file';
          console.error('Failed to update file:', err);
        }
      });
      this.selectedFileForUpdate = null;
    }
  }

  moveDirectory(item: DmsItem) {
    if (item.type === 'directory') {
      const newParentId = prompt('Enter new parent directory ID (leave blank for root):');
      const parsedId = newParentId ? parseInt(newParentId, 10) : undefined;
      if (newParentId && isNaN(parsedId)) {
        this.errorMessage = 'Invalid directory ID';
        return;
      }
      this.dmsService.moveDirectory(item.id as number, parsedId).subscribe({
        next: (response) => {
          this.loadItems(); // Refresh to reflect new position
          this.errorMessage = '';
        },
        error: (err) => {
          this.errorMessage = err.message || 'Failed to move directory';
          console.error('Failed to move directory:', err);
        }
      });
    }
  }

  renameItem(item: DmsItem) {
    const newName = prompt('Enter new name:', item.name);
    if (newName && newName.trim()) {
      if (item.type === 'directory') {
        this.dmsService.renameDirectory(item.id as number, { name: newName }).subscribe({
          next: (response) => {
            item.name = response.name;
            this.errorMessage = '';
          },
          error: (err) => {
            this.errorMessage = err.message || 'Failed to rename directory';
            console.error('Failed to rename directory:', err);
          }
        });
      }
    }
  }

  addComment(item: DmsItem) {
    const comment = prompt('Add a comment:');
    if (comment && comment.trim()) {
      if (item.type === 'file') {
        this.dmsService.addComment(item.id as string, comment).subscribe({
          next: (response) => {
            item.comments = response.comments || [];
            this.errorMessage = '';
          },
          error: (err) => {
            this.errorMessage = err.message || 'Failed to add comment';
            console.error('Failed to add comment:', err);
          }
        });
      }
    }
  }

  deleteItem(item: DmsItem) {
    if (confirm(`Delete ${item.type} "${item.name}"?`)) {
      if (item.type === 'directory') {
        this.dmsService.deleteDirectory(item.id as number).subscribe({
          next: () => {
            this.items = this.items.filter(i => i.id !== item.id);
            this.errorMessage = '';
          },
          error: (err) => {
            this.errorMessage = err.message || 'Failed to delete directory';
            console.error('Failed to delete directory:', err);
          }
        });
      } else {
        this.dmsService.deleteFile(item.id as string).subscribe({
          next: () => {
            this.items = this.items.filter(i => i.id !== item.id);
            this.errorMessage = '';
          },
          error: (err) => {
            this.errorMessage = err.message || 'Failed to delete file';
            console.error('Failed to delete file:', err);
          }
        });
      }
    }
  }

  downloadFile(item: DmsItem) {
    if (item.type === 'file') {
      this.dmsService.downloadFile(item.id as string).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = item.name;
          a.click();
          window.URL.revokeObjectURL(url);
          this.errorMessage = '';
        },
        error: (err) => {
          this.errorMessage = err.message || 'Failed to download file';
          console.error('Failed to download file:', err);
        }
      });
    }
  }

  viewComments(item: DmsItem) {
    const comments = item.comments && item.comments.length > 0
      ? item.comments.join('\n- ')
      : 'No comments yet';
    alert(`Comments for ${item.name}:\n- ${comments}`);
  }

  isAdminUser(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.roles?.includes('ROLE_ADMIN') || false;
  }

  isModeratorOrAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.roles?.includes('ROLE_MODERATOR') || user?.roles?.includes('ROLE_ADMIN') || false;
  }
}