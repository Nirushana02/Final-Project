// src/app/home/services-catalog.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Router, ActivatedRoute, Params, RouterModule } from '@angular/router';
import { environment } from '../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

interface ServiceDto {
  serviceID: number;
  serviceName: string;
  description?: string | null;
  fixedRate: number;
  estimatedDuration: number;
  categoryName: string;
  categoryID: number | null;
  imageUrl?: string | null;
  imagePublicId?: string | null;
}

interface CategoryItem {
  categoryID: number | null;
  categoryName: string;
  count: number;
}

@Component({
  selector: 'app-services-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './services-catalog.component.html',
  styleUrls: ['./services-catalog.component.css']
})
export class ServicesCatalogComponent implements OnInit, OnDestroy {
  apiRoot = (environment.apiBaseUrl || '').replace(/\/$/, '');
  services: ServiceDto[] = [];
  filtered: ServiceDto[] = [];
  categories: CategoryItem[] = [];
  activeCategoryId: number | null = null;
  search = '';
  isLoading = false;
  error = '';

  private routeSub: Subscription | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.queryParams.subscribe((params: Params) => {
      const raw = params['categoryId'];
      this.activeCategoryId = raw === undefined || raw === null || raw === '' ? null : Number(raw);

      if (this.services.length) {
        this.applyFilter();
      } else {
        this.loadServices();
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  private getAuthHeaders(): { headers?: HttpHeaders } {
    const token = localStorage.getItem('authToken');
    return token ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) } : {};
  }

  loadServices(): void {
    this.isLoading = true;
    this.error = '';

    const url = `${this.apiRoot}/admin/services`;
    console.log('Loading services from:', url);

    this.http.get<ServiceDto[]>(url, this.getAuthHeaders()).subscribe({
      next: (data) => {
        this.services = (data || []).map(s => ({
          ...s,
          categoryID: s.categoryID != null ? Number(s.categoryID) : null
        }));
        this.buildCategories();
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Load services failed:', err);
        this.error = err.status === 401 || err.status === 403
          ? 'Please login to view services.'
          : 'Unable to load services. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  buildCategories(): void {
    const map = new Map<number | string, CategoryItem>();
    for (const s of this.services) {
      const key = s.categoryID ?? 'uncat';
      const name = s.categoryName || 'Uncategorized';
      if (!map.has(key)) {
        map.set(key, { categoryID: s.categoryID, categoryName: name, count: 0 });
      }
      map.get(key)!.count++;
    }
    const list = Array.from(map.values());
    list.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
    this.categories = [
      { categoryID: null, categoryName: 'All Services', count: this.services.length },
      ...list
    ];
  }

  selectCategory(catId: number | string | null): void {
    this.activeCategoryId = catId == null || catId === '' ? null : Number(catId);
    this.applyFilter();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { categoryId: this.activeCategoryId || null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  applyFilter(): void {
    const term = this.search.trim().toLowerCase();
    const activeNum = this.activeCategoryId;

    this.filtered = this.services.filter(s => {
      const catMatch = activeNum == null || s.categoryID === activeNum;
      const searchMatch = !term ||
        s.serviceName.toLowerCase().includes(term) ||
        (s.description && s.description.toLowerCase().includes(term));
      return catMatch && searchMatch;
    });
  }
bookNow(service: ServiceDto): void {
  const token = localStorage.getItem('authToken');
  const role = localStorage.getItem('userRole');

  if (token && role === 'customer') {
    this.router.navigate(['/customer/booking'], {
      state: { selectedService: service }
    });
  } else {
    this.router.navigate(['/login'], {
      queryParams: {
        returnUrl: '/customer/booking',
        serviceId: service.serviceID
      }
    });
  }
}

  getImageUrl(s: ServiceDto | string | undefined | null): string | null {
    const path = typeof s === 'string' ? s : s?.imageUrl;
    if (!path) return null;
    if (path.startsWith('http')) return path;

    const base = this.apiRoot.replace(/\/api$/, '');
    const cleanPath = path.startsWith('/') ? path : `/uploads/${path}`;
    return `${base}${cleanPath}`;
  }

  formatPrice(n: number | undefined | null): string {
    if (n == null) return 'Rs. 0.00';
    return 'Rs. ' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
