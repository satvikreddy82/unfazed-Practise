import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  Calendar,
  CreditCard,
  Users,
  Clock,
  ArrowRight,
  Video,
  PlusCircle,
  Share2,
  FileText,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

export const Overview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    revenue: 0,
    completedSessions: 0,
    upcomingSessions: 0,
    activeClients: 0,
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [analyticsRes, appointmentsRes] = await Promise.all([
          axios.get('/api/analytics?range=30d'),
          axios.get('/api/scheduling/appointments?status=confirmed'),
        ]);

        if (analyticsRes.data.success) {
          const s = analyticsRes.data.data.summary;
          setStats({
            revenue: s.totalRevenue || 0,
            completedSessions: s.completedSessions || 0,
            upcomingSessions: s.upcomingSessions || 0,
            activeClients: s.activeClients || 0,
          });
        }

        if (appointmentsRes.data.success) {
          setUpcomingAppointments(appointmentsRes.data.appointments.slice(0, 5));
        }
      } catch (err) {
        console.warn('Dashboard fetch error:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton count={4} className="h-28 w-full" containerClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" />
        <LoadingSkeleton count={2} className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Welcome Banner & Quick Action Buttons */}
      <div className="clay-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text font-serif">
              Welcome, {user?.name || 'Dr. Sharma'}
            </h1>
            <Badge variant="primary" clay size="sm">PRACTICE LIVE</Badge>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Here is your practice summary for the past 30 days. You have {stats.upcomingSessions} upcoming consultations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="clay"
            size="sm"
            onClick={() => {
              const url = `${window.location.origin}/${user?.slug || 'dr-sharma'}`;
              navigator.clipboard.writeText(url);
              alert('Copied your public practice link to clipboard!');
            }}
            icon={Share2}
          >
            Share Link
          </Button>
          <Button
            variant="clay-primary"
            size="sm"
            onClick={() => navigate('/dashboard/notes')}
            icon={PlusCircle}
          >
            New Clinical Note
          </Button>
        </div>
      </div>

      {/* Metric Summary Cards (Claymorphism Inflated Stats) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="clay-stat">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">30-Day Revenue</span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary shadow-inner">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-text">₹{stats.revenue.toLocaleString('en-IN')}</div>
          <div className="flex items-center gap-1 text-[11px] text-success mt-1">
            <TrendingUp className="w-3 h-3" />
            <span>Verified practice receipts</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="clay-stat">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Upcoming Sessions</span>
            <div className="p-2 rounded-xl bg-accent/20 text-text shadow-inner">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-text">{stats.upcomingSessions}</div>
          <div className="text-[11px] text-text-muted mt-1">Confirmed on calendar</div>
        </div>

        {/* Metric 3 */}
        <div className="clay-stat">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed Sessions</span>
            <div className="p-2 rounded-xl bg-success/15 text-success shadow-inner">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-text">{stats.completedSessions}</div>
          <div className="text-[11px] text-text-muted mt-1">Past 30 days</div>
        </div>

        {/* Metric 4 */}
        <div className="clay-stat">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Caseload</span>
            <div className="p-2 rounded-xl bg-surface-elevated text-text shadow-inner">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-text">{stats.activeClients}</div>
          <div className="text-[11px] text-text-muted mt-1">Active therapy clients</div>
        </div>
      </div>

      {/* Upcoming Consultations Table */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-subtle">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-text uppercase tracking-wider">Upcoming Appointments</h3>
            <p className="text-xs text-text-muted">Direct Google Meet links and client notes</p>
          </div>
          <Link to="/dashboard/calendar" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            Open Calendar <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {upcomingAppointments.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-muted">
            No upcoming appointments scheduled for this week.
          </div>
        ) : (
          <div className="divide-y divide-border overflow-x-auto">
            {upcomingAppointments.map((appt) => (
              <div key={appt._id} className="p-4 flex items-center justify-between gap-4 hover:bg-surface-elevated/40 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-primary">
                      {new Date(appt.startDateTime).toLocaleDateString([], { month: 'short' })}
                    </span>
                    <span className="text-xs font-extrabold text-text -mt-1">
                      {new Date(appt.startDateTime).getDate()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-text truncate">{appt.clientId?.name || 'Client'}</span>
                      <Badge variant="primary" size="sm">
                        {appt.serviceName}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-text-muted mt-0.5">
                      <span>{new Date(appt.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({appt.duration}m)</span>
                      <span>•</span>
                      <span className="text-success font-medium">₹{appt.price} ({appt.paymentStatus})</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {appt.meetLink && (
                    <a
                      href={appt.meetLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Meet</span>
                    </a>
                  )}
                  <Link to="/dashboard/notes">
                    <Button variant="ghost" size="sm" icon={FileText}>
                      Write Note
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Practice Quick Links Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/dashboard/clients"
          className="p-5 rounded-xl border border-border bg-surface hover:border-primary/40 hover:shadow-subtle transition-all group"
        >
          <Users className="w-5 h-5 text-primary mb-2" />
          <h4 className="font-bold text-sm text-text group-hover:text-primary transition-colors">Client CRM & Intake</h4>
          <p className="text-xs text-text-muted mt-1">Review onboarding intake questionnaires and sign-offs.</p>
        </Link>

        <Link
          to="/dashboard/packages"
          className="p-5 rounded-xl border border-border bg-surface hover:border-primary/40 hover:shadow-subtle transition-all group"
        >
          <CreditCard className="w-5 h-5 text-accent mb-2" />
          <h4 className="font-bold text-sm text-text group-hover:text-primary transition-colors">Session Packages</h4>
          <p className="text-xs text-text-muted mt-1">Offer bundled sessions of 3, 6, or 12 consultations.</p>
        </Link>

        <Link
          to="/dashboard/settings"
          className="p-5 rounded-xl border border-border bg-surface hover:border-primary/40 hover:shadow-subtle transition-all group"
        >
          <TrendingUp className="w-5 h-5 text-success mb-2" />
          <h4 className="font-bold text-sm text-text group-hover:text-primary transition-colors">Visual Themes & Branding</h4>
          <p className="text-xs text-text-muted mt-1">Switch between 10 clinical palettes and customize your slug.</p>
        </Link>
      </div>
    </div>
  );
};
