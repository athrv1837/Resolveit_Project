import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from 'react-router-dom';
import {
  Shield, Search, Filter, ChevronDown, MessageSquare, CheckCircle2,
  AlertTriangle, TrendingUp, Clock, FileText, User, UserCheck,
  Users, FileImage, Calendar, StickyNote, X, Loader2, AlertCircle
} from "lucide-react";
import { Header } from "./shared/Header";
import { Footer } from "./shared/Footer";
import { StatCard } from "./shared/StatCard";
import { ComplaintCard } from "./shared/ComplaintCard";
import { Complaint, ComplaintStatus, ComplaintPriority } from "../types";
import api, { API_BASE } from '../lib/api';
import { ChartContainer, ChartTooltip } from './ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

import RoleGuard from './RoleGuard';

export const AdminDashboard: React.FC = () => {
  const { getAuthHeaders, token } = useAuth();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [loading, setLoading] = useState(true);

  // Officer Requests Modal
  const [showOfficerRequestModal, setShowOfficerRequestModal] = useState(false);
  const [pendingOfficerRequests, setPendingOfficerRequests] = useState<any[]>([]);
  const [loadingOfficers, setLoadingOfficers] = useState(false);

  // Assign Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedOfficerEmail, setSelectedOfficerEmail] = useState("");
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalationReason, setEscalationReason] = useState('');
  const [escalationLevel, setEscalationLevel] = useState(1);

  // Note Modal (reply removed, moved to details page)
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const navigate = useNavigate();

  // Officers list
  const [officers, setOfficers] = useState<{ id: number; email: string; name: string; department?: string }[]>([]);
  const [analytics, setAnalytics] = useState<any | null>(null);

  // Fetch complaints
  useEffect(() => {
    fetchComplaints();
    fetchAnalytics();
  }, [token]);

  const fetchAnalytics = async () => {
    try {
      const data = await api.analyticsOverview(token ?? undefined);
      setAnalytics(data);
    } catch (err) {
      console.warn('Failed to fetch analytics overview:', err);
    }
  };

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const data = await api.getAllComplaints(token ?? undefined);
      setComplaints(Array.isArray(data) ? data.map((c: any) => ({
        ...c,
        id: Number(c.id),
        submittedAt: c.submittedAt || new Date().toISOString(),
        notes: c.notes || [],
        replies: c.replies || [],
        attachments: c.attachments || [],
        status: c.status ? c.status.toString().toLowerCase().replace(/_/g, '-') : 'pending',
        priority: c.priority ? c.priority.toString().toLowerCase() : 'medium',
      })) : []);
    } catch (err) {
      alert("Failed to load complaints.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch officers
  useEffect(() => {
    const fetchOfficers = async () => {
      try {
        const data = await api.getOfficers(token ?? undefined);
        console.log("Officers fetched:", data);
        setOfficers(Array.isArray(data) ? data.map((o: any) => ({
          id: Number(o.id),
          email: o.email,
          name: o.name,
          department: o.department,
        })) : []);
      } catch (err) {
        console.error("Failed to load officers:", err);
      }
    };
    fetchOfficers();
  }, [token]);

  // Fetch pending officer requests
  const fetchPendingOfficerRequests = async () => {
    setLoadingOfficers(true);
    try {
      const data = await api.getPendingOfficers(token ?? undefined);
      console.log("Pending officers fetched:", data);
      setPendingOfficerRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load pending requests:", err);
      alert("Failed to load requests.");
    } finally {
      setLoadingOfficers(false);
    }
  };

  // Approve/Reject officer
  const handleApproveOfficer = async (id: number) => {
    if (!confirm("Approve officer?")) return;
    try {
      await api.approveOfficer(id, token ?? undefined);
      setPendingOfficerRequests(prev => prev.filter(r => r.id !== id));
      alert("Officer approved!");
    } catch {
      alert("Failed.");
    }
  };

  const handleRejectOfficer = async (id: number) => {
    if (!confirm("Reject officer?")) return;
    try {
      await api.rejectOfficer(id, token ?? undefined);
      setPendingOfficerRequests(prev => prev.filter(r => r.id !== id));
      alert("Officer rejected.");
    } catch {
      alert("Failed.");
    }
  };

  // Assign officer
  const assignOfficer = async () => {
    if (!selectedComplaint || !selectedOfficerEmail) return;
    setAssigning(true);
    try {
      const updated = await api.assignOfficer(selectedComplaint.id, selectedOfficerEmail, token ?? undefined);
      const updatedComplaint = { ...selectedComplaint, assignedTo: selectedOfficerEmail, status: "assigned" as ComplaintStatus };
      setComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? updatedComplaint : c));
      setSelectedComplaint(updatedComplaint);
      setShowAssignModal(false);
      setSelectedOfficerEmail("");
        // Refresh analytics after assignment
        fetchAnalytics();
      alert("Officer assigned!");
    } catch (err) {
      console.error("Failed to assign:", err);
      alert("Failed to assign.");
    } finally {
      setAssigning(false);
    }
  };

  // Update status/priority
  const updateStatus = async (id: number, status: ComplaintStatus) => {
    try {
      // convert to backend enum format (IN_PROGRESS, UNDER_REVIEW, etc.)
      const backendStatus = String(status).toUpperCase().replace(/-/g, '_');
      await api.updateComplaintStatus(id, backendStatus, null, token ?? undefined);
      setComplaints(prev => prev.map(c => c.id === id ? { ...c, status } : c));
      if (selectedComplaint?.id === id) setSelectedComplaint(prev => prev ? { ...prev, status } : null);
    } catch { alert("Failed"); }
  };

  const updatePriority = async (id: number, priority: ComplaintPriority) => {
    try {
      const backendPriority = String(priority).toUpperCase();
      await api.updateComplaintPriority(id, backendPriority, token ?? undefined);
      setComplaints(prev => prev.map(c => c.id === id ? { ...c, priority } : c));
      if (selectedComplaint?.id === id) setSelectedComplaint(prev => prev ? { ...prev, priority } : null);
    } catch { alert("Failed"); }
  };



  // Add note
  const addNote = async () => {
    if (!selectedComplaint || !noteContent.trim()) return;
    try {
      const newNote = await api.addNote(selectedComplaint.id, noteContent, true, token ?? undefined);
      const updated = { ...selectedComplaint, notes: [...(selectedComplaint.notes || []), newNote] };
      setComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? updated : c));
      setSelectedComplaint(updated);
      setNoteContent("");
      setShowNoteModal(false);
    } catch { alert("Failed"); }
  };

  const visibleComplaints = complaints
    .filter(c => {
      const matchesStatus = filterStatus === "all" || c.status === filterStatus;
      const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.id.toString().includes(searchTerm);
      return matchesStatus && matchesSearch;
    })
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
      if (sortBy === 'status-asc') return a.status.localeCompare(b.status);
      if (sortBy === 'status-desc') return b.status.localeCompare(a.status);
      return 0;
    });

  const stats = {
    total: analytics?.totalComplaints ?? complaints.length,
    pending: analytics?.pending ?? complaints.filter(c => c.status === "pending").length,
    assigned: analytics?.assigned ?? complaints.filter(c => ["assigned", "in-progress"].includes(c.status)).length,
    resolved: analytics?.resolved ?? complaints.filter(c => c.status === "resolved").length,
    highPriority: analytics?.highPriority ?? complaints.filter(c => c.priority === "high").length,
  };

  // Chart data
  // Use analytics data when available; otherwise compute from complaints
  const priorityData = analytics?.priorityBreakdown
    ? [
        { name: 'Low', value: Number(analytics.priorityBreakdown.low || 0), color: '#10B981' },
        { name: 'Medium', value: Number(analytics.priorityBreakdown.medium || 0), color: '#F59E0B' },
        { name: 'High', value: Number(analytics.priorityBreakdown.high || 0), color: '#EF4444' },
        { name: 'Urgent', value: Number(analytics.priorityBreakdown.urgent || 0), color: '#B91C1C' },
      ]
    : [
        { name: 'Low', value: complaints.filter(c => c.priority === 'low').length, color: '#10B981' },
        { name: 'Medium', value: complaints.filter(c => c.priority === 'medium').length, color: '#F59E0B' },
        { name: 'High', value: complaints.filter(c => c.priority === 'high').length, color: '#EF4444' },
        { name: 'Urgent', value: complaints.filter(c => c.priority === 'urgent').length, color: '#B91C1C' },
      ];

  const statusOrder = ['pending', 'assigned', 'in-progress', 'resolved', 'escalated', 'closed'];
  const statusData = analytics?.statusBreakdown
    ? statusOrder.map(k => ({ name: k === 'in-progress' ? 'In Progress' : k.charAt(0).toUpperCase() + k.slice(1), value: Number(analytics.statusBreakdown[k] || 0) })).filter(s => s.value > 0)
    : [
        { name: 'Pending', value: complaints.filter(c => c.status === 'pending').length },
        { name: 'Assigned', value: complaints.filter(c => c.status === 'assigned').length },
        { name: 'In Progress', value: complaints.filter(c => ['in-progress', 'under-review'].includes(c.status)).length },
        { name: 'Resolved', value: complaints.filter(c => c.status === 'resolved').length },
        { name: 'Escalated', value: complaints.filter(c => c.status === 'escalated').length },
        { name: 'Closed', value: complaints.filter(c => c.status === 'closed').length },
      ];

  const workloadData = (analytics?.workload
    ? Object.entries(analytics.workload).map(([email, count]) => {
        const off = officers.find((o: any) => o.email === email);
        return { email, name: off?.name ?? (email?.split('@')[0] ?? email), count };
      })
    : officers.map(o => ({ email: o.email, name: o.name ?? o.email.split('@')[0], count: complaintRepositoryFallbackCount(complaints, o.email) }))).sort((a: any, b: any) => b.count - a.count);

  // Shorten name for X-axis labels (keep it readable) and show full name+email in tooltips
  const formatLabelTick = (label: string) => {
    if (!label) return '';
    return label.length > 15 ? label.slice(0, 15) + '…' : label;
  };

  function complaintRepositoryFallbackCount(list: any[], email: string) {
    return list.filter(c => c.assignedTo === email).length;
  }

  return (
    <RoleGuard allowed={['admin']}>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-slate-50">
        <Header title="Authority Control Panel" subtitle="Grievance Management & Audit" icon={<Shield className="w-7 h-7 text-white" />} />

      <main className="flex-1 container-custom py-12">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-12">
          <StatCard label="Total" value={stats.total} icon={<FileText />} color="blue" />
          <StatCard label="Pending" value={stats.pending} icon={<Clock />} color="amber" />
          <StatCard label="Assigned" value={stats.assigned} icon={<TrendingUp />} color="cyan" />
          <StatCard label="Resolved" value={stats.resolved} icon={<CheckCircle2 />} color="green" />
          <StatCard label="High Priority" value={stats.highPriority} icon={<AlertTriangle />} color="red" />
        </div>

        <div className="flex items-center justify-end mb-6">
          <button onClick={() => { fetchAnalytics(); fetchComplaints(); }} className="btn-ghost">Refresh Analytics</button>
        </div>

        {/* Charts: workload larger, priority smaller for compact view */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-start">
          <div className="card p-4 lg:col-span-2">
            <h3 className="font-bold text-lg mb-3">Officer Workload</h3>
            <div style={{ height: 360 }} className="rounded-lg overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workloadData.slice(0, 12)} margin={{ left: 8, right: 8 }} barSize={36} barCategoryGap="20%">
                  <XAxis dataKey="name" type="category" tickFormatter={formatLabelTick} tick={{ angle: -45, textAnchor: 'end' } as any} height={80} interval={0} />
                  <YAxis allowDecimals={false} domain={[0, 'dataMax']} />
                  <Tooltip
                    formatter={(value: any) => [value, 'count']}
                    labelFormatter={(label: string) => {
                      const item = workloadData.find((d: any) => d.name === label);
                      return `Officer: ${label}${item?.email ? ' (' + item.email + ')' : ''}`;
                    }}
                  />
                  <Bar dataKey="count" fill="#0EA5A4" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-sm text-slate-500">Showing top officers. Workload is number of assigned complaints.</div>
          </div>

          <div className="card p-4 lg:col-span-1">
            <h3 className="font-bold text-lg mb-3">Priority Distribution</h3>
            <div style={{ height: 160 }} className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  {(() => {
                    const total = priorityData.reduce((s, p) => s + (p.value || 0), 0);
                    const pieData = total > 0 ? priorityData.filter(p => p.value > 0) : [{ name: 'none', value: 1, color: '#e5e7eb' }];
                    return (
                      <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={30} outerRadius={56} label={false} stroke="none">
                        {pieData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    );
                  })()}
                  <Tooltip formatter={(value: any) => [value, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-sm text-slate-500">{priorityData.map(p => `${p.name}: ${p.value}`).join(' · ')}</div>
          </div>
        </div>
        {/* Status breakdown - compact */}
        <div className="card p-4 mb-8">
          <h3 className="font-bold text-lg mb-3">Status Breakdown</h3>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ left: 8, right: 8 }}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#2563EB" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 text-sm text-slate-500">Counts by current status from analytics.</div>
        </div>

        {/* Filters */}
        <div className="card p-6 mb-8 shadow-lg">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search complaints..."
                className="input-field pl-12"
              />
            </div>

            <div className="flex gap-3 items-center">
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="input-field w-44"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="escalated">Escalated</option>
                <option value="closed">Closed</option>
              </select>

              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input-field w-48">
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="priority-high">Priority (High → Low)</option>
                <option value="priority-low">Priority (Low → High)</option>
                <option value="status-asc">Status A→Z</option>
                <option value="status-desc">Status Z→A</option>
              </select>

              <button onClick={() => { setFilterStatus('all'); setSortBy('newest'); setSearchTerm(''); }} className="btn-ghost">
                Clear
              </button>

              <button
                onClick={() => { fetchPendingOfficerRequests(); setShowOfficerRequestModal(true); }}
                className="btn-primary whitespace-nowrap"
              >
                <Users className="w-5 h-5" /> Officer Requests
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* List */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="text-center py-20">Loading...</div>
            ) : visibleComplaints.length === 0 ? (
              <div className="card p-20 text-center">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-xl text-slate-500">No complaints found</p>
              </div>
            ) : (
              visibleComplaints.map(c => (
                <ComplaintCard
                  key={c.id}
                  complaint={c}
                  isSelected={selectedComplaint?.id === c.id}
                  onSelect={() => navigate(`/complaint/${c.id}`)}
                  showStatus={true}
                  showPriority={true}
                />
              ))
            )}
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-1">
            {selectedComplaint ? (
              <div className="card p-6 sticky top-24 space-y-6 max-h-[calc(100vh-10rem)] overflow-y-auto">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs uppercase text-slate-600 font-bold">Reference</p>
                    <p className="text-2xl font-mono font-bold text-cyan-600">{selectedComplaint.referenceNumber || `#${selectedComplaint.id}`}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    selectedComplaint.priority === 'high' ? 'bg-red-100 text-red-700' :
                    selectedComplaint.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {selectedComplaint.priority.toUpperCase()}
                  </span>
                </div>

                {/* Citizen */}
                <div className="py-4 border-y">
                  <p className="text-xs uppercase font-bold text-slate-600 mb-3">Citizen</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{selectedComplaint.isAnonymous ? 'Anonymous' : selectedComplaint.citizenName || 'Citizen'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(selectedComplaint.submittedAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className="text-xs uppercase font-bold text-slate-600 mb-2">Description</p>
                  <p className="text-sm bg-slate-50 p-4 rounded-lg">{selectedComplaint.description}</p>
                </div>

                {/* Assign Officer Button */}
                <button
                  onClick={() => {
                    setSelectedOfficerEmail(selectedComplaint.assignedTo || "");
                    setShowAssignModal(true);
                  }}
                  className="w-full btn-primary py-4 text-lg font-bold flex items-center justify-center gap-3"
                >
                  <UserCheck className="w-6 h-6" />
                  {selectedComplaint.assignedTo ? "Reassign Officer" : "Assign Officer"}
                </button>

                {/* Status & Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs uppercase font-bold text-slate-600 block mb-2">Status</label>
                    <select
                      value={selectedComplaint.status}
                      onChange={e => updateStatus(selectedComplaint.id, e.target.value as ComplaintStatus)}
                      className="input-field"
                    >
                      <option value="pending">Pending</option>
                      <option value="assigned">Assigned</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="escalated">Escalated</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs uppercase font-bold text-slate-600 block mb-2">Priority</label>
                    <select
                      value={selectedComplaint.priority}
                      onChange={e => updatePriority(selectedComplaint.id, e.target.value as ComplaintPriority)}
                      className="input-field"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setShowNoteModal(true)} className="btn-secondary py-3">
                    <StickyNote className="w-5 h-5" /> Note
                  </button>
                  <button onClick={() => setShowEscalateModal(true)} className="btn-ghost py-3">
                    <AlertTriangle className="w-5 h-5 text-red-500" /> Escalate
                  </button>
                </div>

                {/* Replies & Notes */}
                {selectedComplaint.replies?.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="font-bold mb-3">Replies</h4>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {selectedComplaint.replies.map(r => (
                        <div key={r.id} className="p-3 bg-blue-50 rounded-lg text-sm">
                          <p className="font-medium">{r.content}</p>
                          <p className="text-xs text-slate-600">{new Date(r.createdAt).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedComplaint.notes?.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="font-bold mb-3">Notes</h4>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {selectedComplaint.notes.map(n => (
                        <div key={n.id} className="p-3 bg-purple-50 rounded-lg text-sm">
                          <p className="font-medium">{n.content}</p>
                          <p className="text-xs text-slate-600">{new Date(n.createdAt).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card p-20 text-center">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-xl text-slate-600">Select a complaint</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Assign Officer Modal */}
      {showAssignModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card p-8 max-w-lg w-full animate-slide-in-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-3">
                <UserCheck className="w-8 h-8 text-cyan-600" />
                Assign Officer
              </h3>
              <button onClick={() => setShowAssignModal(false)} className="text-2xl"><X /></button>
            </div>

            <p className="text-slate-600 mb-6">Complaint ID: <span className="font-mono font-bold">#{selectedComplaint.id}</span></p>

            <select
              value={selectedOfficerEmail}
              onChange={e => setSelectedOfficerEmail(e.target.value)}
              className="input-field w-full text-lg py-4 mb-6"
            >
              <option value="">-- Select Officer --</option>
              {officers.map(o => (
                <option key={o.id} value={o.email}>
                  {o.name} ({o.department || "No Dept"}) – {o.email}
                </option>
              ))}
            </select>

            {officers.length === 0 && (
              <p className="text-amber-600 flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5" />
                No approved officers. Approve from requests.
              </p>
            )}

            <div className="flex gap-4">
              <button onClick={() => setShowAssignModal(false)} className="flex-1 btn-ghost py-4 text-lg">Cancel</button>
              <button
                onClick={assignOfficer}
                disabled={assigning || !selectedOfficerEmail}
                className="flex-1 btn-primary py-4 text-lg font-bold flex items-center justify-center gap-3 disabled:opacity-60"
              >
                {assigning ? <Loader2 className="w-6 h-6 animate-spin" /> : <UserCheck className="w-6 h-6" />}
                {assigning ? "Assigning..." : "Assign Officer"}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  await api.escalateComplaint(selectedComplaint.id, escalationLevel, escalationReason, null, token ?? undefined);
                  alert('Escalation submitted');
                  setComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? { ...c, escalated: true, escalationLevel, escalationReason } : c));
                  setSelectedComplaint(prev => prev ? { ...prev, escalated: true, escalationLevel, escalationReason } : prev);
                  setShowEscalateModal(false);
                  setEscalationReason('');
                  setEscalationLevel(1);
                  fetchAnalytics();
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



      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card p-8 max-w-2xl w-full">
            <h3 className="text-2xl font-bold mb-6">Internal Note</h3>
            <textarea
              value={noteContent}
              onChange={e => setNoteContent(e.target.value)}
              className="input-field w-full h-40 resize-none mb-4"
              placeholder="Private note..."
            />
            <div className="flex gap-4">
              <button onClick={() => { setShowNoteModal(false); setNoteContent(""); }} className="flex-1 btn-ghost py-4">Cancel</button>
              <button onClick={addNote} className="flex-1 btn-primary py-4 font-bold">Save Note</button>
            </div>
          </div>
        </div>
      )}

      {/* Officer Requests Modal */}
      {showOfficerRequestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card p-8 max-w-4xl w-full max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Officer Approval Requests</h3>
              <button onClick={() => setShowOfficerRequestModal(false)}><X className="w-8 h-8" /></button>
            </div>
            {loadingOfficers ? (
              <p className="text-center py-20">Loading...</p>
            ) : pendingOfficerRequests.length === 0 ? (
              <p className="text-center py-20 text-slate-500">No pending requests</p>
            ) : (
              <div className="space-y-4">
                {pendingOfficerRequests.map(r => (
                  <div key={r.id} className="card p-6 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-lg">{r.name}</p>
                      <p className="text-slate-600">{r.email} • {r.department}</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => handleApproveOfficer(r.id)} className="btn-primary px-6 py-3">Approve</button>
                      <button onClick={() => handleRejectOfficer(r.id)} className="btn-ghost px-6 py-3 text-red-600">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

        <Footer />
      </div>
    </RoleGuard>
  );
};