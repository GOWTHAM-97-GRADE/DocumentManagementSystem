import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [CommonModule, FormsModule]
})
export class HomeComponent implements OnInit {
  isDarkTheme: boolean = false;
  
  // Footer company information
  companyName: string = 'oneDMS Solutions';
  companyEmail: string = 'support@onedms.com';
  companyPhone: string = '+1 (555) 123-4567';
  companyAddress: string = '123 Document Lane, Tech City, TC 12345';
  currentYear: number = new Date().getFullYear();

  constructor(private router: Router) {}

  ngOnInit() {
    const savedTheme = localStorage.getItem('isDarkTheme');
    this.isDarkTheme = savedTheme === 'true';
  }

  toggleTheme(newTheme: boolean) {
    this.isDarkTheme = newTheme;
    localStorage.setItem('isDarkTheme', newTheme.toString());
  }

  navigateToLogin(event: Event) {
    event.preventDefault();
    this.router.navigate(['/login']);
  }

  navigateToSignup(event: Event) {
    event.preventDefault();
    this.router.navigate(['/signup']);
  }
}