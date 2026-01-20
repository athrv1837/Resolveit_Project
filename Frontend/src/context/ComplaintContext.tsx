import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Complaint, ComplaintStatus, ComplaintPriority, Note, Reply, Officer } from '../types';
import api from '../lib/api';
import { useAuth } from './AuthContext';

interface ComplaintContextType {
  complaints: Complaint[];
  officers: Officer[];
  addComplaint: (data: Omit<Complaint, 'id' | 'status' | 'priority' | 'submittedAt' | 'notes' | 'replies'> & { files?: File[] }) => Promise<number | null>;
  updateComplaintStatus: (id: number | string, status: ComplaintStatus) => Promise<void>;
  updateComplaintPriority: (id: number | string, priority: ComplaintPriority) => Promise<void>;
  assignComplaint: (id: number | string, officerEmail: string) => Promise<void>;
  addNote: (complaintId: number | string, note: Omit<Note, 'id' | 'createdAt'>) => Promise<void>;
  addReply: (complaintId: number | string, reply: Omit<Reply, 'id' | 'createdAt'>) => Promise<void>;
  getOfficerWorkload: (officerEmail: string) => { assigned: number; inProgress: number; completed: number; };
}

const ComplaintContext = createContext<ComplaintContextType | undefined>(undefined);

const generateId = () => `CMP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

// Normalize backend enums (e.g. IN_PROGRESS -> in-progress)
const normalizeStatus = (s?: string) => {
  if (!s) return 'pending';
  return String(s).toLowerCase().replace(/_/g, '-');
};

const normalizePriority = (p?: string) => (p ? String(p).toLowerCase() : 'medium');

const normalizeComplaint = (c: any): Complaint => ({
  id: c.id,
  referenceNumber: c.referenceNumber,
  title: c.title || 'Untitled Complaint',
  description: c.description || '',
  category: c.category || 'General',
  status: normalizeStatus(c.status) as ComplaintStatus,
  priority: normalizePriority(c.priority) as ComplaintPriority,
  assignedTo: c.assignedTo || undefined,
  assignedDepartment: c.assignedDepartment || c.assignedOfficer?.department || undefined,
  isAnonymous: !!c.isAnonymous,
  submittedBy: c.submittedBy || c.user?.email,
  submittedAt: c.submittedAt || c.submittedAt,
  lastUpdatedAt: c.lastUpdatedAt || undefined,
  lastUpdatedBy: c.lastUpdatedBy || undefined,
  attachmentCount: (c.attachments && c.attachments.length) || c.attachmentCount || 0,
  attachments: c.attachments || [],
  escalated: !!c.escalated,
  escalationLevel: c.escalationLevel,
  escalationReason: c.escalationReason,
  escalatedAt: c.escalatedAt,
  citizenName: c.user?.name || c.citizenName,
  user: c.user ? { id: c.user.id, email: c.user.email, name: c.user.name } : undefined,
  assignedOfficer: c.assignedOfficer ? { ...c.assignedOfficer } : undefined,
  notes: c.notes || [],
  replies: (c.replies || []).map((r: any) => ({
    id: r.id,
    content: r.content,
    createdBy: r.createdBy || r.authorName || r.createdBy,
    authorName: (typeof r.isAdminReply !== 'undefined' ? r.isAdminReply : (typeof r.adminReply !== 'undefined' ? r.adminReply : false)) ? 'Authority' : (r.createdBy || r.authorName || 'Citizen'),
    createdAt: r.createdAt || r.createdAt,
    isAdminReply: typeof r.isAdminReply !== 'undefined' ? r.isAdminReply : (typeof r.adminReply !== 'undefined' ? r.adminReply : false),
  })),

  feedback: c.feedback || undefined,
});

export const ComplaintProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);

  // Polling intervals (in milliseconds)
  const COMPLAINTS_POLL_INTERVAL = 10000; // 10 seconds
  const OFFICERS_POLL_INTERVAL = 30000; // 30 seconds

  const fetchComplaints = async () => {
    try {
      console.log('fetchComplaints: user=', user?.email, 'role=', user?.role, 'tokenPresent=', !!token);
      let data;
      if (user?.role === 'admin') {
        // Admin gets all complaints
        console.log('Fetching ALL complaints (admin)');
        data = await api.getAllComplaints(token ?? undefined);
      } else if (user?.role === 'officer') {
        // Officer gets only assigned complaints
        if (!user?.email) {
          console.warn('Officer email not available');
          setComplaints([]);
          return;
        }
        console.log('Fetching officer complaints for:', user.email);
        data = await api.getOfficerComplaints(user.email, token ?? undefined);
        console.log('Officer complaints raw data:', data);
      } else {
        // Citizen gets only their own complaints
        if (!user?.email) {
          console.warn('Citizen email not available');
          setComplaints([]);
          return;
        }
        console.log('Fetching citizen complaints for:', user.email);
        data = await api.getUserComplaints(user.email, token ?? undefined);
      }

      console.log('Data received from API:', data);
      console.log('Is data an array?', Array.isArray(data), 'Type:', typeof data);
      
      const list = Array.isArray(data) ? data.map((complaint, idx) => {
        try {
          const normalized = normalizeComplaint(complaint);
          console.log(`✓ Complaint ${idx} normalized successfully:`, normalized.id);
          return normalized;
        } catch (err) {
          console.error(`✗ Error normalizing complaint ${idx}:`, complaint, err);
          return null;
        }
      }).filter(c => c !== null) : [];
      
      console.log('Normalized complaints count:', list.length);
      console.log('Final complaints list:', list);
      setComplaints(list);
    } catch (err) {
      console.error('Error fetching complaints:', err);
    }
  };

  const fetchOfficers = async () => {
    try {
      // Only admin needs the full officers list in the UI; avoid making this call for other roles (prevents 403 noise)
      if (user?.role !== 'admin') {
        setOfficers([]);
        return;
      }

      const res = await api.getOfficers(token ?? undefined);
      setOfficers(Array.isArray(res) ? res : []);
    } catch (err) {
      console.warn('Failed to fetch officers, falling back to empty list', err);
      setOfficers([]);
    }
  };

  // Initial fetch + Setup polling
  useEffect(() => { 
    fetchComplaints();
    fetchOfficers();

    // Set up polling for complaints
    const complaintsPollInterval = setInterval(fetchComplaints, COMPLAINTS_POLL_INTERVAL);

    // Set up polling for officers (only if admin)
    let officersPollInterval: NodeJS.Timeout | null = null;
    if (user?.role === 'admin') {
      officersPollInterval = setInterval(fetchOfficers, OFFICERS_POLL_INTERVAL);
    }

    // Cleanup intervals on unmount or when user/token changes
    return () => {
      clearInterval(complaintsPollInterval);
      if (officersPollInterval) clearInterval(officersPollInterval);
    };
  }, [user, token]);

  const addComplaint = async (data: Omit<Complaint, 'id' | 'status' | 'priority' | 'submittedAt' | 'notes' | 'replies'> & { files?: File[] }) => {
    try {
      const res = await api.submitComplaint(data, user?.email ?? '', token ?? undefined);
      const created = normalizeComplaint(res);
      setComplaints(prev => [created, ...prev]);
      return created.id;
    } catch (err) {
      console.error('Error submitting complaint:', err);
      alert('Failed to submit complaint');
      return null;
    }
  };

  const updateComplaintStatus = async (id: number | string, status: ComplaintStatus) => {
    // optimistic update
    setComplaints(prev => prev.map(c => (c.id === id ? { ...c, status } : c)));
    try {
      const backendStatus = String(status).toUpperCase().replace(/-/g, '_');
      console.log('updateComplaintStatus: Converting', status, 'to', backendStatus, 'for id', id);
      console.log('updateComplaintStatus: User email:', user?.email, 'Token present:', !!token);
      const updated = await api.updateComplaintStatus(id, backendStatus, user?.email ?? undefined, token ?? undefined);
      if (updated) {
        const normalized = normalizeComplaint(updated);
        setComplaints(prev => prev.map(c => (c.id === normalized.id ? normalized : c)));
      }
      // Refresh all complaints to sync with backend
      fetchComplaints();
    } catch (err) {
      console.error('Failed to update status:', err);
      console.error('Error details:', err instanceof Error ? err.message : String(err));
      alert('Failed to update status: ' + (err instanceof Error ? err.message : String(err)));
      fetchComplaints();
    }
  };

  const updateComplaintPriority = async (id: number | string, priority: ComplaintPriority) => {
    setComplaints(prev => prev.map(c => (c.id === id ? { ...c, priority } : c)));
    try {
      const backendPriority = String(priority).toUpperCase();
      const updated = await api.updateComplaintPriority(id, backendPriority, token ?? undefined);
      if (updated) {
        const normalized = normalizeComplaint(updated);
        setComplaints(prev => prev.map(c => (c.id === normalized.id ? normalized : c)));
      }
      // Refresh all complaints to sync with backend
      fetchComplaints();
    } catch (err) {
      console.error('Failed to update priority:', err);
      alert('Failed to update priority');
      fetchComplaints();
    }
  };

  const assignComplaint = async (id: number | string, officerEmail: string) => {
    try {
      const updated = await api.assignOfficer(id, officerEmail, token ?? undefined);
      if (updated) {
        const normalized = normalizeComplaint(updated);
        setComplaints(prev => prev.map(c => (c.id === normalized.id ? normalized : c)));
      }
      // Refresh all complaints and officers to sync with backend
      fetchComplaints();
      fetchOfficers();
    } catch (err) {
      console.error('Error assigning complaint:', err);
      alert('Failed to assign complaint');
      fetchComplaints();
    }
  };

  const addNote = async (complaintId: number | string, note: Omit<Note, 'id' | 'createdAt'>) => {
    try {
      const created = await api.addNote(complaintId, note.content, note.isPrivate, token ?? undefined);
      setComplaints(prev => prev.map(c => (c.id === complaintId ? { ...c, notes: [...c.notes, created as Note] } : c)));
      // Refresh to ensure sync with backend
      fetchComplaints();
    } catch (err) {
      console.error('Error adding note:', err);
      alert('Failed to add note');
    }
  };

  const addReply = async (complaintId: number | string, reply: Omit<Reply, 'id' | 'createdAt'>) => {
    try {
      const created = await api.addReply(complaintId, reply.content, reply.isAdminReply ?? true, token ?? undefined);
      setComplaints(prev => prev.map(c => (c.id === complaintId ? { ...c, replies: [...c.replies, created as Reply] } : c)));
      // Refresh to ensure sync with backend
      fetchComplaints();
    } catch (err) {
      console.error('Error adding reply:', err);
      alert('Failed to add reply');
    }
  };

  const getOfficerWorkload = (officerEmail: string) => {
    const officerComplaints = complaints.filter(c => c.assignedTo === officerEmail);
    return {
      assigned: officerComplaints.filter(c => c.status === 'assigned' || c.status === 'pending').length,
      inProgress: officerComplaints.filter(c => c.status === 'in-progress' || c.status === 'under-review').length,
      completed: officerComplaints.filter(c => c.status === 'resolved' || c.status === 'closed').length,
    };
  };

  return (
    <ComplaintContext.Provider
      value={{
        complaints,
        officers,
        addComplaint,
        updateComplaintStatus,
        updateComplaintPriority,
        assignComplaint,
        addNote,
        addReply,
        getOfficerWorkload,
      }}
    >
      {children}
    </ComplaintContext.Provider>
  );
};

export const useComplaints = () => {
  const context = useContext(ComplaintContext);
  if (context === undefined) {
    throw new Error('useComplaints must be used within a ComplaintProvider');
  }
  return context;
};
