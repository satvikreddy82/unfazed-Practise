import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  UserCheck,
  UserPlus,
  Phone,
  Mail,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileEdit,
} from 'lucide-react';

export const LeadsPipeline = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Edit lead modal state
  const [editingLead, setEditingLead] = useState(null);
  const [leadNotes, setLeadNotes] = useState('');
  const [leadStatus, setLeadStatus] = useState('new');
  const [followUpDate, setFollowUpDate] = useState('');
  const [savingLead, setSavingLead] = useState(false);
  const [convertingId, setConvertingId] = useState(null);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/crm/leads?status=${statusFilter}`);
      if (res.data.success) {
        setLeads(res.data.leads || []);
      }
    } catch (err) {
      console.warn('Error fetching leads:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter]);

  const handleOpenEdit = (lead) => {
    setEditingLead(lead);
    setLeadNotes(lead.notes || '');
    setLeadStatus(lead.status || 'new');
    setFollowUpDate(lead.followUpDate ? lead.followUpDate.split('T')[0] : '');
  };

  const handleSaveLead = async () => {
    if (!editingLead) return;
    setSavingLead(true);
    try {
      await axios.put(`/api/crm/leads/${editingLead._id}`, {
        status: leadStatus,
        notes: leadNotes,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
      });
      setEditingLead(null);
      fetchLeads();
    } catch (err) {
      alert('Failed to update lead: ' + err.message);
    } finally {
      setSavingLead(false);
    }
  };

  const handleConvertLead = async (lead) => {
    setConvertingId(lead._id);
    try {
      const res = await axios.post(`/api/crm/leads/${lead._id}/convert`);
      if (res.data.success) {
        alert(`Successfully converted ${lead.name} to active client!`);
        fetchLeads();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to convert lead.');
    } finally {
      setConvertingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'new':
        return <Badge variant="warning">New Inquiry</Badge>;
      case 'contacted':
        return <Badge variant="primary">Contacted</Badge>;
      case 'qualified':
        return <Badge variant="accent">Qualified</Badge>;
      case 'converted':
        return <Badge variant="success">Converted to Client</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border border-border bg-surface shadow-subtle">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text font-serif">Prospective Leads Pipeline</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Capture and follow up with inquiries received from your public practice link.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-surface text-text text-xs font-medium focus:outline-none focus:ring-2 focus:ring-focus-ring"
        >
          <option value="all">All Pipeline Stages</option>
          <option value="new">New Inquiries</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="converted">Converted</option>
        </select>
      </div>

      {/* Leads List / Cards */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-subtle">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton count={3} className="h-16 w-full" />
          </div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center text-xs text-text-muted">
            No inquiries logged in the pipeline currently.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {leads.map((lead) => (
              <div key={lead._id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-elevated/40 transition-colors">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-text">{lead.name}</span>
                    {getStatusBadge(lead.status)}
                    {lead.preferredService && (
                      <span className="text-[11px] text-text-muted hidden sm:inline">
                        • Interested in: {lead.preferredService}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      {lead.email}
                    </span>
                    {lead.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        {lead.phone}
                      </span>
                    )}
                    <span className="text-[11px] text-text-muted/70">
                      Inquired on: {new Date(lead.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>

                  {lead.message && (
                    <div className="mt-2 p-3 rounded-lg bg-surface border border-border text-xs text-text-muted leading-relaxed">
                      "{lead.message}"
                    </div>
                  )}

                  {lead.notes && (
                    <div className="text-[11px] text-primary font-medium mt-1">
                      Therapist note: {lead.notes}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(lead)}
                    icon={FileEdit}
                  >
                    Update
                  </Button>

                  {lead.status !== 'converted' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleConvertLead(lead)}
                      isLoading={convertingId === lead._id}
                      icon={UserPlus}
                    >
                      Convert to Client
                    </Button>
                  ) : (
                    <span className="text-xs text-success font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Active Client
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Lead Modal */}
      <Modal
        isOpen={!!editingLead}
        onClose={() => setEditingLead(null)}
        title="Update Lead Status"
        subtitle={editingLead?.name}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-text uppercase tracking-wider mb-1.5">
              Pipeline Stage
            </label>
            <select
              value={leadStatus}
              onChange={(e) => setLeadStatus(e.target.value)}
              className="w-full p-2 rounded-lg border border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-focus-ring"
            >
              <option value="new">New Inquiry</option>
              <option value="contacted">Contacted via Email/Phone</option>
              <option value="qualified">Qualified Prospective Client</option>
              <option value="converted">Converted to Client</option>
              <option value="archived">Archived / Closed</option>
            </select>
          </div>

          <Input
            label="Follow-up Date"
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold text-text uppercase tracking-wider mb-1.5">
              Therapist Notes & Consultation Plans
            </label>
            <textarea
              rows={3}
              value={leadNotes}
              onChange={(e) => setLeadNotes(e.target.value)}
              placeholder="Record follow-up notes, consultation conversation summary..."
              className="w-full p-3 rounded-lg border border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-focus-ring"
            />
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditingLead(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={savingLead}
              onClick={handleSaveLead}
            >
              Save Lead Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
