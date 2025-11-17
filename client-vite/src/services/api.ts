import type { AuthResponse, CreateUserRequest, User } from '../types/user';

const API_BASE_URL = 'http://localhost:3000/api';

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
      let response = await fetch(`${API_BASE_URL}${endpoint}`, config);

      // If unauthorized, attempt to refresh token once
      if (response.status === 401) {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            const refreshRes = await fetch(`${API_BASE_URL.replace(/\/api$/, '')}/api/login/refresh-token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken })
            });
            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              if (refreshData.token) {
                localStorage.setItem('authToken', refreshData.token);
                // retry original request with new token
                const retryConfig = {
                  ...config,
                  headers: {
                    ...(config.headers as Record<string,string>),
                    Authorization: `Bearer ${refreshData.token}`
                  }
                };
                response = await fetch(`${API_BASE_URL}${endpoint}`, retryConfig);
              }
            }
          } catch (err) {
            // ignore and fall through to error handling
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
    const body: any = { username, password, role: role || 'User' };
    if (department_id) {
      body.department_id = parseInt(department_id);
    }
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getUsers(): Promise<User[]> {
    const response = await this.request('/users');
    return response.users || [];
  }

  async createUser(userData: CreateUserRequest): Promise<{ userId: number }> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getMasterList(): Promise<any[]> {
    const response = await this.request('/master-list');
    return response.data || [];
  }

  async getDepartments(): Promise<any[]> {
    const response = await this.request('/departments');
    return response.data || [];
  }
}

export const apiService = new ApiService();