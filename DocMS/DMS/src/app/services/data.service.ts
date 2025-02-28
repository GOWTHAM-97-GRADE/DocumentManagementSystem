import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor() { }

  getDirectoryStructure(): any[] {
    // Return a mock directory structure
    return ['Documents', 'Images', 'Videos', 'Archives'];
  }

  getRecentFiles(): any[] {
    // Return a mock list of recent files
    return ['Report.pdf', 'Presentation.pptx', 'Image.png', 'Notes.docx'];
  }
}
