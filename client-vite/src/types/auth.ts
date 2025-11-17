export interface LoginCredentials {
  username: string;
  password: string;
  role?: string;
  department_id?: string;
}

export interface AuthContextType {
  user: any | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}