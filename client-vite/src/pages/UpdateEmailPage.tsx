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
} from '@mui/material';
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

const UpdateEmailPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();

  const sendOtp = async () => {
    setError('');
    setMessage('');
    if (!email) {
      setError('Please enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      await apiService.sendEmailOtp(email);
      setMessage('✅ OTP sent to your email. Check your inbox.');
      setOtpSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally { 
      setLoading(false); 
    }
  };

  const verifyOtp = async () => {
    setError('');
    setMessage('');
    if (!email || !otp) {
      setError('Please enter both email and OTP');
      return;
    }
    setLoading(true);
    try {
      await apiService.verifyEmailOtp(email, otp);
      setMessage('✅ Email verified successfully');
      // update local stored user
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.email = email;
          localStorage.setItem('user', JSON.stringify(parsed));
        }
      } catch {}
      // After verifying email, require user to change default password
      setTimeout(() => navigate('/change-password'), 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP');
    } finally { 
      setLoading(false); 
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
                🔐 Verify Your Email
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: SAKTHI_COLORS.darkGray,
                  fontSize: '0.95rem',
                }}
              >
                Complete your account setup by verifying your email address
              </Typography>
            </Box>

            {/* Email Input Section */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  mb: 1.5,
                  fontWeight: 600,
                  color: SAKTHI_COLORS.darkGray,
                }}
              >
                Email Address
              </Typography>
              <TextField
                fullWidth
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={otpSent || loading}
                variant="outlined"
                size="medium"
                InputProps={{
                  sx: {
                    backgroundColor: SAKTHI_COLORS.white,
                    borderRadius: 2,
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root.Mui-disabled': {
                    backgroundColor: SAKTHI_COLORS.lightGray,
                  }
                }}
              />
              <Button
                fullWidth
                variant="contained"
                onClick={sendOtp}
                disabled={loading || otpSent}
                sx={{
                  mt: 2,
                  py: 1.5,
                  background: `linear-gradient(135deg, ${SAKTHI_COLORS.primary} 0%, ${SAKTHI_COLORS.lightBlue} 100%)`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${SAKTHI_COLORS.lightBlue} 0%, ${SAKTHI_COLORS.primary} 100%)`,
                  },
                  '&:disabled': {
                    background: SAKTHI_COLORS.lightGray,
                    color: SAKTHI_COLORS.darkGray,
                  }
                }}
              >
                {loading ? (
                  <CircularProgress size={20} sx={{ color: SAKTHI_COLORS.white }} />
                ) : otpSent ? (
                  '✓ OTP Sent'
                ) : (
                  'Send OTP'
                )}
              </Button>
            </Box>

            {/* Divider */}
            {otpSent && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  my: 3,
                  gap: 2,
                }}
              >
                <Box sx={{ flex: 1, height: 1, backgroundColor: SAKTHI_COLORS.lightGray }} />
                <Typography sx={{ color: SAKTHI_COLORS.darkGray, fontSize: '0.85rem' }}>
                  Step 2
                </Typography>
                <Box sx={{ flex: 1, height: 1, backgroundColor: SAKTHI_COLORS.lightGray }} />
              </Box>
            )}

            {/* OTP Input Section */}
            {otpSent && (
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    mb: 1.5,
                    fontWeight: 600,
                    color: SAKTHI_COLORS.darkGray,
                  }}
                >
                  Enter OTP
                </Typography>
                <TextField
                  fullWidth
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={loading}
                  variant="outlined"
                  size="medium"
                  inputProps={{
                    maxLength: 6,
                    style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }
                  }}
                  InputProps={{
                    sx: {
                      backgroundColor: SAKTHI_COLORS.white,
                      borderRadius: 2,
                    }
                  }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  onClick={verifyOtp}
                  disabled={loading || otp.length !== 6}
                  sx={{
                    mt: 2,
                    py: 1.5,
                    '&:disabled': {
                      background: SAKTHI_COLORS.lightGray,
                      color: SAKTHI_COLORS.darkGray,
                    }
                  }}
                >
                  {loading ? (
                    <CircularProgress size={20} sx={{ color: SAKTHI_COLORS.white }} />
                  ) : (
                    'Verify OTP'
                  )}
                </Button>
              </Box>
            )}

            {/* Messages */}
            {message && (
              <Alert
                severity="success"
                sx={{
                  mt: 3,
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
                  mt: 3,
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
            {!otpSent && (
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mt: 3,
                  textAlign: 'center',
                  color: SAKTHI_COLORS.darkGray,
                  fontSize: '0.8rem',
                }}
              >
                💡 We'll send a verification code to your email address
              </Typography>
            )}
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default UpdateEmailPage;
