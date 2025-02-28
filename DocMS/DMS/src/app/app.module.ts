import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router'; // ✅ Import RouterModule and Routes

import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { ForgotpasswordComponent } from './components/forgotpassword/forgotpassword.component';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { DmsapplicationComponent } from './components/dmsapplication/dmsapplication.component';

// Define your app routes
const appRoutes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'forgot-password', component: ForgotpasswordComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'dms', component: DmsapplicationComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ForgotpasswordComponent,
    LoginComponent,
    SignupComponent,
    DmsapplicationComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(appRoutes), // ✅ Use RouterModule.forRoot(appRoutes) for routing
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
