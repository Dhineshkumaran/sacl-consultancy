import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  ThemeProvider,
  createTheme,
  InputAdornment,
  IconButton,
  LinearProgress,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { apiService } from '../services/api';
import { useNavigate } from 'react-router-dom';

const SAKTHI_COLORS = {
  primary: '#2950bbff',
  secondary: '#DC2626',
  accent: '#F59E0B',
  background: '#F8FAFC',
  lightBlue: '#3B82F6',
  darkGray: '#374151',
  lightGray: '#E5E7EB',
  white: '#FFFFFF',
  success: '#10B981',
};

const theme = createTheme({
  palette: {
    primary: { main: SAKTHI_COLORS.primary },
    secondary: { main: SAKTHI_COLORS.secondary },
    success: { main: SAKTHI_COLORS.success },
    background: { default: SAKTHI_COLORS.background },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    body1: { fontWeight: 500 },
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '1rem',
        },
        contained: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }
        }
      }
    }
  }
});

// Password strength calculator
const calculatePasswordStrength = (password: string): { strength: number; color: string; label: string } => {
  let strength = 0;
  if (password.length >= 6) strength += 25;
  if (password.length >= 8) strength += 25;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
  if (/[0-9]/.test(password)) strength += 12.5;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5;

  let color = SAKTHI_COLORS.secondary;
  let label = 'Weak';
  if (strength >= 75) {
    color = SAKTHI_COLORS.success;
    label = 'Strong';
  } else if (strength >= 50) {
    color = SAKTHI_COLORS.accent;
    label = 'Fair';
  }

  return { strength: Math.min(strength, 100), color, label };
};

const ChangePasswordPage: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const passwordStrength = calculatePasswordStrength(newPassword);
  const passwordsMatch = newPassword && confirm && newPassword === confirm;

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
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await apiService.changePassword(newPassword);
      setMessage('✅ Password updated successfully. Redirecting...');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
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
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: `linear-gradient(135deg, ${SAKTHI_COLORS.background} 0%, ${SAKTHI_COLORS.white} 100%)`,
          padding: 2,
        }}
      >
        <Container maxWidth="xs">
          <Paper
            elevation={3}
            sx={{
              padding: 4,
              borderRadius: 3,
              border: `2px solid ${SAKTHI_COLORS.lightBlue}`,
              boxShadow: '0 8px 24px rgba(41, 80, 187, 0.15)',
            }}
          >
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography
                variant="h4"
                sx={{
                  color: SAKTHI_COLORS.primary,
                  mb: 1,
                  fontWeight: 700,
                }}
              >
                🔑 Set New Password
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: SAKTHI_COLORS.darkGray,
                  fontSize: '0.95rem',
                }}
              >
                Create a strong password for your account security
              </Typography>
            </Box>

            {/* New Password Input */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  mb: 1.5,
                  fontWeight: 600,
                  color: SAKTHI_COLORS.darkGray,
                }}
              >
                New Password
              </Typography>
              <TextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                variant="outlined"
                size="medium"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        disabled={loading}
                        size="small"
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: {
                    backgroundColor: SAKTHI_COLORS.white,
                    borderRadius: 2,
                  }
                }}
              />

              {/* Password Strength Indicator */}
              {newPassword && (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" sx={{ color: SAKTHI_COLORS.darkGray, fontSize: '0.8rem' }}>
                      Password Strength
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: passwordStrength.color,
                        fontWeight: 600,
                        fontSize: '0.8rem',
                      }}
                    >
                      {passwordStrength.label}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={passwordStrength.strength}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: SAKTHI_COLORS.lightGray,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: passwordStrength.color,
                        borderRadius: 3,
                      }
                    }}
                  />
                  <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ color: SAKTHI_COLORS.darkGray, fontSize: '0.75rem' }}>
                      Requirements:
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: newPassword.length >= 6 ? SAKTHI_COLORS.success : SAKTHI_COLORS.secondary,
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      {newPassword.length >= 6 ? '✓' : '○'} At least 6 characters
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword) ? SAKTHI_COLORS.success : SAKTHI_COLORS.secondary,
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      {/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword) ? '✓' : '○'} Mix of uppercase & lowercase
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: /[0-9]/.test(newPassword) ? SAKTHI_COLORS.success : SAKTHI_COLORS.secondary,
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      {/[0-9]/.test(newPassword) ? '✓' : '○'} Contains numbers
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>

            {/* Confirm Password Input */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  mb: 1.5,
                  fontWeight: 600,
                  color: SAKTHI_COLORS.darkGray,
                }}
              >
                Confirm Password
              </Typography>
              <TextField
                fullWidth
                type={showConfirm ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                variant="outlined"
                size="medium"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirm(!showConfirm)}
                        edge="end"
                        disabled={loading}
                        size="small"
                      >
                        {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: {
                    backgroundColor: SAKTHI_COLORS.white,
                    borderRadius: 2,
                  }
                }}
              />

              {/* Password Match Indicator */}
              {confirm && (
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 1,
                    color: passwordsMatch ? SAKTHI_COLORS.success : SAKTHI_COLORS.secondary,
                    fontSize: '0.8rem',
                    fontWeight: 500,
                  }}
                >
                  {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                </Typography>
              )}
            </Box>

            {/* Submit Button */}
            <Button
              fullWidth
              variant="contained"
              onClick={handleSubmit}
              disabled={loading || !newPassword || !confirm || !passwordsMatch}
              sx={{
                py: 1.5,
                mb: 2,
                background: passwordsMatch
                  ? `linear-gradient(135deg, ${SAKTHI_COLORS.primary} 0%, ${SAKTHI_COLORS.lightBlue} 100%)`
                  : SAKTHI_COLORS.lightGray,
                '&:hover': passwordsMatch ? {
                  background: `linear-gradient(135deg, ${SAKTHI_COLORS.lightBlue} 0%, ${SAKTHI_COLORS.primary} 100%)`,
                } : {},
                '&:disabled': {
                  background: SAKTHI_COLORS.lightGray,
                  color: SAKTHI_COLORS.darkGray,
                }
              }}
            >
              {loading ? (
                <CircularProgress size={20} sx={{ color: SAKTHI_COLORS.white }} />
              ) : (
                'Update Password'
              )}
            </Button>

            {/* Messages */}
            {message && (
              <Alert
                severity="success"
                sx={{
                  mb: 2,
                  backgroundColor: `${SAKTHI_COLORS.success}15`,
                  color: SAKTHI_COLORS.success,
                  border: `1px solid ${SAKTHI_COLORS.success}`,
                  borderRadius: 2,
                }}
              >
                {message}
              </Alert>
            )}
            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 2,
                  backgroundColor: `${SAKTHI_COLORS.secondary}15`,
                  color: SAKTHI_COLORS.secondary,
                  border: `1px solid ${SAKTHI_COLORS.secondary}`,
                  borderRadius: 2,
                }}
              >
                {error}
              </Alert>
            )}

            {/* Footer Note */}
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                textAlign: 'center',
                color: SAKTHI_COLORS.darkGray,
                fontSize: '0.8rem',
              }}
            >
              💡 Use a strong password with uppercase, lowercase, numbers, and symbols for maximum security
            </Typography>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default ChangePasswordPage;
