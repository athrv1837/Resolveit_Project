import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useComplaints } from '../context/ComplaintContext';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, FileText, Clock, TrendingUp, CheckCircle2, AlertTriangle,
  User, Calendar, FileImage, MessageSquare, FileText as NoteIcon,
  UserCheck, Loader2
} from 'lucide-react';
import { Header } from './shared/Header';
import { Footer } from './shared/Footer';
import { StatCard } from './shared/StatCard';
import { ComplaintCard } from './shared/ComplaintCard';
import { Complaint, ComplaintStatus } from '../types';
import RoleGuard from './RoleGuard';
import api from '../lib/api';



export const OfficerDashboard: React.FC = () => {
  const { user, getAuthHeaders, token } = useAuth();
  const { complaints: contextComplaints } = useComplaints();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [noteContent, setNoteContent] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalationReason, setEscalationReason] = useState('');
  const [escalationLevel, setEscalationLevel] = useState(1);
  const navigate = useNavigate();

  // Auto-refresh polling interval
  const COMPLAINTS_POLL_INTERVAL = 12000; // 12 seconds

  // Use context complaints and sync to local state
  useEffect(() => {
    if (contextComplaints && contextComplaints.length > 0) {
      console.log('Officer Dashboard: Received complaints from context:', contextComplaints.length);
      setComplaints(contextComplaints);
      setLoading(false);
    } else if (contextComplaints) {
      console.log('Officer Dashboard: No complaints in context');
      setComplaints([]);
      setLoading(false);
    }
  }, [contextComplaints]);

  // Old local fetch removed - now using context data

  // Update status
  const updateStatus = async (id: number, status: ComplaintStatus) => {
    try {
      console.log("Updating status for complaint", id, "to", status);
      await api.updateComplaintStatus(id, status,user?.name,token ?? undefined);
      setComplaints(prev => prev.map(c => c.id === id ? { ...c, status } : c));
      if (selectedComplaint?.id === id) {
        setSelectedComplaint({ ...selectedComplaint, status });
      }
    } catch {
      alert("Failed to update status. Try again.");
    }
  };



  // Add internal note
  const addInternalNote = async () => {
    if (!selectedComplaint || !noteContent.trim()) return;

    try {
      const newNote = await api.addNote(selectedComplaint.id, noteContent, true, token ?? undefined);
      const updatedComplaint = {
        ...selectedComplaint,
        notes: [...(selectedComplaint.notes || []), newNote]
      };

      setComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? updatedComplaint : c));
      setSelectedComplaint(updatedComplaint);
      setNoteContent('');
      setShowNoteModal(false);
    } catch {
      alert("Failed to save note.");
    }
  };

  const stats = {
    total: complaints.length,
    assigned: complaints.filter(c => c.status === 'assigned').length,
    inProgress: complaints.filter(c => c.status === 'in-progress').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    highPriority: complaints.filter(c => c.priority.toLowerCase() === 'high').length, // ← NOW CORRECT!
  };

  if (!user) {
    return <div className="text-center py-32 text-xl">Please log in as an officer.</div>;
  }

  // DEBUG: log complaints state so we can see updates and why UI might still show empty
  useEffect(() => {
    console.log('Officer complaints state updated:', complaints.length, complaints.map(c => ({ id: c.id, status: c.status, assignedTo: c.assignedTo }))); 
  }, [complaints]);

  return (
    <RoleGuard allowed={['officer', 'admin']}>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-slate-50">
        <Header 
          title="Officer Portal - Grievance Resolution" 
          subtitle={`${user.name || user.email.split('@')[0]} | Assigned Cases`} 
          icon={<Shield className="w-7 h-7 text-white" />} 
        />

      <main className="flex-1 container-custom py-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-5 mb-12">
          <StatCard label="Total Assigned" value={stats.total} icon={<FileText className="w-6 h-6" />} color="blue" />
          <StatCard label="Pending Action" value={stats.assigned} icon={<Clock className="w-6 h-6" />} color="amber" />
          <StatCard label="In Progress" value={stats.inProgress} icon={<TrendingUp className="w-6 h-6" />} color="cyan" />
          <StatCard label="Resolved" value={stats.resolved} icon={<CheckCircle2 className="w-6 h-6" />} color="green" />
          <StatCard label="High Priority" value={stats.highPriority} icon={<AlertTriangle className="w-6 h-6" />} color="red" />
        </div>
        {/* Priority breakdown */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard label="Low" value={complaints.filter(c => c.priority === 'low').length} icon={<FileText className="w-6 h-6" />} color="green" />
          <StatCard label="Medium" value={complaints.filter(c => c.priority === 'medium').length} icon={<FileText className="w-6 h-6" />} color="amber" />
          <StatCard label="High/Urgent" value={complaints.filter(c => c.priority === 'high' || c.priority === 'urgent').length} icon={<FileText className="w-6 h-6" />} color="red" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Complaints List */}
          <div className="lg:col-span-2 space-y-5">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <UserCheck className="w-7 h-7 text-cyan-600" />
              My Assigned Complaints
            </h2>

            {loading ? (
              <div className="card p-20 text-center shadow-2xl border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center animate-pulse shadow-xl">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
                <p className="text-lg font-bold text-slate-700 mb-2">Loading your assignments...</p>
                <p className="text-sm text-slate-500">Please wait a moment</p>
              </div>
            ) : complaints.length === 0 ? (
              <div className="card p-20 text-center shadow-2xl border-2 border-slate-200 bg-gradient-to-br from-white to-cyan-50/30">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-200 to-blue-200 flex items-center justify-center">
                  <FileText className="w-10 h-10 text-cyan-600" />
                </div>
                <p className="text-xl font-bold text-slate-800 mb-2">No complaints assigned yet</p>
                <p className="text-sm text-slate-600 font-medium">Check back later for new assignments!</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-4 mb-6 flex-wrap">
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field w-48 font-semibold shadow-lg">
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="assigned">Assigned</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>

                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input-field w-52 font-semibold shadow-lg">
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="priority-high">Priority (High → Low)</option>
                    <option value="priority-low">Priority (Low → High)</option>
                  </select>

                  <button onClick={() => { setFilterStatus('all'); setSortBy('newest'); }} className="btn-ghost font-bold">Clear Filters</button>
                </div>

                <div className="space-y-4">
                  {complaints
                    .filter(c => filterStatus === 'all' || c.status === filterStatus)
                    .sort((a, b) => {
                      if (sortBy === 'newest') return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
                      if (sortBy === 'oldest') return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
                      if (sortBy === 'priority-high') {
                        const order: any = { urgent: 4, high: 3, medium: 2, low: 1 };
                        return (order[b.priority] || 0) - (order[a.priority] || 0);
                      }
                      if (sortBy === 'priority-low') {
                        const order: any = { urgent: 4, high: 3, medium: 2, low: 1 };
                        return (order[a.priority] || 0) - (order[b.priority] || 0);
                      }
                      return 0;
                    })
                    .map((complaint) => (
                      <ComplaintCard
                        key={complaint.id}
                        complaint={complaint}
                        isSelected={selectedComplaint?.id === complaint.id}
                        onSelect={() => navigate(`/complaint/${complaint.id}`)}
                        showStatus={true}
                        showPriority={true}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Detail Panel */}
          <div className="lg:col-span-1">
            {selectedComplaint ? (
              <div className="card p-6 sticky top-24 space-y-6 max-h-[calc(100vh-10rem)] overflow-y-auto bg-white/90 backdrop-blur">
                {/* Header - BULLETPROOF PRIORITY BADGE */}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-slate-600 uppercase font-semibold">Reference</p>
                    <p className="font-mono text-2xl font-bold text-slate-900">{selectedComplaint.referenceNumber || `#${selectedComplaint.id}`}</p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-xs font-bold tracking-wider shadow-sm ${
                    selectedComplaint.priority.toLowerCase() === 'high' ? 'bg-red-500 text-white' :
                    selectedComplaint.priority.toLowerCase() === 'medium' ? 'bg-amber-500 text-white' :
                    'bg-green-500 text-white'
                  }`}>
                    {selectedComplaint.priority.toUpperCase()} PRIORITY
                  </span>
                </div>

                {/* Citizen Info */}
                <div className="space-y-3 py-4 border-y border-slate-200">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-slate-500" />
                    <span className="font-medium text-slate-700">
                      {selectedComplaint.isAnonymous ? 'Anonymous Citizen' : selectedComplaint.citizenName || 'Citizen'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-slate-500" />
                    <span className="text-slate-600">
                      {new Date(selectedComplaint.submittedAt).toLocaleString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className="text-xs text-slate-600 uppercase font-semibold mb-2">Description</p>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-lg">
                    {selectedComplaint.description}
                  </p>
                </div>

                {/* Attachments */}
                {selectedComplaint.attachments && selectedComplaint.attachments.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-600 uppercase font-semibold mb-2 flex items-center gap-2">
                      <FileImage className="w-4 h-4" />
                      Attachments ({selectedComplaint.attachments.length})
                    </p>
                    <div className="space-y-2">
                      {selectedComplaint.attachments.map((file, i) => (
                        <a key={i} href={file} target="_blank" rel="noopener noreferrer"
                           className="block text-sm text-blue-600 hover:underline truncate">
                          {file.split('/').pop() || `Attachment ${i + 1}`}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status Update */}
                <div>
                  <label className="text-xs text-slate-600 uppercase font-semibold mb-2 block">Update Status</label>
                  <select
                    value={selectedComplaint.status}
                    onChange={(e) => updateStatus(selectedComplaint.id, e.target.value as ComplaintStatus)}
                    className="input-field w-full font-medium"
                  >
                    <option value="assigned">Assigned</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                  <button
                    onClick={() => setShowNoteModal(true)}
                    className="btn-secondary flex items-center justify-center gap-2 py-3 text-sm font-medium"
                  >
                    <NoteIcon className="w-4 h-4" />
                    Note
                  </button>
                  <button
                    onClick={() => setShowEscalateModal(true)}
                    className="btn-ghost flex items-center justify-center gap-2 py-3 text-sm font-medium"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    Escalate
                  </button>
                </div>

                {/* Admin Updates */}
                {selectedComplaint.replies?.filter(r => r.isAdminReply).length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold text-sm mb-3 text-slate-800">Admin Updates</h4>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {selectedComplaint.replies
                        .filter(r => r.isAdminReply)
                        .map((reply) => (
                          <div key={reply.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
                            <p className="font-medium text-slate-800">{reply.content}</p>
                            <p className="text-slate-500 mt-1">
                              {new Date(reply.createdAt).toLocaleDateString()} at {new Date(reply.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Your Notes */}
                {selectedComplaint.notes?.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold text-sm mb-3 text-slate-800">Your Internal Notes</h4>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {selectedComplaint.notes.map((note) => (
                        <div key={note.id} className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs">
                          <p className="font-medium text-slate-800">{note.content}</p>
                          <p className="text-slate-500 mt-1">
                            {new Date(note.createdAt).toLocaleDateString()} at {new Date(note.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card p-16 text-center bg-white/80">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-lg text-slate-600 font-medium">Select a complaint</p>
                <p className="text-sm text-slate-500">to view details and take action</p>
              </div>
            )}
          </div>
        </div>
      </main>



      {/* Escalation Modal */}
      {showEscalateModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card p-8 max-w-2xl w-full animate-slide-in-up">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <AlertTriangle className="w-7 h-7 text-red-600" />
              Escalate Complaint #{selectedComplaint.id}
            </h3>
            <div className="grid gap-4">
              <div>
                <label className="text-sm font-semibold">Escalation Level</label>
                <input type="number" min={1} value={escalationLevel} onChange={e => setEscalationLevel(Number(e.target.value))} className="input-field mt-2" />
              </div>
              <div>
                <label className="text-sm font-semibold">Reason</label>
                <textarea value={escalationReason} onChange={e => setEscalationReason(e.target.value)} className="input-field mt-2" rows={4} />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button onClick={async () => {
                try {
                  await api.escalateComplaint(selectedComplaint.id, escalationLevel, escalationReason, user?.email, token);
                  alert('Escalation submitted');
                  // Optimistic update
                  setComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? { ...c, escalated: true, escalationLevel, escalationReason } : c));
                  setSelectedComplaint(prev => prev ? { ...prev, escalated: true, escalationLevel, escalationReason } : prev);
                  setShowEscalateModal(false);
                  setEscalationReason('');
                  setEscalationLevel(1);
                  // Trigger analytics refresh (best-effort)
                  try { await api.analyticsOverview(token); } catch (err) { /* ignore */ }
                } catch (err) {
                  console.error(err);
                  alert('Failed to escalate.');
                }
              }} className="btn-primary flex-1 py-3">Escalate</button>
              <button onClick={() => setShowEscalateModal(false)} className="btn-ghost flex-1 py-3">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Internal Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card p-8 max-w-2xl w-full animate-slide-in-up">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <NoteIcon className="w-7 h-7 text-purple-600" />
              Internal Note (Admin Only)
            </h3>
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="input-field w-full h-40 resize-none mb-4 text-base"
              placeholder="Add investigation notes, evidence, or completion details..."
              maxLength={2000}
            />
            <div className="text-right text-sm text-slate-500 mb-4">
              {noteContent.length}/2000
            </div>
            <div className="flex gap-4">
              <button onClick={addInternalNote} className="btn-primary flex-1 py-3 text-lg font-semibold">
                Save Note
              </button>
              <button 
                onClick={() => { setShowNoteModal(false); setNoteContent(''); }} 
                className="btn-ghost flex-1 py-3 text-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

        <Footer />
      </div>
    </RoleGuard>
  );
};