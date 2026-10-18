import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  FileText,
  Search,
  Plus,
  Lock,
  Share2,
  Calendar,
  User,
  Trash2,
  AlertCircle,
  Sparkles,
  Check,
} from 'lucide-react';

export const SessionNotes = () => {
  const [notes, setNotes] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create/Edit Note State
  const [modalOpen, setModalOpen] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [noteError, setNoteError] = useState('');

  const [formData, setFormData] = useState({
    clientId: '',
    title: '',
    noteType: 'freeform', // 'freeform', 'soap', 'dap'
    isPrivate: true,
    content: {
      freeform: { body: '' },
      soap: { subjective: '', objective: '', assessment: '', plan: '' },
      dap: { data: '', assessment: '', plan: '' },
    },
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [notesRes, clientsRes] = await Promise.all([
        axios.get(`/api/notes?search=${encodeURIComponent(search)}`),
        axios.get('/api/crm/clients?status=active'),
      ]);

      if (notesRes.data.success) {
        setNotes(notesRes.data.notes || []);
      }
      if (clientsRes.data.success) {
        setClients(clientsRes.data.clients || []);
        if (clientsRes.data.clients.length > 0 && !formData.clientId) {
          setFormData((prev) => ({ ...prev, clientId: clientsRes.data.clients[0]._id }));
        }
      }
    } catch (err) {
      console.warn('Error loading notes:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchData();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  const handleCreateNote = async (e) => {
    e.preventDefault();
    setSavingNote(true);
    setNoteError('');

    try {
      const res = await axios.post('/api/notes', formData);
      if (res.data.success) {
        setModalOpen(false);
        setFormData({
          clientId: clients[0]?._id || '',
          title: '',
          noteType: 'freeform',
          isPrivate: true,
          content: {
            freeform: { body: '' },
            soap: { subjective: '', objective: '', assessment: '', plan: '' },
            dap: { data: '', assessment: '', plan: '' },
          },
        });
        fetchData();
      }
    } catch (err) {
      if (err.response?.data?.entitlementError) {
        setNoteError(err.response.data.message);
      } else {
        setNoteError(err.response?.data?.message || 'Failed to save clinical note.');
      }
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (id) => {
    if (!window.confirm('Are you sure you want to delete this clinical note?')) return;
    try {
      await axios.delete(`/api/notes/${id}`);
      setNotes((prev) => prev.filter((n) => n._id !== id));
    } catch (e) {
      alert('Failed to delete note.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border border-border bg-surface shadow-subtle">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text font-serif">Clinical Documentation</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Standardized SOAP, DAP, and Freeform notes with multi-level confidentiality protection.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setNoteError('');
            setModalOpen(true);
          }}
          icon={Plus}
        >
          New Clinical Note
        </Button>
      </div>

      {/* Search Input */}
      <div>
        <Input
          placeholder="Search clinical notes by keyword, client name, or diagnostic assessment..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={Search}
        />
      </div>

      {/* Notes Grid */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-subtle">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton count={3} className="h-20 w-full" />
          </div>
        ) : notes.length === 0 ? (
          <div className="p-12 text-center text-xs text-text-muted">
            No clinical notes found matching your search.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notes.map((note) => (
              <div key={note._id} className="p-5 hover:bg-surface-elevated/40 transition-colors space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-text">{note.title}</h3>
                      <Badge variant="neutral">{note.noteType.toUpperCase()} Template</Badge>
                      <Badge variant={note.isPrivate ? 'danger' : 'success'} className="gap-1">
                        {note.isPrivate ? (
                          <>
                            <Lock className="w-3 h-3" />
                            <span>Private Therapist Note</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-3 h-3" />
                            <span>Shared with Client</span>
                          </>
                        )}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-text-muted mt-1">
                      <span className="font-semibold text-text">Client: {note.clientId?.name || 'Client'}</span>
                      <span>•</span>
                      <span>Recorded on: {new Date(note.createdAt).toLocaleDateString('en-IN')}</span>
                      {note.sessionId && (
                        <>
                          <span>•</span>
                          <span>Session: {note.sessionId?.serviceName}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteNote(note._id)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                    title="Delete note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Structured Note Details */}
                {note.noteType === 'soap' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-xl bg-surface-elevated/40 border border-border text-xs">
                    <div>
                      <span className="font-bold text-text uppercase tracking-wider text-[10px]">Subjective (S):</span>
                      <p className="text-text-muted mt-0.5 leading-relaxed">{note.content?.soap?.subjective || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-bold text-text uppercase tracking-wider text-[10px]">Objective (O):</span>
                      <p className="text-text-muted mt-0.5 leading-relaxed">{note.content?.soap?.objective || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-bold text-text uppercase tracking-wider text-[10px]">Assessment (A):</span>
                      <p className="text-text-muted mt-0.5 leading-relaxed">{note.content?.soap?.assessment || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-bold text-text uppercase tracking-wider text-[10px]">Treatment Plan (P):</span>
                      <p className="text-text-muted mt-0.5 leading-relaxed">{note.content?.soap?.plan || 'N/A'}</p>
                    </div>
                  </div>
                )}

                {note.noteType === 'dap' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-xl bg-surface-elevated/40 border border-border text-xs">
                    <div>
                      <span className="font-bold text-text uppercase tracking-wider text-[10px]">Data (D):</span>
                      <p className="text-text-muted mt-0.5 leading-relaxed">{note.content?.dap?.data || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-bold text-text uppercase tracking-wider text-[10px]">Assessment (A):</span>
                      <p className="text-text-muted mt-0.5 leading-relaxed">{note.content?.dap?.assessment || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-bold text-text uppercase tracking-wider text-[10px]">Plan (P):</span>
                      <p className="text-text-muted mt-0.5 leading-relaxed">{note.content?.dap?.plan || 'N/A'}</p>
                    </div>
                  </div>
                )}

                {note.noteType === 'freeform' && (
                  <div
                    className="p-3.5 rounded-xl bg-surface-elevated/40 border border-border text-xs text-text-muted leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: note.content?.freeform?.body || '' }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Note Modal with Template Switching */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Clinical Note"
        subtitle="Select a structured clinical template or freeform documentation"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateNote} className="space-y-4 text-xs">
          {noteError && (
            <div className="p-3 rounded-lg border border-danger/30 bg-danger/10 text-danger text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{noteError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text uppercase tracking-wider mb-1">
                Select Client
              </label>
              <select
                required
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-focus-ring"
              >
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text uppercase tracking-wider mb-1">
                Clinical Template Type
              </label>
              <select
                value={formData.noteType}
                onChange={(e) => setFormData({ ...formData, noteType: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-focus-ring font-medium"
              >
                <option value="freeform">Freeform Rich Note (All Plans)</option>
                <option value="soap">SOAP Note (Subjective, Objective, Assessment, Plan)</option>
                <option value="dap">DAP Note (Data, Assessment, Plan)</option>
              </select>
            </div>
          </div>

          <Input
            label="Note Title"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Session 4: Exposure Hierarchy & Behavioral Activation"
          />

          {/* PRIVACY TOGGLE */}
          <div className="p-3.5 rounded-xl border border-border bg-surface-elevated/40 flex items-center justify-between">
            <div>
              <span className="font-bold text-xs text-text block">Confidentiality Barrier</span>
              <p className="text-[11px] text-text-muted mt-0.5">
                {formData.isPrivate
                  ? 'Private to therapist. Never returned to client portal.'
                  : 'Shared with client. Visible in their client portal reflection tab.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isPrivate: true })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  formData.isPrivate ? 'bg-danger text-white shadow-subtle' : 'text-text-muted hover:text-text'
                }`}
              >
                Private (Strict)
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isPrivate: false })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  !formData.isPrivate ? 'bg-success text-white shadow-subtle' : 'text-text-muted hover:text-text'
                }`}
              >
                Share with Client
              </button>
            </div>
          </div>

          {/* TEMPLATE EDITING FIELDS */}
          {formData.noteType === 'soap' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-text uppercase">Subjective (S) — Client statements, mood rating</label>
                <textarea
                  rows={2}
                  value={formData.content.soap.subjective}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      content: { ...formData.content, soap: { ...formData.content.soap, subjective: e.target.value } },
                    })
                  }
                  className="w-full p-2.5 rounded-lg border border-border bg-surface text-text text-sm focus:ring-2 focus:ring-focus-ring"
                  placeholder="Client reports feeling..."
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-text uppercase">Objective (O) — Clinician observations, affect, speech</label>
                <textarea
                  rows={2}
                  value={formData.content.soap.objective}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      content: { ...formData.content, soap: { ...formData.content.soap, objective: e.target.value } },
                    })
                  }
                  className="w-full p-2.5 rounded-lg border border-border bg-surface text-text text-sm focus:ring-2 focus:ring-focus-ring"
                  placeholder="Affect congruent, alert, speech normal..."
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-text uppercase">Assessment (A) — Diagnostic progress, cognitive distortions</label>
                <textarea
                  rows={2}
                  value={formData.content.soap.assessment}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      content: { ...formData.content, soap: { ...formData.content.soap, assessment: e.target.value } },
                    })
                  }
                  className="w-full p-2.5 rounded-lg border border-border bg-surface text-text text-sm focus:ring-2 focus:ring-focus-ring"
                  placeholder="Client demonstrated improved awareness of catastrophizing..."
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-text uppercase">Plan (P) — Homework, interventions, next session</label>
                <textarea
                  rows={2}
                  value={formData.content.soap.plan}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      content: { ...formData.content, soap: { ...formData.content.soap, plan: e.target.value } },
                    })
                  }
                  className="w-full p-2.5 rounded-lg border border-border bg-surface text-text text-sm focus:ring-2 focus:ring-focus-ring"
                  placeholder="Complete behavioral experiment; next appointment on Monday..."
                />
              </div>
            </div>
          )}

          {formData.noteType === 'dap' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-text uppercase">Data (D) — Session content & client presentation</label>
                <textarea
                  rows={3}
                  value={formData.content.dap.data}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      content: { ...formData.content, dap: { ...formData.content.dap, data: e.target.value } },
                    })
                  }
                  className="w-full p-2.5 rounded-lg border border-border bg-surface text-text text-sm focus:ring-2 focus:ring-focus-ring"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-text uppercase">Assessment (A) — Clinical evaluation</label>
                <textarea
                  rows={2}
                  value={formData.content.dap.assessment}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      content: { ...formData.content, dap: { ...formData.content.dap, assessment: e.target.value } },
                    })
                  }
                  className="w-full p-2.5 rounded-lg border border-border bg-surface text-text text-sm focus:ring-2 focus:ring-focus-ring"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-text uppercase">Plan (P) — Treatment trajectory</label>
                <textarea
                  rows={2}
                  value={formData.content.dap.plan}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      content: { ...formData.content, dap: { ...formData.content.dap, plan: e.target.value } },
                    })
                  }
                  className="w-full p-2.5 rounded-lg border border-border bg-surface text-text text-sm focus:ring-2 focus:ring-focus-ring"
                />
              </div>
            </div>
          )}

          {formData.noteType === 'freeform' && (
            <div>
              <label className="block text-xs font-semibold text-text uppercase tracking-wider mb-1">
                Clinical Content (Rich Text)
              </label>
              <textarea
                rows={6}
                required
                value={formData.content.freeform.body}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    content: { ...formData.content, freeform: { body: e.target.value } },
                  })
                }
                placeholder="Write clinical documentation, reflection points, or therapeutic instructions..."
                className="w-full p-3 rounded-lg border border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-focus-ring font-sans leading-relaxed"
              />
            </div>
          )}

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={savingNote}>
              Save Clinical Note
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
