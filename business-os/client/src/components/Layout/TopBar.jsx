import React, { useContext, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Bell, ChevronDown, LogOut, User } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const PAGE_TITLES = {
  '/dashboard':  'Dashboard',
  '/pipeline':   'Pipeline & CRM',
  '/sales':      'Sales Dashboard',
  '/marketing':  'Marketing Dashboard',
  '/clients':    'Client Management',
  '/portal':     'My Portal',
  '/resources':  'Resource Library',
  '/settings':   'Settings',
};

export default function TopBar({ onMenuClick }) {
  const { user, logout }  = useContext(AuthContext);
  const location          = useLocation();
  const [dropOpen, setDropOpen] = useState(false);

  const title = Object.entries(PAGE_TITLES).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] || 'Affiliate Launchpad OS';

  return (
    <header className="h-16 bg-dark-card border-b border-dark-border flex items-center justify-between px-4 lg:px-6 flex-shrink-0 sticky top-0 z-30">
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-dark-hover transition"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-white font-semibold text-base lg:text-lg">{title}</h1>
      </div>

      {/* Right: notifications + user */}
      <div className="flex items-center gap-2">
        {/* Notifications bell */}
        <button className="relative p-2 text-gray-400 hover:text-white rounded-lg hover:bg-dark-hover transition">
          <Bell size={19} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gold rounded-full" />
        </button>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropOpen(v => !v)}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-dark-hover transition"
          >
            <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
              <span className="text-gold text-sm font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            <span className="hidden sm:block text-white text-sm font-medium max-w-[100px] truncate">
              {user?.name}
            </span>
            <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
          </button>

          {dropOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropOpen(false)} />
              <div className="absolute right-0 top-11 z-50 w-48 bg-dark-card border border-dark-border rounded-xl shadow-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-dark-border">
                  <p className="text-white text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-gray-500 text-xs truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => { setDropOpen(false); logout(); }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
