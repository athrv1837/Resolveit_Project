import React from 'react';
import { Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white mt-20 border-t-2 border-slate-700/50 shadow-2xl">
      <div className="container-custom py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div>
            <h3 className="font-extrabold text-xl mb-5 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">ResolveIt</h3>
            <p className="text-slate-300 text-sm leading-relaxed font-medium">
              Smart Grievance and Feedback Management System for seamless complaint resolution.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-5 tracking-wide">Product</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><a href="#" className="hover:text-cyan-400 transition-colors duration-200 font-medium hover:translate-x-1 inline-block">Features</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors duration-200 font-medium hover:translate-x-1 inline-block">Pricing</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors duration-200 font-medium hover:translate-x-1 inline-block">Security</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors duration-200 font-medium hover:translate-x-1 inline-block">Status</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-5 tracking-wide">Company</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><a href="#" className="hover:text-cyan-400 transition-colors duration-200 font-medium hover:translate-x-1 inline-block">About</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors duration-200 font-medium hover:translate-x-1 inline-block">Blog</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors duration-200 font-medium hover:translate-x-1 inline-block">Careers</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors duration-200 font-medium hover:translate-x-1 inline-block">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-5 tracking-wide">Legal</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><a href="#" className="hover:text-cyan-400 transition-colors duration-200 font-medium hover:translate-x-1 inline-block">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors duration-200 font-medium hover:translate-x-1 inline-block">Terms of Service</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors duration-200 font-medium hover:translate-x-1 inline-block">Cookie Policy</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors duration-200 font-medium hover:translate-x-1 inline-block">Accessibility</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-700/60 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className="text-sm text-slate-400 mb-4 md:mb-0">
              Copyright {currentYear} ResolveIt. All rights reserved.
            </p>
            <div className="flex items-center space-x-1 text-sm text-slate-400">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-500 fill-red-500" />
              <span>for better governance</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
