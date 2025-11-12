import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Complaint, ComplaintStatus, ComplaintPriority, Note, Reply, Officer } from '../types';

const API_BASE = "http://localhost:8080/api";

interface ComplaintContextType {
  complaints: Complaint[];
  officers: Officer[];
  addComplaint: (data: Omit<Complaint, 'id' | 'status' | 'priority' | 'submittedAt' | 'notes' | 'replies'>) => string;
  updateComplaintStatus: (id: string, status: ComplaintStatus) => void;
  updateComplaintPriority: (id: string, priority: ComplaintPriority) => void;
  assignComplaint: (id: string, officerEmail: string) => Promise<void>;
  addNote: (complaintId: string, note: Omit<Note, 'id' | 'createdAt'>) => void;
  addReply: (complaintId: string, reply: Omit<Reply, 'id' | 'createdAt'>) => void;
  getOfficerWorkload: (officerEmail: string) => { assigned: number; inProgress: number; completed: number; };
}

const ComplaintContext = createContext<ComplaintContextType | undefined>(undefined);

const generateId = () => `CMP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

const officers: Officer[] = [
  { id: 'OFF-001', name: 'Sarah Johnson', email: 'officer@example.com', department: 'Infrastructure' },
  { id: 'OFF-002', name: 'Michael Chen', email: 'officer2@example.com', department: 'Utilities' },
  { id: 'OFF-003', name: 'Emily Rodriguez', email: 'officer3@example.com', department: 'Public Safety' },
  { id: 'OFF-004', name: 'David Kim', email: 'officer4@example.com', department: 'Infrastructure' },
  { id: 'OFF-005', name: 'Jessica Williams', email: 'officer5@example.com', department: 'Environmental Services' },
];

export const ComplaintProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  const fetchComplaints = async () => {
    try {
      const res = await fetch(`${API_BASE}/complaints`);
      if (!res.ok) throw new Error("Failed to fetch complaints");
      const data = await res.json();
      setComplaints(data);
    } catch (err) {
      console.error("Error fetching complaints:", err);
    }
  };

  const addComplaint = (data: Omit<Complaint, 'id' | 'status' | 'priority' | 'submittedAt' | 'notes' | 'replies'>) => {
    const id = generateId();
    const newComplaint: Complaint = {
      ...data,
      id,
      status: 'pending',
      priority: 'medium',
      submittedAt: new Date(),
      notes: [],
      replies: [],
    };
    setComplaints(prev => [newComplaint, ...prev]);
    return id;
  };

  const updateComplaintStatus = (id: string, status: ComplaintStatus) => {
    setComplaints(prev => prev.map(c => (c.id === id ? { ...c, status } : c)));
  };

  const updateComplaintPriority = (id: string, priority: ComplaintPriority) => {
    setComplaints(prev => prev.map(c => (c.id === id ? { ...c, priority } : c)));
  };

  const assignComplaint = async (id: string, officerEmail: string) => {
    try {
      const res = await fetch(`${API_BASE}/complaints/assign/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officerEmail }),
      });

      if (!res.ok) throw new Error('Failed to assign complaint');
      const updatedComplaint = await res.json();

      setComplaints(prev =>
        prev.map(c => (c.id === updatedComplaint.id ? updatedComplaint : c))
      );
    } catch (err) {
      console.error('Error assigning complaint:', err);
      alert('Failed to assign complaint');
    }
  };

  const addNote = (complaintId: string, note: Omit<Note, 'id' | 'createdAt'>) => {
    const newNote: Note = { ...note, id: generateId(), createdAt: new Date() };
    setComplaints(prev =>
      prev.map(c => (c.id === complaintId ? { ...c, notes: [...c.notes, newNote] } : c))
    );
  };

  const addReply = (complaintId: string, reply: Omit<Reply, 'id' | 'createdAt'>) => {
    const newReply: Reply = {
      ...reply,
      id: generateId(),
      createdAt: new Date(),
      isAdminReply: reply.createdBy.includes('admin'),
    };
    setComplaints(prev =>
      prev.map(c => (c.id === complaintId ? { ...c, replies: [...c.replies, newReply] } : c))
    );
  };

  const getOfficerWorkload = (officerEmail: string) => {
    const officerComplaints = complaints.filter(c => c.assignedTo === officerEmail);
    return {
      assigned: officerComplaints.filter(c => c.status === 'assigned' || c.status === 'pending').length,
      inProgress: officerComplaints.filter(c => c.status === 'in-progress').length,
      completed: officerComplaints.filter(c => c.status === 'resolved').length,
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
