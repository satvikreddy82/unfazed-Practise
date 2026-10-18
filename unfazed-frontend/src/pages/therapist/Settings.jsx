import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { ThemePreviewCard } from '../../components/common/ThemePreviewCard';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  Palette,
  Sun,
  Moon,
  Monitor,
  User,
  Shield,
  Link as LinkIcon,
  Save,
  Check,
  AlertCircle,
  Copy,
  ExternalLink,
} from 'lucide-react';

export const Settings = () => {
  const { user, refreshUser } = useAuth();
  const { theme, setTheme, mode, setMode, themesList } = useTheme();

  const [activeTab, setActiveTab] = useState('appearance'); // 'appearance', 'practice', 'slug', 'offerings'

  // Practice Profile Form
  const [profileForm, setProfileForm] = useState({
    name: '',
    title: '',
    bio: '',
    phone: '',
    qualifications: '',
    specializations: '',
    languages: '',
    clinicName: '',
    address: '',
    city: '',
    registrationNumber: '',
    gstNumber: '',
  });

  // Slug Customization Form
  const [customSlug, setCustomSlug] = useState('');
  const [slugSuccess, setSlugSuccess] = useState('');
  const [slugError, setSlugError] = useState('');
  const [savingSlug, setSavingSlug] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setCustomSlug(user.slug || '');
      setProfileForm({
        name: user.name || '',
        title: user.title || '',
        bio: user.bio || '',
        phone: user.phone || '',
        qualifications: user.qualifications?.join(', ') || '',
        specializations: user.specializations?.join(', ') || '',
        languages: user.languages?.join(', ') || '',
        clinicName: user.practiceDetails?.clinicName || '',
        address: user.practiceDetails?.address || '',
        city: user.practiceDetails?.city || 'Delhi',
        registrationNumber: user.practiceDetails?.registrationNumber || '',
        gstNumber: user.practiceDetails?.gstNumber || '',
      });
    }
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess('');

    try {
      const payload = {
        name: profileForm.name,
        title: profileForm.title,
        bio: profileForm.bio,
        phone: profileForm.phone,
        qualifications: profileForm.qualifications.split(',').map((q) => q.trim()).filter(Boolean),
        specializations: profileForm.specializations.split(',').map((s) => s.trim()).filter(Boolean),
        languages: profileForm.languages.split(',').map((l) => l.trim()).filter(Boolean),
        practiceDetails: {
          clinicName: profileForm.clinicName,
          address: profileForm.address,
          city: profileForm.city,
          registrationNumber: profileForm.registrationNumber,
          gstNumber: profileForm.gstNumber,
        },
      };

      const res = await axios.put('/api/profile/me', payload);
      if (res.data.success) {
        setProfileSuccess('Practice profile updated successfully.');
        await refreshUser();
      }
    } catch (err) {
      alert('Failed to update profile: ' + (err.response?.data?.message || err.message));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdateSlug = async (e) => {
    e.preventDefault();
    setSavingSlug(true);
    setSlugError('');
    setSlugSuccess('');

    try {
      const res = await axios.put('/api/profile/slug', { slug: customSlug });
      if (res.data.success) {
        setSlugSuccess('Branded profile link updated successfully!');
        await refreshUser();
      }
    } catch (err) {
      setSlugError(err.response?.data?.message || 'Failed to update slug.');
    } finally {
      setSavingSlug(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl border border-border bg-surface shadow-subtle">
        <h1 className="text-xl font-bold tracking-tight text-text font-serif">Practice Settings & Themes</h1>
        <p className="text-xs text-text-muted mt-0.5">
          Personalize your complete visual theme, practice credentials, and shareable branded URL.
        </p>

        {/* Tab Selection */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border">
          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'appearance' ? 'bg-primary text-white shadow-subtle' : 'text-text-muted hover:text-text'
            }`}
          >
            Visual Themes (10 Presets)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('practice')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'practice' ? 'bg-primary text-white shadow-subtle' : 'text-text-muted hover:text-text'
            }`}
          >
            Practice Profile & Credentials
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('slug')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'slug' ? 'bg-primary text-white shadow-subtle' : 'text-text-muted hover:text-text'
            }`}
          >
            Branded Link Customizer
          </button>
        </div>
      </div>

      {/* 1. APPEARANCE & THEME TAB */}
      {activeTab === 'appearance' && (
        <div className="space-y-6">
          {/* Mode Selector */}
          <div className="p-6 rounded-2xl border border-border bg-surface shadow-subtle space-y-4">
            <div>
              <h2 className="text-sm font-bold text-text uppercase tracking-wider">Display Mode</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Every theme features separate, handcrafted light and dark mode color mappings.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setMode('light')}
                className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                  mode === 'light'
                    ? 'border-primary ring-2 ring-primary/20 bg-surface shadow-subtle font-semibold text-text'
                    : 'border-border bg-surface-elevated/40 text-text-muted hover:text-text'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sun className="w-4 h-4 text-warning" />
                  <span className="text-xs">Light Mode</span>
                </div>
                {mode === 'light' && <Check className="w-4 h-4 text-primary" />}
              </button>

              <button
                type="button"
                onClick={() => setMode('dark')}
                className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                  mode === 'dark'
                    ? 'border-primary ring-2 ring-primary/20 bg-surface shadow-subtle font-semibold text-text'
                    : 'border-border bg-surface-elevated/40 text-text-muted hover:text-text'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Moon className="w-4 h-4 text-primary" />
                  <span className="text-xs">Dark Mode</span>
                </div>
                {mode === 'dark' && <Check className="w-4 h-4 text-primary" />}
              </button>

              <button
                type="button"
                onClick={() => setMode('system')}
                className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                  mode === 'system'
                    ? 'border-primary ring-2 ring-primary/20 bg-surface shadow-subtle font-semibold text-text'
                    : 'border-border bg-surface-elevated/40 text-text-muted hover:text-text'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Monitor className="w-4 h-4 text-text-muted" />
                  <span className="text-xs">System Preference</span>
                </div>
                {mode === 'system' && <Check className="w-4 h-4 text-primary" />}
              </button>
            </div>
          </div>

          {/* Preset Theme Selection Grid */}
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-text uppercase tracking-wider">Practice Theme Presets</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Click any palette card below to apply it immediately across your dashboard, scheduling widgets, and public profile.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {themesList.map((preset) => (
                <ThemePreviewCard key={preset.id} themePreset={preset} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. PRACTICE PROFILE TAB */}
      {activeTab === 'practice' && (
        <form onSubmit={handleSaveProfile} className="p-6 rounded-2xl border border-border bg-surface shadow-subtle space-y-6">
          {profileSuccess && (
            <div className="p-3 rounded-lg border border-success/30 bg-success/10 text-success text-xs font-medium">
              {profileSuccess}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Practitioner Full Name"
              required
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
            />
            <Input
              label="Professional Title & Degrees"
              required
              value={profileForm.title}
              onChange={(e) => setProfileForm({ ...profileForm, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text uppercase tracking-wider mb-1">
              Professional Biography
            </label>
            <textarea
              rows={4}
              value={profileForm.bio}
              onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
              className="w-full p-3 rounded-lg border border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-focus-ring leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Specializations (Comma-separated)"
              value={profileForm.specializations}
              onChange={(e) => setProfileForm({ ...profileForm, specializations: e.target.value })}
              placeholder="CBT, Anxiety, Panic Disorders"
            />
            <Input
              label="Languages Spoken"
              value={profileForm.languages}
              onChange={(e) => setProfileForm({ ...profileForm, languages: e.target.value })}
              placeholder="English, Hindi, Bengali"
            />
            <Input
              label="Contact Phone"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
            />
          </div>

          <div className="pt-4 border-t border-border">
            <h3 className="text-xs font-bold text-text uppercase tracking-wider mb-4">Clinic & GST Billing Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Clinic Name"
                value={profileForm.clinicName}
                onChange={(e) => setProfileForm({ ...profileForm, clinicName: e.target.value })}
                placeholder="MindWell Psychological Practice"
              />
              <Input
                label="City & State"
                value={profileForm.city}
                onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                placeholder="New Delhi"
              />
              <Input
                label="RCI Registration Number"
                value={profileForm.registrationNumber}
                onChange={(e) => setProfileForm({ ...profileForm, registrationNumber: e.target.value })}
                placeholder="RCI-CR-2015-8941"
              />
              <Input
                label="GSTIN (Optional)"
                value={profileForm.gstNumber}
                onChange={(e) => setProfileForm({ ...profileForm, gstNumber: e.target.value })}
                placeholder="07AAAAA0000A1Z5"
                helperText="If provided, 18% GST will be displayed on invoices."
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <Button type="submit" variant="primary" isLoading={savingProfile} icon={Save}>
              Save Practice Changes
            </Button>
          </div>
        </form>
      )}

      {/* 3. BRANDED LINK SLUG TAB */}
      {activeTab === 'slug' && (
        <div className="p-6 rounded-2xl border border-border bg-surface shadow-subtle space-y-6 max-w-2xl">
          <div>
            <h2 className="text-sm font-bold text-text uppercase tracking-wider">Customize Your Practice Link</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Change the URL through which clients reach your profile.
            </p>
          </div>

          {slugSuccess && (
            <div className="p-3 rounded-lg border border-success/30 bg-success/10 text-success text-xs font-medium">
              {slugSuccess}
            </div>
          )}

          {slugError && (
            <div className="p-3 rounded-lg border border-danger/30 bg-danger/10 text-danger text-xs font-medium">
              {slugError}
            </div>
          )}

          <form onSubmit={handleUpdateSlug} className="space-y-4">
            <div className="flex rounded-lg shadow-subtle border border-border overflow-hidden bg-surface focus-within:ring-2 focus-within:ring-focus-ring">
              <span className="inline-flex items-center px-3 border-r border-border bg-surface-elevated text-xs font-mono text-text-muted">
                unfazed.in/
              </span>
              <input
                type="text"
                required
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                className="block w-full px-3 py-2 text-sm bg-transparent text-text focus:outline-none font-mono font-medium"
              />
            </div>

            <Button type="submit" variant="primary" isLoading={savingSlug} icon={Save}>
              Update Slug
            </Button>
          </form>

          <div className="p-4 rounded-xl border border-border bg-surface-elevated/40 text-xs text-text-muted space-y-2">
            <span className="font-bold text-text block">Preview Live Public Profile:</span>
            <div className="flex items-center gap-2">
              <a
                href={`/${user?.slug || 'dr-sharma'}`}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline font-mono text-xs font-semibold flex items-center gap-1"
              >
                <span>{window.location.origin}/{user?.slug || 'dr-sharma'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
