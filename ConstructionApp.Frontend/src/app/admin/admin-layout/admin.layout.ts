// src/app/admin/admin-layout/admin-layout.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
// IMPORTANT: import RouterOutlet so standalone layout can render child routes
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  // RouterOutlet MUST be listed here for <router-outlet> to work inside template
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './admin.layout.html',
  styleUrls: ['./admin.layout.css']
})
export class AdminLayoutComponent {}
