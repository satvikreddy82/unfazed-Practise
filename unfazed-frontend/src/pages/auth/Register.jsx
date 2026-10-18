import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ThemeSelector } from '../../components/common/ThemeSelector';
import { Shield, Lock, Mail, User, Link as LinkIcon, Sparkles, CheckCircle2 } from 'lucide-react';

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('therapist'); // 'therapist' | 'client'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    slug: '',
    title: 'Licensed Clinical Psychologist',
    phone: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'name' && !formData.slug && role === 'therapist') {
      // Auto-suggest slug from name
      const autoSlug = value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      setFormData((prev) => ({ ...prev, [name]: value, slug: autoSlug }));
    } else if (name === 'slug') {
      const cleanSlug = value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
      setFormData((prev) => ({ ...prev, slug: cleanSlug }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const payload = {
        role,
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        ...(role === 'therapist' ? { slug: formData.slug, title: formData.title } : {}),
      };

      const user = await register(payload);
      if (user.role === 'client') {
        navigate('/portal');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text flex flex-col justify-between transition-colors">
      <div className="p-4 sm:p-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">
            <span>U</span>
          </div>
          <span className="font-bold text-lg tracking-tight font-serif">UNFAZED</span>
        </Link>
        <ThemeSelector compact />
      </div>

      <div className="w-full max-w-lg mx-auto px-4 py-8">
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-card">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-text font-serif">
              {role === 'therapist' ? 'Start Your Practice' : 'Create Client Account'}
            </h1>
            <p className="text-xs text-text-muted mt-1.5">
              {role === 'therapist'
                ? 'Launch your branded link with scheduling, payments, and client records in 60 seconds.'
                : 'Access your appointments, shared notes, and invoices in one secure portal.'}
            </p>
          </div>

          {/* Role Switcher */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-surface-elevated border border-border mb-6">
            <button
              type="button"
              onClick={() => { setRole('therapist'); setError(''); }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                role === 'therapist'
                  ? 'bg-surface text-primary shadow-subtle'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Therapist Practice
            </button>
            <button
              type="button"
              onClick={() => { setRole('client'); setError(''); }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                role === 'client'
                  ? 'bg-surface text-primary shadow-subtle'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Client Portal
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg border border-danger/30 bg-danger/10 text-danger text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={role === 'therapist' ? 'Full Name & Professional Title' : 'Full Name'}
              required
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={role === 'therapist' ? 'e.g. Dr. Priya Nair' : 'e.g. Rohan Verma'}
              icon={User}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email Address"
                type="email"
                required
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={role === 'therapist' ? 'priya@mindcare.in' : 'rohan@example.com'}
                icon={Mail}
              />
              <Input
                label="Contact Number"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                required
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 8 characters"
                icon={Lock}
                helperText="Must be strong and confidential."
              />
            </div>

            {/* Unique Branded URL Slug (Therapist Only) */}
            {role === 'therapist' && (
              <div>
                <label className="block text-xs font-semibold text-text uppercase tracking-wider mb-1.5">
                  Your Practice Link Slug
                </label>
                <div className="flex rounded-lg shadow-subtle border border-border overflow-hidden bg-surface focus-within:ring-2 focus-within:ring-focus-ring focus-within:border-transparent">
                  <span className="inline-flex items-center px-3 border-r border-border bg-surface-elevated text-xs font-mono text-text-muted select-none">
                    unfazed.in/
                  </span>
                  <input
                    type="text"
                    required={role === 'therapist'}
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="dr-priya-nair"
                    className="block w-full px-3 py-2 text-sm bg-transparent text-text focus:outline-none placeholder:text-text-muted/60 font-mono font-medium"
                  />
                </div>
                <p className="mt-1 text-[11px] text-text-muted">
                  This is your shareable link for clients to book appointments and submit intake forms.
                </p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-4"
              size="md"
              isLoading={isLoading}
              icon={Sparkles}
            >
              {role === 'therapist' ? 'Create Free Practice & Branded Link' : 'Create Client Account'}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-text-muted">
            Already have a practice account?{' '}
            <Link to="/login" className="text-primary hover:underline font-semibold">
              Sign In
            </Link>
          </div>
        </div>
      </div>

      <div className="p-4 text-center text-xs text-text-muted">
        © {new Date().getFullYear()} UNFAZED — Built for Therapists in India
      </div>
    </div>
  );
};
