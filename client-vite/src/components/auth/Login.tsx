import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/commonService';
import './Login.css';
import './ForgotPasswordModal.css';

import GearSpinner from '../common/GearSpinner';

const Login: React.FC = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ username: false, password: false });
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [otpStep, setOtpStep] = useState<'request' | 'verify' | 'reset'>('request');
  const [otpUsername, setOtpUsername] = useState('');

  const [otpValue, setOtpValue] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    if (!credentials.username.trim()) {
      setError('Username is required');
      return false;
    }
    if (credentials.username.length < 3) {
      setError('Username must be at least 3 characters');
      return false;
    }
    if (!credentials.password) {
      setError('Password is required');
      return false;
    }
    if (credentials.password.length < 4) {
      setError('Password must be at least 4 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const res = await login(credentials);
      if (res) {
        if (res.needsEmailVerification) {
          navigate('/update-email');
          return;
        }
        if (res.needsPasswordChange) {
          navigate('/change-password');
          return;
        }

        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleBlur = (field: 'username' | 'password') => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const getFieldError = (field: 'username' | 'password') => {
    if (!touched[field]) return '';
    if (field === 'username' && !credentials.username.trim()) return 'Username is required';
    if (field === 'password' && !credentials.password) return 'Password is required';
    return '';
  };

  return (
    <div className="login-container">
      {/* Left Side - Image Panel */}
      <div className="login-image-panel">
        <img src="/assets/login.jpg" alt="Login Background" className="login-bg-image" />
      </div>

      {/* Right Side - Login Form */}
      <div className="login-form-panel">
        {/* Decorative mechanical pattern background */}
        <div className="decorative-elements">
          {/* Evenly scattered mechanical icons pattern - 80 unique icons */}
          {[...Array(80)].map((_, i) => {
            const icons = [
              // Gear
              <svg key={`i${i}`} viewBox="0 0 24 24"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" /></svg>,
              // Wrench
              <svg key={`i${i}`} viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z" /></svg>,
              // Hexagon Bolt
              <svg key={`i${i}`} viewBox="0 0 24 24"><path d="M12 2L4 7v10l8 5 8-5V7l-8-5Z" /><circle cx="12" cy="12" r="3" /></svg>,
              // Sun Cog
              <svg key={`i${i}`} viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>,
              // Screwdriver
              <svg key={`i${i}`} viewBox="0 0 24 24"><path d="M14 4l6 6-1 1-2-2-7 7-4-4 7-7-2-2 1-1 2 2z" /><path d="M5 17l-2 2 2 2 2-2-2-2z" /></svg>,
              // Hammer
              <svg key={`i${i}`} viewBox="0 0 24 24"><path d="M15 12l-8.5 8.5a2.12 2.12 0 0 1-3-3L12 9" /><path d="M17.64 15L22 10.64a1 1 0 0 0 0-1.42l-7.22-7.22a1 1 0 0 0-1.42 0L9 6.36" /></svg>,
              // Piston
              <svg key={`i${i}`} viewBox="0 0 24 24"><rect x="8" y="2" width="8" height="6" rx="1" /><rect x="6" y="8" width="12" height="4" /><rect x="9" y="12" width="6" height="10" rx="1" /></svg>,
              // Wheel
              <svg key={`i${i}`} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></svg>,
              // Spring/Coil
              <svg key={`i${i}`} viewBox="0 0 24 24"><path d="M4 4c4 0 4 2 8 2s4-2 8-2M4 8c4 0 4 2 8 2s4-2 8-2M4 12c4 0 4 2 8 2s4-2 8-2M4 16c4 0 4 2 8 2s4-2 8-2M4 20c4 0 4 2 8 2s4-2 8-2" /></svg>,
              // Chain Link
              <svg key={`i${i}`} viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>,
              // Screw
              <svg key={`i${i}`} viewBox="0 0 24 24"><circle cx="12" cy="5" r="3" /><path d="M12 8v14" /><path d="M8 12h8M8 16h8M8 20h8" /></svg>,
              // Nut
              <svg key={`i${i}`} viewBox="0 0 24 24"><path d="M12 2l8 4.5v11L12 22l-8-4.5v-11L12 2z" /><circle cx="12" cy="12" r="4" /></svg>,
              // Bearing
              <svg key={`i${i}`} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
              // Pulley
              <svg key={`i${i}`} viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 4v-2M12 22v-2" /></svg>,
              // Clamp
              <svg key={`i${i}`} viewBox="0 0 24 24"><path d="M6 4h12v4H6zM8 8v12M16 8v12M6 16h12" /></svg>,
              // Valve
              <svg key={`i${i}`} viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M8 12h8M12 12v10M8 18h8" /></svg>,
              // Gauge
              <svg key={`i${i}`} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>,
              // Cylinder
              <svg key={`i${i}`} viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" /></svg>,
              // Pipe
              <svg key={`i${i}`} viewBox="0 0 24 24"><path d="M4 6h6v12H4zM14 6h6v12h-6zM10 10h4v4h-4z" /></svg>,
              // Motor
              <svg key={`i${i}`} viewBox="0 0 24 24"><rect x="4" y="6" width="12" height="12" rx="2" /><circle cx="10" cy="12" r="3" /><path d="M16 10h4v4h-4" /></svg>,
              // Shaft
              <svg key={`i${i}`} viewBox="0 0 24 24"><rect x="2" y="10" width="20" height="4" rx="1" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="12" r="3" /></svg>,
              // Flywheel
              <svg key={`i${i}`} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="2" /><path d="M12 4l2 6h-4l2-6M12 20l-2-6h4l-2 6M4 12l6-2v4l-6-2M20 12l-6 2v-4l6 2" /></svg>,
              // Spark Plug
              <svg key={`i${i}`} viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="4" /><path d="M10 6h4v4h-4z" /><path d="M8 10h8l-2 8h-4l-2-8z" /><path d="M10 18v4M14 18v4" /></svg>,
              // Camshaft
              <svg key={`i${i}`} viewBox="0 0 24 24"><rect x="2" y="10" width="20" height="4" /><ellipse cx="6" cy="8" rx="2" ry="4" /><ellipse cx="12" cy="8" rx="2" ry="4" /><ellipse cx="18" cy="8" rx="2" ry="4" /></svg>,
              // Crankshaft
              <svg key={`i${i}`} viewBox="0 0 24 24"><circle cx="4" cy="12" r="2" /><circle cx="20" cy="12" r="2" /><path d="M6 12h4v-4h4v4h4" /></svg>,
              // Oil Drop
              <svg key={`i${i}`} viewBox="0 0 24 24"><path d="M12 2c-4 6-7 9-7 13a7 7 0 1 0 14 0c0-4-3-7-7-13z" /></svg>,
              // Fan Blade
              <svg key={`i${i}`} viewBox="0 0 24 24"><circle cx="12" cy="12" r="2" /><path d="M12 2c2 3 2 6 0 10M12 22c-2-3-2-6 0-10M2 12c3-2 6-2 10 0M22 12c-3 2-6 2-10 0" /></svg>,
              // Thermometer
              <svg key={`i${i}`} viewBox="0 0 24 24"><path d="M14 4v12a4 4 0 1 1-4 0V4a2 2 0 1 1 4 0z" /></svg>,
              // Battery
              <svg key={`i${i}`} viewBox="0 0 24 24"><rect x="2" y="7" width="18" height="12" rx="2" /><path d="M20 10h2v4h-2" /><path d="M6 11v4M10 11v4" /></svg>,
              // Radiator
              <svg key={`i${i}`} viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="1" /><path d="M8 4v16M12 4v16M16 4v16" /></svg>,
              // Filter
              <svg key={`i${i}`} viewBox="0 0 24 24"><path d="M4 4h16l-6 8v8l-4-2v-6L4 4z" /></svg>,
              // Gasket
              <svg key={`i${i}`} viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><rect x="7" y="7" width="10" height="10" rx="1" /></svg>,
              // Caliper
              <svg key={`i${i}`} viewBox="0 0 24 24"><path d="M2 4h4v16H2zM6 8h12M6 12h14v4H6z" /></svg>,
              // Disc Brake
              <svg key={`i${i}`} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /><path d="M12 8v-4M12 20v-4M8 12H4M20 12h-4" /></svg>,
              // Shock Absorber
              <svg key={`i${i}`} viewBox="0 0 24 24"><rect x="10" y="2" width="4" height="4" /><path d="M8 6h8l-1 4h-6l-1-4z" /><rect x="9" y="10" width="6" height="8" /><path d="M10 18v4M14 18v4" /></svg>,
              // Leaf Spring
              <svg key={`i${i}`} viewBox="0 0 24 24"><path d="M2 12c4-4 8-4 10 0s6 4 10 0M2 16c4-4 8-4 10 0s6 4 10 0" /></svg>,
              // Exhaust
              <svg key={`i${i}`} viewBox="0 0 24 24"><path d="M4 12h8l4-4h6M4 16h6l4 4h6" /><circle cx="4" cy="14" r="2" /></svg>,
              // Carburetor
              <svg key={`i${i}`} viewBox="0 0 24 24"><rect x="6" y="4" width="12" height="8" rx="1" /><path d="M8 12v8M16 12v8M4 16h16" /></svg>,
              // Turbo
              <svg key={`i${i}`} viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /><path d="M12 8c2 0 3 1 3 4s-1 4-3 4-3-1-3-4 1-4 3-4" /><path d="M4 12h4M16 12h4" /></svg>,
              // Fuel Injector
              <svg key={`i${i}`} viewBox="0 0 24 24"><rect x="8" y="2" width="8" height="6" rx="1" /><path d="M10 8v6M14 8v6" /><path d="M6 14h12v4H6z" /><path d="M10 18v4M14 18v4" /></svg>,
              // Timing Belt
              <svg key={`i${i}`} viewBox="0 0 24 24"><circle cx="6" cy="8" r="4" /><circle cx="18" cy="16" r="4" /><path d="M6 12c0 8 12 0 12 8M6 4c0-2 12 6 12 4" /></svg>,
              // Dipstick
              <svg key={`i${i}`} viewBox="0 0 24 24"><rect x="10" y="2" width="4" height="4" rx="1" /><path d="M11 6h2v16h-2z" /><path d="M9 18h6" /></svg>,
              // Hose Clamp
              <svg key={`i${i}`} viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="6" /><path d="M12 4v2M12 18v2M4 12h2M18 12h2" /></svg>,
              // Mounting Bracket
              <svg key={`i${i}`} viewBox="0 0 24 24"><path d="M4 4h16v4H4z" /><path d="M6 8v12M18 8v12" /><circle cx="6" cy="20" r="2" /><circle cx="18" cy="20" r="2" /></svg>,
              // Bushing
              <svg key={`i${i}`} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="5" /></svg>,
              // O-Ring
              <svg key={`i${i}`} viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="6" /></svg>,
              // Washer
              <svg key={`i${i}`} viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /></svg>,
              // Pin
              <svg key={`i${i}`} viewBox="0 0 24 24"><circle cx="12" cy="6" r="4" /><path d="M12 10v12" /></svg>,
              // Key
              <svg key={`i${i}`} viewBox="0 0 24 24"><circle cx="8" cy="8" r="5" /><path d="M12 12l8 8M16 16l2 2M18 14l2 2" /></svg>,
              // Rivet
              <svg key={`i${i}`} viewBox="0 0 24 24"><circle cx="12" cy="6" r="4" /><path d="M10 10h4v10c0 2-4 2-4 0V10z" /></svg>,
              // Stud
              <svg key={`i${i}`} viewBox="0 0 24 24"><rect x="10" y="2" width="4" height="20" /><path d="M8 4h8M8 6h8M8 18h8M8 20h8" /></svg>,
              // Allen Key
              <svg key={`i${i}`} viewBox="0 0 24 24"><path d="M4 4h6v6H4z" /><path d="M10 7h12" /></svg>,
              // Socket
              <svg key={`i${i}`} viewBox="0 0 24 24"><path d="M12 2l6 3v6l-6 3-6-3V5l6-3z" /><rect x="8" y="14" width="8" height="8" rx="1" /></svg>,
              // Torque Wrench
              <svg key={`i${i}`} viewBox="0 0 24 24"><path d="M4 12h12" /><circle cx="18" cy="12" r="4" /><path d="M4 10v4" /></svg>,
              // Pliers
              <svg key={`i${i}`} viewBox="0 0 24 24"><path d="M8 4l4 6-4 2-4-6 4-2z" /><path d="M16 4l-4 6 4 2 4-6-4-2z" /><path d="M10 12l-4 10M14 12l4 10" /></svg>,
              // Vice
              <svg key={`i${i}`} viewBox="0 0 24 24"><rect x="2" y="8" width="20" height="8" /><rect x="6" y="6" width="4" height="12" /><rect x="14" y="6" width="4" height="12" /></svg>,
              // File Tool
              <svg key={`i${i}`} viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="16" rx="1" /><path d="M8 6h8M8 9h8M8 12h8M8 15h8" /><path d="M10 18v4M14 18v4" /></svg>,
              // Drill Bit
              <svg key={`i${i}`} viewBox="0 0 24 24"><path d="M12 2l3 4-3 2-3-2 3-4z" /><rect x="10" y="8" width="4" height="14" /></svg>,
              // Tap
              <svg key={`i${i}`} viewBox="0 0 24 24"><rect x="10" y="2" width="4" height="6" /><path d="M8 8h8v2H8z" /><path d="M10 10v12M14 10v12" /><path d="M8 14h8M8 18h8" /></svg>,
              // Die
              <svg key={`i${i}`} viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" /><circle cx="12" cy="12" r="4" /></svg>,
              // Micrometer
              <svg key={`i${i}`} viewBox="0 0 24 24"><path d="M2 14h10" /><path d="M12 8v12" /><rect x="12" y="10" width="10" height="8" rx="1" /></svg>,
              // Caliper Gauge
              <svg key={`i${i}`} viewBox="0 0 24 24"><path d="M4 6h16v2H4z" /><path d="M4 6v12M8 8v8" /><path d="M4 18h6" /></svg>,
              // Level
              <svg key={`i${i}`} viewBox="0 0 24 24"><rect x="2" y="8" width="20" height="8" rx="2" /><rect x="9" y="10" width="6" height="4" rx="1" /><circle cx="12" cy="12" r="1" /></svg>,
              // Compass
              <svg key={`i${i}`} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M16 8l-6 3 2 5 6-3-2-5z" /></svg>,
              // Protractor
              <svg key={`i${i}`} viewBox="0 0 24 24"><path d="M2 20a10 10 0 0 1 20 0H2z" /><path d="M12 10v10" /><path d="M6 14l6-4 6 4" /></svg>,
              // Ruler
              <svg key={`i${i}`} viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="1" /><path d="M6 6v4M10 6v6M14 6v4M18 6v6" /></svg>,
              // Tape Measure
              <svg key={`i${i}`} viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /><path d="M12 4v4M12 12h6" /></svg>,
              // Magnifier
              <svg key={`i${i}`} viewBox="0 0 24 24"><circle cx="10" cy="10" r="7" /><path d="M15 15l6 6" /></svg>,
              // Clamp Tool
              <svg key={`i${i}`} viewBox="0 0 24 24"><path d="M4 4l4 4M4 4h6M4 4v6" /><path d="M20 20l-4-4M20 20h-6M20 20v-6" /><rect x="8" y="8" width="8" height="8" /></svg>,
              // Vise Grip
              <svg key={`i${i}`} viewBox="0 0 24 24"><path d="M4 8h8l4 8h4" /><path d="M4 16h8l4-8" /><circle cx="4" cy="12" r="2" /></svg>,
              // Crowbar
              <svg key={`i${i}`} viewBox="0 0 24 24"><path d="M4 4c2 0 4 2 4 4v12" /><path d="M4 4h4M8 20h4" /></svg>,
              // Jack
              <svg key={`i${i}`} viewBox="0 0 24 24"><path d="M6 20h12" /><path d="M8 20l4-16 4 16" /><path d="M10 12h4" /></svg>,
              // Crane Hook
              <svg key={`i${i}`} viewBox="0 0 24 24"><path d="M12 2v8" /><path d="M8 10a4 4 0 1 0 8 0" /><circle cx="12" cy="18" r="4" /></svg>,
              // Anvil
              <svg key={`i${i}`} viewBox="0 0 24 24"><path d="M4 14h16l-2 6H6l-2-6z" /><path d="M6 14V8h12v6" /><path d="M16 8h4v4h-4" /></svg>,
              // Forge
              <svg key={`i${i}`} viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="10" rx="1" /><path d="M8 10V6h8v4" /><path d="M10 2v4M14 2v4" /></svg>,
              // Crucible
              <svg key={`i${i}`} viewBox="0 0 24 24"><path d="M6 6h12l-2 14H8L6 6z" /><path d="M4 6h16" /></svg>,
            ];
            // 8 columns x 10 rows grid for even distribution
            const cols = 8;
            const rows = 10;
            const col = i % cols;
            const row = Math.floor(i / cols);
            // Center each icon in its grid cell with slight random offset
            const cellWidth = 100 / cols;
            const cellHeight = 100 / rows;
            const baseLeft = (col * cellWidth) + (cellWidth / 2);
            const baseTop = (row * cellHeight) + (cellHeight / 2);
            // Small random offset for natural scattered look
            const seed = i * 7919;
            const offsetX = ((seed * 13) % 20) - 10;
            const offsetY = ((seed * 17) % 20) - 10;
            const rotate = ((seed * 23) % 360);
            const size = 26 + ((seed * 11) % 14);
            return (
              <span
                key={i}
                className="deco-icon"
                style={{
                  position: 'absolute',
                  top: `calc(${baseTop}% + ${offsetY}px)`,
                  left: `calc(${baseLeft}% + ${offsetX}px)`,
                  transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
                  width: `${size}px`,
                  height: `${size}px`,
                }}
              >
                {icons[i % icons.length]}
              </span>
            );
          })}
        </div>
        <div className="login-card">
          <div className="login-header">
            <img src="/assets/LOGO.png" alt="SACL Logo" className="login-logo" />
            <h2 className="system-title">Digital Trial Card</h2>
            <p className="login-subtitle">Sign in now.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <input
                type="text"
                id="username"
                name="username"
                value={credentials.username}
                onChange={handleChange}
                onBlur={() => handleBlur('username')}
                className={getFieldError('username') ? 'input-error' : ''}
                placeholder="Enter your username"
                autoComplete="username"
                disabled={loading}
                required
              />
              {getFieldError('username') && (
                <span className="field-error">{getFieldError('username')}</span>
              )}
            </div>

            <div className="form-group">
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                  onBlur={() => handleBlur('password')}
                  className={getFieldError('password') ? 'input-error' : ''}
                  placeholder="Password"
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  )}
                </button>
              </div>
              {getFieldError('password') && (
                <span className="field-error">{getFieldError('password')}</span>
              )}
            </div>

            {error && (
              <div className="error-message">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading || !credentials.username || !credentials.password} className="login-button">
              {loading ? (
                <>
                  <GearSpinner className="gear-white" />
                  Signing in...
                </>
              ) : 'Login'}
            </button>
          </form>
          <div style={{ textAlign: 'right', marginTop: '8px' }}>
            <button
              type="button"
              className="forgot-password-link"
              style={{ background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer', padding: 0, fontSize: '0.95em' }}
              onClick={() => setShowForgotModal(true)}
            >
              Forgot Password?
            </button>
          </div>
          {/* Forgot Password Modal will be rendered here */}
          {showForgotModal && (
            <div className="forgot-modal-overlay">
              <div className="forgot-modal-content">
                <button className="forgot-close-btn" onClick={() => { setShowForgotModal(false); setOtpStep('request'); setOtpValue(''); setOtpUsername(''); }} title="Close">×</button>
                <h3>Forgot Password</h3>
                {otpStep === 'request' && (
                  <form
                    className="forgot-form"
                    onSubmit={async e => {
                      e.preventDefault();
                      setForgotError('');
                      setForgotSuccess('');
                      setForgotLoading(true);
                      const form = e.target as HTMLFormElement;
                      const username = (form.forgotUsername as HTMLInputElement).value;
                      const email = (form.forgotEmail as HTMLInputElement).value;
                      try {
                        const { authService } = await import('../../services/authService');
                        await authService.forgotPasswordRequest(username, email);
                        setOtpUsername(username);
                        setOtpStep('verify');
                      } catch (err: any) {
                        setForgotError(err.message || 'Failed to send OTP');
                      } finally {
                        setForgotLoading(false);
                      }
                    }}
                  // style handled by className
                  >
                    <div style={{ padding: '12px', backgroundColor: '#e3f2fd', border: '1px solid #90caf9', borderRadius: '4px', marginBottom: '16px', fontSize: '14px', color: '#1565c0' }}>
                      <strong>Note:</strong> If you don't know your username and password, please contact the admin for assistance.
                    </div>
                    <input
                      type="text"
                      name="forgotUsername"
                      placeholder="Enter your username"
                      required
                    />
                    <input
                      type="email"
                      name="forgotEmail"
                      placeholder="Enter your email address"
                      required
                    />
                    <button type="submit" disabled={forgotLoading}>
                      {forgotLoading ? (
                        <>
                          <GearSpinner />
                          Sending...
                        </>
                      ) : 'Send OTP'}
                    </button>
                    {forgotError && <span className="forgot-error">{forgotError}</span>}
                    {forgotSuccess && <span className="forgot-success">{forgotSuccess}</span>}
                  </form>
                )}
                {otpStep === 'verify' && (
                  <form
                    className="forgot-form"
                    onSubmit={e => {
                      e.preventDefault();
                      setForgotError('');
                      const form = e.target as HTMLFormElement;
                      const otp = (form.otpCode as HTMLInputElement).value;
                      if (!otp) {
                        setForgotError('OTP is required');
                        return;
                      }
                      setOtpValue(otp);
                      setOtpStep('reset');
                    }}
                  >
                    <input
                      type="text"
                      name="otpCode"
                      placeholder="Enter OTP"
                      required
                    />
                    <button type="submit">
                      Verify OTP
                    </button>
                    {forgotError && <span className="forgot-error">{forgotError}</span>}
                  </form>
                )}
                {otpStep === 'reset' && (
                  <form
                    className="forgot-form"
                    onSubmit={async e => {
                      e.preventDefault();
                      setForgotError('');
                      setForgotSuccess('');
                      setForgotLoading(true);
                      const form = e.target as HTMLFormElement;
                      const newPassword = (form.otpNewPassword as HTMLInputElement).value;
                      if (!otpUsername || !otpValue || !newPassword) {
                        setForgotError('All fields are required');
                        setForgotLoading(false);
                        return;
                      }
                      try {
                        const { authService } = await import('../../services/authService');
                        await authService.resetPasswordWithOtp(otpUsername, otpValue, newPassword);
                        setForgotSuccess('Password updated successfully. You can now log in.');
                        setTimeout(() => {
                          setShowForgotModal(false);
                          setForgotSuccess('');
                          setOtpStep('request');
                          setOtpValue('');
                          setOtpUsername('');
                        }, 2000);
                      } catch (err: any) {
                        setForgotError(err.message || 'Failed to reset password');
                      } finally {
                        setForgotLoading(false);
                      }
                    }}
                  >

                    <div className="password-input-wrapper">
                      <input
                        type={showResetPassword ? "text" : "password"}
                        name="otpNewPassword"
                        placeholder="Enter new password"
                        required
                        style={{ paddingRight: '48px', width: '100%' }} // Inline style to ensure padding for icon if CSS doesn't catch it
                      />
                      <button
                        type="button"
                        className="toggle-password"
                        onClick={() => setShowResetPassword(!showResetPassword)}
                        aria-label={showResetPassword ? "Hide password" : "Show password"}
                        style={{ right: '10px', background: 'transparent', color: '#9e9e9e', padding: '4px' }} // Adjustment for modal context and override form button styles
                      >
                        {showResetPassword ? (
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <button type="submit" disabled={forgotLoading}>
                      {forgotLoading ? (
                        <>
                          <GearSpinner />
                          Updating...
                        </>
                      ) : 'Reset Password'}
                    </button>
                    {forgotError && <span className="forgot-error">{forgotError}</span>}
                    {forgotSuccess && <span className="forgot-success">{forgotSuccess}</span>}
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
