import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  XCircle,
  CheckCircle2,
  Settings,
  Plus,
  AlertCircle,
} from 'lucide-react';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // Week starts on Monday
  getDay,
  locales,
});

export const CalendarView = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Availability state
  const [availability, setAvailability] = useState(null);
  const [bufferMinutes, setBufferMinutes] = useState(15);
  const [savingAvailability, setSavingAvailability] = useState(false);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/scheduling/appointments');
      if (res.data.success) {
        setAppointments(res.data.appointments || []);
      }
    } catch (err) {
      console.warn('Error loading appointments:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async () => {
    try {
      const res = await axios.get('/api/scheduling/availability');
      if (res.data.success) {
        setAvailability(res.data.availability);
        setBufferMinutes(res.data.availability.bufferMinutes || 15);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchAppointments();
    fetchAvailability();
  }, []);

  // Format events for React Big Calendar
  const events = appointments.map((appt) => ({
    id: appt._id,
    title: `${appt.clientId?.name || 'Client'} — ${appt.serviceName}`,
    start: new Date(appt.startDateTime),
    end: new Date(appt.endDateTime),
    raw: appt,
  }));

  const handleSelectEvent = (event) => {
    setSelectedEvent(event.raw);
    setModalOpen(true);
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedEvent) return;
    setUpdatingStatus(true);
    try {
      await axios.put(`/api/scheduling/appointments/${selectedEvent._id}/status`, {
        status: newStatus,
      });
      setModalOpen(false);
      fetchAppointments();
    } catch (err) {
      alert('Failed to update appointment: ' + err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveAvailability = async () => {
    setSavingAvailability(true);
    try {
      await axios.put('/api/scheduling/availability', {
        bufferMinutes: parseInt(bufferMinutes, 10),
      });
      setAvailabilityModalOpen(false);
      alert('Scheduling buffer saved!');
    } catch (e) {
      alert('Failed to update availability.');
    } finally {
      setSavingAvailability(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border border-border bg-surface shadow-subtle">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text font-serif">Appointment Schedule</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Color-coded practice calendar with real-time double-booking prevention.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAvailabilityModalOpen(true)}
            icon={Settings}
          >
            Schedule Buffers ({bufferMinutes}m)
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={fetchAppointments}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Calendar Area */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
        {loading ? (
          <LoadingSkeleton count={3} className="h-40 w-full" />
        ) : (
          <div className="h-[650px]">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              defaultView="week"
              views={['month', 'week', 'day', 'agenda']}
              step={30}
              timeslots={2}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={(event) => {
                const status = event.raw.status;
                let bg = 'var(--color-primary)';
                if (status === 'completed') bg = 'var(--color-success)';
                if (status === 'cancelled') bg = 'var(--color-danger)';
                return {
                  style: {
                    backgroundColor: bg,
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                  },
                };
              }}
            />
          </div>
        )}
      </div>

      {/* Appointment Detail & Status Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Appointment Details"
        subtitle={selectedEvent?.serviceName}
      >
        {selectedEvent && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl border border-border bg-surface-elevated/40 space-y-2">
              <div className="flex justify-between">
                <span className="text-text-muted">Client Name:</span>
                <span className="font-bold text-text">{selectedEvent.clientId?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Client Email:</span>
                <span className="font-medium text-text">{selectedEvent.clientId?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Date & Time:</span>
                <span className="font-bold text-text">
                  {new Date(selectedEvent.startDateTime).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Duration:</span>
                <span>{selectedEvent.duration} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Status:</span>
                <Badge variant={selectedEvent.status === 'confirmed' ? 'primary' : selectedEvent.status === 'completed' ? 'success' : 'danger'}>
                  {selectedEvent.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Fee & Payment:</span>
                <span className="font-bold text-success">₹{selectedEvent.price} ({selectedEvent.paymentStatus})</span>
              </div>
            </div>

            {selectedEvent.meetLink && (
              <a
                href={selectedEvent.meetLink}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-primary text-white font-semibold text-xs shadow-subtle hover:bg-primary-hover"
              >
                <Video className="w-4 h-4" />
                Join Telehealth Room
              </a>
            )}

            {selectedEvent.clientNotes && (
              <div>
                <span className="font-semibold text-text uppercase tracking-wider text-[10px]">Client Intake Note:</span>
                <p className="mt-1 p-2 rounded-lg bg-surface border border-border text-text-muted text-[11px]">
                  {selectedEvent.clientNotes}
                </p>
              </div>
            )}

            {/* Status Change Buttons */}
            <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleUpdateStatus('cancelled')}
                disabled={updatingStatus || selectedEvent.status === 'cancelled'}
                icon={XCircle}
              >
                Cancel Session
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleUpdateStatus('completed')}
                disabled={updatingStatus || selectedEvent.status === 'completed'}
                icon={CheckCircle2}
              >
                Mark Completed
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Schedule Availability Settings Modal */}
      <Modal
        isOpen={availabilityModalOpen}
        onClose={() => setAvailabilityModalOpen(false)}
        title="Schedule & Buffer Time"
        subtitle="Prevent back-to-back fatigue with automated rest buffers"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-text uppercase tracking-wider mb-1.5">
              Rest Buffer Between Sessions
            </label>
            <select
              value={bufferMinutes}
              onChange={(e) => setBufferMinutes(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-focus-ring"
            >
              <option value="0">No Buffer (0 minutes)</option>
              <option value="5">5 Minutes</option>
              <option value="10">10 Minutes</option>
              <option value="15">15 Minutes (Recommended for Clinical Notes)</option>
              <option value="20">20 Minutes</option>
              <option value="30">30 Minutes</option>
            </select>
            <p className="mt-1 text-[11px] text-text-muted leading-relaxed">
              When a client books a session, this buffer is automatically blocked before and after the appointment to give you time to decompress and complete your clinical notes.
            </p>
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setAvailabilityModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={savingAvailability}
              onClick={handleSaveAvailability}
            >
              Save Schedule Settings
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
