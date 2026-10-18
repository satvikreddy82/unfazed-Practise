import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { Button } from '../components/common/Button';
import { ThemeSelector } from '../components/common/ThemeSelector';
import { useTheme } from '../context/ThemeContext';
import {
  Calendar,
  ShieldCheck,
  CreditCard,
  FileText,
  MessageSquare,
  Users,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  Sparkles,
  Link as LinkIcon,
  Clock,
  Lock,
} from 'lucide-react';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { theme, setTheme, themesList } = useTheme();
  const [tiers, setTiers] = useState([]);
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [faqOpenIndex, setFaqOpenIndex] = useState(null);

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const res = await axios.get('/api/subscriptions/tiers');
        if (res.data.success) {
          setTiers(res.data.tiers);
        }
      } catch (e) {
        console.warn('Could not load tiers:', e.message);
      }
    };
    fetchTiers();
  }, []);

  const faqs = [
    {
      q: 'How does the branded link work for my practice?',
      a: 'When you register, you choose a personalized slug like unfazed.in/dr-sharma. You can share this link on your Instagram bio, WhatsApp business profile, email signature, or website. Clients open the link to view your bio, credentials, available slots, book appointments, complete intake forms, and pay upfront.',
    },
    {
      q: 'How does UNFAZED prevent double-booking?',
      a: 'Our scheduling engine evaluates your weekly schedule, date overrides, buffer times between sessions (e.g., 15 minutes), and real-time appointment overlaps on the server. Simultaneous booking attempts are checked atomically, completely eliminating accidental conflicting appointments.',
    },
    {
      q: 'Are client session notes kept confidential from clients?',
      a: 'Yes, absolutely. UNFAZED provides a multi-layer clinical privacy architecture. Private notes (including SOAP and DAP notes) are filtered at the database query level, controller level, and serialization level. Clients cannot access private notes under any circumstances, even if they manipulate request parameters.',
    },
    {
      q: 'Can I issue GST-compliant invoices for therapy sessions?',
      a: 'Yes. If your practice is GST-registered, you can input your GSTIN in Practice Settings. The platform will automatically calculate applicable CGST/SGST and generate downloadable GST-style PDF invoices for every session and package purchase.',
    },
    {
      q: 'Does UNFAZED work with Razorpay in India?',
      a: 'Yes. The platform supports Razorpay test and live modes for seamless UPI, credit/debit card, and net banking payments. In development or test mode, an integrated test transaction simulator is available so you can explore complete payment workflows safely.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-text flex flex-col transition-colors selection:bg-accent/20">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            {/* Pill Announcement */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface text-xs font-medium text-text-muted mb-8 shadow-subtle">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span>The Practice Operating System for Mental Health Professionals</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-text font-serif max-w-4xl mx-auto leading-tight">
              Manage your private therapy practice through <span className="text-primary underline decoration-accent/40 decoration-wavy">one branded link</span>.
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-base sm:text-lg text-text-muted max-w-2xl mx-auto leading-relaxed">
              Ditch the chaos of disjointed WhatsApp messages, manual calendar juggling, and scattered notes.
              UNFAZED gives Indian therapists a branded public profile with automated scheduling, upfront payments, clinical CRM, and confidential SOAP/DAP notes.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto"
                icon={Sparkles}
              >
                Create Your Practice Link
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/dr-sharma')}
                className="w-full sm:w-auto"
                icon={ArrowRight}
              >
                View Live Demo Practice (Dr. Sharma)
              </Button>
            </div>

            {/* Live Interactive Branded Link Mockup */}
            <div className="clay-card mt-14 max-w-3xl mx-auto p-4 sm:p-6 text-left">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-danger/60" />
                    <div className="w-3 h-3 rounded-full bg-warning/60" />
                    <div className="w-3 h-3 rounded-full bg-success/60" />
                  </div>
                  <div className="ml-3 px-3 py-1 rounded-md bg-surface-elevated text-xs font-mono text-text flex items-center gap-1.5 border border-border">
                    <LinkIcon className="w-3 h-3 text-text-muted" />
                    <span className="text-text-muted">unfazed.in/</span>
                    <span className="font-semibold text-primary">dr-sharma</span>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-xs text-text-muted">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>Verified Clinical Practice</span>
                </div>
              </div>

              <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-lg">
                      AS
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-text">Dr. Aarav Sharma</h3>
                      <p className="text-xs text-text-muted">Licensed Clinical Psychologist (NIMHANS)</p>
                    </div>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Evidence-based psychotherapy specializing in Cognitive Behavioral Therapy (CBT) for anxiety, depression, and executive burnout.
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-elevated border border-border text-text font-medium">Anxiety Disorders</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-elevated border border-border text-text font-medium">CBT Protocols</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-elevated border border-border text-text font-medium">English & Hindi</span>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-surface-elevated/40 p-4 flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] font-semibold uppercase text-text-muted tracking-wider">Book Consultation</div>
                    <div className="text-sm font-bold text-text mt-1">Individual Therapy Session</div>
                    <div className="text-lg font-bold text-primary mt-1">₹2,200 <span className="text-xs font-normal text-text-muted">/ 60 mins</span></div>
                  </div>
                  <Button
                    variant="accent"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => navigate('/dr-sharma')}
                  >
                    Select Slot & Book
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CORE FEATURES OVERVIEW */}
        <section id="features" className="py-20 bg-surface/50 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Complete Practice Management</h2>
              <p className="text-3xl font-bold tracking-tight text-text font-serif">
                Everything required to run a calm, private practice
              </p>
              <p className="text-sm text-text-muted mt-3">
                Built specifically around the operational realities of mental health professionals in India.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="clay-card p-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4 shadow-inner">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-text mb-2">One Branded Link</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Your distinct digital front door at unfazed.in/your-name. Showcase your clinical credentials, languages, fee schedule, and let clients schedule directly.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="clay-card p-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4 shadow-inner">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-text mb-2">Atomic Scheduling & Buffers</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Server-side slot calculation that automatically prevents double-booking, enforces 15-minute rest buffers, and converts timezones smoothly for diaspora clients.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="clay-card p-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4 shadow-inner">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-text mb-2">Razorpay & GST Invoicing</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Collect payments upfront via UPI, cards, and net banking. Automatic session packages (3, 6, 12 sessions) and downloadable GST-compliant PDF receipts.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="clay-card p-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4 shadow-inner">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-text mb-2">SOAP & DAP Clinical Notes</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Rich-text clinical documentation with standardized SOAP, DAP, and Freeform templates. Bank-grade isolation guarantees private notes remain strictly inaccessible to clients.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="clay-card p-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4 shadow-inner">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-text mb-2">Client CRM & Lead Pipeline</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Capture incoming inquiries from prospective clients, manage active client caseloads, and access clinical history and consent records in one click.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="clay-card p-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4 shadow-inner">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-text mb-2">Secure Client Portal & Chat</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Provide clients with a clean portal to view upcoming sessions, download invoices, access shared therapeutic exercises, and message within secure bounds.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="how-it-works" className="py-20 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Simple 3-Step Setup</h2>
              <p className="text-3xl font-bold tracking-tight text-text font-serif">
                From signup to your first booked session in minutes
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-xl border border-border bg-surface relative">
                <span className="text-4xl font-bold font-serif text-primary/30">01</span>
                <h3 className="text-base font-bold text-text mt-2 mb-1">Set Your Schedule & Fee</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Configure your weekly consultation windows, buffer minutes, and session offerings (30, 45, 60, or 90 minutes).
                </p>
              </div>

              <div className="p-6 rounded-xl border border-border bg-surface relative">
                <span className="text-4xl font-bold font-serif text-primary/30">02</span>
                <h3 className="text-base font-bold text-text mt-2 mb-1">Share Your Branded Link</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Share unfazed.in/your-name on WhatsApp, social media, or website. Clients pick an available slot, sign consent, and pay.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-border bg-surface relative">
                <span className="text-4xl font-bold font-serif text-primary/30">03</span>
                <h3 className="text-base font-bold text-text mt-2 mb-1">Focus on Clinical Care</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Conduct sessions with automated Google Meet links, write SOAP notes with ease, and track practice revenue without friction.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PRACTICE BENEFITS SECTION */}
        <section id="benefits" className="py-20 bg-surface/40 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Designed for Indian Mental Health Practices</h2>
                <h3 className="text-3xl font-bold tracking-tight text-text font-serif leading-snug">
                  Built for therapists who want boundaries, professionalism, and peace of mind.
                </h3>
                <div className="mt-8 space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-text">Eliminate Awkward Fee Conversations</h4>
                      <p className="text-xs text-text-muted mt-0.5">Payment is confirmed upfront before the session is placed on your calendar. No more chasing transfers.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-text">Protect Your Clinical Boundaries</h4>
                      <p className="text-xs text-text-muted mt-0.5">Move client scheduling and intake out of your personal WhatsApp into a professional, structured clinical system.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-text">Informed Consent Audits</h4>
                      <p className="text-xs text-text-muted mt-0.5">Timestamped, versioned consent records captured before sessions to keep your practice compliant.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Theme Showcase in Context */}
              <div className="p-6 rounded-2xl border border-border bg-surface shadow-card">
                <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-text">Visual Branding Customizer</div>
                  <ThemeSelector compact />
                </div>
                <p className="text-xs text-text-muted mb-4">
                  Pick from 10 curated clinical themes. Every palette transforms the entire interface, from dashboard to client booking page.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {themesList.slice(0, 6).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTheme(t.id)}
                      className={`p-2 rounded-lg border text-left text-xs transition-all ${
                        theme === t.id ? 'border-primary ring-1 ring-primary bg-surface-elevated font-semibold' : 'border-border hover:bg-surface-elevated/40'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.primary }} />
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.accent }} />
                      </div>
                      <span className="text-[11px] truncate block text-text">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING PLANS SECTION (LOADED DYNAMICALLY FROM BACKEND CONFIG) */}
        <section id="pricing" className="py-20 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Transparent Practice Plans</h2>
              <p className="text-3xl font-bold tracking-tight text-text font-serif">
                Select the tier that matches your caseload
              </p>
              <p className="text-sm text-text-muted mt-3">
                All plans include your branded link, client portal, and payment automation.
              </p>

              {/* Billing Cycle Toggle */}
              <div className="mt-6 inline-flex items-center rounded-lg border border-border bg-surface p-1 shadow-subtle">
                <button
                  type="button"
                  onClick={() => setBillingPeriod('monthly')}
                  className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    billingPeriod === 'monthly' ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text'
                  }`}
                >
                  Monthly Billing
                </button>
                <button
                  type="button"
                  onClick={() => setBillingPeriod('yearly')}
                  className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    billingPeriod === 'yearly' ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text'
                  }`}
                >
                  Yearly (Save 15%)
                </button>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {tiers.map((tier) => {
                const isPro = tier.tierKey === 'pro';
                const price = billingPeriod === 'yearly' ? Math.round(tier.priceYearly / 12) : tier.priceMonthly;

                return (
                  <div
                    key={tier.tierKey}
                    className={`rounded-2xl border p-6 flex flex-col justify-between transition-all ${
                      isPro
                        ? 'border-primary ring-2 ring-primary/20 bg-surface shadow-card relative'
                        : 'border-border bg-surface shadow-subtle hover:shadow-elevated'
                    }`}
                  >
                    {isPro && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                        Most Popular
                      </span>
                    )}

                    <div>
                      <h3 className="text-lg font-bold text-text">{tier.name}</h3>
                      <p className="text-xs text-text-muted mt-1 min-h-[36px]">{tier.description}</p>

                      <div className="mt-6 mb-6">
                        <span className="text-3xl font-extrabold text-text">₹{price.toLocaleString('en-IN')}</span>
                        <span className="text-xs text-text-muted font-normal"> / month</span>
                        {billingPeriod === 'yearly' && (
                          <p className="text-[11px] text-primary mt-1 font-medium">Billed annually (₹{tier.priceYearly.toLocaleString('en-IN')}/yr)</p>
                        )}
                      </div>

                      <div className="space-y-3 pt-4 border-t border-border text-xs text-text">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                          <span>
                            {tier.activeClientLimit === -1 ? 'Unlimited' : `${tier.activeClientLimit}`} active clients
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                          <span>Branded Practice Link (unfazed.in/slug)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                          <span>Double-booking prevention & buffer times</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                          <span>
                            Templates: {tier.allowedNoteTemplates.map((t) => t.toUpperCase()).join(', ')} notes
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                          <span>Analytics: {tier.analyticsAccessLevel === 'advanced' ? 'Advanced historical trends' : 'Basic overview'}</span>
                        </div>
                        {tier.enabledFeatures.includes('packages') && (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                            <span>Multi-session bundles (3, 6, 12 sessions)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-8">
                      <Button
                        variant={isPro ? 'primary' : 'outline'}
                        className="w-full"
                        onClick={() => navigate('/register')}
                      >
                        Start 14-Day Free Trial
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ ACCORDION SECTION */}
        <section id="faq" className="py-20 border-b border-border bg-surface/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Frequently Asked Questions</h2>
              <p className="text-3xl font-bold tracking-tight text-text font-serif">
                Everything you need to know
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = faqOpenIndex === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-border bg-surface overflow-hidden transition-colors shadow-subtle"
                  >
                    <button
                      type="button"
                      onClick={() => setFaqOpenIndex(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-4 text-left text-sm font-semibold text-text hover:bg-surface-elevated/40"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-text-muted transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-primary' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 text-xs text-text-muted leading-relaxed border-t border-border/60 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
