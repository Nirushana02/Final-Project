import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TechnicianService } from './technician.service';
import { DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-technician-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule],
  providers: [DecimalPipe]
})
export class TechnicianDashboardComponent implements OnInit {
  profileName: string | null = null;
  profileAvatarUrl: string | null = null;
  experienceYears: number | null = null;

  // stats
  stats = {
    totalRevenue: 0,
    revenueChangePercent: 0,
    jobsCompleted: 0,
    jobsChangePercent: 0,
    currentRating: 0,
    wallet: 0
  };

  newJobs: Array<any> = [];
  currentJob: any = null;
  weekly = { total: 0, changePercent: 0, bars: [] };

  loading = {
    profile: true,
    stats: true,
    jobs: true,
    current: true,
    weekly: true
  };

  constructor(private techService: TechnicianService) {}

  ngOnInit(): void {
    this.loadProfile();
    this.loadDashboardData();
  }

  // dashboard.component.ts (replace loadProfile)
loadProfile() {
  this.loading.profile = true;
  this.techService.getAnyProfile()
    .pipe(catchError(err => { console.error('both profile endpoints failed', err); return of(null); }))
    .subscribe(res => {
      this.loading.profile = false;
      console.log('profile response', res);
      if (!res) {
        this.profileName = 'Technician';
        this.experienceYears = null;
        return;
      }

      const userObj = res.user ?? res;
      this.profileName =
        userObj?.fullName ||
        userObj?.name ||
        (userObj?.firstName ? `${userObj.firstName} ${userObj.lastName ?? ''}`.trim() : null) ||
        userObj?.username ||
        userObj?.email ||
        'Technician';

      this.profileAvatarUrl = userObj?.avatarUrl || userObj?.profileImage || userObj?.photo || res?.profileImage || null;

      // technician-specific fields
      this.stats.currentRating = res?.rating ?? res?.currentRating ?? 0;
      this.stats.wallet = res?.walletBalance ?? res?.wallet ?? res?.balance ?? 0;
      this.experienceYears = res?.experienceYears ?? res?.experience ?? null;
    });
}


  loadDashboardData() {
    // STATS
    this.loading.stats = true;
    this.techService.getDashboardStats()
      .pipe(catchError(err => { console.warn('stats error', err); return of(null); }))
      .subscribe(s => {
        this.loading.stats = false;
        if (!s) return;
        console.log('stats response', s);
        this.stats.totalRevenue = s.totalRevenue ?? s.revenue ?? s.earnings ?? 0;
        this.stats.revenueChangePercent = s.revenueChangePercent ?? s.revenueChange ?? s.earningsChange ?? 0;
        this.stats.jobsCompleted = s.jobsCompleted ?? s.completedJobs ?? 0;
        this.stats.jobsChangePercent = s.jobsChange ?? s.jobsChangePercent ?? 0;
        this.stats.currentRating = s.currentRating ?? s.rating ?? 0;
        this.stats.wallet = s.wallet ?? s.walletBalance ?? s.balance ?? 0;
      });

    // NEW JOB REQUESTS
    this.loading.jobs = true;
    this.techService.getNewJobRequests()
      .pipe(catchError(err => { console.warn('new jobs error', err); return of([]); }))
      .subscribe(list => {
        this.loading.jobs = false;
        this.newJobs = (list || []).map(j => ({
          bookingId: j.bookingId ?? j.id ?? j._id,
          title: j.title ?? j.serviceName ?? j.jobTitle ?? j.service?.name,
          rateText: j.rateText ?? (j.rate ? `Fixed Rate: $${j.rate}` : (j.price ? `$${j.price}` : '')),
          address: j.address ?? (j.location ? `${j.location.street ?? ''} ${j.location.city ?? ''}` : j.addressText ?? ''),
          raw: j
        }));
        console.log('new jobs mapped', this.newJobs);
      });

    // CURRENT JOB
    this.loading.current = true;
    this.techService.getCurrentJob()
      .pipe(catchError(err => { console.warn('current job error', err); return of(null); }))
      .subscribe(cj => {
        this.loading.current = false;
        if (!cj) { this.currentJob = null; return; }
        console.log('current job response', cj);
        this.currentJob = {
          title: cj.title ?? cj.serviceName ?? cj.jobTitle,
          address: cj.address ?? cj.location ?? null,
          progress: Math.floor((cj.progress ?? cj.percent ?? cj.completion ?? 0)),
          raw: cj
        };
      });

    // WEEKLY
    this.loading.weekly = true;
    this.techService.getWeeklyEarnings()
      .pipe(catchError(err => { console.warn('weekly error', err); return of(null); }))
      .subscribe(w => {
        this.loading.weekly = false;
        if (!w) { this.weekly = { total: 0, changePercent: 0, bars: [] }; return; }
        console.log('weekly response', w);
        this.weekly.total = w.total ?? w.sum ?? 0;
        this.weekly.changePercent = w.changePercent ?? w.change ?? 0;
        this.weekly.bars = w.bars ?? w.series ?? [];
      });
  }

  onAccept(bookingId: string) {
    this.techService.acceptJob(bookingId).subscribe({
      next: res => {
        console.log('accepted', res);
        // remove from the list
        this.newJobs = this.newJobs.filter(j => j.bookingId !== bookingId);
        // optionally reload current job
        this.loadDashboardData();
      },
      error: err => console.error('accept failed', err)
    });
  }

  onDecline(bookingId: string) {
    this.techService.declineJob(bookingId).subscribe({
      next: res => {
        console.log('declined', res);
        this.newJobs = this.newJobs.filter(j => j.bookingId !== bookingId);
      },
      error: err => console.error('decline failed', err)
    });
  }
}
