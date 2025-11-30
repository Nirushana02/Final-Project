// src/app/customer/booking/booking.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { forkJoin } from 'rxjs';

interface ServiceDto {
  serviceID: number;
  serviceName: string;
  description?: string | null;
  fixedRate: number;
  estimatedDuration: number;
  imageUrl?: string | null;
}

interface CartItem {
  service: ServiceDto;
  quantity: number;
}

interface CalendarDay {
  day: number | string;
  disabled?: boolean;
  selected?: boolean;
}

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css']
})
export class BookingComponent implements OnInit {
  step = 1;
  services: ServiceDto[] = [];
  cart: CartItem[] = [];
  selectedDate = '';
  selectedTime = '';
  isLoading = true;
  error = '';

  currentMonth: string = '';
  currentYear: number = 0;
  currentMonthIndex: number = 0;

  timeSlots: string[] = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
    '05:00 PM', '06:00 PM'
  ];

  calendarDays: CalendarDay[] = [];
  private apiUrl = (environment.apiBaseUrl || '').replace(/\/$/, '');

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.setCurrentMonth();
    this.loadServices();
  }

  // ====================== CALENDAR ======================
  private setCurrentMonth(): void {
    const today = new Date();
    this.currentYear = today.getFullYear();
    this.currentMonthIndex = today.getMonth();
    this.currentMonth = today.toLocaleString('default', { month: 'long' });
    this.generateCalendar();
  }

  generateCalendar(): void {
    const firstDay = new Date(this.currentYear, this.currentMonthIndex, 1).getDay();
    const daysInMonth = new Date(this.currentYear, this.currentMonthIndex + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.calendarDays = [];
    for (let i = 0; i < firstDay; i++) {
      this.calendarDays.push({ day: '', disabled: true });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(this.currentYear, this.currentMonthIndex, day);
      date.setHours(0, 0, 0, 0);
      const isPast = date < today;

      this.calendarDays.push({
        day,
        disabled: isPast,
        selected: this.selectedDate === `${day} ${this.currentMonth} ${this.currentYear}`
      });
    }
  }

  previousMonth(): void {
    if (this.currentMonthIndex === 0) {
      this.currentMonthIndex = 11;
      this.currentYear--;
    } else this.currentMonthIndex--;
    this.currentMonth = new Date(this.currentYear, this.currentMonthIndex).toLocaleString('default', { month: 'long' });
    this.generateCalendar();
  }

  nextMonth(): void {
    if (this.currentMonthIndex === 11) {
      this.currentMonthIndex = 0;
      this.currentYear++;
    } else this.currentMonthIndex++;
    this.currentMonth = new Date(this.currentYear, this.currentMonthIndex).toLocaleString('default', { month: 'long' });
    this.generateCalendar();
  }

  selectDate(day: CalendarDay): void {
    if (day.disabled || typeof day.day !== 'number') return;
    this.calendarDays.forEach(d => d.selected = false);
    day.selected = true;
    this.selectedDate = `${day.day} ${this.currentMonth} ${this.currentYear}`;
  }

  // ====================== AUTH & SERVICES ======================
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    let headers = new HttpHeaders();
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return headers;
  }

  loadServices(): void {
    this.isLoading = true;
    this.http.get<ServiceDto[]>(`${this.apiUrl}/admin/services`, { headers: this.getAuthHeaders() })
      .subscribe({
        next: (data) => {
          this.services = data || [];
          this.isLoading = false;
        },
        error: () => {
          this.error = 'Failed to load services.';
          this.isLoading = false;
        }
      });
  }

  getImageUrl(service: ServiceDto): string {
    if (!service.imageUrl) return '';
    if (service.imageUrl.startsWith('http')) return service.imageUrl;
    const base = this.apiUrl.replace(/\/api$/, '');
    const path = service.imageUrl.startsWith('/') ? service.imageUrl : `/uploads/${service.imageUrl}`;
    return `${base}${path}`;
  }

  formatPrice(price: number): string {
    return 'Rs. ' + price.toLocaleString('en-IN');
  }

  // ====================== CART ======================
  getCartItem(serviceId: number): CartItem | undefined {
    return this.cart.find(i => i.service.serviceID === serviceId);
  }

  addToCart(service: ServiceDto): void {
    const item = this.getCartItem(service.serviceID);
    if (item) item.quantity++;
    else this.cart.push({ service, quantity: 1 });
  }

  increaseQty(serviceId: number): void {
    const item = this.getCartItem(serviceId);
    if (item) item.quantity++;
  }

  decreaseQty(serviceId: number): void {
    const item = this.getCartItem(serviceId);
    if (item && item.quantity > 1) item.quantity--;
    else this.removeFromCart(serviceId);
  }

  removeFromCart(serviceId: number): void {
    this.cart = this.cart.filter(i => i.service.serviceID !== serviceId);
  }

  get totalAmount(): number {
    return this.cart.reduce((sum, item) => sum + (item.service.fixedRate * item.quantity), 0);
  }

  get totalItems(): number {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  goToSchedule(): void {
    if (this.cart.length === 0) {
      alert('Please add at least one service!');
      return;
    }
    this.step = 2;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ====================== BOOKING LOGIC ======================
  initiatePayment(): void {
    if (!this.selectedDate || !this.selectedTime) {
      alert('Please select date and time!');
      return;
    }
    this.saveBookingAndGoToDashboard();
  }

  private saveBookingAndGoToDashboard(): void {
    this.http.get<any>(`${this.apiUrl}/addresses/my`, { headers: this.getAuthHeaders() })
      .subscribe({
        next: (addrRes) => {
          const addresses = Array.isArray(addrRes) ? addrRes : addrRes.data || [];
          const defaultAddr = addresses.find((a: any) => a.isDefault || a.IsDefault);
          const address = defaultAddr || addresses[0];

          if (!address) {
            alert('Please add an address in your profile first!');
            this.router.navigate(['/customer/profile']);
            return;
          }

          const addressId = address.addressID || address.AddressID;
          this.createBookingsWithAddress(addressId);
        },
        error: () => {
          alert('Unable to fetch address. Please try again.');
        }
      });
  }
private createBookingsWithAddress(addressId: number): void {
  const [day, monthName, year] = this.selectedDate.split(' ');
  const monthIndex = new Date(Date.parse(`${monthName} 1, ${year}`)).getMonth();
  const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  let [time, period] = this.selectedTime.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  const preferredStart = `${dateStr}T${timeStr}`;

  const requests = this.cart.map(item => {
    // C# DTO-க்கு EXACT MATCH! (PascalCase + Correct Names)
    const payload = {
      ServiceID: item.service.serviceID,
      Quantity: item.quantity,
      Description: `${item.service.serviceName} × ${item.quantity}`,
      AddressID: addressId,
      PreferredStartDateTime: preferredStart,
      PreferredEndDateTime: new Date(
        new Date(preferredStart).getTime() +
        (item.service.estimatedDuration * 60 * 60 * 1000 * item.quantity)
      ).toISOString()
    };

    console.log('Sending payload:', payload); // Debug பார்க்க

    return this.http.post(`${this.apiUrl}/bookings`, payload, {
      headers: this.getAuthHeaders().set('Content-Type', 'application/json')
    });
  });

  forkJoin(requests).subscribe({
    next: (responses) => {
      console.log('All bookings created:', responses);
      this.step = 3; // SUCCESS SCREEN
    },
    error: (err) => {
      console.error('Booking API Error:', err);
      if (err.status === 400) {
        alert('Invalid data sent. Check console (F12) for details.');
      } else if (err.status === 401) {
        alert('Session expired! Login again.');
        this.router.navigate(['/login']);
      } else {
        alert('Booking failed: ' + (err.error?.message || err.statusText || 'Server error'));
      }
    }
  });
}
  // THIS WAS MISSING! NOW ADDED!
  goToDashboard(): void {
    this.router.navigate(['/customer/dashboard']);
  }
}
