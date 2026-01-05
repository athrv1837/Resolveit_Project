import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types";
import { UserPlus, Mail, Lock, User, ArrowRight, Upload } from "lucide-react";
import ForgotPassword from "./ForgotPassword";

interface RegisterProps {
  onSwitchToLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
  const { register } = useAuth();

  // Common fields
  const [role, setRole] = useState<UserRole>("citizen");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Officer-specific fields
  const [officerAge, setOfficerAge] = useState("");
  const [officerGender, setOfficerGender] = useState("");
  const [officerDepartment, setOfficerDepartment] = useState("");
  const [officerCertificate, setOfficerCertificate] = useState<File | null>(null);

  const handleCertificateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setOfficerCertificate(file);
  };

  const resetAll = () => {
    setName("");
    setEmail("");
    setPassword("");
    setOfficerAge("");
    setOfficerGender("");
    setOfficerDepartment("");
    setOfficerCertificate(null);
    setError("");
  };

  // ✅ Citizen Registration
  const handleCitizenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!name || !email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      await register(email, password, name, "citizen");
      alert("✅ Account created successfully! You can now sign in.");
      resetAll();
      onSwitchToLogin();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Officer Registration (with backend integration)
  const handleOfficerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation
    if (!name || !email || !password || !officerAge || !officerGender || !officerDepartment) {
      setError("Please fill in all officer fields");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      // We will use FormData in case backend supports file upload later.
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("department", officerDepartment);
      formData.append("age", officerAge);
      formData.append("gender", officerGender);
      if (officerCertificate) formData.append("certificate", officerCertificate);

      const res = await fetch("http://localhost:8080/api/officers/register", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "Officer registration failed");
        throw new Error(msg);
      }

      alert("✅ Officer application submitted successfully! Awaiting admin approval.");
      resetAll();
      onSwitchToLogin();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message?.includes("approval")
          ? "Your registration is pending admin approval."
          : err?.message || "Officer registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/30">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="w-full max-w-md relative animate-fade-in">
        <div className="card-premium p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-600 via-cyan-500 to-blue-500 rounded-3xl mb-6 shadow-2xl shadow-cyan-500/40 hover:shadow-cyan-500/60 transition-all duration-300 hover:scale-110 animate-bounce-subtle">
              <UserPlus className="w-10 h-10 text-white" />
            </div>
            <h1 className="typography-h3 mb-3 text-gradient drop-shadow-sm">Get Started</h1>
            <p className="text-slate-600 font-medium">Create your account to file and track complaints</p>
            <p className="text-xs text-slate-500 mt-3 font-semibold">(Admin accounts cannot be created manually)</p>
          </div>

          {/* Role Selector */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-3">Select Your Role</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("citizen")}
                className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  role === "citizen"
                    ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg scale-105"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                Citizen
              </button>

              <button
                type="button"
                onClick={() => setRole("officer")}
                className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  role === "officer"
                    ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg scale-105"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                Officer
              </button>
            </div>
          </div>

          {/* Citizen Form */}
          {role === "citizen" && (
            <form onSubmit={handleCitizenSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field pl-12"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-12"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-12"
                    placeholder="Minimum 6 characters"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium animate-slide-in-up">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center space-x-2 group"
              >
                <span>{loading ? "Creating account..." : "Create Account"}</span>
                {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </button>
              <div className="text-center mt-3">
                <ForgotPassword />
              </div>
            </form>
          )}

          {/* Officer Form */}
          {role === "officer" && (
            <form onSubmit={handleOfficerSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field pl-12"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Age</label>
                  <input
                    type="number"
                    value={officerAge}
                    onChange={(e) => setOfficerAge(e.target.value)}
                    className="input-field"
                    placeholder="Age"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Gender</label>
                  <select
                    value={officerGender}
                    onChange={(e) => setOfficerGender(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select Gender</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Department</label>
                <select
                  value={officerDepartment}
                  onChange={(e) => setOfficerDepartment(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select Department</option>
                  <option>Infrastructure</option>
                  <option>Utilities</option>
                  <option>Public Safety</option>
                  <option>Sanitation</option>
                  <option>Transport</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Certificate Upload</label>
                <div className="relative">
                  <Upload className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  <input
                    type="file"
                    accept=".pdf,.jpg,.png"
                    onChange={handleCertificateUpload}
                    className="input-field pl-12"
                  />
                </div>
                {officerCertificate && (
                  <p className="text-xs text-slate-500 mt-1">{officerCertificate.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-12"
                    placeholder="official@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-12"
                    placeholder="Minimum 6 characters"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium animate-slide-in-up">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center space-x-2 group"
              >
                <span>{loading ? "Submitting..." : "Submit for Approval"}</span>
                {!loading && (
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                )}
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-6 p-4 bg-slate-50 rounded-xl text-center">
            <p className="text-slate-600 text-sm mb-3">Already registered?</p>
            <button
              onClick={onSwitchToLogin}
              className="text-cyan-600 hover:text-cyan-700 font-semibold text-sm hover:underline transition-colors"
            >
              Sign in to your account
            </button>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          Quick • Secure • Free to use
        </p>
      </div>
    </div>
  );
};
