// src/app/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  try {
    const token =
      localStorage.getItem('adminToken') ||
      localStorage.getItem('authToken') ||
      localStorage.getItem('token') ||
      '';

    if (!token) return next(req);

    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });

    return next(authReq);
  } catch {
    return next(req);
  }
};
