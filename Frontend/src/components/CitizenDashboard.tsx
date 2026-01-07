import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from 'react-router-dom';
import api from "../lib/api";
import {
  Plus,
  X,
  ChevronRight,
  Upload,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Header } from "./shared/Header";
import { Footer } from "./shared/Footer";
import { StatCard } from "./shared/StatCard";
import { ComplaintCard } from "./shared/ComplaintCard";
import RoleGuard from './RoleGuard';

const API_BASE = "http://localhost:8080/api";

export const CitizenDashboard: React.FC = () => {
  const { user, getAuthHeaders, token } = useAuth(); // ✅ added getAuthHeaders and token

  const [complaints, setComplaints] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Infrastructure");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const userComplaints = Array.isArray(complaints) ? complaints : [];

  // Auto-refresh polling interval
  const COMPLAINTS_POLL_INTERVAL = 15000; // 15 seconds

  // normalize helpers (backend may return UPPERCASE / underscored enums)
  const normalizeStatus = (s: any) => {
    if (!s) return 'pending';
    return String(s).toLowerCase().replace(/_/g, '-');
  };
  const normalizePriority = (p: any) => (p ? String(p).toLowerCase() : 'medium');

  const normalizedComplaints = userComplaints.map(c => ({ ...c, status: normalizeStatus(c.status), priority: normalizePriority(c.priority) }));

  // ✅ Fetch complaints safely with token
  const fetchComplaints = async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(
        `${API_BASE}/complaints/user?email=${user.email}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(), // ✅ attach token
          },
        }
      );

      if (!res.ok) {
        console.error("Failed to fetch complaints:", res.status);
        return;
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        setComplaints(data);
      } else {
        console.warn("Unexpected response format:", data);
        setComplaints([]);
      }
    } catch (err) {
      console.error("Error fetching complaints:", err);
      setComplaints([]);
    }
  };

  useEffect(() => {
    fetchComplaints();

    // Set up polling for complaints
    const complaintsPoll = setInterval(fetchComplaints, COMPLAINTS_POLL_INTERVAL);

    // Cleanup on unmount
    return () => clearInterval(complaintsPoll);
  }, [user]);

  // ✅ Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    setLoading(true);

    try {
      // If there are attachments, use the multipart endpoint
      if (attachments.length > 0) {
        const formData = new FormData();
        const complaintJson = {
          title,
          description,
          category,
          isAnonymous,
        };
        formData.append('data', new Blob([JSON.stringify(complaintJson)], { type: 'application/json' }));
        
        // Append all files
        attachments.forEach(file => {
          formData.append('files', file);
        });

        const res = await fetch(
          `${API_BASE}/complaints/submit-with-files?email=${user.email}`,
          {
            method: "POST",
            body: formData,
            headers: getAuthHeaders(),
          }
        );

        if (res.ok) {
          alert("Complaint submitted successfully with attachments!");
          setTitle("");
          setDescription("");
          setCategory("Infrastructure");
          setIsAnonymous(false);
          setAttachments([]);
          setShowForm(false);

          setTimeout(() => {
            fetchComplaints();
          }, 400);
        } else {
          const err = await res.text();
          alert(`Failed to submit complaint: ${err}`);
        }
      } else {
        // No attachments - use regular endpoint
        const complaintData = {
          title,
          description,
          category,
          isAnonymous,
        };

        const res = await fetch(
          `${API_BASE}/complaints/submit?email=${user.email}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...getAuthHeaders(),
            },
            body: JSON.stringify(complaintData),
          }
        );

        if (res.ok) {
          alert("Complaint submitted successfully!");
          setTitle("");
          setDescription("");
          setCategory("Infrastructure");
          setIsAnonymous(false);
          setAttachments([]);
          setShowForm(false);

          setTimeout(() => {
            fetchComplaints();
          }, 400);
        } else {
          alert("Failed to submit complaint. Try again.");
        }
      }
    } catch (error) {
      console.error("Error submitting complaint:", error);
      alert("Server error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ File upload handler - stores actual File objects
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileList = Array.from(files);
      setAttachments((prev) => [...prev, ...fileList]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };



  return (
    <RoleGuard allowed={['citizen', 'admin']}>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <Header
          title="Citizen Grievance Portal"
          subtitle="File, Track & Resolve Grievances"
          icon={<FileText className="w-6 h-6 text-white" />}
        />

      <main className="flex-1">
        <div className="container-custom py-12">
          {/* ✅ Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <StatCard
              label="Total Complaints"
              value={normalizedComplaints.length}
              icon={<FileText className="w-6 h-6" />}
              color="blue"
            />
            <StatCard
              label="Pending"
              value={normalizedComplaints.filter((c) => c.status === "pending").length}
              icon={<Clock className="w-6 h-6" />}
              color="amber"
            />
            {/* Priority breakdown for user's complaints */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Low" value={normalizedComplaints.filter((c) => c.priority === 'low').length} icon={<FileText className="w-6 h-6" />} color="green" />
              <StatCard label="Medium" value={normalizedComplaints.filter((c) => c.priority === 'medium').length} icon={<FileText className="w-6 h-6" />} color="amber" />
              <StatCard label="High" value={normalizedComplaints.filter((c) => c.priority === 'high' || c.priority === 'urgent').length} icon={<FileText className="w-6 h-6" />} color="red" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ✅ Complaint Form + List */}
            <div className="lg:col-span-2">
              <div className="card p-8 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Submit New Complaint
                  </h2>
                  {showForm && (
                    <button onClick={() => setShowForm(false)} className="btn-ghost">
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {!showForm ? (
                  <button
                    onClick={() => setShowForm(true)}
                    className="w-full btn-primary flex items-center justify-center gap-3 py-5 text-lg font-bold shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
                  >
                    <Plus className="w-6 h-6" />
                    <span>File a New Complaint</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Category */}
                    <div>
                      <label className="block text-sm font-extrabold text-slate-800 mb-3 tracking-wide uppercase text-xs">
                        Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="input-field font-semibold"
                      >
                        <option>Infrastructure</option>
                        <option>Utilities</option>
                        <option>Public Safety</option>
                        <option>Sanitation</option>
                        <option>Transportation</option>
                        <option>Healthcare</option>
                        <option>Education</option>
                        <option>Other</option>
                      </select>
                    </div>

                    {/* Title */}
                    <div>
                      <label className="block text-sm font-extrabold text-slate-800 mb-3 tracking-wide uppercase text-xs">
                        Title
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="input-field font-semibold"
                        placeholder="Brief description of your issue"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-extrabold text-slate-800 mb-3 tracking-wide uppercase text-xs">
                        Description
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        rows={6}
                        className="input-field resize-none font-medium leading-relaxed"
                        placeholder="Provide details about your complaint..."
                      />
                    </div>

                    {/* Attachments */}
                    <div>
                      <label className="block text-sm font-extrabold text-slate-800 mb-3 tracking-wide uppercase text-xs">
                        Attachments (Optional)
                      </label>
                      <label className="flex items-center justify-center w-full p-6 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-200 group">
                        <Upload className="w-5 h-5 text-slate-400 mr-2 group-hover:text-blue-500 transition-colors" />
                        <span className="text-sm text-slate-600 font-semibold group-hover:text-blue-700">
                          Upload photos or files
                        </span>
                        <input
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                      {attachments.length > 0 && (
                        <div className="space-y-2 mt-3">
                          {attachments.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between bg-blue-50 p-2 rounded-lg"
                            >
                              <span className="text-sm text-slate-700">{file.name} ({(file.size / 1024).toFixed(2)} KB)</span>
                              <button
                                type="button"
                                onClick={() => removeAttachment(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Anonymous Option */}
                    <div className="flex items-center space-x-3 p-5 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl border-2 border-slate-200 hover:border-blue-300 transition-all duration-200">
                      <input
                        type="checkbox"
                        id="anonymous"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                      <label
                        htmlFor="anonymous"
                        className="text-sm font-bold text-slate-800 cursor-pointer flex-1"
                      >
                        Submit Anonymously
                      </label>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-4 pt-6">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 btn-primary py-4 text-base font-bold shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="animate-spin">⏳</span> Submitting...
                          </span>
                        ) : "Submit Complaint"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="flex-1 btn-secondary py-4 text-base font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* ✅ Complaint List */}
              <div className="card p-8 shadow-2xl border-2 border-slate-200/70">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Your Complaints
                  </h2>
                </div>

                {userComplaints.length === 0 ? (
                  <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl border-2 border-slate-200">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-slate-200 to-blue-200 flex items-center justify-center">
                      <AlertCircle className="w-10 h-10 text-slate-500" />
                    </div>
                    <p className="text-xl font-bold text-slate-700 mb-2">No complaints yet</p>
                    <p className="text-sm text-slate-600 font-medium mb-6">
                      File your first complaint using the form above.
                    </p>
                    <button
                      onClick={() => setShowForm(true)}
                      className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      <span>File your first complaint</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {normalizedComplaints.map((complaint: any) => (
                      <ComplaintCard
                        key={complaint.id || Math.random()}
                        complaint={complaint}
                        onSelect={() => navigate(`/complaint/${complaint.id}`)}
                        showStatus
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ✅ Info Panel */}
            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-24">
                <h3 className="font-bold text-slate-900 mb-4 text-lg">How It Works</h3>
                <div className="space-y-4 text-sm text-slate-700">
                  <p>1️⃣ File your complaint with proper details</p>
                  <p>2️⃣ It gets assigned to a city officer</p>
                  <p>3️⃣ You can track status updates</p>
                  <p>4️⃣ Receive resolution and closure confirmation</p>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-200 text-sm text-slate-500">
                  Need help?{" "}
                  <a
                    href="mailto:support@resolveit.io"
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    support@resolveit.io
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

        <Footer />
      </div>
    </RoleGuard>
  );
};
