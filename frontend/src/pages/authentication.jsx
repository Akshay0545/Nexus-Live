import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  VideoCameraIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/solid';

export default function Authentication() {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const { login, register, error: authError, loading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (isRegister) {
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (isRegister) {
      const passwordErrors = [];
      if (!/[A-Z]/.test(formData.password)) passwordErrors.push('uppercase letter');
      if (!/[a-z]/.test(formData.password)) passwordErrors.push('lowercase letter');
      if (!/[0-9]/.test(formData.password)) passwordErrors.push('number');
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) passwordErrors.push('special character');
      if (passwordErrors.length > 0) {
        newErrors.password = `Password must contain at least one ${passwordErrors.join(', ')}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      let result;
      if (isRegister) {
        result = await register(formData.email, formData.username, formData.password);
      } else {
        result = await login(formData.username, formData.password);
      }
      if (result?.success) navigate('/home');
    } catch (err) {
      console.error('Authentication error:', err);
    }
  };

  const inputClass =
    'w-full px-4 py-3 rounded-xl bg-white border border-ll-border text-ll-text placeholder-ll-text-secondary outline-none focus:ring-2 focus:ring-ll-accent/30 focus:border-ll-accent transition-all disabled:opacity-60';
  const labelClass = 'block text-sm font-medium text-ll-text mb-1';
  const errorClass = 'text-ll-danger text-xs mt-0.5';

  return (
    <div className="h-screen bg-ll-bg flex overflow-hidden">
      {/* Left: branding - warm gradient matching landing */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#fcecd5] via-[#f8d5ba] to-[#ffb347] flex-col justify-center items-center px-12 text-center">
        <div className="max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-white/80 flex items-center justify-center mx-auto mb-6 shadow-md">
            <VideoCameraIcon className="h-8 w-8 text-ll-accent" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-ll-text mb-3">
            <span className="text-ll-accent">Connect</span> with your loved ones
          </h1>
          <p className="text-ll-text-secondary text-lg">
            Sign in or create an account to start your next meeting.
          </p>
        </div>
      </div>

      {/* Right: form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 min-h-0 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-ll-border shadow-lg overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-ll-accent via-[#FFB347] to-ll-accent-dark" />
            <div className="p-6 sm:p-8">
              <div className="flex justify-center mb-6">
                <div className="w-12 h-12 rounded-full bg-ll-accent/15 flex items-center justify-center">
                  <LockClosedIcon className="h-6 w-6 text-ll-accent" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-ll-text text-center mb-1">
                {isRegister ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-ll-text-secondary text-sm text-center mb-6">
                {isRegister ? 'Join LiveLink today' : 'Sign in to continue'}
              </p>

              {/* Toggle Sign In / Sign Up */}
              <div className="flex rounded-xl bg-ll-surface-alt p-1 mb-6">
                <button
                  type="button"
                  onClick={() => setIsRegister(false)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    !isRegister
                      ? 'bg-white text-ll-text shadow-sm'
                      : 'text-ll-text-secondary hover:text-ll-text'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    isRegister
                      ? 'bg-white text-ll-text shadow-sm'
                      : 'text-ll-text-secondary hover:text-ll-text'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {authError && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-ll-danger text-sm">
                  {authError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {isRegister && (
                  <div>
                    <label htmlFor="email" className={labelClass}>Email</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="you@example.com"
                      className={inputClass}
                    />
                    {errors.email && <p className={errorClass}>{errors.email}</p>}
                  </div>
                )}

                <div>
                  <label htmlFor="username" className={labelClass}>Username</label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={formData.username}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Your username"
                    className={inputClass}
                  />
                  {errors.username && <p className={errorClass}>{errors.username}</p>}
                </div>

                <div>
                  <label htmlFor="password" className={labelClass}>Password</label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={isRegister ? 'new-password' : 'current-password'}
                      value={formData.password}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="••••••••"
                      className={`${inputClass} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ll-text-secondary hover:text-ll-text"
                    >
                      {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && <p className={errorClass}>{errors.password}</p>}
                </div>

                {isRegister && (
                  <div>
                    <label htmlFor="confirmPassword" className={labelClass}>Confirm Password</label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="••••••••"
                      className={inputClass}
                    />
                    {errors.confirmPassword && <p className={errorClass}>{errors.confirmPassword}</p>}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-ll-accent-dark hover:bg-ll-accent text-white font-semibold transition-all disabled:opacity-60 shadow-md hover:shadow-lg"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      {isRegister ? 'Create Account' : 'Sign In'}
                      <ArrowRightIcon className="h-5 w-5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
          {/* Keep page compact to avoid scroll on signup/login */} 
        </div>
      </div>
    </div>
  );
}
