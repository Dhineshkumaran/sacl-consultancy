import type { AuthResponse, CreateUserRequest, User } from '../types/user';

const API_BASE = (import.meta.env.VITE_API_BASE as string);

class ApiService {
  async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('authToken');

    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    if (options.body instanceof FormData) {
      delete defaultHeaders['Content-Type'];
    }

    const config: RequestInit = {
      headers: {
        ...defaultHeaders,
        ...options.headers as Record<string, string>,
      },
      ...options,
    };

    try {
      let response = await fetch(`${API_BASE}${endpoint}`, config);

      if (response.status === 401) {
        const handleSessionExpiry = () => {
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        };

        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            const refreshRes = await fetch(`${API_BASE}/login/refresh-token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken })
            });

            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              if (refreshData.token) {
                localStorage.setItem('authToken', refreshData.token);

                const newHeaders = {
                  ...(config.headers as Record<string, string>),
                  Authorization: `Bearer ${refreshData.token}`
                };

                const retryConfig = {
                  ...config,
                  headers: newHeaders
                };

                response = await fetch(`${API_BASE}${endpoint}`, retryConfig);
              } else {
                handleSessionExpiry();
                throw new Error('Session expired: Invalid refresh token');
              }
            } else {
              handleSessionExpiry();
              throw new Error('Session expired: Refresh failed');
            }
          } catch (err) {
            handleSessionExpiry();
            throw err;
          }
        } else {
          handleSessionExpiry();
          throw new Error('Session expired: No refresh token');
        }
      }

      if (!response.ok) {
        let errorMessage = 'API request failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error: Could not connect to server');
    }
  }

  async login(username: string, password: string, role?: string, department_id?: string): Promise<AuthResponse> {
    const body = { username, password };
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getUsers(): Promise<User[]> {
    const response = await this.request('/users', {
      method: 'GET',
    });
    return response.users || [];
  }

  async createUser(userData: CreateUserRequest): Promise<{ userId: number }> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUserStatus(userId: number, status: boolean): Promise<void> {
    return this.request('/users/change-status', {
      method: 'POST',
      body: JSON.stringify({ userId, status })
    });
  }

  async adminUpdateUser(userId: number, userData: Partial<User>): Promise<void> {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  async deleteUser(userId: number): Promise<void> {
    return this.request(`/users/${userId}`, {
      method: 'DELETE'
    });
  }

  async sendEmailOtp(email: string) {
    return this.request('/users/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyEmailOtp(email: string, otp: string) {
    return this.request('/users/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  }

  async changePassword(newPassword: string) {
    return this.request('/users/change-password', {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  }

  async updateUsername(username: string) {
    return this.request('/users/update-username', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
  }

  async uploadProfilePhoto(photoBase64: string) {
    return this.request('/users/upload-photo', {
      method: 'POST',
      body: JSON.stringify({ photoBase64 }),
    });
  }

  async getProfilePhoto() {
    return this.request('/users/profile-photo', {
      method: 'GET',
    });
  }

  async getMasterList(): Promise<any[]> { // eslint-disable-line @typescript-eslint/no-explicit-any
    const response = await this.request('/master-list', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('authToken') || '' },
    });
    return response.data || [];
  }

  async getDepartments(): Promise<any[]> { // eslint-disable-line @typescript-eslint/no-explicit-any
    const response = await this.request('/departments', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('authToken') || '' },
    });
    return response.data || [];
  }

  async getIP(): Promise<string> {
    const response = await this.request('/ip', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('authToken') || '' },
    });
    return response.ip || 'Unknown';
  }
}

export const apiService = new ApiService();
