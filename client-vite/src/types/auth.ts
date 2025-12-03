export interface LoginCredentials {
  username: string;
  password: string;
  role?: string;
  department_id?: string;
}

export interface AuthContextType {
  user: any | null;
  token: string | null;
  // login returns the server response (user/token/etc). Keep as any for flexibility.
  login: (credentials: LoginCredentials) => Promise<any>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}