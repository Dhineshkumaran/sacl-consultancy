export interface LoginCredentials {
  username: string;
  password: string;
  role?: string;
  department_id?: string;
}

export interface AuthContextType {
  user: any | null; // eslint-disable-line @typescript-eslint/no-explicit-any
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  logout: () => void;
  updateUser: (user: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  isAuthenticated: boolean;
  loading: boolean;
}