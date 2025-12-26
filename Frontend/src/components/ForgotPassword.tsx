import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import api from "../lib/api";
import { toast } from "../hooks/use-toast";

export const ForgotPassword: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");

  React.useEffect(() => {
    try {
      const urlToken = new URLSearchParams(window.location.search).get("token");
      if (urlToken) {
        setToken(urlToken);
        setOpen(true);
        setStep("reset");
      }
    } catch (e) {
      // ignore in non-browser environments
    }
  }, []);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"request" | "reset">("request");

  const requestReset = async () => {
    setLoading(true);
    try {
      await api.requestPasswordReset(email);
      toast({ title: "If an account exists, an email was sent.", description: "Check your inbox for the reset token." });
      setStep("reset");
    } catch (err: any) {
      toast({ title: "Request failed", description: err?.message || String(err) });
    } finally {
      setLoading(false);
    }
  };

  const doReset = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match" });
      return;
    }
    if (!token) {
      toast({ title: "Token is required" });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters" });
      return;
    }

    // helpful debug info when testing locally (does not log the password)
    console.debug("Attempting password reset with token:", token);

    setLoading(true);
    try {
      await api.resetPassword(token, newPassword);
      toast({ title: "Password reset successful", description: "You can now sign in with your new password." });
      setOpen(false);
      setStep("request");
      setEmail("");
      setToken("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      // show server message when available
      const msg = err?.message || String(err) || "Failed to reset password";
      toast({ title: "Reset failed", description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => setOpen(o)}>
      <DialogTrigger asChild>
        <Button variant="link" className="text-sm">Forgot password?</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Password Reset</DialogTitle>
          <DialogDescription>
            Request a password reset token or use a token you already received to set a new
            password.
          </DialogDescription>
        </DialogHeader>

        {step === "request" ? (
          <div className="mt-4 space-y-4">
            <label className="block text-sm font-medium">Email</label>
            <input className="input-field w-full" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
              <Button onClick={requestReset} disabled={loading || !email}>{loading ? "Sending..." : "Send reset email"}</Button>
            </div>
            <div className="text-sm text-slate-500 pt-2">
              Already have a token? <button className="text-blue-600 underline" onClick={() => setStep("reset")}>Use it to reset</button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <label className="block text-sm font-medium">Reset Token</label>
            <input className="input-field w-full" value={token} onChange={(e) => setToken(e.target.value)} placeholder="paste token from email" />

            <label className="block text-sm font-medium">New Password</label>
            <input type="password" className="input-field w-full" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" />

            <label className="block text-sm font-medium">Confirm Password</label>
            <input type="password" className="input-field w-full" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" />

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setStep("request")}>Back</Button>
              <Button onClick={doReset} disabled={loading || !token || !newPassword}>{loading ? "Resetting..." : "Reset Password"}</Button>
            </div>
          </div>
        )}

        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPassword;
