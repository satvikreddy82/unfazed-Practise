import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';

// Lazy-loaded pages for performance (all use named exports)
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const Login = lazy(() => import('./pages/auth/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/auth/Register').then(m => ({ default: m.Register })));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const PublicProfile = lazy(() => import('./pages/PublicProfile').then(m => ({ default: m.PublicProfile })));

// Therapist Dashboard
const DashboardLayout = lazy(() => import('./pages/therapist/DashboardLayout').then(m => ({ default: m.DashboardLayout })));
const Overview = lazy(() => import('./pages/therapist/Overview').then(m => ({ default: m.Overview })));
const CalendarView = lazy(() => import('./pages/therapist/CalendarView').then(m => ({ default: m.CalendarView })));
const ClientsCRM = lazy(() => import('./pages/therapist/ClientsCRM').then(m => ({ default: m.ClientsCRM })));
const SessionNotes = lazy(() => import('./pages/therapist/SessionNotes').then(m => ({ default: m.SessionNotes })));
const PaymentsInvoices = lazy(() => import('./pages/therapist/PaymentsInvoices').then(m => ({ default: m.PaymentsInvoices })));
const Messages = lazy(() => import('./pages/therapist/Messages').then(m => ({ default: m.Messages })));
const Analytics = lazy(() => import('./pages/therapist/Analytics').then(m => ({ default: m.Analytics })));
const Packages = lazy(() => import('./pages/therapist/Packages').then(m => ({ default: m.Packages })));
const LeadsPipeline = lazy(() => import('./pages/therapist/LeadsPipeline').then(m => ({ default: m.LeadsPipeline })));
const Settings = lazy(() => import('./pages/therapist/Settings').then(m => ({ default: m.Settings })));
const SubscriptionUsage = lazy(() => import('./pages/therapist/SubscriptionUsage').then(m => ({ default: m.SubscriptionUsage })));

// Client Portal
const ClientPortal = lazy(() => import('./pages/client/ClientPortal').then(m => ({ default: m.ClientPortal })));

// Loading fallback
const AppLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-text-muted text-sm font-medium tracking-wide animate-pulse">Loading UNFAZED...</p>
    </div>
  </div>
);

// Protected route wrapper
const ProtectedRoute = ({ children, role }) => {
  const { isAuthenticated, isTherapist, isClient, isAdmin, loading } = useAuth();

  if (loading) return <AppLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Admin has supervisor access to dashboard views
  if (role === 'therapist' && !isTherapist && !isAdmin) {
    return <Navigate to="/login" replace />;
  }
  if (role === 'client' && !isClient && !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public-only route (redirect if authenticated)
const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, isTherapist, isAdmin, loading } = useAuth();
  if (loading) return <AppLoader />;
  if (isAuthenticated) {
    if (isAdmin || isTherapist) {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/portal" replace />;
  }
  return children;
};

const AppRoutes = () => (
  <Suspense fallback={<AppLoader />}>
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Therapist Dashboard Routes (nested) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute role="therapist">
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Overview />} />
        <Route path="calendar" element={<CalendarView />} />
        <Route path="clients" element={<ClientsCRM />} />
        <Route path="notes" element={<SessionNotes />} />
        <Route path="payments" element={<PaymentsInvoices />} />
        <Route path="messages" element={<Messages />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="packages" element={<Packages />} />
        <Route path="leads" element={<LeadsPipeline />} />
        <Route path="subscription" element={<SubscriptionUsage />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Client Portal (accessible via both /portal and /client-portal) */}
      <Route
        path="/portal"
        element={
          <ProtectedRoute role="client">
            <ClientPortal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client-portal"
        element={
          <ProtectedRoute role="client">
            <ClientPortal />
          </ProtectedRoute>
        }
      />

      {/* Therapist Public Profile (Dynamic slug wildcard after application paths) */}
      <Route path="/:slug" element={<PublicProfile />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <AppRoutes />
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
