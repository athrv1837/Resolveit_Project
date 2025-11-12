import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
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

const API_BASE = "http://localhost:8080/api";

export const CitizenDashboard: React.FC = () => {
  const { user, getAuthHeaders } = useAuth(); // ✅ added getAuthHeaders

  const [complaints, setComplaints] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Infrastructure");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
  }, [user]);

  // ✅ Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    setLoading(true);
    const complaintData = {
      title,
      description,
      category,
      isAnonymous,
    };

    try {
      const res = await fetch(
        `${API_BASE}/complaints/submit?email=${user.email}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(), // ✅ attach token here too
          },
          body: JSON.stringify(complaintData),
        }
      );

      if (res.ok) {
        alert("Complaint submitted successfully!");
        // ✅ Reset form
        setTitle("");
        setDescription("");
        setCategory("Infrastructure");
        setIsAnonymous(false);
        setAttachments([]);
        setShowForm(false);

        // ✅ Refresh complaint list after submission
        setTimeout(() => {
          fetchComplaints();
        }, 400);
      } else {
        alert("Failed to submit complaint. Try again.");
      }
    } catch (error) {
      console.error("Error submitting complaint:", error);
      alert("Server error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ File upload handler (for future feature)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileNames = Array.from(files).map((file) => file.name);
      setAttachments((prev) => [...prev, ...fileNames]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const userComplaints = Array.isArray(complaints) ? complaints : [];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <Header
        title="Citizen Portal"
        subtitle="File & Track Complaints"
        icon={<FileText className="w-6 h-6 text-white" />}
      />

      <main className="flex-1">
        <div className="container-custom py-12">
          {/* ✅ Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <StatCard
              label="Total Complaints"
              value={userComplaints.length}
              icon={<FileText className="w-6 h-6" />}
              color="blue"
            />
            <StatCard
              label="Pending"
              value={userComplaints.filter((c) => c.status === "pending").length}
              icon={<Clock className="w-6 h-6" />}
              color="amber"
            />
            <StatCard
              label="Resolved"
              value={userComplaints.filter((c) => c.status === "resolved").length}
              icon={<CheckCircle className="w-6 h-6" />}
              color="green"
            />
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
                    className="w-full btn-primary flex items-center justify-center space-x-2 py-4"
                  >
                    <Plus className="w-5 h-5" />
                    <span>File a New Complaint</span>
                  </button>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Category */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="input-field"
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
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Title
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="input-field"
                        placeholder="Brief description of your issue"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Description
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        rows={5}
                        className="input-field resize-none"
                        placeholder="Provide details about your complaint..."
                      />
                    </div>

                    {/* Attachments */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Attachments (Optional)
                      </label>
                      <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                        <Upload className="w-5 h-5 text-slate-400 mr-2" />
                        <span className="text-sm text-slate-600">
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
                              <span className="text-sm text-slate-700">{file}</span>
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
                    <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-lg">
                      <input
                        type="checkbox"
                        id="anonymous"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label
                        htmlFor="anonymous"
                        className="text-sm font-semibold text-slate-700 cursor-pointer"
                      >
                        Submit Anonymously
                      </label>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 btn-primary"
                      >
                        {loading ? "Submitting..." : "Submit Complaint"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="flex-1 btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* ✅ Complaint List */}
              <div className="card p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  Your Complaints
                </h2>

                {userComplaints.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 mb-4">
                      You haven't filed any complaints yet
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
                    {userComplaints.map((complaint: any) => (
                      <ComplaintCard
                        key={complaint.id || Math.random()}
                        complaint={complaint}
                        isSelected={selectedComplaint === complaint.id}
                        onSelect={(c) =>
                         setSelectedComplaint(selectedComplaint === String(c.id) ? null : String(c.id))

                        }
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
  );
};
