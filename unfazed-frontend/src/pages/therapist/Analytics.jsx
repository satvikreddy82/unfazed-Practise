import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  BarChart3,
  Calendar,
  CreditCard,
  Users,
  Clock,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Package,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Analytics = () => {
  const [range, setRange] = useState('30d');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gatedNotice, setGatedNotice] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/analytics?range=${range}`);
      if (res.data.success) {
        setAnalyticsData(res.data.data);
        setGatedNotice(res.data.isGatedNotice);
      }
    } catch (err) {
      console.warn('Error fetching analytics:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Range Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border border-border bg-surface shadow-subtle">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text font-serif">Practice Analytics & Intelligence</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Real MongoDB aggregation pipelines tracking clinical capacity, revenue, and retention.
          </p>
        </div>

        <div className="inline-flex items-center rounded-lg border border-border bg-surface-elevated p-1 shadow-subtle">
          {['7d', '30d', '90d', '1y'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                range === r
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {gatedNotice && (
        <div className="p-4 rounded-xl border border-accent/40 bg-accent/10 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent shrink-0" />
            <span className="text-text font-medium">{gatedNotice} Showing 30-day baseline data.</span>
          </div>
          <Link to="/dashboard/subscription">
            <Button variant="accent" size="sm">
              Upgrade Plan
            </Button>
          </Link>
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <LoadingSkeleton count={4} className="h-28 w-full" containerClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" />
          <LoadingSkeleton count={2} className="h-72 w-full" containerClassName="grid grid-cols-1 lg:grid-cols-2 gap-6" />
        </div>
      ) : (
        <>
          {/* Key Metric Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl border border-border bg-surface shadow-subtle">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Total Period Revenue</span>
              <div className="text-2xl font-bold text-text mt-1">₹{analyticsData?.summary?.totalRevenue?.toLocaleString('en-IN') || 0}</div>
              <p className="text-[11px] text-text-muted mt-1">Verified patient collections</p>
            </div>

            <div className="p-5 rounded-xl border border-border bg-surface shadow-subtle">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Completed Consultations</span>
              <div className="text-2xl font-bold text-text mt-1">{analyticsData?.summary?.completedSessions || 0}</div>
              <p className="text-[11px] text-text-muted mt-1">{analyticsData?.summary?.upcomingSessions || 0} currently upcoming</p>
            </div>

            <div className="p-5 rounded-xl border border-border bg-surface shadow-subtle">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Cancellation Rate</span>
              <div className="text-2xl font-bold text-text mt-1">{analyticsData?.summary?.cancellationRate || 0}%</div>
              <p className="text-[11px] text-text-muted mt-1">No-show rate: {analyticsData?.summary?.noShowRate || 0}%</p>
            </div>

            <div className="p-5 rounded-xl border border-border bg-surface shadow-subtle">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Active Caseload</span>
              <div className="text-2xl font-bold text-text mt-1">{analyticsData?.summary?.activeClients || 0}</div>
              <p className="text-[11px] text-text-muted mt-1">{analyticsData?.summary?.newClients || 0} new clients joined</p>
            </div>
          </div>

          {/* Charts Row 1: Revenue Over Time & Session Status Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Revenue Over Time */}
            <div className="p-6 rounded-2xl border border-border bg-surface shadow-subtle">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm text-text">Revenue Growth</h3>
                  <p className="text-[11px] text-text-muted">Collections trend grouped by day</p>
                </div>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>

              <div className="h-64">
                {analyticsData?.charts?.revenueOverTime?.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-text-muted">
                    No revenue data recorded for this date range.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analyticsData?.charts?.revenueOverTime}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                      <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={10} tickLine={false} />
                      <YAxis stroke="var(--color-text-muted)" fontSize={10} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--color-surface)',
                          borderColor: 'var(--color-border)',
                          borderRadius: '8px',
                          color: 'var(--color-text)',
                          fontSize: '12px',
                        }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 2: Sessions by Service Type */}
            <div className="p-6 rounded-2xl border border-border bg-surface shadow-subtle">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm text-text">Consultation Services</h3>
                  <p className="text-[11px] text-text-muted">Volume breakdown by offering</p>
                </div>
                <div className="p-2 rounded-lg bg-accent/20 text-text">
                  <Clock className="w-4 h-4" />
                </div>
              </div>

              <div className="h-64">
                {analyticsData?.charts?.sessionsByService?.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-text-muted">
                    No consultation sessions logged in this range.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData?.charts?.sessionsByService}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                      <XAxis dataKey="service" stroke="var(--color-text-muted)" fontSize={10} tickLine={false} />
                      <YAxis stroke="var(--color-text-muted)" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--color-surface)',
                          borderColor: 'var(--color-border)',
                          borderRadius: '8px',
                          color: 'var(--color-text)',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Package Utilization Metrics */}
          <div className="p-6 rounded-2xl border border-border bg-surface shadow-subtle">
            <h3 className="font-bold text-sm text-text mb-4">Client Package Utilization Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-border bg-surface-elevated/40">
                <span className="text-text-muted uppercase text-[10px] font-bold">Total Bundles Sold</span>
                <div className="text-lg font-bold text-text mt-1">{analyticsData?.packageStats?.totalPackages || 0}</div>
              </div>
              <div className="p-4 rounded-xl border border-border bg-surface-elevated/40">
                <span className="text-text-muted uppercase text-[10px] font-bold">Sessions Purchased</span>
                <div className="text-lg font-bold text-text mt-1">{analyticsData?.packageStats?.totalSessionsPurchased || 0}</div>
              </div>
              <div className="p-4 rounded-xl border border-border bg-surface-elevated/40">
                <span className="text-text-muted uppercase text-[10px] font-bold">Sessions Completed</span>
                <div className="text-lg font-bold text-success mt-1">{analyticsData?.packageStats?.totalSessionsUsed || 0}</div>
              </div>
              <div className="p-4 rounded-xl border border-border bg-surface-elevated/40">
                <span className="text-text-muted uppercase text-[10px] font-bold">Sessions Remaining</span>
                <div className="text-lg font-bold text-primary mt-1">{analyticsData?.packageStats?.totalSessionsRemaining || 0}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
