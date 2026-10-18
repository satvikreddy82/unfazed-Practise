import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ThemeSelector } from '../components/common/ThemeSelector';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import {
  ShieldCheck,
  Calendar,
  Clock,
  Globe,
  MapPin,
  CheckCircle2,
  CreditCard,
  FileCheck,
  Send,
  ArrowRight,
  AlertCircle,
  Video,
  Check,
  ChevronRight,
} from 'lucide-react';

export const PublicProfile = () => {
  const { slug } = useParams();

  const [therapist, setTherapist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Booking Flow States
  const [selectedOffering, setSelectedOffering] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    // Default to tomorrow's date YYYY-MM-DD
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return tomorrow.toISOString().split('T')[0];
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [timezone, setTimezone] = useState('Asia/Kolkata');

  // Client Details & Consent Form
  const [clientDetails, setClientDetails] = useState({
    name: '',
    email: '',
    phone: '',
    presentingConcern: '',
    consentAgreed: false,
    clientNotes: '',
  });

  // Booking execution state
  const [bookingStep, setBookingStep] = useState(1); // 1: Select Service, 2: Select Slot, 3: Details & Consent, 4: Payment, 5: Confirmed
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Public Lead Inquiry state
  const [leadForm, setLeadForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);

  // 1. Fetch public profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/profile/${slug}`);
        if (res.data.success) {
          setTherapist(res.data.therapist);
          if (res.data.therapist.sessionOfferings?.length > 0) {
            setSelectedOffering(res.data.therapist.sessionOfferings[0]);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Therapist profile not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [slug]);

  // 2. Fetch slots when date or duration changes
  useEffect(() => {
    if (!therapist || !selectedOffering || !selectedDate) return;

    const fetchSlots = async () => {
      try {
        setLoadingSlots(true);
        setSelectedSlot(null);
        const res = await axios.get(
          `/api/scheduling/public/${slug}/slots?date=${selectedDate}&duration=${selectedOffering.duration}&timezone=${timezone}`
        );
        if (res.data.success) {
          setAvailableSlots(res.data.slots || []);
        }
      } catch (err) {
        console.warn('Slot calculation error:', err.message);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [slug, therapist, selectedOffering, selectedDate, timezone]);

  // Handle Booking & Payment Execution
  const handleConfirmAndPay = async () => {
    if (!clientDetails.consentAgreed) {
      setBookingError('You must agree to the informed consent to book a session.');
      return;
    }

    setIsSubmitting(true);
    setBookingError('');

    try {
      // 1. Create order on backend
      const orderRes = await axios.post('/api/payments/order', {
        therapistId: therapist.id,
        clientId: null,
        itemType: 'session',
        amount: selectedOffering.price,
        itemDescription: `${selectedOffering.title} (${selectedOffering.duration} mins)`,
      });

      const orderData = orderRes.data;

      // 2. Complete payment verification via test simulator / Razorpay
      const verifyRes = await axios.post('/api/payments/verify', {
        paymentId: orderData.paymentId,
        razorpayOrderId: orderData.orderId,
        razorpayPaymentId: `sim_pay_${Date.now()}`,
        razorpaySignature: 'simulated_signature_verified',
        isSimulated: true,
      });

      // 3. Complete atomic appointment booking on backend
      const bookRes = await axios.post('/api/scheduling/book', {
        slug,
        serviceName: selectedOffering.title,
        duration: selectedOffering.duration,
        startDateTime: selectedSlot.startDateTime,
        clientName: clientDetails.name,
        clientEmail: clientDetails.email,
        clientPhone: clientDetails.phone,
        clientNotes: `${clientDetails.presentingConcern}. ${clientDetails.clientNotes || ''}`,
        clientTimezone: timezone,
        paymentMethod: 'razorpay_simulated',
      });

      if (bookRes.data.success) {
        setConfirmedBooking({
          appointment: bookRes.data.appointment,
          payment: verifyRes.data.payment,
          client: bookRes.data.client,
        });
        setBookingStep(5); // Confirmed screen
      }
    } catch (err) {
      if (err.response?.status === 409) {
        setBookingError('This slot was just booked by another client. Please select another slot.');
        setBookingStep(2); // Send back to slot picker
      } else {
        setBookingError(err.response?.data?.message || 'Payment or booking failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Contact Inquiry
  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    setLeadSubmitting(true);
    try {
      await axios.post(`/api/crm/leads/public/${slug}`, {
        ...leadForm,
        preferredService: selectedOffering?.title || '',
      });
      setLeadSuccess(true);
      setLeadForm({ name: '', email: '', phone: '', message: '' });
    } catch (e) {
      alert('Failed to send inquiry. Please try again.');
    } finally {
      setLeadSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6">
        <LoadingSkeleton count={4} className="h-20 w-80 max-w-full mb-4" />
      </div>
    );
  }

  if (error || !therapist) {
    return (
      <div className="min-h-screen bg-background text-text flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-danger mb-3" />
        <h2 className="text-xl font-bold font-serif">Therapist Profile Not Found</h2>
        <p className="text-xs text-text-muted mt-1 max-w-sm">
          {error || 'The requested practitioner URL does not exist or has been modified.'}
        </p>
        <Link to="/" className="mt-6">
          <Button variant="outline" size="sm">
            Back to UNFAZED
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text flex flex-col transition-colors selection:bg-accent/20">
      {/* Top Practice Navigation Bar */}
      <header className="border-b border-border bg-surface/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center text-white font-bold text-[11px]">
                U
              </div>
              <span className="text-xs font-serif font-bold text-text-muted group-hover:text-text hidden sm:inline">
                UNFAZED Practice Link
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <ThemeSelector compact />
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Client Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Profile & Booking Flow */}
      <main className="max-w-6xl mx-auto px-4 py-10 flex-1 w-full space-y-10">
        {/* Practice Hero Card */}
        <div className="clay-card p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-border">
            {therapist.profileImage ? (
              <img
                src={therapist.profileImage}
                alt={therapist.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-primary/20 shadow-elevated"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-2xl font-bold font-serif shadow-elevated">
                {therapist.name.split(' ').map((n) => n[0]).join('')}
              </div>
            )}

            <div className="space-y-1 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-text font-serif">{therapist.name}</h1>
                <Badge variant="primary" clay size="sm" className="gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Practice
                </Badge>
              </div>

              <p className="text-xs sm:text-sm text-text-muted font-medium">{therapist.title}</p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  {therapist.practiceDetails?.city || 'Delhi'}, India
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-accent" />
                  {therapist.languages?.join(', ') || 'English, Hindi'}
                </span>
                {therapist.practiceDetails?.clinicName && (
                  <span className="font-medium text-text">
                    • {therapist.practiceDetails.clinicName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* About & Credentials */}
          <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">About the Practitioner</h3>
                <p className="text-xs sm:text-sm text-text-muted leading-relaxed whitespace-pre-line">
                  {therapist.bio || 'Experienced clinical psychologist committed to evidence-based psychotherapy and compassionate mental health care.'}
                </p>
              </div>

              {therapist.specializations?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Specializations & Clinical Focus</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {therapist.specializations.map((spec, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-lg bg-surface-elevated border border-border text-text font-medium"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {therapist.qualifications?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Qualifications & Certifications</h4>
                  <ul className="space-y-1 text-xs text-text-muted">
                    {therapist.qualifications.map((q, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Quick Practice Highlights */}
            <div className="rounded-xl border border-border bg-surface-elevated/40 p-5 space-y-4 text-xs">
              <h4 className="font-bold text-text uppercase tracking-wider text-[11px]">Practice Standards</h4>
              <div className="space-y-2.5 text-text-muted">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-primary shrink-0" />
                  <span>Secure 1-on-1 Google Meet Telehealth</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-success shrink-0" />
                  <span>UPI, Cards, Netbanking (Razorpay)</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-accent shrink-0" />
                  <span>GST-compliant invoice for reimbursement</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOOKING WORKFLOW CONTAINER */}
        <div id="booking-section" className="clay-card p-6 sm:p-8">
          <div className="border-b border-border pb-4 mb-6 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-bold text-text font-serif">Book an Appointment</h2>
              <p className="text-xs text-text-muted">Select your service, choose an open slot, and confirm securely.</p>
            </div>

            {/* Step Indicators */}
            {bookingStep < 5 && (
              <div className="flex items-center gap-1 text-xs font-semibold text-text-muted">
                <span className={bookingStep >= 1 ? 'text-primary font-bold' : ''}>1. Service</span>
                <ChevronRight className="w-3 h-3 text-border" />
                <span className={bookingStep >= 2 ? 'text-primary font-bold' : ''}>2. Slot</span>
                <ChevronRight className="w-3 h-3 text-border" />
                <span className={bookingStep >= 3 ? 'text-primary font-bold' : ''}>3. Consent</span>
                <ChevronRight className="w-3 h-3 text-border" />
                <span className={bookingStep >= 4 ? 'text-primary font-bold' : ''}>4. Payment</span>
              </div>
            )}
          </div>

          {bookingError && (
            <div className="mb-6 p-4 rounded-xl border border-danger/30 bg-danger/10 text-danger text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{bookingError}</span>
            </div>
          )}

          {/* STEP 1: SELECT SERVICE OFFERING */}
          {bookingStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">Select Consultation Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {therapist.sessionOfferings?.map((offering) => {
                  const isSelected = selectedOffering?._id === offering._id;
                  return (
                    <div
                      key={offering._id}
                      onClick={() => setSelectedOffering(offering)}
                      role="button"
                      tabIndex={0}
                      className={`p-5 rounded-xl border transition-all text-left cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20 bg-surface shadow-elevated'
                          : 'border-border bg-surface hover:border-text-muted/40 hover:bg-surface-elevated/40'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-sm text-text">{offering.title}</h4>
                          <span className="text-sm font-bold text-primary">₹{offering.price}</span>
                        </div>
                        <p className="text-xs text-text-muted leading-relaxed line-clamp-2">{offering.description}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border/80 flex items-center justify-between text-xs text-text-muted">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          {offering.duration} minutes
                        </span>
                        {isSelected && <span className="font-semibold text-primary">Selected</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  variant="primary"
                  onClick={() => setBookingStep(2)}
                  disabled={!selectedOffering}
                  icon={ArrowRight}
                >
                  Continue to Select Slot
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: SELECT DATE & APPOINTMENT SLOT */}
          {bookingStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">Pick Consultation Date</h3>
                  <p className="text-xs text-text mt-0.5">
                    Selected: <strong>{selectedOffering?.title}</strong> (₹{selectedOffering?.price} • {selectedOffering?.duration}m)
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Date Input */}
                  <input
                    type="date"
                    value={selectedDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-border bg-surface text-text text-xs font-medium focus:outline-none focus:ring-2 focus:ring-focus-ring"
                  />

                  {/* Timezone Selector */}
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-border bg-surface text-text text-xs font-medium focus:outline-none focus:ring-2 focus:ring-focus-ring"
                  >
                    <option value="Asia/Kolkata">IST (India • +05:30)</option>
                    <option value="America/New_York">EST (New York • -04:00)</option>
                    <option value="Europe/London">BST (London • +01:00)</option>
                    <option value="Asia/Dubai">GST (Dubai • +04:00)</option>
                    <option value="Australia/Sydney">AEST (Sydney • +10:00)</option>
                  </select>
                </div>
              </div>

              {/* Slot Grid */}
              <div>
                <h4 className="text-xs font-semibold text-text-muted mb-3">
                  Available Slots for {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}:
                </h4>

                {loadingSlots ? (
                  <LoadingSkeleton count={3} className="h-10 w-full" />
                ) : availableSlots.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-border rounded-xl text-xs text-text-muted">
                    No open consultation slots available on this date. Please select another date above.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                    {availableSlots.map((slot, idx) => {
                      const isSelected = selectedSlot?.startDateTime === slot.startDateTime;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all text-center ${
                            isSelected
                              ? 'bg-primary text-white border-primary shadow-subtle'
                              : 'border-border bg-surface hover:bg-surface-elevated text-text'
                          }`}
                        >
                          {slot.formattedTime}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-border">
                <Button variant="ghost" size="sm" onClick={() => setBookingStep(1)}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setBookingStep(3)}
                  disabled={!selectedSlot}
                  icon={ArrowRight}
                >
                  Continue to Intake & Consent
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: CLIENT DETAILS, INTAKE & MANDATORY INFORMED CONSENT */}
          {bookingStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1">Client Information & Intake</h3>
                <p className="text-xs text-text-muted">
                  Booking for: <strong>{new Date(selectedSlot?.startDateTime).toLocaleString('en-IN')}</strong> ({selectedOffering?.title})
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Your Full Name"
                  required
                  value={clientDetails.name}
                  onChange={(e) => setClientDetails({ ...clientDetails, name: e.target.value })}
                  placeholder="e.g. Rohan Verma"
                />
                <Input
                  label="Your Email Address"
                  type="email"
                  required
                  value={clientDetails.email}
                  onChange={(e) => setClientDetails({ ...clientDetails, email: e.target.value })}
                  placeholder="rohan.verma@example.com"
                  helperText="Session confirmation and Google Meet link will be sent here."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Phone / WhatsApp"
                  type="tel"
                  required
                  value={clientDetails.phone}
                  onChange={(e) => setClientDetails({ ...clientDetails, phone: e.target.value })}
                  placeholder="+91 98111 22233"
                />
                <Input
                  label="Primary Presenting Concern"
                  required
                  value={clientDetails.presentingConcern}
                  onChange={(e) => setClientDetails({ ...clientDetails, presentingConcern: e.target.value })}
                  placeholder="e.g. Work anxiety, panic attacks, depression..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text uppercase tracking-wider mb-1">
                  Additional Notes for the Therapist (Optional)
                </label>
                <textarea
                  rows={2}
                  value={clientDetails.clientNotes}
                  onChange={(e) => setClientDetails({ ...clientDetails, clientNotes: e.target.value })}
                  placeholder="Any specific background or preferences for this consultation..."
                  className="block w-full rounded-lg border border-border bg-surface text-text text-sm p-3 focus:outline-none focus:ring-2 focus:ring-focus-ring"
                />
              </div>

              {/* MANDATORY INFORMED CONSENT AGREEMENT */}
              <div className="p-4 rounded-xl border border-border bg-surface-elevated/40 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text">Informed Consent & Practice Policy</h4>
                <div className="max-h-24 overflow-y-auto p-3 rounded-lg bg-surface border border-border text-[11px] text-text-muted leading-relaxed">
                  1. <strong>Confidentiality:</strong> Information shared during psychotherapy is strictly confidential and protected by mental health ethics, except where required by Indian law (risk of imminent self-harm or harm to others).<br />
                  2. <strong>Cancellation & Rescheduling:</strong> Notice of at least 24 hours is required to reschedule without forfeiture of session fee.<br />
                  3. <strong>Emergency Protocol:</strong> Telehealth sessions are not suited for acute psychiatric emergencies. In crisis, call 112 (National Emergency) or Vandrevala Foundation (9999 666 555).
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={clientDetails.consentAgreed}
                    onChange={(e) => setClientDetails({ ...clientDetails, consentAgreed: e.target.checked })}
                    className="w-4 h-4 rounded text-primary border-border focus:ring-focus-ring mt-0.5"
                  />
                  <span className="text-xs font-medium text-text select-none">
                    I explicitly confirm that I am at least 18 years of age, agree to voluntary participation in psychotherapy, accept the confidentiality boundaries, and agree to the fee policy.
                  </span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-border">
                <Button variant="ghost" size="sm" onClick={() => setBookingStep(2)}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (!clientDetails.name || !clientDetails.email || !clientDetails.presentingConcern) {
                      setBookingError('Please fill in your name, email, and primary concern.');
                      return;
                    }
                    if (!clientDetails.consentAgreed) {
                      setBookingError('You must check the informed consent box to proceed.');
                      return;
                    }
                    setBookingError('');
                    setBookingStep(4);
                  }}
                  disabled={!clientDetails.consentAgreed}
                  icon={ArrowRight}
                >
                  Proceed to Payment
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: PAYMENT CHECKOUT */}
          {bookingStep === 4 && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="text-center">
                <h3 className="text-base font-bold text-text font-serif">Order Summary & Payment</h3>
                <p className="text-xs text-text-muted mt-0.5">Payment is verified securely before the session is confirmed.</p>
              </div>

              <div className="rounded-xl border border-border bg-surface-elevated/40 p-5 space-y-3">
                <div className="flex items-center justify-between text-xs pb-3 border-b border-border">
                  <span className="text-text-muted">Practitioner:</span>
                  <span className="font-semibold text-text">{therapist.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs pb-3 border-b border-border">
                  <span className="text-text-muted">Consultation:</span>
                  <span className="font-semibold text-text">{selectedOffering?.title}</span>
                </div>
                <div className="flex items-center justify-between text-xs pb-3 border-b border-border">
                  <span className="text-text-muted">Date & Time:</span>
                  <span className="font-semibold text-text">
                    {new Date(selectedSlot?.startDateTime).toLocaleString('en-IN', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm pt-1">
                  <span className="font-bold text-text">Total Payable:</span>
                  <span className="text-xl font-bold text-primary">₹{selectedOffering?.price}</span>
                </div>
              </div>

              {/* Development Test Simulator Banner */}
              <div className="p-4 rounded-xl border border-accent/40 bg-accent/10 space-y-1 text-left">
                <div className="flex items-center gap-1.5 font-bold text-xs text-text">
                  <CreditCard className="w-4 h-4 text-accent" />
                  <span>Razorpay Test Mode / Transaction Simulator</span>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  [TEST / DEMONSTRATION MODE]: No real bank funds will be charged. This completes end-to-end backend signature verification, prevents double-booking atomically, triggers notifications, and generates a GST-style PDF invoice.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" size="sm" onClick={() => setBookingStep(3)} disabled={isSubmitting}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  onClick={handleConfirmAndPay}
                  icon={CheckCircle2}
                >
                  Pay ₹{selectedOffering?.price} & Confirm Slot
                </Button>
              </div>
            </div>
          )}

          {/* STEP 5: BOOKING CONFIRMATION SCREEN */}
          {bookingStep === 5 && confirmedBooking && (
            <div className="text-center py-8 space-y-6 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-success/20 border border-success/30 flex items-center justify-center text-success mx-auto shadow-elevated">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-text font-serif">Appointment Confirmed!</h3>
                <p className="text-xs text-text-muted mt-1">
                  A calendar invite and invoice have been dispatched to <strong>{clientDetails.email}</strong>.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-surface-elevated/40 p-5 text-left space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-text-muted">Therapist:</span>
                  <span className="font-bold text-text">{therapist.name}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-text-muted">Date & Time:</span>
                  <span className="font-bold text-text">
                    {new Date(confirmedBooking.appointment.startDateTime).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-text-muted">Telehealth Room:</span>
                  <a
                    href={confirmedBooking.appointment.meetLink}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <Video className="w-3.5 h-3.5" />
                    Join Google Meet
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Invoice Number:</span>
                  <span className="font-mono font-semibold text-text">
                    {confirmedBooking.payment.invoiceNumber}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button
                  variant="primary"
                  onClick={() => {
                    // Reset to fresh state
                    setBookingStep(1);
                    setConfirmedBooking(null);
                  }}
                >
                  Book Another Session
                </Button>
                <Link to="/login">
                  <Button variant="outline" className="w-full sm:w-auto">
                    Sign In to Client Portal
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* PUBLIC LEAD / INQUIRY SECTION */}
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-card max-w-3xl mx-auto">
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold text-text font-serif">Have a Question Before Booking?</h3>
            <p className="text-xs text-text-muted mt-1">
              Send {therapist.name} a confidential consultation inquiry.
            </p>
          </div>

          {leadSuccess ? (
            <div className="p-4 rounded-xl border border-success/30 bg-success/10 text-center space-y-1 text-xs">
              <CheckCircle2 className="w-6 h-6 text-success mx-auto" />
              <p className="font-bold text-text">Inquiry Received</p>
              <p className="text-text-muted">
                Dr. Sharma's practice will review your message and reply via email shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleLeadSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Name"
                  required
                  value={leadForm.name}
                  onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                  placeholder="Your Name"
                />
                <Input
                  label="Email"
                  type="email"
                  required
                  value={leadForm.email}
                  onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                  placeholder="your.email@example.com"
                />
                <Input
                  label="Phone"
                  type="tel"
                  value={leadForm.phone}
                  onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                  placeholder="+91..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text uppercase tracking-wider mb-1">
                  Message or Question
                </label>
                <textarea
                  rows={3}
                  required
                  value={leadForm.message}
                  onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })}
                  placeholder="Describe what you are looking for support with..."
                  className="block w-full rounded-lg border border-border bg-surface text-text text-sm p-3 focus:outline-none focus:ring-2 focus:ring-focus-ring"
                />
              </div>

              <Button
                type="submit"
                variant="outline"
                className="w-full"
                isLoading={leadSubmitting}
                icon={Send}
              >
                Send Confidential Inquiry
              </Button>
            </form>
          )}
        </div>
      </main>

      <footer className="border-t border-border bg-surface py-6 text-center text-xs text-text-muted">
        <p>Practicing on UNFAZED — The Practice Operating System for Mental Health</p>
      </footer>
    </div>
  );
};
