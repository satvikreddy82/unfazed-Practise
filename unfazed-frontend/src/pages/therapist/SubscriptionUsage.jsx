import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Sparkles, CheckCircle2, ShieldCheck, ArrowRight, Zap, Check } from 'lucide-react';

export const SubscriptionUsage = () => {
  const { user, refreshUser } = useAuth();

  const [usage, setUsage] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgradingKey, setUpgradingKey] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subRes, tiersRes] = await Promise.all([
        axios.get('/api/subscriptions/current'),
        axios.get('/api/subscriptions/tiers'),
      ]);

      if (subRes.data.success) {
        setUsage(subRes.data.usage);
        setSubscription(subRes.data.subscription);
      }
      if (tiersRes.data.success) {
        setTiers(tiersRes.data.tiers);
      }
    } catch (e) {
      console.warn('Error fetching subscription:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpgrade = async (tierKey) => {
    setUpgradingKey(tierKey);
    try {
      const res = await axios.post('/api/subscriptions/change-tier', { tierKey });
      if (res.data.success) {
        alert(res.data.message);
        await refreshUser();
        fetchData();
      }
    } catch (err) {
      alert('Upgrade failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpgradingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton count={3} className="h-28 w-full" />
      </div>
    );
  }

  const currentTierKey = usage?.tierKey || user?.subscriptionTier || 'starter';

  return (
    <div className="space-y-8">
      {/* Current Subscription Card */}
      <div className="p-6 sm:p-8 rounded-2xl border border-border bg-surface shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Active Plan</span>
              <Badge variant="primary">{usage?.tierName || 'Starter Practice'}</Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text font-serif mt-1">
              Practice Subscription & Usage Caps
            </h1>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-text-muted">Subscription Status</span>
            <div className="text-sm font-bold text-success capitalize">{subscription?.status || 'Active'}</div>
          </div>
        </div>

        {/* Caseload Utilization Meter */}
        <div className="p-5 rounded-xl border border-border bg-surface-elevated/40 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-text">Active Client Caseload Capacity</span>
            <span className="font-bold text-text">
              {usage?.activeClients} of {usage?.activeClientLimit === -1 ? 'Unlimited' : usage?.activeClientLimit} clients ({usage?.clientUsagePercentage || 0}%)
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-border overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                (usage?.clientUsagePercentage || 0) > 85 ? 'bg-danger' : 'bg-primary'
              }`}
              style={{ width: `${Math.min(usage?.clientUsagePercentage || 0, 100)}%` }}
            />
          </div>

          <p className="text-[11px] text-text-muted">
            {usage?.activeClientLimit === -1
              ? 'Your practice enjoys unlimited client capacity.'
              : `Your current tier permits up to ${usage?.activeClientLimit} simultaneous active clients. Upgrade to unlock higher limits.`}
          </p>
        </div>

        {/* Current Entitlements Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-border bg-surface">
            <span className="font-bold text-text uppercase text-[10px] tracking-wider block mb-1">Clinical Templates</span>
            <p className="text-text-muted capitalize">{usage?.allowedNoteTemplates?.join(', ')} Notes</p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-surface">
            <span className="font-bold text-text uppercase text-[10px] tracking-wider block mb-1">Practice Analytics</span>
            <p className="text-text-muted capitalize">{usage?.analyticsAccessLevel} Intelligence</p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-surface">
            <span className="font-bold text-text uppercase text-[10px] tracking-wider block mb-1">Session Bundles</span>
            <p className="text-text-muted">
              {usage?.enabledFeatures?.includes('packages') ? 'Enabled (3, 6, 12 sessions)' : 'Upgrade to Pro'}
            </p>
          </div>
        </div>
      </div>

      {/* Available Tiers Comparison */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-text font-serif">Change Practice Tier</h2>
          <p className="text-xs text-text-muted">Instantly scale your active client limit and clinical tooling.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((t) => {
            const isCurrent = t.tierKey === currentTierKey;
            return (
              <div
                key={t.tierKey}
                className={`rounded-2xl border p-6 flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'border-primary ring-2 ring-primary/20 bg-surface shadow-card'
                    : 'border-border bg-surface hover:shadow-subtle'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-base text-text">{t.name}</h3>
                    {isCurrent && <Badge variant="primary">Current Plan</Badge>}
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed min-h-[36px]">{t.description}</p>

                  <div className="mt-4 mb-6">
                    <span className="text-2xl font-extrabold text-text">₹{t.priceMonthly.toLocaleString('en-IN')}</span>
                    <span className="text-xs text-text-muted font-normal"> / month</span>
                  </div>

                  <div className="space-y-2.5 pt-4 border-t border-border text-xs text-text">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      <span>{t.activeClientLimit === -1 ? 'Unlimited' : t.activeClientLimit} active clients</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      <span>{t.allowedNoteTemplates.map((n) => n.toUpperCase()).join(', ')} clinical notes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      <span>{t.analyticsAccessLevel === 'advanced' ? 'Advanced Analytics' : 'Basic Analytics'}</span>
                    </div>
                    {t.enabledFeatures.includes('packages') && (
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary shrink-0" />
                        <span>Multi-session packages</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border">
                  <Button
                    variant={isCurrent ? 'outline' : 'primary'}
                    className="w-full"
                    disabled={isCurrent}
                    isLoading={upgradingKey === t.tierKey}
                    onClick={() => handleUpgrade(t.tierKey)}
                  >
                    {isCurrent ? 'Current Tier' : `Switch to ${t.name}`}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
