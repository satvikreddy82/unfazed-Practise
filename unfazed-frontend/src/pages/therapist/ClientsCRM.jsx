import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  Users,
  Search,
  Plus,
  Eye,
  FileText,
  Calendar,
  CreditCard,
  ShieldCheck,
  Phone,
  Mail,
  Tag,
  AlertCircle,
  Clock,
} from 'lucide-react';

export const ClientsCRM = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Client Details Drawer
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientDetailsLoading, setClientDetailsLoading] = useState(false);
  const [detailsData, setDetailsData] = useState(null);
  const [activeTab, setActiveTab] = useState('sessions'); // 'sessions', 'notes', 'payments', 'intake'

  // Add Client Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', tags: '', notes: '' });
  const [addingClient, setAddingClient] = useState(false);
  const [addError, setAddError] = useState('');

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/crm/clients?search=${encodeURIComponent(search)}&status=${statusFilter}`);
      if (res.data.success) {
        setClients(res.data.clients || []);
      }
    } catch (err) {
      console.warn('Clients fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchClients();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [search, statusFilter]);

  const openClientDetails = async (client) => {
    setSelectedClient(client);
    setClientDetailsLoading(true);
    setActiveTab('sessions');
    try {
      const res = await axios.get(`/api/crm/clients/${client._id}`);
      if (res.data.success) {
        setDetailsData(res.data);
      }
    } catch (err) {
      alert('Failed to load client profile details.');
    } finally {
      setClientDetailsLoading(false);
    }
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    setAddingClient(true);
    setAddError('');

    try {
      const tagsArray = newClient.tags ? newClient.tags.split(',').map((t) => t.trim()) : [];
      const res = await axios.post('/api/crm/clients', {
        ...newClient,
        tags: tagsArray,
      });

      if (res.data.success) {
        setAddModalOpen(false);
        setNewClient({ name: '', email: '', phone: '', tags: '', notes: '' });
        fetchClients();
      }
    } catch (err) {
      if (err.response?.data?.entitlementError) {
        setAddError(err.response.data.message);
      } else {
        setAddError(err.response?.data?.message || 'Failed to add client.');
      }
    } finally {
      setAddingClient(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border border-border bg-surface shadow-subtle">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text font-serif">Client Caseload (CRM)</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Manage confidential clinical records, intake forms, and billing history.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setAddError('');
            setAddModalOpen(true);
          }}
          icon={Plus}
        >
          Add Client
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by client name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={Search}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-surface text-text text-xs font-medium focus:outline-none focus:ring-2 focus:ring-focus-ring"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Clients Table */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-subtle">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton count={4} className="h-12 w-full" />
          </div>
        ) : clients.length === 0 ? (
          <div className="p-12 text-center text-xs text-text-muted">
            No clients found matching the search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-elevated/60 text-text-muted uppercase tracking-wider text-[10px] border-b border-border">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Client Name</th>
                  <th className="px-5 py-3.5 font-bold">Contact</th>
                  <th className="px-5 py-3.5 font-bold">Tags</th>
                  <th className="px-5 py-3.5 font-bold">Status</th>
                  <th className="px-5 py-3.5 font-bold">Intake / Consent</th>
                  <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clients.map((client) => (
                  <tr key={client._id} className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="px-5 py-4 font-semibold text-text">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                          {client.name[0]}
                        </div>
                        <span className="truncate">{client.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-text-muted">
                      <div>{client.email}</div>
                      {client.phone && <div className="text-[11px]">{client.phone}</div>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {client.tags?.map((t, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-surface-elevated border border-border text-text-muted">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={client.status === 'active' ? 'success' : 'neutral'}>
                        {client.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${client.intakeCompleted ? 'bg-success' : 'bg-warning'}`} />
                        <span className="text-text-muted">{client.intakeCompleted ? 'Intake Complete' : 'Pending Intake'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openClientDetails(client)}
                        icon={Eye}
                      >
                        Profile
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Client Detail Full Modal */}
      <Modal
        isOpen={!!selectedClient}
        onClose={() => setSelectedClient(null)}
        title={selectedClient?.name || 'Client Record'}
        subtitle={`Caseload Record • ${selectedClient?.email}`}
        maxWidth="max-w-3xl"
      >
        {selectedClient && (
          <div className="space-y-6 text-xs">
            {/* Tab navigation */}
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('sessions')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'sessions' ? 'bg-primary text-white shadow-subtle' : 'text-text-muted hover:text-text'
                }`}
              >
                Sessions ({detailsData?.sessions?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('notes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'notes' ? 'bg-primary text-white shadow-subtle' : 'text-text-muted hover:text-text'
                }`}
              >
                Clinical Notes ({detailsData?.notes?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('payments')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'payments' ? 'bg-primary text-white shadow-subtle' : 'text-text-muted hover:text-text'
                }`}
              >
                Payments & Receipts ({detailsData?.payments?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('intake')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'intake' ? 'bg-primary text-white shadow-subtle' : 'text-text-muted hover:text-text'
                }`}
              >
                Intake & Consent
              </button>
            </div>

            {/* Content for Tabs */}
            {clientDetailsLoading ? (
              <LoadingSkeleton count={3} className="h-16 w-full" />
            ) : (
              <div>
                {/* 1. SESSIONS TAB */}
                {activeTab === 'sessions' && (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {detailsData?.sessions?.length === 0 ? (
                      <p className="text-center text-text-muted py-6">No session appointments logged for this client yet.</p>
                    ) : (
                      detailsData?.sessions?.map((s) => (
                        <div key={s._id} className="p-3 rounded-lg border border-border bg-surface flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-text">{s.serviceName}</div>
                            <div className="text-[11px] text-text-muted">
                              {new Date(s.startDateTime).toLocaleString('en-IN')} ({s.duration}m)
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-success">₹{s.price}</span>
                            <Badge variant={s.status === 'completed' ? 'success' : s.status === 'confirmed' ? 'primary' : 'danger'}>
                              {s.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 2. NOTES TAB */}
                {activeTab === 'notes' && (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {detailsData?.notes?.length === 0 ? (
                      <p className="text-center text-text-muted py-6">No clinical documentation yet.</p>
                    ) : (
                      detailsData?.notes?.map((n) => (
                        <div key={n._id} className="p-3.5 rounded-xl border border-border bg-surface space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-text">{n.title}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="neutral">{n.noteType.toUpperCase()}</Badge>
                              <Badge variant={n.isPrivate ? 'danger' : 'success'}>
                                {n.isPrivate ? 'Private Therapist Note' : 'Shared with Client'}
                              </Badge>
                            </div>
                          </div>
                          {n.noteType === 'soap' && (
                            <div className="grid grid-cols-2 gap-2 text-[11px] text-text-muted pt-1">
                              <div><strong>S:</strong> {n.content?.soap?.subjective}</div>
                              <div><strong>O:</strong> {n.content?.soap?.objective}</div>
                              <div><strong>A:</strong> {n.content?.soap?.assessment}</div>
                              <div><strong>P:</strong> {n.content?.soap?.plan}</div>
                            </div>
                          )}
                          {n.noteType === 'freeform' && (
                            <div
                              className="text-[11px] text-text-muted pt-1 prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: n.content?.freeform?.body || '' }}
                            />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 3. PAYMENTS TAB */}
                {activeTab === 'payments' && (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {detailsData?.payments?.length === 0 ? (
                      <p className="text-center text-text-muted py-6">No payment transactions recorded.</p>
                    ) : (
                      detailsData?.payments?.map((p) => (
                        <div key={p._id} className="p-3 rounded-lg border border-border bg-surface flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-text">{p.itemDescription}</div>
                            <div className="text-[11px] text-text-muted">
                              Invoice: <span className="font-mono">{p.invoiceNumber}</span> • {new Date(p.createdAt).toLocaleDateString('en-IN')}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-text">₹{p.amount}</span>
                            <Badge variant={p.status === 'captured' ? 'success' : 'warning'}>
                              {p.status}
                            </Badge>
                            <a
                              href={`/api/payments/invoices/${p._id}/pdf`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline text-[11px] font-semibold"
                            >
                              PDF Receipt
                            </a>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 4. INTAKE & CONSENT TAB */}
                {activeTab === 'intake' && (
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    <div className="p-4 rounded-xl border border-border bg-surface-elevated/40 space-y-2">
                      <h4 className="font-bold text-text uppercase tracking-wider text-[10px]">Client Intake Submission</h4>
                      {detailsData?.intake ? (
                        <div className="space-y-2 text-text">
                          <div><strong>Presenting Concern:</strong> {detailsData.intake.presentingConcern}</div>
                          {detailsData.intake.goalsForTherapy && <div><strong>Goals:</strong> {detailsData.intake.goalsForTherapy}</div>}
                          {detailsData.intake.previousTherapyExperience && <div><strong>Previous Therapy:</strong> {detailsData.intake.previousTherapyExperience}</div>}
                        </div>
                      ) : (
                        <p className="text-text-muted">Client has not completed the onboarding intake form yet.</p>
                      )}
                    </div>

                    <div className="p-4 rounded-xl border border-border bg-surface-elevated/40 space-y-1.5">
                      <h4 className="font-bold text-text uppercase tracking-wider text-[10px]">Informed Consent Audit Trail</h4>
                      {detailsData?.consent ? (
                        <div className="text-[11px] text-text-muted space-y-1">
                          <div className="text-success font-semibold flex items-center gap-1">
                            <ShieldCheck className="w-4 h-4" />
                            Consent Signed Voluntarily (Version {detailsData.consent.consentVersion})
                          </div>
                          <div>Timestamp: {new Date(detailsData.consent.agreedAt || detailsData.consent.createdAt).toLocaleString('en-IN')}</div>
                          <div>IP Record: {detailsData.consent.ipAddress || '127.0.0.1'}</div>
                        </div>
                      ) : (
                        <p className="text-text-muted">No signed consent record found on file.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add Client Modal (Gated by active client limit!) */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Client to Practice"
        subtitle="Registers client to practice caseload with entitlement verification"
      >
        <form onSubmit={handleAddClient} className="space-y-4 text-xs">
          {addError && (
            <div className="p-3 rounded-lg border border-danger/30 bg-danger/10 text-danger text-xs font-medium">
              {addError}
            </div>
          )}

          <Input
            label="Client Full Name"
            required
            value={newClient.name}
            onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
            placeholder="e.g. Kavita Krishnan"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Email Address"
              type="email"
              required
              value={newClient.email}
              onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
              placeholder="kavita@example.com"
            />
            <Input
              label="Phone Number"
              type="tel"
              value={newClient.phone}
              onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
              placeholder="+91..."
            />
          </div>

          <Input
            label="Clinical Tags (Comma-separated)"
            value={newClient.tags}
            onChange={(e) => setNewClient({ ...newClient, tags: e.target.value })}
            placeholder="CBT, Anxiety, Bi-weekly"
          />

          <div>
            <label className="block text-xs font-semibold text-text uppercase tracking-wider mb-1">
              Internal Administrative Notes
            </label>
            <textarea
              rows={2}
              value={newClient.notes}
              onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
              placeholder="Referral source or administrative notes..."
              className="block w-full rounded-lg border border-border bg-surface text-text text-sm p-3 focus:outline-none focus:ring-2 focus:ring-focus-ring"
            />
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={addingClient}>
              Save Client Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
