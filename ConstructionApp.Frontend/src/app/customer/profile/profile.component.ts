// src/app/customer/profile/profile.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../shared/services/auth.service';
import { LucideAngularModule } from 'lucide-angular';
import { environment } from '../../../environments/environment';

declare const cloudinary: any;

interface Address {
  addressID: number;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user = {
    name: '',
    email: '',
    phone: '',
    avatar: ''
  };

  addresses: Address[] = [];
  isLoading = true;
  showAddForm = false;
  isEditMode = false;
  currentEditId = 0;

  // NOTIFICATIONS PROPERTY - HTML-ல use ஆகுது
  notifications = {
    bookingConfirmation: true,
    statusUpdates: true,
    offers: false
  };

  newAddress: any = {
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Sri Lanka',
    isDefault: false
  };

  private apiUrl = environment.apiBaseUrl;

  private cloudinaryConfig = {
    cloud_name: 'dxbhnpgd4',
    upload_preset: 'construction_app',
    folder: 'constructpro/profiles',
    cropping: true,
    multiple: false,
    sources: ['local', 'camera']
  };

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
    this.loadAddresses();
  }

  // IMAGE ERROR FALLBACK METHOD - HTML-ல (error) use ஆகுது
  onImgError(event: any) {
    event.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.user.name || 'User')}&background=8b5cf6&color=fff&bold=true&size=256`;
  }

  loadProfile() {
    const token = this.auth.getToken();
    if (!token || !this.auth.isLoggedIn()) {
      alert('Session expired! Redirecting to login...');
      this.auth.logout();
      return;
    }

    this.http.get<any>(`${this.apiUrl}/customer/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.user = {
            name: res.data.fullName || '',
            email: res.data.email || '',
            phone: res.data.phone || '',
            avatar: res.data.profileImage || ''
          };

          if (!this.user.avatar) {
            this.user.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.user.name)}&background=8b5cf6&color=fff&bold=true&size=200`;
          }

          localStorage.setItem('userName', this.user.name);
          localStorage.setItem('userEmail', this.user.email);
        }
      },
      error: () => {
        this.user.name = localStorage.getItem('userName') || '';
        this.user.email = localStorage.getItem('userEmail') || '';
      }
    });
  }
loadAddresses() {
  const token = this.auth.getToken();
  if (!token) return;

  this.isLoading = true;

  this.http.get<any>(`${this.apiUrl}/addresses/my`, {
    headers: { Authorization: `Bearer ${token}` }
  }).subscribe({
    next: (res) => {
      // இதுதான் முக்கியம்! Postman-ல வர response structure பாரு
      let data = [];

      if (Array.isArray(res)) {
        data = res;
      } else if (res.data && Array.isArray(res.data)) {
        data = res.data;
      } else if (res.addresses && Array.isArray(res.addresses)) {
        data = res.addresses;
      } else {
        console.warn('Unexpected response format:', res);
        data = [];
      }

      this.addresses = data.map((a: any) => ({
        addressID: a.addressID ?? a.AddressID ?? a.id ?? 0,
        street: a.street ?? a.Street ?? '',
        city: a.city ?? a.City ?? '',
        state: a.state ?? a.State ?? '',
        postalCode: a.postalCode ?? a.PostalCode ?? '',
        country: a.country ?? a.Country ?? 'Sri Lanka',
        isDefault: a.isDefault ?? a.IsDefault ?? false
      }));

      console.log('Loaded addresses:', this.addresses); // ← Console-ல பாரு!
      this.isLoading = false;
    },
    error: (err) => {
      console.error('Load addresses error:', err);
      this.isLoading = false;
      alert('Failed to load addresses: ' + (err.error?.message || err.message));
    }
  });
}
  openAddForm() {
    this.isEditMode = false;
    this.resetForm();
    this.showAddForm = true;
  }

  openEditModal(addr: Address) {
    this.isEditMode = true;
    this.currentEditId = addr.addressID;
    this.newAddress = { ...addr };
    this.showAddForm = true;
  }

 saveAddress() {
  // Required fields check
  if (!this.newAddress.street?.trim() ||
      !this.newAddress.city?.trim() ||
      !this.newAddress.postalCode?.trim()) {
    alert('Please fill all required fields: Street, City & Postal Code!');
    return;
  }

  const token = this.auth.getToken();
  if (!token) {
    alert('Session expired! Please login again.');
    this.auth.logout();
    return;
  }

  // Clean payload - C# model-க்கு exact match!
  const payload = {
    street: this.newAddress.street.trim(),
    city: this.newAddress.city.trim(),
    state: this.newAddress.state?.trim() || null,
    postalCode: this.newAddress.postalCode.trim(),
    country: this.newAddress.country || 'Sri Lanka',
    isDefault: !!this.newAddress.isDefault
  };

  const url = this.isEditMode
    ? `${this.apiUrl}/addresses/${this.currentEditId}`
    : `${this.apiUrl}/addresses`;

  const request = this.isEditMode
    ? this.http.put<any>(url, payload, { headers: { Authorization: `Bearer ${token}` } })
    : this.http.post<any>(url, payload, { headers: { Authorization: `Bearer ${token}` } });

  request.subscribe({
    next: (response) => {
      console.log('Address saved successfully:', response);
      alert(this.isEditMode ? 'Address updated successfully!' : 'New address added!');
      this.showAddForm = false;
      this.resetForm();
      this.loadAddresses(); // Refresh list
    },
    error: (err) => {
      console.error('Save address failed:', err);
      const msg = err.error?.message || err.error?.title || err.message || 'Unknown error';
      alert('Failed to save address: ' + msg);
    }
  });
}
  setDefaultAddress(id: number) {
    const token = this.auth.getToken();
    this.http.patch(`${this.apiUrl}/addresses/${id}/default`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe(() => this.loadAddresses());
  }

  deleteAddress(id: number) {
    if (!confirm('Delete this address?')) return;
    const token = this.auth.getToken();
    this.http.delete(`${this.apiUrl}/addresses/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe(() => {
      this.addresses = this.addresses.filter(a => a.addressID !== id);
    });
  }

  resetForm() {
    this.newAddress = {
      street: '', city: '', state: '', postalCode: '', country: 'Sri Lanka', isDefault: false
    };
  }

  changeProfileImage() {
    if (typeof cloudinary === 'undefined') {
      alert('Cloudinary not loaded! Check internet connection.');
      return;
    }

    cloudinary.openUploadWidget(this.cloudinaryConfig, (error: any, result: any) => {
      if (error) {
        console.error('Upload error:', error);
        return;
      }
      if (result?.event === 'success') {
        const url = result.info.secure_url;
        this.user.avatar = url;
        this.saveProfileImage(url);
      }
    });
  }

  private saveProfileImage(url: string) {
    const token = this.auth.getToken();
    if (!token) return;

    this.http.patch(
      `${this.apiUrl}/customer/profile/image`,
      { profileImage: url },
      { headers: { Authorization: `Bearer ${token}` } }
    ).subscribe({
      next: () => console.log('Photo saved!'),
      error: () => alert('Photo uploaded but save failed. Click Save All Changes.')
    });
  }

  saveProfile() {
    const token = this.auth.getToken();
    if (!token) return;

    const payload = {
      fullName: this.user.name,
      phone: this.user.phone,
      profileImage: this.user.avatar
    };

    this.http.put(`${this.apiUrl}/customer/profile`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: () => {
        alert('All changes saved successfully!');
        localStorage.setItem('userName', this.user.name);
      },
      error: () => alert('Save failed!')
    });
  }
}
