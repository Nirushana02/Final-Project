// src/app/app.routes.ts
import { Routes } from '@angular/router';

import { AdminLayoutComponent } from './admin/admin-layout/admin.layout';
import { AdminDashboardComponent } from './admin/dashboard';
import { HomeComponent } from './home/home';
import { ServicesCatalogComponent } from './home/services-catalog.component';
import { LoginComponent } from './auth/login.component';
import { RegisterComponent } from './auth/register.component';
import { VerifyComponent } from './auth/verify.component';
import { ResendVerificationComponent } from './auth/resend-verification.component';
import { ForgotPasswordComponent } from './auth/forgot-password.component';
import { ResetPasswordComponent } from './auth/reset-password.component';

// ADMIN components
import { ServicesManagementComponent } from './admin/service/services-management.component';
import { AdminBookingsComponent } from './admin/booking/admin-bookings.component';
import { AdminLoginComponent } from './auth/admin-login/admin.login';
import { AdminUsersComponent } from './admin/users/admin-users.component';

// Guards
import { AdminGuard } from './shared/guards/admin.guard';
import { AuthGuard } from './shared/guards/auth.guard';

// Customer area
import { ProfileComponent } from './customer/profile/profile.component';
import { BookingComponent } from './customer/booking/booking.component';
import { CustomerDashboardComponent } from './customer/dashboard.component';
import { AdminTechReviewComponent } from './admin/users/admin-tech-review.component';
//import { AboutComponent } from './about/about.component';

export const routes: Routes = [
  // default
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
 // { path: 'about', component: AboutComponent},

  // public services page
  { path: 'services', component: ServicesCatalogComponent },

  // Auth routes
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'technician-register', component: RegisterComponent },
  { path: 'verify/:token', component: VerifyComponent },
  { path: 'resend-verification', component: ResendVerificationComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset/:token', component: ResetPasswordComponent },

  // Admin login (public)
  { path: 'admin-login', component: AdminLoginComponent },

  {
    path: 'admin',
    component: AdminLayoutComponent,
    // Protect the parent route and its children with the AdminGuard
    canActivate: [AdminGuard],
    canActivateChild: [AdminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'service', component: ServicesManagementComponent },
      { path: 'users', component: AdminUsersComponent },
      { path: 'tech-review/:id', component: AdminTechReviewComponent },
      { path: 'booking', component: AdminBookingsComponent },


    ]
  },

  // ---------- Customer area (protected) ----------
  {
    path: 'customer',
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: CustomerDashboardComponent },
      { path: 'booking', component: BookingComponent },
      { path: 'profile', component: ProfileComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

   // Technician Public (Login, Register)
  {
    path: 'technician/login',
    loadComponent: () =>
      import('./auth/technician-login.component').then(m => m.TechnicianLoginComponent)
  },
  {
    path: 'technician/register',
    loadComponent: () =>
      import('./auth/technician-register.component').then(m => m.TechnicianRegisterComponent)
  },

  // Technician Protected Area
  {
    path: 'technician',
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./technician/dashboard.component').then(m => m.TechnicianDashboardComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // fallback
  { path: '**', redirectTo: '/home' }
];
