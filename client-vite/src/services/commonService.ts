import type { AuthResponse, CreateUserRequest, User } from '../types/user';

const API_BASE = (import.meta.env.VITE_API_BASE as string) || "http://localhost:3000/api";

class ApiService {
  async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('authToken');
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      let response = await fetch(`${API_BASE}${endpoint}`, config);

      if (response.status === 401) {
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
                const retryConfig = {
                  ...config,
                  headers: {
                    ...(config.headers as Record<string, string>),
                    Authorization: `Bearer ${refreshData.token}`
                  }
                };
                response = await fetch(`${API_BASE}${endpoint}`, retryConfig);
              }
            }
          } catch (err) {
          }
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

  async deleteUser(userId: number): Promise<void> {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async deleteUsersBulk(userIds: number[]): Promise<void> {
    return this.request('/users/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ userIds })
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

  async getMasterList(): Promise<any[]> {
    const response = await this.request('/master-list', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('authToken') || '' },
    });
    return response.data || [];
  }

  async getDepartments(): Promise<any[]> {
    const response = await this.request('/departments', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('authToken') || '' },
    });
    return response.data || [];
  }
}

export const apiService = new ApiService();