export interface User {
  user_id: number;
  username: string;
  full_name: string;
  email: string;
  department_id?: number;
  role: string;
  is_active?: boolean;
  created_at?: string;
  last_login?: string;
}

export interface CreateUserRequest {
  username: string;
  full_name: string;
  password: string;
  email: string;
  department_name?: string | null;
  role?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    user_id: number;
    username: string;
    department_id: number;
    role: string;
  };
  refreshToken?: string;
}