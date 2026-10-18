import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ThemeSelector } from './ThemeSelector';
import { Button } from './Button';
import { Menu, X, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

export const Navbar = () => {
  const { isAuthenticated, isTherapist, isClient, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-surface/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm shadow-subtle group-hover:scale-105 transition-transform">
              <span className="tracking-wider">U</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-text font-serif">UNFAZED</span>
              <span className="text-[10px] text-text-muted tracking-widest uppercase -mt-1 font-sans">Practice OS</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-text-muted">
            <a href="#features" className="hover:text-text transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-text transition-colors">How It Works</a>
            <a href="#benefits" className="hover:text-text transition-colors">For Therapists</a>
            <a href="#pricing" className="hover:text-text transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-text transition-colors">FAQ</a>
            {/* Direct demo profile link */}
            <Link to="/dr-sharma" className="text-primary hover:underline font-semibold flex items-center gap-1">
              Live Demo Practice
              <ArrowRight className="w-3 h-3" />
            </Link>
          </nav>

          {/* Right Action Controls: Theme Picker + Auth CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeSelector />

            {isAuthenticated ? (
              <div className="flex items-center gap-2 pl-2 border-l border-border">
                {isTherapist && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/dashboard')}
                    icon={ShieldCheck}
                  >
                    Dashboard
                  </Button>
                )}
                {isClient && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/portal')}
                    icon={UserCheck}
                  >
                    Client Portal
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={logout}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2 border-l border-border">
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
                <Button variant="primary" size="sm" onClick={() => navigate('/register')}>
                  Start Practice
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeSelector compact showModeToggle={false} />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-elevated"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-surface px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-4 duration-150">
          <div className="flex flex-col space-y-2 text-sm font-medium text-text-muted">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-surface-elevated hover:text-text"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-surface-elevated hover:text-text"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-surface-elevated hover:text-text"
            >
              Pricing
            </a>
            <Link
              to="/dr-sharma"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg bg-surface-elevated text-primary font-semibold flex items-center justify-between"
            >
              <span>View Sample Branded Link (/dr-sharma)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="pt-3 border-t border-border flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate(isTherapist ? '/dashboard' : '/portal');
                  }}
                >
                  Go to {isTherapist ? 'Dashboard' : 'Client Portal'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/login');
                  }}
                >
                  Sign In
                </Button>
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/register');
                  }}
                >
                  Start Practice Free
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
