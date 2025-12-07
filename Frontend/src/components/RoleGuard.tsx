import React from 'react';
import { useAuth } from '../context/AuthContext';

interface RoleGuardProps {
  allowed: Array<'admin' | 'officer' | 'citizen'>;
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowed, children }) => {
  const { isAdmin, isOfficer, isCitizen } = useAuth();

  const hasAccess = () => {
    if (allowed.includes('admin') && isAdmin()) return true;
    if (allowed.includes('officer') && isOfficer()) return true;
    if (allowed.includes('citizen') && isCitizen()) return true;
    return false;
  };

  if (!hasAccess()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-cyan-50 to-slate-50">
        <div className="card p-10 text-center">
          <h3 className="text-2xl font-bold mb-2">Access denied</h3>
          <p className="text-sm text-slate-600">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleGuard;
