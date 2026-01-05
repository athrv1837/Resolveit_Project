import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, UserCheck, Loader2, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";
import api from '../lib/api';

const API_BASE = "http://localhost:8080/api";

interface AssignOfficerModalProps {
  complaintId: number;
  onClose: () => void;
}

export const AssignOfficerModal: React.FC<AssignOfficerModalProps> = ({ complaintId, onClose }) => {
  const { getAuthHeaders, token } = useAuth();
  const [officers, setOfficers] = useState<any[]>([]);
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchOfficers();
  }, []);

  const fetchOfficers = async () => {
    try {
      const data = await api.getOfficers(token ?? undefined);
      setOfficers(Array.isArray(data) ? data : []);
      console.log('Officers fetched (modal):', Array.isArray(data) ? data.length : 'not-array', data);
    } catch (err: any) {
      console.error('Failed to load officers:', err);
      // If the API returned a status text, show it; otherwise show generic message
      alert("Failed to load officers: " + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedOfficer) return;
    setAssigning(true);

    try {
      await api.assignOfficer(complaintId, selectedOfficer, token ?? undefined);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      alert("Failed to assign officer");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="card-premium p-10 max-w-lg w-full animate-slide-in-up relative shadow-2xl border-2 border-cyan-200/50">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all duration-200"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl">
            <UserCheck className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Assign Officer</h2>
          <p className="text-slate-600 mt-3 font-semibold">Complaint ID: <span className="font-mono text-cyan-600">#{complaintId}</span></p>
        </div>

        {/* Officer Dropdown */}
        {loading ? (
          <div className="text-center py-16 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl border-2 border-cyan-200">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg animate-pulse">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <p className="text-sm font-bold text-slate-700">Loading officers...</p>
          </div>
        ) : success ? (
          <div className="text-center py-16 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-xl">
              <CheckCircle2 className="w-10 h-10 text-white animate-bounce" />
            </div>
            <p className="text-2xl font-extrabold text-green-700 mb-2">Success!</p>
            <p className="text-sm font-semibold text-green-600">Officer Assigned Successfully</p>
          </div>
        ) : (
          <>
            <label className="text-sm font-extrabold text-slate-800 mb-4 block tracking-wide uppercase">
              Select Officer
            </label>
            <select
              value={selectedOfficer}
              onChange={(e) => setSelectedOfficer(e.target.value)}
              className="input-field w-full text-base py-4 font-semibold shadow-lg"
            >
              <option value="">Choose an officer...</option>
              {officers.map((officer) => (
                <option key={officer.id} value={officer.email}>
                  {officer.name} - {officer.department} ({officer.email})
                </option>
              ))}
            </select>

            {officers.length === 0 && (
              <div className="mt-4 p-4 bg-amber-50 border-2 border-amber-300 rounded-xl flex items-center gap-3\">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="text-amber-800 text-sm font-semibold">
                  No approved officers found. Please approve officers first.
                </p>
              </div>
            )}

            {/* Assign Button */}
            <div className="mt-8 flex gap-4">
              <button
                onClick={handleAssign}
                disabled={!selectedOfficer || assigning}
                className="flex-1 btn-primary py-5 text-lg font-extrabold flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl"
              >
                {assigning ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <UserCheck className="w-6 h-6" />
                )}
                {assigning ? "Assigning..." : "Assign Officer"}
              </button>
              <button
                onClick={onClose}
                className="flex-1 btn-ghost py-5 text-lg font-bold"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};