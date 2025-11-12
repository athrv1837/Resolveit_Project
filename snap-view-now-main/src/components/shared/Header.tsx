import React from 'react';
import { LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, icon }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 backdrop-blur-2xl bg-white/80 border-b border-slate-200/50 shadow-sm">
        <div className="container-custom h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg glow-blue">
              {icon}
            </div>
            <div className="hidden sm:block">
              <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                ResolveIt
              </h2>
              <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4 flex-1 justify-end">
            <div className="text-right border-r border-slate-200 pr-4">
              <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={logout}
              className="btn-ghost flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden btn-ghost"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200/50 bg-white/95 backdrop-blur-xl animate-slide-in-up">
            <div className="container-custom py-4 space-y-4">
              <div className="px-4 py-3 bg-slate-50 rounded-xl">
                <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-600">{user?.email}</p>
                <p className="text-xs text-slate-500 capitalize mt-1">{user?.role}</p>
              </div>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full btn-secondary flex items-center justify-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};
