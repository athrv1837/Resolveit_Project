const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api';

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
    const res = await fetch(`${API_BASE}/complaints/user?email=${encodeURIComponent(email)}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) throw new Error(await res.text());
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

  async getOfficers(token?: string) {
    const res = await fetch(`${API_BASE}/officers`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) throw new Error(await res.text());
    return handleRes(res);
  },

  async getPendingOfficers(token?: string) {
    const res = await fetch(`${API_BASE}/officers/pending`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) throw new Error(await res.text());
    return handleRes(res);
  }
};

export default api;
