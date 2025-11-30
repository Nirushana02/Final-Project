// src/app/shared/guards/admin.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate, CanActivateChild {
  private jwtHelper = new JwtHelperService();
  private tokenKey = 'adminToken'; // <-- ensure this matches what admin login stores

  constructor(private router: Router) {}

  private checkToken(stateUrl?: string): boolean {
    const token = localStorage.getItem(this.tokenKey) || localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/admin-login'], { queryParams: { returnUrl: stateUrl || '/admin' } });
      return false;
    }
    if (this.jwtHelper.isTokenExpired(token)) {
      localStorage.removeItem(this.tokenKey);
      this.router.navigate(['/admin-login'], { queryParams: { returnUrl: stateUrl || '/admin' } });
      return false;
    }
    try {
      const decoded = this.jwtHelper.decodeToken(token);
      const role = decoded['role'] || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      if (role !== 'Admin' && role !== 'SuperAdmin') {
        this.router.navigate(['/admin-login']);
        return false;
      }
      return true;
    } catch (err) {
      this.router.navigate(['/admin-login']);
      return false;
    }
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.checkToken(state.url);
  }
  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.checkToken(state.url);
  }
}
