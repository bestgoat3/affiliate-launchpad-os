import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, KanbanSquare, TrendingUp, Megaphone,
  Users, BookOpen, Settings, LogOut, Rocket, X, Phone,
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const NAV_ITEMS = [
  { label: 'Dashboard',  icon: LayoutDashboard, to: '/dashboard',  roles: ['admin','sales','fulfillment','client'] },
  { label: 'Pipeline',   icon: KanbanSquare,    to: '/pipeline',   roles: ['admin','sales'] },
  { label: 'Sales',      icon: TrendingUp,      to: '/sales',      roles: ['admin','sales'] },
  { label: 'Marketing',  icon: Megaphone,       to: '/marketing',  roles: ['admin','sales'] },
  { label: 'Dialer',     icon: Phone,           to: '/dialer',     roles: ['admin','sales'] },
  { label: 'Clients',    icon: Users,           to: '/clients',    roles: ['admin','fulfillment'] },
  { label: 'My Portal',  icon: Users,           to: '/portal',     roles: ['client'] },
  { label: 'Resources',  icon: BookOpen,        to: '/resources',  roles: ['admin','sales','fulfillment','client'] },
  { label: 'Settings',   icon: Settings,        to: '/settings',   roles: ['admin'] },
];

const ROLE_COLORS = {
  admin:       'bg-gold/20 text-gold',
  sales:       'bg-blue-500/20 text-blue-400',
  fulfillment: 'bg-purple-500/20 text-purple-400',
  client:      'bg-green-500/20 text-green-400',
};

export default function Sidebar({ mobileOpen, onClose }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleItems = NAV_ITEMS.filter(item =>
    item.roles.includes(user?.role)
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-dark-card border-r border-dark-border">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-5 border-b border-dark-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gold rounded-md flex items-center justify-center flex-shrink-0">
            <Rocket size={15} className="text-black" />
          </div>
          <div className="leading-none">
            <span className="text-white font-semibold text-sm tracking-wide">Affiliate</span>
            <span className="text-gold font-bold text-sm ml-1">Launchpad</span>
          </div>
        </div>
        {/* Close btn mobile */}
        <button onClick={onClose} className="lg:hidden p-1 text-gray-400 hover:text-white">
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-gold/10 text-gold border-l-2 border-gold ml-[-1px] pl-[11px]'
                  : 'text-gray-400 hover:text-white hover:bg-dark-hover border-l-2 border-transparent ml-[-1px] pl-[11px]'
              }`
            }
          >
            <item.icon size={17} className="flex-shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-dark-border flex-shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
            <span className="text-gold text-sm font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name || 'User'}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ROLE_COLORS[user?.role] || 'bg-gray-500/20 text-gray-400'}`}>
              {user?.role}
            </span>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 text-gray-500 hover:text-red-400 transition-colors rounded"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-60 flex-shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Drawer */}
          <aside className="absolute left-0 top-0 bottom-0 w-64 flex flex-col">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
