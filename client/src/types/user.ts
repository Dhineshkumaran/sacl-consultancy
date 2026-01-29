export interface User {
  user_id: number;
  username: string;
  full_name: string;
  email: string;
  department_id?: number;
  department_name?: string;
  role: string;
  is_active?: boolean;
  needsEmailVerification?: boolean;
  needsPasswordChange?: boolean;
  created_at?: string;
  last_login?: string;
}

export interface CreateUserRequest {
  username: string;
  full_name: string;
  email?: string;
  department_name?: string | null;
  department_id?: number | null;
  role?: string;
  password: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  refreshToken?: string;
}