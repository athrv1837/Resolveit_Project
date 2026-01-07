import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useComplaints } from '../context/ComplaintContext';
import { Complaint } from '../types';
import { Header } from './shared/Header';
import { Footer } from './shared/Footer';
import { ComplaintCard } from './shared/ComplaintCard';
import { FileImage, ArrowLeft, UserCheck, X, Download, Eye, FileText, Music, Play } from 'lucide-react';

const statusSteps = [
  { key: 'pending', label: 'Submitted' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'escalated', label: 'Escalated' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'closed', label: 'Closed' },
];

// Utility to detect file type
const getFileType = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
  const videoExts = ['mp4', 'webm', 'mov', 'avi', 'mkv'];
  const audioExts = ['mp3', 'wav', 'ogg', 'm4a', 'flac'];
  const docExts = ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'];
  
  if (imageExts.includes(ext)) return 'image';
  if (videoExts.includes(ext)) return 'video';
  if (audioExts.includes(ext)) return 'audio';
  if (docExts.includes(ext)) return 'document';
  return 'file';
};

// Get icon for file type
const getFileIcon = (fileName: string) => {
  const type = getFileType(fileName);
  switch (type) {
    case 'image': return <FileImage className="w-5 h-5 text-blue-500" />;
    case 'video': return <Play className="w-5 h-5 text-purple-500" />;
    case 'audio': return <Music className="w-5 h-5 text-green-500" />;
    default: return <FileText className="w-5 h-5 text-slate-500" />;
  }
};

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
  const [selectedAttachment, setSelectedAttachment] = useState<string | null>(null);

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
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-cyan-50/40">
      <Header title={`Complaint #${id}`} subtitle="Complaint Details" icon={<ArrowLeft className="w-5 h-5 text-white" />} />

      <main className="flex-1 container-custom py-10">
        <button onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors duration-200 hover:translate-x-1 bg-white px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg border-2 border-slate-200 hover:border-blue-300">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Complaint Details, Description, Attachments */}
          <div className="space-y-8">
            {complaint ? (
              <>
                <div className="card p-8 shadow-2xl border-2 border-slate-200/70 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] transition-all duration-300">
                  <ComplaintCard complaint={complaint} />
                </div>

                {/* Admin: assignment card */}
                {isAdmin() && (
                  <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50/50 border-2 border-indigo-200 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
                        <div className="flex items-start justify-between mb-5">
                          <div className="flex items-center gap-4">
                            <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 p-3 shadow-lg">
                              <UserCheck className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <div className="text-base font-extrabold text-slate-900">Assignment</div>
                              <div className="text-sm text-slate-600 font-medium">Assign this complaint to an officer for handling</div>
                            </div>
                          </div>
                          <div className="text-sm text-slate-700 bg-white px-4 py-2 rounded-xl border-2 border-indigo-200 shadow-md">Current: <span className="font-extrabold text-indigo-700">{complaint?.assignedTo || 'Unassigned'}</span></div>
                        </div>

                        <div className="flex gap-4 items-center">
                          <select className="flex-grow border-2 border-indigo-300 rounded-xl p-3 shadow-lg focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium bg-white transition-all duration-200" value={selectedOfficer || ''} onChange={(e) => setSelectedOfficer(e.target.value)}>
                            <option value="">-- Select officer --</option>
                            {(officers || []).map((o: any) => (
                              <option key={o.email} value={o.email}>{o.name} — {o.department}</option>
                            ))}
                          </select>

                          <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105" onClick={handleAssign} disabled={loading || !selectedOfficer}>
                            <UserCheck className="w-5 h-5 text-white" />
                            <span className="text-sm">{loading ? 'Assigning...' : 'Assign'}</span>
                          </button>
                        </div>
                  </div>
                )}

                {/* Description */}
                <div className="card p-8 shadow-2xl border-2 border-slate-200/70">
                      <p className="text-xs text-slate-600 uppercase font-extrabold tracking-wider mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        DESCRIPTION
                      </p>
                      <p className="text-base text-slate-800 whitespace-pre-wrap bg-gradient-to-br from-slate-50 to-blue-50/30 p-6 rounded-2xl border-2 border-slate-200 shadow-lg font-medium leading-relaxed">{complaint.description}</p>
                    </div>

                {/* Attachments */}
                <div className="card p-8 shadow-2xl border-2 border-slate-200/70">
                      <p className="text-xs text-slate-600 uppercase font-extrabold tracking-wider mb-4 flex items-center gap-2">
                        <FileImage className="w-4 h-4 text-blue-600" /> 
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        ATTACHMENTS
                      </p>
                      <div className="space-y-3">
                        {complaint.attachments && complaint.attachments.length > 0 ? (
                          complaint.attachments.map((a, i) => {
                            const fileName = a.split('/').pop() || `Attachment ${i+1}`;
                            const fileType = getFileType(fileName);
                            return (
                              <div key={i} className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-cyan-50 px-4 py-3 rounded-xl border-2 border-blue-200 hover:border-blue-400 transition-all duration-200 group">
                                <div className="flex-shrink-0">
                                  {getFileIcon(fileName)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <a href={a} download className="block text-sm font-semibold text-blue-700 hover:text-blue-600 truncate group-hover:underline">
                                    {fileName}
                                  </a>
                                  <p className="text-xs text-slate-600 font-medium capitalize">{fileType}</p>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                  {fileType === 'image' && (
                                    <button
                                      onClick={() => setSelectedAttachment(a)}
                                      className="p-2 hover:bg-blue-200 rounded-lg transition-colors text-blue-700 hover:text-blue-900"
                                      title="Preview image"
                                    >
                                      <Eye className="w-5 h-5" />
                                    </button>
                                  )}
                                  <a href={a} download className="p-2 hover:bg-blue-200 rounded-lg transition-colors text-blue-700 hover:text-blue-900" title="Download">
                                    <Download className="w-5 h-5" />
                                  </a>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-sm text-slate-500 font-medium bg-slate-50 px-4 py-3 rounded-xl border-2 border-slate-200">No attachments</div>
                        )}
                      </div>
                    </div>

                {/* Internal Notes (only officer/admin) */}
                {(isAdmin() || isOfficer()) && (
                  <div className="card p-8 shadow-2xl border-2 border-slate-200/70">
                    <h4 className="font-extrabold text-lg mb-4 tracking-tight text-slate-900">Internal Notes</h4>
                    <textarea value={noteContent} onChange={e => setNoteContent(e.target.value)} rows={3} className="w-full rounded-2xl border-2 border-purple-300 p-4 resize-none shadow-lg focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 font-medium transition-all duration-200 bg-purple-50/30" placeholder="Add an internal note..." />
                    <div className="flex justify-end gap-3 mt-4">
                      <button onClick={() => setNoteContent('')} className="btn-ghost">Cancel</button>
                      <button onClick={handleAddNote} className="btn-primary bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700" disabled={loading || !noteContent.trim()}>Save Note</button>
                    </div>
                    <div className="space-y-3 mt-6 max-h-72 overflow-y-auto pr-2">
                      {(complaint.notes || []).length === 0 ? (
                        <div className="text-sm text-slate-500 font-medium bg-purple-50 px-4 py-6 rounded-2xl border-2 border-purple-200 text-center">No internal notes</div>
                      ) : (
                        (complaint.notes || []).map(n => (
                          <div key={n.id} className="p-5 bg-gradient-to-br from-purple-50 to-indigo-50/50 border-2 border-purple-300 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200">
                            <p className="font-semibold text-slate-900 leading-relaxed">{n.content}</p>
                            <p className="text-xs text-slate-600 mt-2 font-semibold">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="card p-16 text-center shadow-2xl border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50">
                <p className="text-lg font-bold text-slate-700">Complaint not found in current list.</p>
              </div>
            )}
          </div>

          {/* Right Column: Timeline, Actions, Conversation */}
          <div className="space-y-8">
            {complaint && (
              <>
                {/* Citizen Timeline */}
                {isCitizen() && (
                  <div className="card p-8 shadow-2xl border-2 border-slate-200/70">
                    <h4 className="font-extrabold text-lg mb-5 tracking-tight text-slate-900">Progress</h4>
                    <div className="space-y-4">
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
                          <div key={s.key} className="flex items-start gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${done ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-green-500/40' : 'bg-slate-200 text-slate-600'}`}>
                                <span className="text-sm font-extrabold">{done ? '✓' : idx + 1}</span>
                              </div>
                              {idx < statusSteps.length - 1 && (
                                <div className={`w-0.5 h-10 transition-all duration-300 ${done ? 'bg-gradient-to-b from-green-500 to-emerald-500' : 'bg-slate-200'}`} />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{s.label}</div>
                              {date && <div className="text-xs text-slate-600 mt-1 font-semibold">{new Date(date).toLocaleString()}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Officer Actions Panel */}
                {isOfficer() && (
                  <div className="card p-8 shadow-2xl border-2 border-slate-200/70">
                    <h4 className="font-extrabold text-lg mb-5 tracking-tight text-slate-900">Officer Actions</h4>
                    <div className="space-y-5">
                      <div className="text-sm text-slate-700 font-medium bg-white px-4 py-3 rounded-xl border-2 border-blue-200 shadow-md">Assigned to: <span className="font-extrabold text-blue-700">{complaint?.assignedTo || 'Unassigned'}</span></div>
                      <div>
                        <label className="text-xs text-slate-600 block mb-2 font-extrabold tracking-wider uppercase">Update status</label>
                        <select className="w-full border-2 border-blue-300 rounded-xl p-3 shadow-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 font-semibold bg-white transition-all duration-200" value={normalizeStatus(complaint?.status)} onChange={(e) => handleStatusChange(e.target.value)}>
                          <option value="pending">Pending</option>
                          <option value="assigned">Assigned</option>
                          <option value="in-progress">In Progress</option>
                          <option value="escalated">Escalated</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                      <div className="flex justify-end gap-3 pt-2">
                        <button className="btn-ghost hover:bg-green-50 hover:text-green-700 border-2 border-transparent hover:border-green-300" disabled={statusUpdateLoading} onClick={() => handleStatusChange('resolved')}>Mark Resolved</button>
                        <button className="btn-primary" disabled={statusUpdateLoading} onClick={() => handleStatusChange('escalated')}>Escalate</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Conversation Section */}
                <div className="card p-8 shadow-2xl border-2 border-slate-200/70">
                  <h4 className="font-extrabold text-lg mb-4 tracking-tight text-slate-900">Conversation</h4>
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2 mb-6">
                    {(complaint.replies || []).length === 0 ? (
                      <div className="text-sm text-slate-500 font-medium bg-slate-50 px-4 py-8 rounded-2xl border-2 border-slate-200 text-center">No messages yet</div>
                    ) : (
                      (complaint.replies || []).map((r) => (
                        <div key={r.id} className={`p-5 rounded-2xl shadow-lg border-2 transition-all duration-200 hover:shadow-xl ${r.isAdminReply ? 'bg-gradient-to-br from-blue-50 to-cyan-50/50 border-blue-300 hover:border-blue-400' : 'bg-gradient-to-br from-slate-50 to-slate-100/50 border-slate-300 hover:border-slate-400'}`}>
                          <p className="font-semibold text-slate-900 leading-relaxed">{r.content}</p>
                          <div className="text-xs text-slate-600 mt-2 font-semibold">{r.createdBy || (r.isAdminReply ? 'Authority' : 'Citizen')} • {r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Reply Input */}
                  <div className="border-t-2 border-slate-200 pt-6">
                    <label className="block text-sm font-extrabold text-slate-800 mb-3 tracking-wide">Post a message</label>
                    <textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)} rows={4} className="w-full rounded-2xl border-2 border-slate-300 p-4 resize-none shadow-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 font-medium transition-all duration-200" placeholder="Write your message to the other party..." />
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-slate-500 font-semibold">{(replyContent || '').length}/2000</div>
                      <div className="flex gap-3">
                        <button onClick={() => { setReplyContent(''); }} className="btn-ghost" disabled={loading}>Cancel</button>
                        <button onClick={handleSendReply} disabled={loading || !replyContent.trim()} className="btn-primary">{loading ? 'Sending...' : 'Send'}</button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Image Preview Modal */}
      {selectedAttachment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-slideInUp">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                Attachment Preview
              </h3>
              <button
                onClick={() => setSelectedAttachment(null)}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-slate-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-6 bg-slate-50">
              {getFileType(selectedAttachment.split('/').pop() || '') === 'image' ? (
                <img
                  src={selectedAttachment}
                  alt="Attachment preview"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              ) : (
                <div className="text-center">
                  <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 font-medium">Preview not available for this file type</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t-2 border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="text-sm text-slate-600 font-medium">
                {selectedAttachment.split('/').pop()}
              </div>
              <div className="flex gap-3">
                <a
                  href={selectedAttachment}
                  download
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <Download className="w-5 h-5" />
                  Download
                </a>
                <button
                  onClick={() => setSelectedAttachment(null)}
                  className="px-4 py-2 bg-slate-200 text-slate-900 rounded-lg font-semibold hover:bg-slate-300 transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ComplaintDetails;
