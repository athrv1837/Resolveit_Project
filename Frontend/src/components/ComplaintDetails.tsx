import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useComplaints } from '../context/ComplaintContext';
import { Complaint } from '../types';
import { Header } from './shared/Header';
import { Footer } from './shared/Footer';
import { ComplaintCard } from './shared/ComplaintCard';
import { FileImage, ArrowLeft, UserCheck } from 'lucide-react';

const statusSteps = [
  { key: 'pending', label: 'Submitted' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'escalated', label: 'Escalated' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'closed', label: 'Closed' },
];

export const ComplaintDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isOfficer, isCitizen, token } = useAuth();
  const { complaints, officers, addReply, addNote, updateComplaintStatus, updateComplaintPriority, assignComplaint } = useComplaints();

  const [complaint, setComplaint] = useState<Complaint | null>(() => {
    if (!id) return null;
    return complaints.find(c => String(c.id) === String(id)) || null;
  });
  const [loading, setLoading] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [noteContent, setNoteContent] = useState('');

  // role-specific UI state
  const [selectedOfficer, setSelectedOfficer] = useState<string | undefined>(undefined);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  useEffect(() => {
    if (complaint?.assignedTo) setSelectedOfficer(complaint.assignedTo);
  }, [complaint]);

  const handleAssign = async () => {
    if (!complaint || !selectedOfficer) return;
    setLoading(true);
    try {
      await assignComplaint(complaint.id, selectedOfficer);
      const fresh = complaints.find(c => c.id === complaint.id);
      if (fresh) setComplaint(fresh);
      alert('Assignment updated');
    } catch (err) {
      console.error(err);
      alert('Failed to assign officer');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: any) => {
    if (!complaint) return;
    setStatusUpdateLoading(true);
    try {
      await updateComplaintStatus(complaint.id, newStatus);
      const fresh = complaints.find(c => c.id === complaint.id);
      if (fresh) setComplaint(fresh);
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      // Prefer context value first
      if (id) {
        const found = complaints.find(c => String(c.id) === String(id));
        if (found) {
          if (mounted) setComplaint(found);
          return;
        }

        // Fetch single complaint from backend when not present in context (direct link or refresh)
        try {
          const data = await (await import('../lib/api')).default.getComplaintById(id, token);
          if (mounted && data) setComplaint((Array.isArray(data) ? data[0] : data) as Complaint);
        } catch (err) {
          console.warn('Could not fetch complaint by id:', err);
          if (mounted) setComplaint(null);
        }
      }
    };
    load();
    return () => { mounted = false; };
  }, [id, complaints]);

  useEffect(() => {
    // keep local state updated if context changes
    if (!complaint || !complaints) return;
    const fresh = complaints.find(c => c.id === complaint.id);
    if (fresh && fresh !== complaint) setComplaint(fresh);
  }, [complaints, complaint]);

  const normalizeStatus = (s?: any) => {
    if (!s) return 'pending';
    return String(s).toLowerCase().replace(/_/g, '-');
  };

  const timeline = useMemo(() => {
    if (!complaint) return [];
    const events: { label: string; date?: string; done?: boolean }[] = [];

    const s = normalizeStatus(complaint.status);

    // Submitted
    if (complaint.submittedAt) events.push({ label: 'Submitted', date: new Date(complaint.submittedAt).toLocaleString(), done: true });

    // Assigned
    if (complaint.assignedTo) {
      events.push({ label: `Assigned to ${complaint.assignedTo}`, done: ['assigned','in-progress','escalated','resolved','closed'].includes(s) });
    }

    // Replies (each reply is an event)
    (complaint.replies || []).forEach(r => {
      events.push({ label: `${r.isAdminReply ? 'Authority' : 'Citizen'} reply: ${r.content?.slice(0,80)}`,
        date: r.createdAt ? new Date(r.createdAt).toLocaleString() : undefined, done: true });
    });

    // Escalated
    if (complaint.escalated) events.push({ label: `Escalated (Level ${complaint.escalationLevel || '?'})`, date: complaint.escalatedAt ? new Date(complaint.escalatedAt).toLocaleString() : undefined, done: true });

    // Final status event
    events.push({ label: `Status: ${s}`, date: complaint.lastUpdatedAt ? new Date(complaint.lastUpdatedAt).toLocaleString() : undefined, done: ['resolved','closed'].includes(s) });

    // If no events were found other than status, show a placeholder
    if (events.length === 0) {
      events.push({ label: 'No timeline events yet', done: false });
    }

    return events;
  }, [complaint]);

  const handleSendReply = async () => {
    if (!complaint) return;
    if (!replyContent.trim()) return alert('Please write a reply.');

    setLoading(true);
    try {
      await addReply(complaint.id, { content: replyContent.trim(), isAdminReply: (isAdmin() || isOfficer()), createdBy: user?.name || user?.email || 'Me' });
      setReplyContent('');
      // refresh complaint from context
      const fresh = complaints.find(c => c.id === complaint.id);
      if (fresh) setComplaint(fresh);
    } catch (err) {
      console.error(err);
      alert('Failed to send reply');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!complaint) return;
    if (!noteContent.trim()) return alert('Note empty');
    setLoading(true);
    try {
      await addNote(complaint.id, { content: noteContent.trim(), isPrivate: true, createdBy: user?.name || user?.email || 'Me' });
      setNoteContent('');
      const fresh = complaints.find(c => c.id === complaint.id);
      if (fresh) setComplaint(fresh);
    } catch (err) {
      console.error(err);
      alert('Failed to save note');
    } finally {
      setLoading(false);
    }
  };

  if (!id) return <div className="p-12">Invalid complaint</div>;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <Header title={`Complaint #${id}`} subtitle="Complaint Details" icon={<ArrowLeft className="w-5 h-5 text-white" />} />

      <main className="flex-1 container-custom py-8">
        <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: details + replies (full width) */}
          <div className="lg:col-span-3 space-y-6">
            {complaint ? (
              <div className="card p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <ComplaintCard complaint={complaint} />

                    {/* Admin: assignment card (kept under complaint card) */}
                    {isAdmin() && (
                      <div className="mt-4 p-4 bg-white border rounded-md shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="rounded-full bg-indigo-50 p-2">
                              <UserCheck className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-800">Assignment</div>
                              <div className="text-xs text-slate-500">Assign this complaint to an officer for handling</div>
                            </div>
                          </div>
                          <div className="text-sm text-slate-600">Current: <span className="font-medium text-slate-800">{complaint?.assignedTo || 'Unassigned'}</span></div>
                        </div>

                        <div className="flex gap-3 items-center">
                          <select className="flex-grow border rounded p-2 shadow-sm focus:ring-1 focus:ring-indigo-500" value={selectedOfficer || ''} onChange={(e) => setSelectedOfficer(e.target.value)}>
                            <option value="">-- Select officer --</option>
                            {(officers || []).map((o: any) => (
                              <option key={o.email} value={o.email}>{o.name} — {o.department}</option>
                            ))}
                          </select>

                          <button className="inline-flex items-center gap-2 px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60" onClick={handleAssign} disabled={loading || !selectedOfficer}>
                            <UserCheck className="w-4 h-4 text-white" />
                            <span className="text-sm">{loading ? 'Assigning...' : 'Assign'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    <div className="mt-6">
                      <p className="text-xs text-slate-600 uppercase font-semibold mb-2">Description</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg">{complaint.description}</p>
                    </div>

                    {/* Attachments */}
                    <div className="mt-4">
                      <p className="text-xs text-slate-600 uppercase font-semibold mb-2 flex items-center gap-2"><FileImage className="w-4 h-4" /> Attachments</p>
                      <div className="space-y-2">
                        {complaint.attachments && complaint.attachments.length > 0 ? (
                          complaint.attachments.map((a, i) => (
                            <a key={i} href={a} target="_blank" rel="noreferrer" className="block text-sm text-blue-600 hover:underline truncate">{a.split('/').pop() || `Attachment ${i+1}`}</a>
                          ))
                        ) : (
                          <div className="text-sm text-slate-500">No attachments</div>
                        )}
                      </div>
                    </div>

                    {/* Reply box */}
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Post a message</label>
                      <textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)} rows={4} className="w-full rounded-md border p-3 resize-none" placeholder="Write your message to the other party..." />
                      <div className="flex items-center justify-between mt-3">
                        <div className="text-sm text-slate-500">{(replyContent || '').length}/2000</div>
                        <div className="flex gap-2">
                          <button onClick={() => { setReplyContent(''); }} className="btn-ghost" disabled={loading}>Cancel</button>
                          <button onClick={handleSendReply} disabled={loading || !replyContent.trim()} className="btn-primary">{loading ? 'Sending...' : 'Send'}</button>
                        </div>
                      </div>
                    </div>

                    {/* Replies list */}
                    <div className="mt-6">
                      <h4 className="font-semibold mb-3">Conversation</h4>
                        <div className="space-y-3 max-h-72 overflow-y-auto">
                          {(complaint.replies || []).length === 0 ? (
                            <div className="text-sm text-slate-500">No messages yet</div>
                          ) : (
                            (complaint.replies || []).map((r) => (
                              <div key={r.id} className={`p-3 rounded-lg ${r.isAdminReply ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50 border border-slate-200'}`}>
                                <p className="font-medium text-slate-800">{r.content}</p>
                                <div className="text-xs text-slate-500 mt-1">{r.createdBy || (r.isAdminReply ? 'Authority' : 'Citizen')} • {r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                    {/* Internal note area (only officer/admin) */}
                    {(isAdmin() || isOfficer()) && (
                      <div className="mt-6">
                        <h4 className="font-semibold mb-3">Internal Notes</h4>
                        <textarea value={noteContent} onChange={e => setNoteContent(e.target.value)} rows={3} className="w-full rounded-md border p-3 resize-none" placeholder="Add an internal note..." />
                        <div className="flex justify-end gap-2 mt-3">
                          <button onClick={() => setNoteContent('')} className="btn-ghost">Cancel</button>
                          <button onClick={handleAddNote} className="btn-primary" disabled={loading || !noteContent.trim()}>Save Note</button>
                        </div>
                        <div className="space-y-2 mt-4 max-h-56 overflow-y-auto">
                          {(complaint.notes || []).length === 0 ? (
                            <div className="text-sm text-slate-500">No internal notes</div>
                          ) : (
                            (complaint.notes || []).map(n => (
                              <div key={n.id} className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs">
                                <p className="font-medium text-slate-800">{n.content}</p>
                                <p className="text-slate-500 mt-1">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-1 space-y-6">
                    {/* Citizen timeline */}
                    {isCitizen() && (
                      <div className="mt-6 p-4 bg-white border rounded-md shadow-sm">
                        <h4 className="font-semibold mb-2">Progress</h4>
                        <div className="space-y-3">
                          {statusSteps.map((s, idx) => {
                            const currentIndex = statusSteps.findIndex(st => st.key === (complaint?.status || 'pending'));
                            const done = idx <= currentIndex;
                            let date: string | undefined;
                            if (!complaint) date = undefined;
                            else if (s.key === 'pending') date = complaint.submittedAt;
                            else if (s.key === 'assigned') date = complaint.assignedTo ? complaint.lastUpdatedAt : undefined;
                            else if (s.key === 'in-progress') date = complaint.lastUpdatedAt;
                            else if (s.key === 'escalated') date = complaint.escalatedAt;
                            else if (s.key === 'resolved' || s.key === 'closed') date = complaint.lastUpdatedAt;

                            return (
                              <div key={s.key} className="flex items-start gap-3">
                                <div className="flex flex-col items-center">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${done ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                    <span className="text-xs font-semibold">{done ? '✓' : idx + 1}</span>
                                  </div>
                                  {idx < statusSteps.length - 1 && (
                                    <div className={`w-px h-8 ${done ? 'bg-green-500' : 'bg-slate-200'}`} />
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium text-slate-800">{s.label}</div>
                                  {date && <div className="text-xs text-slate-500">{new Date(date).toLocaleString()}</div>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Officer actions */}
                    {isOfficer() && (
                      <div className="mt-6 p-4 bg-white border rounded-md shadow-sm">
                        <h4 className="font-semibold mb-2">Officer Actions</h4>
                        <div className="space-y-3">
                          <div className="text-sm text-slate-600">Assigned to: <span className="font-medium">{complaint?.assignedTo || 'Unassigned'}</span></div>
                          <div>
                            <label className="text-xs text-slate-500 block mb-1">Update status</label>
                            <select className="w-full border rounded p-2" value={normalizeStatus(complaint?.status)} onChange={(e) => handleStatusChange(e.target.value)}>
                              <option value="pending">Pending</option>
                              <option value="assigned">Assigned</option>
                              <option value="in-progress">In Progress</option>
                              <option value="escalated">Escalated</option>
                              <option value="resolved">Resolved</option>
                              <option value="closed">Closed</option>
                            </select>
                          </div>
                          <div className="flex justify-end gap-2">
                            <button className="btn-ghost" disabled={statusUpdateLoading} onClick={() => handleStatusChange('resolved')}>Mark Resolved</button>
                            <button className="btn-primary" disabled={statusUpdateLoading} onClick={() => handleStatusChange('escalated')}>Escalate</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card p-12 text-center">Complaint not found in current list.</div>
            )}
          </div>


        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ComplaintDetails;
