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
  createTheme,
} from '@mui/material';
import GearSpinner from '../components/common/GearSpinner';
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
import { useAuth } from '../context/AuthContext';
import Header from '../components/dashboard/Header';
import ProfileModal from '../components/dashboard/ProfileModal';
import { getDepartmentInfo } from '../utils/dashboardUtils';
import { appTheme, COLORS } from '../theme/appTheme';

// Local theme removed in favor of global appTheme


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

const DecorativeBackground: React.FC<{ boxRef?: React.RefObject<HTMLDivElement> }> = ({ boxRef }) => {

  const positions = [

    { top: '-38px', left: '-38px' },
    { top: '-38px', right: '-38px' },
    { bottom: '-38px', left: '-38px' },
    { bottom: '-38px', right: '-38px' },

    { top: '10%', left: '-38px' },
    { top: '10%', right: '-38px' },
    { bottom: '10%', left: '-38px' },
    { bottom: '10%', right: '-38px' },
    { top: '50%', left: '-38px' },
    { top: '50%', right: '-38px' },
    { top: '-38px', left: '50%' },
    { bottom: '-38px', left: '50%' },

    { top: '-50px', left: '10%' },
    { top: '-24px', left: '80%' },
    { bottom: '-24px', left: '15%' },
    { bottom: '-24px', right: '10%' },
    { top: '20%', left: '-38px' },
    { top: '80%', right: '-38px' },
    { bottom: '20%', left: '-38px' },
    { bottom: '80%', right: '-38px' },
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
              opacity: 0.18,
              fontSize: 38 + (i % 3) * 10,
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

const UpdateEmail: React.FC = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();
  const { updateUser, user } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [headerRefreshKey, setHeaderRefreshKey] = useState(0);
  const departmentInfo = getDepartmentInfo(user);
  const formBoxRef = React.useRef<HTMLDivElement>(null);

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
      setMessage('OTP sent to your email. Check your inbox.');
      setOtpSent(true);
    } catch (err) {
      setError((err as Error).message || 'Failed to send OTP');
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
      setMessage('Email verified successfully');
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.email = email;
          parsed.needsEmailVerification = false;
          localStorage.setItem('user', JSON.stringify(parsed));
          updateUser(parsed);
        }
      } catch { }
      setTimeout(() => navigate('/change-password'), 1500);
    } catch (err) {
      setError((err as Error).message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={appTheme}>

      <Box sx={{ minHeight: '100vh', background: `linear-gradient(135deg, #fffbe6 0%, #fff 100%)` }}>
        <Header
          setShowProfile={setShowProfile}
          departmentInfo={departmentInfo}
          photoRefreshKey={headerRefreshKey}
          showBackButton={true}
        />
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
            <Box ref={formBoxRef} sx={{ position: 'relative' }}>
              <DecorativeBackground boxRef={formBoxRef} />
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
                      color: '#f39b03',
                      mb: 1,
                      fontWeight: 700,
                      letterSpacing: 1,
                    }}
                  >
                    Verify Your Email
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: '#374151',
                      fontSize: '1rem',
                      fontWeight: 500,
                    }}
                  >
                    Please verify your email address to secure your account and enable notifications.
                  </Typography>
                </Box>


                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ mb: 1.5, fontWeight: 600, color: '#374151' }}
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
                    InputProps={{ sx: { backgroundColor: '#fff', borderRadius: 2 } }}
                    sx={{ '& .MuiOutlinedInput-root.Mui-disabled': { backgroundColor: '#E5E7EB' } }}
                  />
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={sendOtp}
                    disabled={loading || otpSent}
                    sx={{ mt: 2, py: 1.5, fontWeight: 700, fontSize: '1.1rem', background: '#f39b03', color: '#fff', '&:hover': { background: '#e38c02' }, '&:disabled': { background: '#E5E7EB', color: '#374151' } }}
                  >
                    {loading ? <div style={{ transform: 'scale(0.4)', height: '20px', width: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><GearSpinner /></div> : otpSent ? '✓ OTP Sent' : 'Send OTP'}
                  </Button>
                </Box>


                {otpSent && (
                  <Box sx={{ display: 'flex', alignItems: 'center', my: 3, gap: 2 }}>
                    <Box sx={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
                    <Typography sx={{ color: '#374151', fontSize: '0.9rem', fontWeight: 600 }}>Step 2</Typography>
                    <Box sx={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
                  </Box>
                )}


                {otpSent && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600, color: '#374151' }}>
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
                      inputProps={{ maxLength: 6, style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' } }}
                      InputProps={{ sx: { backgroundColor: '#fff', borderRadius: 2 } }}
                    />
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={verifyOtp}
                      disabled={loading || otp.length !== 6}
                      sx={{ mt: 2, py: 1.5, fontWeight: 700, fontSize: '1.1rem', background: '#f39b03', color: '#fff', '&:hover': { background: '#e38c02' }, '&:disabled': { background: '#E5E7EB', color: '#374151' } }}
                    >
                      {loading ? <div style={{ transform: 'scale(0.4)', height: '20px', width: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><GearSpinner /></div> : 'Verify OTP'}
                    </Button>
                  </Box>
                )}


                {message && (
                  <Alert severity="success" sx={{ mt: 3, backgroundColor: '#f39b0315', color: '#10B981', border: '1px solid #10B981', borderRadius: 2 }}>
                    {message}
                  </Alert>
                )}
                {error && (
                  <Alert severity="error" sx={{ mt: 3, backgroundColor: '#DC262615', color: '#DC2626', border: '1px solid #DC2626', borderRadius: 2 }}>
                    {error}
                  </Alert>
                )}


                {!otpSent && (
                  <Typography variant="caption" sx={{ display: 'block', mt: 3, textAlign: 'center', color: COLORS.textSecondary, fontSize: '0.85rem' }}>
                    We'll send a verification code to your email address
                  </Typography>
                )}
              </Paper>
            </Box>
          </Container>
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

export default UpdateEmail;
