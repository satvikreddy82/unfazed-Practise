import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Package as PackageIcon, Plus, Check, Clock, AlertCircle, Sparkles } from 'lucide-react';

export const Packages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [creatingPackage, setCreatingPackage] = useState(false);
  const [packageError, setPackageError] = useState('');

  const [form, setForm] = useState({
    name: '',
    sessionCount: 6,
    price: 11000,
    discountPercent: 15,
    validityDays: 120,
    description: '',
  });

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/payments/packages');
      if (res.data.success) {
        setPackages(res.data.packages || []);
      }
    } catch (e) {
      console.warn('Error fetching packages:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleCreatePackage = async (e) => {
    e.preventDefault();
    setCreatingPackage(true);
    setPackageError('');

    try {
      const res = await axios.post('/api/payments/packages', form);
      if (res.data.success) {
        setModalOpen(false);
        setForm({
          name: '',
          sessionCount: 6,
          price: 11000,
          discountPercent: 15,
          validityDays: 120,
          description: '',
        });
        fetchPackages();
      }
    } catch (err) {
      if (err.response?.data?.entitlementError) {
        setPackageError(err.response.data.message);
      } else {
        setPackageError(err.response?.data?.message || 'Failed to create package.');
      }
    } finally {
      setCreatingPackage(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border border-border bg-surface shadow-subtle">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text font-serif">Session Bundles & Packages</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Encourage client retention with upfront 3, 6, or 12 session bundles.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setPackageError('');
            setModalOpen(true);
          }}
          icon={Plus}
        >
          Create New Package
        </Button>
      </div>

      {/* Package Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <LoadingSkeleton count={3} className="h-48 w-full" />
        ) : packages.length === 0 ? (
          <div className="md:col-span-3 p-12 text-center text-xs text-text-muted border border-dashed border-border rounded-xl">
            No packages configured yet. Create one to allow clients to purchase bundles on your branded link.
          </div>
        ) : (
          packages.map((pkg) => (
            <div
              key={pkg._id}
              className="p-6 rounded-2xl border border-border bg-surface flex flex-col justify-between shadow-subtle hover:shadow-elevated transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="primary">{pkg.sessionCount} Sessions</Badge>
                  {pkg.discountPercent > 0 && (
                    <span className="text-[10px] font-bold text-success bg-success/15 px-2 py-0.5 rounded-full">
                      Save {pkg.discountPercent}%
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-base text-text">{pkg.name}</h3>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">{pkg.description || 'Flexible bundle for ongoing psychotherapy.'}</p>

                <div className="mt-4 pt-4 border-t border-border">
                  <div className="text-2xl font-extrabold text-text">₹{pkg.price.toLocaleString('en-IN')}</div>
                  <div className="text-[11px] text-text-muted mt-0.5">
                    ₹{Math.round(pkg.price / pkg.sessionCount)} per consultation
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-border/80 flex items-center justify-between text-xs text-text-muted">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  Valid for {pkg.validityDays} days
                </span>
                <span className="text-success font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Active
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Package Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Therapy Package"
        subtitle="Configured package will be displayed on your public profile"
      >
        <form onSubmit={handleCreatePackage} className="space-y-4 text-xs">
          {packageError && (
            <div className="p-3 rounded-lg border border-danger/30 bg-danger/10 text-danger text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{packageError}</span>
            </div>
          )}

          <Input
            label="Package Name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Cognitive Transformation Bundle (6 Sessions)"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text uppercase tracking-wider mb-1">
                Number of Sessions
              </label>
              <select
                value={form.sessionCount}
                onChange={(e) => setForm({ ...form, sessionCount: parseInt(e.target.value, 10) })}
                className="w-full p-2.5 rounded-lg border border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-focus-ring"
              >
                <option value={3}>3 Sessions (Short-term)</option>
                <option value={6}>6 Sessions (Standard Protocol)</option>
                <option value={12}>12 Sessions (Comprehensive Care)</option>
              </select>
            </div>

            <Input
              label="Package Price (INR)"
              type="number"
              required
              value={form.price}
              onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })}
              placeholder="11000"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Discount % (Optional)"
              type="number"
              value={form.discountPercent}
              onChange={(e) => setForm({ ...form, discountPercent: parseInt(e.target.value, 10) })}
              placeholder="15"
            />
            <Input
              label="Validity (Days)"
              type="number"
              value={form.validityDays}
              onChange={(e) => setForm({ ...form, validityDays: parseInt(e.target.value, 10) })}
              placeholder="120"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text uppercase tracking-wider mb-1">
              Package Description
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Highlight protocol benefits and recommended timeline..."
              className="w-full p-2.5 rounded-lg border border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-focus-ring"
            />
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={creatingPackage}>
              Save Package
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
