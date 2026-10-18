import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ThemeSelector } from '../../components/common/ThemeSelector';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post('/api/auth/forgot-password', { email });
      setIsSubmitted(true);
    } catch (e) {
      setIsSubmitted(true);
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

      <div className="w-full max-w-md mx-auto px-4 py-8">
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-card">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text font-medium mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to login
          </Link>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-text font-serif">Reset Password</h1>
            <p className="text-xs text-text-muted mt-1.5">
              Enter your practice or client email address to receive reset instructions.
            </p>
          </div>

          {isSubmitted ? (
            <div className="p-4 rounded-xl border border-success/30 bg-success/10 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-success mx-auto" />
              <h3 className="text-sm font-semibold text-text">Instructions Dispatched</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                If an account exists for <strong>{email}</strong>, a secure password reset link has been dispatched.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setIsSubmitted(false)}
              >
                Try another email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                icon={Mail}
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                size="md"
                isLoading={isLoading}
              >
                Send Reset Link
              </Button>
            </form>
          )}
        </div>
      </div>

      <div className="p-4 text-center text-xs text-text-muted">
        © {new Date().getFullYear()} UNFAZED
      </div>
    </div>
  );
};
