// ...existing code...
import { apiService } from './commonService';

const API_BASE = (import.meta.env.VITE_API_BASE as string) || "http://localhost:3000/api";

export const authService = {
  async login(username: string, password: string, role?: string, department_id?: string) {
    const response = await apiService.login(username, password, role, department_id);
    localStorage.setItem('authToken', response.token);
    if (response.refreshToken) {
      localStorage.setItem('refreshToken', response.refreshToken);
    }
    localStorage.setItem('user', JSON.stringify(response.user));
    return response;
  },

  async refresh() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token available');
    const res = await fetch(API_BASE + '/login/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) throw new Error('Failed to refresh token');
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('authToken', data.token);
      return data.token;
    }
    throw new Error('Invalid refresh response');
  },

  async resetPasswordWithOtp(username: string, otp: string, newPassword: string) {
    const res = await fetch(API_BASE + '/forgot-password/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, otp, newPassword })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Failed to reset password');
    }
    return res.json();
  },

  async forgotPasswordRequest(username: string, email: string) {
    const res = await fetch(API_BASE + '/forgot-password/request-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Failed to send OTP');
    }
    return res.json();
  },

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  getStoredUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getToken() {
    return localStorage.getItem('authToken');
  },

  isAuthenticated() {
    return !!this.getToken();
  }
};