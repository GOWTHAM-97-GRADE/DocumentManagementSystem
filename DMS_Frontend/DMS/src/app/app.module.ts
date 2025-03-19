import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { routes } from './app.routes'; // Assuming this is the file with your routes

import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { ForgotPasswordComponent } from './components/forgotpassword/forgotpassword.component';
import { AuthGuard } from './guards/auth.guard';
import { AuthService } from './services/auth.service';
import { DmsService } from './services/dms.service';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LoginComponent,
    SignupComponent,
    ForgotPasswordComponent
    // DmsComponent and AdminComponent are standalone, so not declared here
  ],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forRoot(routes) // Routes are already integrated here
  ],
  providers: [AuthGuard, AuthService, DmsService],
  bootstrap: [AppComponent]
})
export class AppModule {}