import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { AuthService } from '../shared/services/auth.service'; // adjust path if needed

@Injectable({
  providedIn: 'root'
})
export class TechnicianService {
  // adjust base url to your backend
  private apiUrl = 'http://localhost:5035/api';

  constructor(private http: HttpClient, private auth: AuthService) {}

  private getAuthHeaders() {
    const token = this.auth?.getToken?.();
    if (token) {
      return { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) };
    }
    return {};
  }

  // technician.service.ts (add/replace methods)
getTechnicianProfile(): Observable<any> {
  // try technicians/me first
  return this.http.get<any>(`${this.apiUrl}/technicians/me`, this.getAuthHeaders());
}

getUserProfile(): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/users/me`, this.getAuthHeaders());
}

/**
 * Helper that returns whichever profile endpoint works.
 * Use this from the component to reliably get profile data.
 */
getAnyProfile(): Observable<any> {
  // try technicians/me, fallback to users/me
  return this.getTechnicianProfile().pipe(
    catchError(err => {
      console.warn('technician profile failed, trying users/me', err);
      return this.getUserProfile();
    })
  );
}

  // dashboard stats
  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/technicians/dashboard/stats`, this.getAuthHeaders());
  }

  // new job requests
  getNewJobRequests(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/technicians/dashboard/new-requests`, this.getAuthHeaders());
  }

  // current assigned job
  getCurrentJob(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/technicians/dashboard/current-job`, this.getAuthHeaders());
  }

  // weekly earnings
  getWeeklyEarnings(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/technicians/dashboard/weekly`, this.getAuthHeaders());
  }

  // accept / decline job (example)
  acceptJob(bookingId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/bookings/${bookingId}/accept`, {}, this.getAuthHeaders());
  }
  declineJob(bookingId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/bookings/${bookingId}/decline`, {}, this.getAuthHeaders());
  }
}
