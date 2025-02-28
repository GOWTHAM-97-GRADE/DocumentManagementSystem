import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-forgotpassword',
  templateUrl: './forgotpassword.component.html',
  styleUrls: ['./forgotpassword.component.css']
})
export class ForgotpasswordComponent implements OnInit {

  email: string = '';

  constructor() { }

  ngOnInit(): void {
  }

  onSubmit() {
    // Handle forgot password logic, e.g. send reset link
    console.log('Reset link sent to:', this.email);
  }
}
