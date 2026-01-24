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
import { apiService } from '../services/commonService';
import { useNavigate } from 'react-router-dom';
import { appTheme, COLORS } from '../theme/appTheme';


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

const DECORATIVE_ICONS = [
  EmailIcon,
  VerifiedIcon,
  KeyIcon,
  LockIcon,
  SecurityIcon,
  MarkEmailReadIcon,
  ShieldIcon,
  CheckCircleIcon,
];

const DecorativeBackground: React.FC = () => {
  const positions = [
    { top: '-60px', left: '-60px' },
    { top: '-60px', right: '-60px' },
    { bottom: '-60px', left: '-60px' },
    { bottom: '-60px', right: '-60px' },
    { top: '10%', left: '-60px' },
    { top: '10%', right: '-60px' },
    { bottom: '10%', left: '-60px' },
    { bottom: '10%', right: '-60px' },
    { top: '50%', left: '-60px' },
    { top: '50%', right: '-60px' },
    { top: '-60px', left: '50%' },
    { bottom: '-60px', left: '50%' },
    { top: '-80px', left: '10%' },
    { top: '-50px', left: '80%' },
    { bottom: '-50px', left: '15%' },
    { bottom: '-50px', right: '10%' },
    { top: '20%', left: '-60px' },
    { top: '80%', right: '-60px' },
    { bottom: '20%', left: '-60px' },
    { bottom: '80%', right: '-60px' },
    { top: '0', left: '25%' },
    { top: '0', right: '25%' },
    { bottom: '0', left: '25%' },
    { bottom: '0', right: '25%' },
  ];
  return (
    <Box sx={{ position: 'absolute', pointerEvents: 'none', zIndex: 1, width: '100%', height: '100%' }}>
      {positions.map((pos, i) => {
        const Icon = DECORATIVE_ICONS[i % DECORATIVE_ICONS.length];
        return (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              ...pos,
              color: '#f39b03',
              opacity: 0.20,
              fontSize: 60 + (i % 3) * 18,
              filter: 'blur(0.5px)',
            }}
          >
            <Icon fontSize="inherit" />
          </Box>
        );
      })}
    </Box>
  );
};

const ChangePassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

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
      setMessage('Password updated successfully. Redirecting...');
      setTimeout(() => navigate('/dashboard'), 1500);
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

      <Box sx={{ minHeight: '100vh', background: `linear-gradient(135deg, #fffbe6 0%, #fff 100%)` }}>
        <Paper
          sx={{
            p: { xs: 1.5, sm: 2, md: 3 },
            mb: { xs: 2, md: 3 },
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'center', sm: 'center' },
            justifyContent: { xs: 'center', sm: 'space-between' },
            gap: { xs: 1.5, sm: 2 },
            borderTop: `4px solid #f39b03`,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            position: 'relative',
            zIndex: 2,
            background: '#fff',
          }}
        >
          <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }} sx={{ flexWrap: 'wrap', justifyContent: { xs: 'center', sm: 'flex-start' } }}>
            <Box
              component="img"
              src="/assets/SACL-LOGO-01.svg"
              alt="Sakthi Auto"
              sx={{ height: { xs: 40, sm: 45, md: 55 }, width: 'auto', objectFit: 'contain' }}
            />
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: '#1e293b', fontSize: { xs: '0.8rem', sm: '1rem', md: '1.25rem' }, textAlign: { xs: 'center', sm: 'left' } }}
            >
              Sakthi Auto Component Limited
            </Typography>
          </Box>
        </Paper>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 'calc(100vh - 120px)',
            padding: 2,
            position: 'relative',
            zIndex: 2,
          }}
        >
          <Container maxWidth="sm" sx={{ position: 'relative' }}>
            <Box sx={{ position: 'relative' }}>
              <DecorativeBackground />
              <Paper
                elevation={6}
                sx={{
                  padding: 5,
                  borderRadius: 4,
                  border: `2px solid #f39b03`,
                  boxShadow: '0 8px 32px rgba(243, 155, 3, 0.18)',
                  maxWidth: 480,
                  margin: 'auto',
                  background: '#fff',
                  position: 'relative',
                  zIndex: 2,
                }}
              >

                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Typography
                    variant="h4"
                    sx={{
                      color: COLORS.primary,
                      mb: 1,
                      fontWeight: 700,
                    }}
                  >
                    🔑 Set New Password
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: COLORS.textSecondary,
                      fontSize: '0.95rem',
                    }}
                  >
                    Create a strong password for your account security
                  </Typography>
                </Box>


                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      mb: 1.5,
                      fontWeight: 600,
                      color: COLORS.textPrimary,
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
                        backgroundColor: COLORS.surface,
                        borderRadius: 2,
                      }
                    }}
                  />


                  {newPassword && (
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontSize: '0.8rem' }}>
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
                          backgroundColor: COLORS.border,
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: passwordStrength.color,
                            borderRadius: 3,
                          }
                        }}
                      />
                      <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontSize: '0.75rem', fontWeight: 600 }}>
                          Password Requirements:
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: newPassword.length >= 8 ? COLORS.successText : COLORS.secondary,
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            fontWeight: 500,
                          }}
                        >
                          {newPassword.length >= 8 ? '✓' : '○'} At least 8 characters
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: /[a-z]/.test(newPassword) ? COLORS.successText : COLORS.secondary,
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            fontWeight: 500,
                          }}
                        >
                          {/[a-z]/.test(newPassword) ? '✓' : '○'} Contains lowercase letters
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: /[A-Z]/.test(newPassword) ? COLORS.successText : COLORS.secondary,
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            fontWeight: 500,
                          }}
                        >
                          {/[A-Z]/.test(newPassword) ? '✓' : '○'} Contains uppercase letters
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: /[0-9]/.test(newPassword) ? COLORS.successText : COLORS.secondary,
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            fontWeight: 500,
                          }}
                        >
                          {/[0-9]/.test(newPassword) ? '✓' : '○'} Contains digits
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: /[^a-zA-Z0-9]/.test(newPassword) ? COLORS.successText : COLORS.secondary,
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            fontWeight: 500,
                          }}
                        >
                          {/[^a-zA-Z0-9]/.test(newPassword) ? '✓' : '○'} Contains at least one special character
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>


                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      mb: 1.5,
                      fontWeight: 600,
                      color: COLORS.textPrimary,
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
                        backgroundColor: COLORS.surface,
                        borderRadius: 2,
                      }
                    }}
                  />


                  {confirm && (
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 1,
                        color: passwordsMatch ? COLORS.successText : COLORS.secondary,
                        fontSize: '0.8rem',
                        fontWeight: 500,
                      }}
                    >
                      {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </Typography>
                  )}
                </Box>


                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading || !isPasswordValid}
                  sx={{
                    py: 1.5,
                    mb: 2,
                    background: isPasswordValid
                      ? `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accentBlue} 100%)`
                      : COLORS.border,
                    '&:hover': isPasswordValid ? {
                      background: `linear-gradient(135deg, ${COLORS.accentBlue} 0%, ${COLORS.primary} 100%)`,
                    } : {},
                    '&:disabled': {
                      background: COLORS.border,
                      color: COLORS.textSecondary,
                    }
                  }}
                >
                  {loading ? (
                    <div style={{ transform: 'scale(0.4)', height: '20px', width: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><GearSpinner /></div>
                  ) : (
                    'Update Password'
                  )}
                </Button>


                {message && (
                  <Alert
                    severity="success"
                    sx={{
                      mb: 2,
                      backgroundColor: COLORS.successBg,
                      color: COLORS.successText,
                      border: `1px solid ${COLORS.successText}`,
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
                      backgroundColor: COLORS.orangeHeaderBg,
                      color: COLORS.secondary,
                      border: `1px solid ${COLORS.secondary}`,
                      borderRadius: 2,
                    }}
                  >
                    {error}
                  </Alert>
                )}


                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    textAlign: 'center',
                    color: COLORS.textSecondary,
                    fontSize: '0.8rem',
                  }}
                >
                  💡 Use a strong password with uppercase, lowercase, numbers, and symbols for maximum security
                </Typography>
              </Paper>
            </Box>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default ChangePassword;
