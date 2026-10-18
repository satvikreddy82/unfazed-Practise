import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { ThemeSelector } from '../../components/common/ThemeSelector';
import { NotificationBell } from '../../components/common/NotificationBell';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  Calendar,
  CreditCard,
  FileText,
  MessageSquare,
  Download,
  Video,
  LogOut,
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export const ClientPortal = () => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('appointments'); // 'appointments', 'invoices', 'notes', 'chat'

  // Data states
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [sharedNotes, setSharedNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Chat state
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      const [apptRes, payRes, notesRes] = await Promise.all([
        axios.get(`/api/scheduling/appointments?clientId=${user?.id}`),
        axios.get('/api/payments'),
        axios.get('/api/notes'), // Hard-enforced on backend: only returns isPrivate === false
      ]);

      if (apptRes.data.success) setAppointments(apptRes.data.appointments || []);
      if (payRes.data.success) setInvoices(payRes.data.payments || []);
      if (notesRes.data.success) setSharedNotes(notesRes.data.notes || []);
    } catch (err) {
      console.warn('Error fetching client portal data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchClientData();
    }
  }, [user]);

  // Load or start chat conversation
  const loadChat = async () => {
    if (!user) return;
    setChatLoading(true);
    try {
      const convRes = await axios.post('/api/chat/conversations', {
        therapistId: user.therapistId,
      });

      if (convRes.data.success) {
        setConversation(convRes.data.conversation);
        if (socket) {
          socket.emit('join_conversation', { conversationId: convRes.data.conversation._id });
        }

        const msgRes = await axios.get(`/api/chat/messages/${convRes.data.conversation._id}`);
        if (msgRes.data.success) {
          setMessages(msgRes.data.messages || []);
        }
      }
    } catch (e) {
      console.warn('Chat load error:', e.message);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      loadChat();
    }
  }, [activeTab]);

  // Socket listener for new incoming chat message
  useEffect(() => {
    if (!socket || !conversation) return;

    const handleNewMessage = (msg) => {
      if (msg.conversationId === conversation._id) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on('new_message', handleNewMessage);
    return () => socket.off('new_message', handleNewMessage);
  }, [socket, conversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !conversation) return;

    const textToSend = chatInput.trim();
    setChatInput('');

    try {
      const res = await axios.post(`/api/chat/messages/${conversation._id}`, {
        text: textToSend,
      });
      if (res.data.success) {
        setMessages((prev) => [...prev, res.data.message]);
      }
    } catch (e) {
      alert('Failed to send message.');
    }
  };

  return (
    <div className="min-h-screen bg-background text-text flex flex-col transition-colors selection:bg-accent/20">
      {/* Client Portal Header */}
      <header className="border-b border-border bg-surface/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xs">
                U
              </div>
              <span className="font-bold text-base font-serif text-text">UNFAZED</span>
            </Link>
            <span className="text-xs text-text-muted hidden sm:inline">• Client Care Portal</span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeSelector compact />
            <NotificationBell />
            <Button variant="ghost" size="sm" onClick={logout} icon={LogOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        {/* Welcome Banner */}
        <div className="clay-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-serif text-text">Hello, {user?.name || 'Client'}</h1>
              <Badge variant="success" clay size="sm">ACTIVE CARE</Badge>
            </div>
            <p className="text-xs text-text-muted mt-1">
              Review your upcoming appointments, access shared therapeutic notes, and download official invoices.
            </p>
          </div>

          <Link to="/dr-sharma">
            <Button variant="clay-primary" size="sm" icon={Calendar}>
              Book New Session
            </Button>
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('appointments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'appointments'
                ? 'clay-btn bg-primary text-white shadow-subtle'
                : 'text-text-muted hover:text-text hover:bg-surface'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Appointments ({appointments.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'notes'
                ? 'clay-btn bg-primary text-white shadow-subtle'
                : 'text-text-muted hover:text-text hover:bg-surface'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Shared Therapist Notes ({sharedNotes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('invoices')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'invoices'
                ? 'clay-btn bg-primary text-white shadow-subtle'
                : 'text-text-muted hover:text-text hover:bg-surface'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            Receipts & Invoices ({invoices.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'chat'
                ? 'clay-btn bg-primary text-white shadow-subtle'
                : 'text-text-muted hover:text-text hover:bg-surface'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Chat with Practitioner
          </button>
        </div>

        {/* Tab 1: APPOINTMENTS */}
        {activeTab === 'appointments' && (
          <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-subtle">
            {loading ? (
              <div className="p-6">
                <LoadingSkeleton count={3} className="h-16 w-full" />
              </div>
            ) : appointments.length === 0 ? (
              <div className="p-12 text-center text-xs text-text-muted space-y-3">
                <p>You have no scheduled appointments yet.</p>
                <Link to="/dr-sharma">
                  <Button variant="primary" size="sm">
                    Select a Consultation Slot
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {appointments.map((appt) => (
                  <div key={appt._id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-text">{appt.serviceName}</span>
                        <Badge variant={appt.status === 'confirmed' ? 'primary' : appt.status === 'completed' ? 'success' : 'danger'}>
                          {appt.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-text-muted mt-1 space-y-0.5">
                        <div>{new Date(appt.startDateTime).toLocaleString('en-IN', { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} ({appt.duration}m)</div>
                        <div className="font-semibold text-success">Fee: ₹{appt.price} ({appt.paymentStatus})</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {appt.meetLink && appt.status === 'confirmed' && (
                        <a
                          href={appt.meetLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold shadow-subtle hover:bg-primary-hover"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Telehealth Room</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: SHARED THERAPIST NOTES (CRITICAL PRIVACY TESTED) */}
        {activeTab === 'notes' && (
          <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-subtle">
            {loading ? (
              <div className="p-6">
                <LoadingSkeleton count={2} className="h-24 w-full" />
              </div>
            ) : sharedNotes.length === 0 ? (
              <div className="p-12 text-center text-xs text-text-muted">
                No reflection notes or home exercises shared by your therapist yet.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {sharedNotes.map((note) => (
                  <div key={note.id || note._id} className="p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-text">{note.title}</h3>
                      <span className="text-[10px] text-text-muted">
                        Shared on {new Date(note.sharedWithClientAt || note.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>

                    <div
                      className="p-4 rounded-xl bg-surface-elevated/40 border border-border text-xs text-text-muted leading-relaxed prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: note.content?.freeform?.body || 'Clinical guidance shared for this session.' }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: INVOICES & RECEIPTS */}
        {activeTab === 'invoices' && (
          <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-subtle">
            {loading ? (
              <div className="p-6">
                <LoadingSkeleton count={3} className="h-14 w-full" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="p-12 text-center text-xs text-text-muted">
                No invoices found for your account.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-elevated/60 text-text-muted uppercase tracking-wider text-[10px] border-b border-border">
                    <tr>
                      <th className="px-5 py-3.5 font-bold">Invoice #</th>
                      <th className="px-5 py-3.5 font-bold">Description</th>
                      <th className="px-5 py-3.5 font-bold">Amount</th>
                      <th className="px-5 py-3.5 font-bold">Status</th>
                      <th className="px-5 py-3.5 font-bold">Date</th>
                      <th className="px-5 py-3.5 font-bold text-right">Download</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {invoices.map((inv) => (
                      <tr key={inv._id} className="hover:bg-surface-elevated/40">
                        <td className="px-5 py-4 font-mono font-bold text-text">{inv.invoiceNumber}</td>
                        <td className="px-5 py-4 text-text font-medium">{inv.itemDescription}</td>
                        <td className="px-5 py-4 font-bold text-text">₹{inv.amount}</td>
                        <td className="px-5 py-4">
                          <Badge variant={inv.status === 'captured' ? 'success' : 'warning'}>
                            {inv.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-text-muted">
                          {new Date(inv.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <a
                            href={`/api/payments/invoices/${inv._id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-surface text-primary text-xs font-semibold hover:bg-surface-elevated"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: SECURE CHAT WITH PRACTITIONER */}
        {activeTab === 'chat' && (
          <div className="rounded-2xl border border-border bg-surface h-[550px] flex flex-col overflow-hidden shadow-card">
            <div className="p-4 border-b border-border bg-surface-elevated/40 flex items-center justify-between">
              <span className="font-bold text-xs text-text uppercase tracking-wider">
                Direct Communication with Your Practitioner
              </span>
              <span className="text-[11px] text-text-muted">Encrypted & Secure</span>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-3 bg-background/40">
              {chatLoading ? (
                <LoadingSkeleton count={3} className="h-12 w-3/4" />
              ) : messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-text-muted">
                  Send a message to your therapist below.
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.senderId === user?.id;
                  return (
                    <div
                      key={m._id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-subtle ${
                          isMe
                            ? 'bg-primary text-white rounded-br-xs'
                            : 'bg-surface border border-border text-text rounded-bl-xs'
                        }`}
                      >
                        {m.text}
                      </div>
                      <span className="text-[9px] text-text-muted/70 mt-1 px-1">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendChatMessage} className="p-4 border-t border-border bg-surface flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 text-xs rounded-lg border border-border bg-background text-text focus:outline-none focus:ring-2 focus:ring-focus-ring"
              />
              <Button type="submit" variant="primary" size="sm" icon={Send}>
                Send
              </Button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};
