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

import { apiService } from '../services/commonService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/dashboard/Header';
import Sidebar from '../components/dashboard/Sidebar';
import ProfileModal from '../components/dashboard/ProfileModal';
import { getDepartmentInfo } from '../utils/dashboardUtils';
import { appTheme, COLORS } from '../theme/appTheme';

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
  const [currentView, setCurrentView] = useState('');

  const handleViewChange = (view: string) => {
    navigate('/dashboard', { state: { view } });
  };

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
                Email Verification
              </Typography>
              <Typography variant="body2" sx={{ color: '#7f8c8d' }}>
                Verify your email address to secure your account and enable notifications.
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
                    New Email Address
                  </Typography>
                  <TextField
                    fullWidth
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={otpSent || loading}
                    size="small"
                  />
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={sendOtp}
                    disabled={loading || otpSent}
                    sx={{ mt: 2, py: 1, fontWeight: 600 }}
                  >
                    {loading ? <GearSpinner size={20} color="white" /> : otpSent ? 'OTP Sent' : 'Send Verification OTP'}
                  </Button>
                </Box>

                {otpSent && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600, color: '#333' }}>
                      Verification OTP
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="Enter 6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      disabled={loading}
                      size="small"
                      inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: '4px', fontWeight: 700 } }}
                    />
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={verifyOtp}
                      disabled={loading || otp.length !== 6}
                      sx={{ mt: 2, py: 1, fontWeight: 600, bgcolor: COLORS.secondary, '&:hover': { bgcolor: '#e38c02' } }}
                    >
                      {loading ? <GearSpinner size={20} color="white" /> : 'Verify & Continue'}
                    </Button>
                  </Box>
                )}

                {message && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    {message}
                  </Alert>
                )}
                {error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                  </Alert>
                )}
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

export default UpdateEmail;
