import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  ThemeProvider,
  InputAdornment,
  IconButton,
  LinearProgress,
} from '@mui/material';
import GearSpinner from '../components/common/GearSpinner';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import EmailIcon from '@mui/icons-material/Email';
import VerifiedIcon from '@mui/icons-material/Verified';
import KeyIcon from '@mui/icons-material/Key';
import LockIcon from '@mui/icons-material/Lock';
import SecurityIcon from '@mui/icons-material/Security';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import ShieldIcon from '@mui/icons-material/Shield';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import { apiService } from '../services/commonService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { appTheme, COLORS } from '../theme/appTheme';
import Header from '../components/dashboard/Header';
import Sidebar from '../components/dashboard/Sidebar';
import ProfileModal from '../components/dashboard/ProfileModal';
import { getDepartmentInfo } from '../utils/dashboardUtils';


const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letters');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain digits');
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return { isValid: errors.length === 0, errors };
};


const calculatePasswordStrength = (password: string): { strength: number; color: string; label: string } => {
  let strength = 0;
  if (password.length >= 6) strength += 16;
  if (password.length >= 8) strength += 17;
  if (/[a-z]/.test(password)) strength += 17;
  if (/[A-Z]/.test(password)) strength += 17;
  if (/[0-9]/.test(password)) strength += 17;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 16;

  let color: string = COLORS.secondary;
  let label = 'Weak';
  if (strength >= 75) {
    color = COLORS.successText;
    label = 'Strong';
  } else if (strength >= 50) {
    color = COLORS.orangeHeaderText;
    label = 'Fair';
  }

  return { strength: Math.min(strength, 100), color, label };
};

// Decorative components removed to match dashboard UI

const ChangePassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();
  const { updateUser, user } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [headerRefreshKey, setHeaderRefreshKey] = useState(0);
  const departmentInfo = getDepartmentInfo(user);
  const [currentView, setCurrentView] = useState('');

  const handleViewChange = (view: string) => {
    navigate('/dashboard', { state: { view } });
  };

  const passwordStrength = calculatePasswordStrength(newPassword);
  const passwordValidation = validatePassword(newPassword);
  const passwordsMatch = newPassword && confirm && newPassword === confirm;
  const isPasswordValid = passwordValidation.isValid && passwordsMatch;

  const handleSubmit = async () => {
    setError('');
    setMessage('');

    if (!newPassword || !confirm) {
      setError('Both password fields are required');
      return;
    }

    if (newPassword !== confirm) {
      setError('Passwords do not match');
      return;
    }


    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors.join('. '));
      return;
    }

    setLoading(true);
    try {
      await apiService.changePassword(newPassword);
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...storedUser, needsPasswordChange: false };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      updateUser(updatedUser);
      setMessage('Password updated successfully. Redirecting...');
      setTimeout(() => {
        navigate('/dashboard');
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError((err as Error).message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newPassword && confirm && !loading) {
      handleSubmit();
    }
  };

  return (
    <ThemeProvider theme={appTheme}>
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: '#f8f9fa' }}>
        <Sidebar currentView={currentView} onViewChange={handleViewChange} />

        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <Header
            setShowProfile={setShowProfile}
            departmentInfo={departmentInfo}
            photoRefreshKey={headerRefreshKey}
            showBackButton={true}
          />

          <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
            {/* Page Title Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#2c3e50', mb: 0.5 }}>
                Change Password
              </Typography>
              <Typography variant="body2" sx={{ color: '#7f8c8d' }}>
                Create a strong password for your account security.
              </Typography>
            </Box>

            <Container maxWidth="sm">
              <Paper
                elevation={0}
                sx={{
                  padding: 4,
                  borderRadius: 2,
                  border: '1px solid #e0e0e0',
                  bgcolor: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
              >
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ mb: 1, fontWeight: 600, color: '#333' }}
                  >
                    New Password
                  </Typography>
                  <TextField
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                    size="small"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />

                  {newPassword && (
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="textSecondary">Strength</Typography>
                        <Typography variant="caption" sx={{ color: passwordStrength.color, fontWeight: 700 }}>{passwordStrength.label}</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={passwordStrength.strength}
                        sx={{
                          height: 4,
                          borderRadius: 2,
                          bgcolor: '#f0f0f0',
                          '& .MuiLinearProgress-bar': { bgcolor: passwordStrength.color }
                        }}
                      />
                    </Box>
                  )}
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ mb: 1, fontWeight: 600, color: '#333' }}
                  >
                    Confirm Password
                  </Typography>
                  <TextField
                    fullWidth
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                    size="small"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end" size="small">
                            {showConfirm ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                  {confirm && (
                    <Typography variant="caption" sx={{ color: passwordsMatch ? 'success.main' : 'error.main', mt: 0.5, display: 'block' }}>
                      {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </Typography>
                  )}
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading || !isPasswordValid}
                  sx={{ py: 1, fontWeight: 600 }}
                >
                  {loading ? <GearSpinner size={20} color="white" /> : 'Update Password'}
                </Button>

                {message && <Alert severity="success" sx={{ mt: 2 }}>{message}</Alert>}
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

                <Box sx={{ mt: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#666' }}>
                    <LightbulbIcon sx={{ fontSize: 16, color: '#f39b03' }} />
                    Use 8+ characters with mixed case, numbers & symbols.
                  </Typography>
                </Box>
              </Paper>
            </Container>
          </Box>
        </Box>
      </Box>
      {showProfile && (
        <ProfileModal
          onClose={() => setShowProfile(false)}
          onPhotoUpdate={() => setHeaderRefreshKey(prev => prev + 1)}
        />
      )}
    </ThemeProvider>
  );
};

export default ChangePassword;
