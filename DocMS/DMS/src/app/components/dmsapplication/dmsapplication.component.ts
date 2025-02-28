import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dmsapplication',
  templateUrl: './dmsapplication.component.html',
  styleUrls: ['./dmsapplication.component.css']
})
export class DmsapplicationComponent implements OnInit {

  directoryStructure: any[] = [];
  recentFiles: any[] = [];

  constructor(private authService: AuthService,
              private dataService: DataService,
              private router: Router) { }

  ngOnInit(): void {
    this.directoryStructure = this.dataService.getDirectoryStructure();
    this.recentFiles = this.dataService.getRecentFiles();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  onFileUpload() {
    // Placeholder for file upload logic
    console.log('File upload triggered');
  }
}
