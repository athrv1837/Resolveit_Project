import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ComplaintProvider } from "./context/ComplaintContext";
import { Login } from "./components/Login";
import { Register } from "./components/Register";
import { CitizenDashboard } from "./components/CitizenDashboard";
import { OfficerDashboard } from "./components/OfficerDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { useState } from "react";

const queryClient = new QueryClient();

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ComplaintDetails from './components/ComplaintDetails';

const AppContent = () => {
  const { user, isAdmin, isOfficer } = useAuth();
  const [showLogin, setShowLogin] = useState(true);

  if (!user) {
    return showLogin ? (
      <Login onSwitchToRegister={() => setShowLogin(false)} />
    ) : (
      <Register onSwitchToLogin={() => setShowLogin(true)} />
    );
  }

  // Root content still decided by role, but we also expose a complaint details route
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/complaint/:id" element={<ComplaintDetails />} />
        <Route path="/" element={isAdmin() ? <AdminDashboard /> : isOfficer() ? <OfficerDashboard /> : <CitizenDashboard />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <ComplaintProvider>
          <AppContent />
        </ComplaintProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
