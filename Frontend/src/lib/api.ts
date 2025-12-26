export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api';

async function handleRes(res: Response) {
  const txt = await res.text();
  try { return JSON.parse(txt); } catch { return txt; }
}

export const api = {
  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error(await res.text());
    return handleRes(res);
  },

  async register(name: string, email: string, password: string, role: string) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });
    if (!res.ok) throw new Error(await res.text());
    return handleRes(res);
  },

  async me(token?: string) {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) throw new Error(await res.text());
    return handleRes(res);
  },

  async submitComplaint(data: any, email: string, token?: string) {
    // if data.files present, send multipart
    if (data.files && data.files.length) {
      const fd = new FormData();
      const jsonBlob = new Blob([JSON.stringify({ title: data.title, description: data.description, category: data.category, isAnonymous: data.isAnonymous, priority: data.priority })], { type: 'application/json' });
      fd.append('data', jsonBlob);
      for (const f of data.files) fd.append('files', f);
      const res = await fetch(`${API_BASE}/complaints/submit-with-files?email=${encodeURIComponent(email)}`, {
        method: 'POST',
        body: fd,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(await res.text());
      return handleRes(res);
    }

    const res = await fetch(`${API_BASE}/complaints/submit?email=${encodeURIComponent(email)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ title: data.title, description: data.description, category: data.category, isAnonymous: data.isAnonymous, priority: data.priority }),
    });
    if (!res.ok) throw new Error(await res.text());
    return handleRes(res);
  },

  async getUserComplaints(email: string, token?: string) {
    if (!email || !email.trim()) throw new Error('email is required');
    const res = await fetch(`${API_BASE}/complaints/user?email=${encodeURIComponent(email)}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(body || `Request failed with status ${res.status}`);
    }
    return handleRes(res);
  },

  async getAllComplaints(token?: string) {
    const res = await fetch(`${API_BASE}/complaints`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) throw new Error(await res.text());
    return handleRes(res);
  },

  async assignOfficer(complaintId: number | string, officerEmail: string, token?: string) {
    const res = await fetch(`${API_BASE}/admin/complaints/${complaintId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ officerEmail }),
    });
    if (!res.ok) throw new Error(await res.text());
    return handleRes(res);
  },

  async analyticsOverview(token?: string) {
    const res = await fetch(`${API_BASE}/admin/analytics/overview`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) throw new Error(await res.text());
    return handleRes(res);
  }
  ,

  async escalateComplaint(id: number | string, level: number, reason: string, requestedBy?: string, token?: string) {
    const res = await fetch(`${API_BASE}/complaints/${id}/escalate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ level: String(level), reason, requestedBy }),
    });
    if (!res.ok) throw new Error(await res.text());
    return handleRes(res);
  }
,

  async getOfficers(token?: string) {
    const res = await fetch(`${API_BASE}/officers`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) throw new Error(await res.text());
    return handleRes(res);
  },

  async updateComplaintStatus(id: number | string, status: string , requestedBy : string, token?: string) {
    const res = await fetch(`${API_BASE}/complaints/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ status , requestedBy}),
    });
    if (!res.ok) throw new Error(await res.text());
    return handleRes(res);
  },

  async updateComplaintPriority(id: number | string, priority: string, token?: string) {
    const res = await fetch(`${API_BASE}/complaints/${id}/priority`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ priority }),
    });
    if (!res.ok) throw new Error(await res.text());
    return handleRes(res);
  },

  async addNote(id: number | string, content: string, isPrivate = true, token?: string) {
    const res = await fetch(`${API_BASE}/complaints/${id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ content, isPrivate }),
    });
    if (!res.ok) throw new Error(await res.text());
    return handleRes(res);
  },

  async addReply(id: number | string, content: string, isAdminReply = true, token?: string) {
    const res = await fetch(`${API_BASE}/complaints/${id}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ content, isAdminReply }),
    });
    if (!res.ok) throw new Error(await res.text());
    return handleRes(res);
  },

  async approveOfficer(id: number | string, token?: string) {
    const res = await fetch(`${API_BASE}/admin/approve/${id}`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) throw new Error(await res.text());
    return handleRes(res);
  },

  async rejectOfficer(id: number | string, token?: string) {
    const res = await fetch(`${API_BASE}/admin/reject/${id}`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) throw new Error(await res.text());
    return handleRes(res);
  },

  async requestPasswordReset(email: string) {
    const res = await fetch(`${API_BASE}/auth/password-reset/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || `Request failed with status ${res.status}`);
    }
    return handleRes(res);
  },

  async resetPassword(token: string, newPassword: string) {
    const res = await fetch(`${API_BASE}/auth/password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || `Request failed with status ${res.status}`);
    }
    return handleRes(res);
  },

  async getPendingOfficers(token?: string) {
    const res = await fetch(`${API_BASE}/officers/pending`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) throw new Error(await res.text());
    return handleRes(res);
  },

  async getOfficerComplaints(email: string, token?: string) {
    if (!email || !email.trim()) throw new Error('email is required');
    const res = await fetch(`${API_BASE}/officer/complaints?email=${encodeURIComponent(email)}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(body || `Request failed with status ${res.status}`);
    }
    return handleRes(res);
  },
};

export default api;
