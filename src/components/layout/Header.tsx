import React from 'react';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  Laptop,
  ChevronRight,
} from 'lucide-react';
import { NavigationSection, UserProfile } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface HeaderProps {
  currentSection: NavigationSection;
  onNavigate: (section: NavigationSection) => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount?: number;
  currentUser: UserProfile;
  onOpenUserMenu: () => void;
  onToggleMobileMenu: () => void;
}

const sectionLabels: Record<NavigationSection, string> = {
  dashboard: 'Dashboard',
  sales: 'Sales',
  purchasing: 'Purchasing',
  inventory: 'Inventory',
  customers: 'Customers',
  suppliers: 'Suppliers',
  delivery: 'Delivery & Van Sales',
  finance: 'Finance',
  expenses: 'Expenses',
  reports: 'Reports',
  users: 'Users & Permissions',
  settings: 'Settings',
};

export const Header: React.FC<HeaderProps> = ({
  currentSection,
  onNavigate,
  onOpenSearch,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  currentUser,
  onOpenUserMenu,
  onToggleMobileMenu,
}) => {
  const { theme, setTheme } = useTheme();

  return (
    <header className="h-14 bg-white dark:bg-[#151b18] border-b border-slate-200 dark:border-neutral-800 px-4 md:px-6 flex items-center justify-between gap-4 shrink-0 z-20">
      {/* Left zone: Mobile toggle & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="md:hidden p-1.5 rounded-lg text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800"
          aria-label="Toggle navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-neutral-400 truncate">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="hover:text-slate-900 dark:hover:text-neutral-200 transition-colors cursor-pointer shrink-0"
          >
            Zaid Trading
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-900 dark:text-neutral-100 font-semibold truncate">
            {sectionLabels[currentSection]}
          </span>
        </nav>
      </div>

      {/* Middle zone: Global Search bar (triggering Ctrl+K) */}
      <div className="flex-1 max-w-md hidden sm:block">
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-slate-500 dark:text-neutral-400 bg-slate-50 dark:bg-[#1a211e] border border-slate-200 dark:border-neutral-800 rounded-lg hover:border-slate-300 dark:hover:border-neutral-700 transition-colors text-left cursor-pointer group"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-neutral-300 shrink-0" />
            <span className="truncate">Search sales, products, customers...</span>
          </div>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-[#121614] border border-slate-200 dark:border-neutral-700 rounded text-slate-500 dark:text-neutral-400 shrink-0">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Right zone: Mobile search icon + Notifications + Theme Toggle + User Avatar */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenSearch}
          className="sm:hidden p-1.5 text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-100 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative p-2 text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-100 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1e2621] transition-colors cursor-pointer"
          title="System notifications"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#151b18]" />
          )}
        </button>

        {/* Theme mode switcher */}
        <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-[#1d2520] border border-slate-200/70 dark:border-neutral-800 text-slate-600 dark:text-neutral-400">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-1 rounded-md transition-colors ${
              theme === 'light'
                ? 'bg-white dark:bg-[#28352e] text-slate-900 dark:text-white shadow-xs'
                : 'hover:text-slate-900 dark:hover:text-neutral-200'
            }`}
            title="Light theme"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-1 rounded-md transition-colors ${
              theme === 'dark'
                ? 'bg-white dark:bg-[#28352e] text-slate-900 dark:text-white shadow-xs'
                : 'hover:text-slate-900 dark:hover:text-neutral-200'
            }`}
            title="Dark theme"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`p-1 rounded-md transition-colors ${
              theme === 'system'
                ? 'bg-white dark:bg-[#28352e] text-slate-900 dark:text-white shadow-xs'
                : 'hover:text-slate-900 dark:hover:text-neutral-200'
            }`}
            title="System theme"
          >
            <Laptop className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* User profile button */}
        <button
          type="button"
          onClick={onOpenUserMenu}
          className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1e2621] transition-colors cursor-pointer ml-1"
        >
          <img
            src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
            alt={currentUser.name}
            className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 dark:ring-neutral-700"
          />
        </button>
      </div>
    </header>
  );
};
