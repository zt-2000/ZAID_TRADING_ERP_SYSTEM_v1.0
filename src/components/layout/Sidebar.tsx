import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  Layers,
  Users,
  Building2,
  Truck,
  Landmark,
  Receipt,
  BarChart3,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
} from 'lucide-react';
import { NavigationSection, UserProfile } from '../../types';

interface SidebarProps {
  currentSection: NavigationSection;
  onNavigate: (section: NavigationSection) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  currentUser: UserProfile;
  onOpenUserMenu: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: NavigationSection;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  currentUser,
  onOpenUserMenu,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const navGroups: NavGroup[] = [
    {
      groupTitle: 'CORE',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      groupTitle: 'OPERATIONS',
      items: [
        { id: 'sales', label: 'Sales', icon: ShoppingBag },
        { id: 'purchasing', label: 'Purchasing', icon: ShoppingCart },
        { id: 'inventory', label: 'Inventory', icon: Layers },
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'suppliers', label: 'Suppliers', icon: Building2 },
        { id: 'delivery', label: 'Delivery & Van Sales', icon: Truck },
      ],
    },
    {
      groupTitle: 'ACCOUNTING',
      items: [
        { id: 'finance', label: 'Finance', icon: Landmark },
        { id: 'expenses', label: 'Expenses', icon: Receipt },
        { id: 'reports', label: 'Reports', icon: BarChart3 },
      ],
    },
    {
      groupTitle: 'ADMINISTRATION',
      items: [
        { id: 'users', label: 'Users & Permissions', icon: ShieldCheck },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  const handleNavClick = (id: NavigationSection) => {
    onNavigate(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className={`flex items-center gap-3 px-5 py-4 border-b border-slate-200/80 dark:border-neutral-800/80 ${isCollapsed ? 'justify-center px-3' : ''}`}>
        <div className="w-8 h-8 rounded-lg bg-[#167a53] flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-[#167a53]/25 shrink-0">
          Z
        </div>
        {!isCollapsed && (
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-900 dark:text-neutral-100 tracking-tight leading-tight truncate">
              Zaid Trading
            </h1>
            <p className="text-[10px] font-semibold tracking-wider text-slate-500 dark:text-neutral-400 uppercase">
              ERP SYSTEM
            </p>
          </div>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {navGroups.map((group) => (
          <div key={group.groupTitle} className="space-y-1">
            {!isCollapsed && (
              <p className="px-2.5 text-[10px] font-bold text-slate-600 dark:text-neutral-300 tracking-wider uppercase mb-1">
                {group.groupTitle}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentSection === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    title={isCollapsed ? item.label : undefined}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      isCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2'
                    } ${
                      isActive
                        ? 'bg-[#167a53] text-white shadow-xs'
                        : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-200/60 dark:hover:bg-[#1f2923] hover:text-slate-900 dark:hover:text-neutral-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-neutral-400'}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Footer Controls */}
      <div className="p-3 border-t border-slate-200/80 dark:border-neutral-800/80 space-y-2 shrink-0">
        {/* Collapse toggle (desktop only) */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className={`hidden md:flex items-center gap-2 w-full text-xs text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-100 px-3 py-2 rounded-lg hover:bg-slate-200/50 dark:hover:bg-[#1a211e] transition-colors cursor-pointer ${
            isCollapsed ? 'justify-center px-1' : 'justify-between'
          }`}
          title="Toggle Sidebar Collapse ( [ )"
        >
          <div className="flex items-center gap-2 truncate">
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!isCollapsed && <span>Collapse Sidebar</span>}
          </div>
          {!isCollapsed && (
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] bg-slate-200/70 dark:bg-neutral-800 rounded font-mono text-slate-500 dark:text-neutral-400">
              [
            </kbd>
          )}
        </button>

        {/* User Card */}
        <button
          type="button"
          onClick={onOpenUserMenu}
          className={`flex items-center gap-2.5 w-full p-2 rounded-xl border border-slate-200/70 dark:border-neutral-800 bg-white/70 dark:bg-[#151b18] hover:bg-white dark:hover:bg-[#1a221e] text-left transition-colors cursor-pointer ${
            isCollapsed ? 'justify-center p-2' : ''
          }`}
        >
          <img
            src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
            alt={currentUser.name}
            className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-slate-200 dark:ring-neutral-700"
          />
          {!isCollapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900 dark:text-neutral-100 truncate">
                  {currentUser.name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">
                  {currentUser.role}
                </p>
              </div>
              <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 bg-[#F3F6F4] dark:bg-[#121714] border-r border-slate-200 dark:border-neutral-800 transition-all duration-200 z-30 ${
          isCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden bg-black/50 backdrop-blur-xs flex"
          onClick={onCloseMobile}
        >
          <div
            className="w-72 max-w-[80vw] h-full bg-[#F3F6F4] dark:bg-[#121714] border-r border-slate-200 dark:border-neutral-800 shadow-2xl flex flex-col animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
