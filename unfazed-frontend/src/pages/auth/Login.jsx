import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ThemeSelector } from '../../components/common/ThemeSelector';
import { Shield, Lock, Mail, ArrowRight, UserCheck, KeyRound } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [roleHint, setRoleHint] = useState('therapist'); // 'therapist' | 'client' | 'admin'
  const [email, setEmail] = useState('dr.sharma@unfazed.in');
  const [password, setPassword] = useState('Therapist123!');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle switching roles and pre-filling synthetic seed credentials for convenient testing
  const handleRoleSelect = (role) => {
    setRoleHint(role);
    setError('');
    if (role === 'therapist') {
      setEmail('dr.sharma@unfazed.in');
      setPassword('Therapist123!');
    } else if (role === 'client') {
      setEmail('rohan.verma@example.com');
      setPassword('Client123!');
    } else if (role === 'admin') {
      setEmail('admin@unfazed.in');
      setPassword('AdminUnfazed2026!');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const user = await login(email, password, roleHint);
      if (user.role === 'therapist') {
        navigate('/dashboard');
      } else if (user.role === 'client') {
        navigate('/portal');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text flex flex-col justify-between transition-colors">
      {/* Top Bar with brand and theme selector */}
      <div className="p-4 sm:p-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">
            <span>U</span>
          </div>
          <span className="font-bold text-lg tracking-tight font-serif">UNFAZED</span>
        </Link>
        <ThemeSelector compact />
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md mx-auto px-4 py-8">
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-card">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-text font-serif">Welcome back</h1>
            <p className="text-xs text-text-muted mt-1.5">Sign in to your practice or client portal</p>
          </div>

          {/* Role Context Switcher */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-surface-elevated border border-border mb-6">
            <button
              type="button"
              onClick={() => handleRoleSelect('therapist')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                roleHint === 'therapist'
                  ? 'bg-surface text-primary shadow-subtle'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Therapist
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('client')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                roleHint === 'client'
                  ? 'bg-surface text-primary shadow-subtle'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Client
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('admin')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                roleHint === 'admin'
                  ? 'bg-surface text-primary shadow-subtle'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Admin
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg border border-danger/30 bg-danger/10 text-danger text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@practice.com"
              icon={Mail}
              autoComplete="email"
            />

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-text uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                icon={Lock}
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              size="md"
              isLoading={isLoading}
              icon={ArrowRight}
            >
              Sign In to {roleHint === 'therapist' ? 'Practice' : roleHint === 'client' ? 'Portal' : 'Admin'}
            </Button>
          </form>

          {/* Quick Demo Pre-Fill Hint */}
          <div className="mt-6 p-3 rounded-xl border border-border/80 bg-surface-elevated/40 text-[11px] text-text-muted space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-text">
              <KeyRound className="w-3.5 h-3.5 text-accent" />
              <span>Development Seed Account:</span>
            </div>
            <p>
              Pre-filled with synthetic credentials for <strong>{email}</strong>. Click "Sign In" to explore immediately.
            </p>
          </div>

          <div className="mt-6 text-center text-xs text-text-muted">
            Don't have a practice account?{' '}
            <Link to="/register" className="text-primary hover:underline font-semibold">
              Create your branded link
            </Link>
          </div>
        </div>
      </div>

      <div className="p-4 text-center text-xs text-text-muted">
        © {new Date().getFullYear()} UNFAZED — Practice Management Platform
      </div>
    </div>
  );
};
