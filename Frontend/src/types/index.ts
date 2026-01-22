// src/types/index.ts

export type UserRole = 'citizen' | 'officer' | 'admin';

export type OfficerAvailability = 'Free' | 'Busy' | 'Overloaded';

export interface Officer {
  id: number;
  name: string;
  email: string;
  department: string;
  availability?: OfficerAvailability;
}

//complaint statuses
export type ComplaintStatus = 'pending' | 'assigned' | 'under-review' | 'in-progress' | 'escalated' | 'resolved' | 'closed';

//priority levels with response times
export type ComplaintPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface User {
  email: string;
  name: string;
  role: UserRole;
}

export interface Note {
  id: number;
  content: string;
  createdBy: string;
  createdAt: string;
  isPrivate: boolean;
}

export interface Reply {
  id: number;
  content: string;
  createdBy: string;
  createdAt: string;
  isAdminReply?: boolean;
}

export interface StatusHistory {
  id: number;
  status: string;
  changedAt: string;
  changedBy: string;
  notes?: string;
}

export interface Feedback {
  id: number;
  content: string;
  rating?: number;
  createdAt: string;
  visibleToOfficer: boolean;
}

export interface Complaint {
  id: number;
  referenceNumber?: string;              //Government reference (GRV-XXXXX)
  title: string;
  description: string;
  category: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  assignedTo?: string;
  assignedDepartment?: string;        //Department of assigned officer
  isAnonymous: boolean;
  submittedBy: string;
  submittedAt: string;
  lastUpdatedAt?: string;             // Audit tracking
  lastUpdatedBy?: string;             // Audit tracking
  attachmentCount?: number;           // For summary display
  attachments?: string[];

  // Escalation info
  escalated?: boolean;
  escalationLevel?: number;
  escalationReason?: string;
  escalatedAt?: string;

  //citizenName now exists
  citizenName?: string;

  // Relations
  user?: {
    id: number;
    email: string;
    name: string;
  };

  assignedOfficer?: Officer;

  notes: Note[];
  replies: Reply[];
  statusHistory?: StatusHistory[];
  feedback?: Feedback;
}

//ComplaintCardProps now includes showPriority
export interface ComplaintCardProps {
  complaint: Complaint;
  isSelected?: boolean;
  onSelect?: (complaint: Complaint) => void;
  showStatus?: boolean;
  showPriority?: boolean;
}