
import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  Laptop,
  ChevronRight,
  User,
  Edit3,
  ShieldCheck,
  KeyRound,
  Sliders,
  LogOut,
  ChevronDown,
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
  onOpenMyProfile: () => void;
  onOpenEditProfile: () => void;
  onOpenAccountSecurity: () => void;
  onOpenChangePassword: () => void;
  onOpenPreferences: () => void;
  onOpenSignOut: () => void;
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
  onOpenMyProfile,
  onOpenEditProfile,
  onOpenAccountSecurity,
  onOpenChangePassword,
  onOpenPreferences,
  onOpenSignOut,
  onToggleMobileMenu,
}) => {
  const { theme, setTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleAction = (action: () => void) => {
    setIsDropdownOpen(false);
    action();
  };

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

      {/* Right zone: Mobile search icon + Notifications + Theme Toggle + User Avatar Dropdown */}
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

        {/* User Profile Dropdown Menu */}
        <div className="relative ml-1" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1e2621] transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-neutral-700"
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
          >
            <img
              src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
              alt={currentUser.name}
              className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 dark:ring-neutral-700"
            />
            <span className="hidden md:inline-block text-xs font-semibold text-slate-800 dark:text-neutral-200 max-w-[120px] truncate">
              {currentUser.displayName || currentUser.name.split(' ')[0]}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Popover */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-xs">
              {/* Header with User Info */}
              <div className="px-4 py-3 border-b border-slate-100 dark:border-neutral-800/80 flex items-center gap-3">
                <img
                  src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full object-cover ring-1 ring-[#167a53]/40"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 dark:text-neutral-100 truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">
                    {currentUser.email}
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                    {currentUser.role}
                  </span>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => handleAction(onOpenMyProfile)}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-[#1f2923] hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>My Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAction(onOpenEditProfile)}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-[#1f2923] hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-slate-400" />
                  <span>Edit Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAction(onOpenAccountSecurity)}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-[#1f2923] hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <span>Account & Security</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAction(onOpenChangePassword)}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-[#1f2923] hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 text-slate-400" />
                  <span>Change Password</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAction(onOpenPreferences)}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-[#1f2923] hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <Sliders className="w-4 h-4 text-slate-400" />
                  <span>Preferences</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAction(onOpenNotifications)}
                  className="w-full flex items-center justify-between px-4 py-2 text-left text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-[#1f2923] hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Bell className="w-4 h-4 text-slate-400" />
                    <span>Notifications</span>
                  </div>
                  {unreadNotificationsCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  )}
                </button>
              </div>

              {/* Sign Out Section */}
              <div className="pt-1 mt-1 border-t border-slate-100 dark:border-neutral-800/80">
                <button
                  type="button"
                  onClick={() => handleAction(onOpenSignOut)}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span className="font-semibold">Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

