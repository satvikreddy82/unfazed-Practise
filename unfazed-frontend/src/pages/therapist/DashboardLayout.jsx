import React, { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ThemeSelector } from '../../components/common/ThemeSelector';
import { NotificationBell } from '../../components/common/NotificationBell';
import { Button } from '../../components/common/Button';
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCheck,
  FileText,
  Package,
  CreditCard,
  MessageSquare,
  BarChart3,
  Sparkles,
  ExternalLink,
  Settings,
  LogOut,
  Menu,
  X,
  Copy,
  Check,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard, end: true },
    { name: 'Calendar', path: '/dashboard/calendar', icon: Calendar },
    { name: 'Clients CRM', path: '/dashboard/clients', icon: Users },
    { name: 'Leads Pipeline', path: '/dashboard/leads', icon: UserCheck },
    { name: 'Session Notes', path: '/dashboard/notes', icon: FileText },
    { name: 'Packages', path: '/dashboard/packages', icon: Package },
    { name: 'Payments & GST', path: '/dashboard/payments', icon: CreditCard },
    { name: 'Messages & Chat', path: '/dashboard/messages', icon: MessageSquare },
    { name: 'Practice Analytics', path: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Subscription & Usage', path: '/dashboard/subscription', icon: Sparkles },
    { name: 'Settings & Appearance', path: '/dashboard/settings', icon: Settings },
  ];

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}/${user?.slug || 'dr-sharma'}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-text flex transition-colors selection:bg-accent/20">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-sidebar text-sidebar-text shrink-0 select-none">
        {/* Brand */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-white/10">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-black font-bold text-xs shadow-sm">
              U
            </div>
            <div>
              <span className="font-bold text-base tracking-tight font-serif text-white">UNFAZED</span>
              <span className="text-[10px] block text-sidebar-text/70 uppercase tracking-widest font-sans -mt-1">Practice</span>
            </div>
          </Link>
        </div>

        {/* Branded Link Callout */}
        <div className="px-4 py-3 border-b border-white/10 bg-white/5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-text/70 mb-1">
            Your Branded Profile
          </div>
          <div className="flex items-center justify-between gap-1 p-1.5 rounded-lg bg-black/20 border border-white/10 text-xs">
            <span className="truncate font-mono text-[11px] text-white">
              /{user?.slug || 'dr-sharma'}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleCopyLink}
                title="Copy shareable link"
                className="p-1 rounded hover:bg-white/10 text-sidebar-text/80 hover:text-white transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a
                href={`/${user?.slug || 'dr-sharma'}`}
                target="_blank"
                rel="noreferrer"
                title="Open public profile in new tab"
                className="p-1 rounded hover:bg-white/10 text-sidebar-text/80 hover:text-white transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-sidebar-active text-white font-semibold shadow-sm'
                      : 'text-sidebar-text/80 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Profile & Logout */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent font-bold text-xs shrink-0">
                {user?.name ? user.name[0] : 'T'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'Therapist'}</p>
                <p className="text-[10px] text-sidebar-text/60 truncate capitalize">
                  {user?.subscriptionTier || 'pro'} Tier
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-sidebar-text/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE DRAWER */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-72 bg-sidebar text-sidebar-text flex flex-col shadow-xl z-50 animate-in slide-in-from-left duration-200">
            <div className="h-16 px-6 flex items-center justify-between border-b border-white/10">
              <span className="font-bold text-lg font-serif text-white">UNFAZED</span>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1.5 text-sidebar-text/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium ${
                        isActive ? 'bg-sidebar-active text-white font-semibold' : 'text-sidebar-text/80 hover:bg-white/10'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>
            <div className="p-4 border-t border-white/10">
              <Button variant="ghost" className="w-full text-white justify-start" onClick={logout} icon={LogOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-border bg-surface/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20 transition-colors">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-elevated"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span className="font-semibold text-text hidden sm:inline">{user?.name || 'Dr. Sharma'}</span>
              <span className="hidden sm:inline">•</span>
              <span className="capitalize">{location.pathname.replace('/dashboard', '').replace('/', '') || 'Overview'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeSelector />
            <NotificationBell />
            <a
              href={`/${user?.slug || 'dr-sharma'}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-xs font-medium text-primary shadow-subtle transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Profile</span>
            </a>
          </div>
        </header>

        {/* Dashboard Dynamic View */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
