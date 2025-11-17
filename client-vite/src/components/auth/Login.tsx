import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import './Login.css';

interface Department {
  department_id: number;
  department_name: string;
}

const ROLES = ['Admin', 'HOD', 'User', 'Methods'];

const Login: React.FC = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '', role: 'Admin', department_id: '' });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  // Fetch departments when role changes to HOD or User
  useEffect(() => {
    if (credentials.role === 'HOD' || credentials.role === 'User') {
      fetchDepartments();
    }
  }, [credentials.role]);

  const fetchDepartments = async () => {
    try {
      const depts = await apiService.getDepartments();
      setDepartments(depts);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate department selection for HOD and User roles
    if ((credentials.role === 'HOD' || credentials.role === 'User') && !credentials.department_id) {
      setError('Please select a department');
      return;
    }

    setLoading(true);

    try {
      await login(credentials);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value,
      // Reset department when changing roles
      ...(name === 'role' && { department_id: '' })
    }));
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Welcome Back</h2>
          <p>Please sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              value={credentials.role}
              onChange={handleChange}
              disabled={loading}
            >
              {ROLES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {(credentials.role === 'HOD' || credentials.role === 'User') && (
            <div className="form-group">
              <label htmlFor="department_id">Department</label>
              <select
                id="department_id"
                name="department_id"
                value={credentials.department_id}
                onChange={handleChange}
                disabled={loading}
                required
              >
                <option value="">Select your department</option>
                {departments.map((dept) => (
                  <option key={dept.department_id} value={String(dept.department_id)}>
                    {dept.department_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;