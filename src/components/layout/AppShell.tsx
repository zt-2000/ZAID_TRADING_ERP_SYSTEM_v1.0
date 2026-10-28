import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { UserMenuModal } from './UserMenuModal';
import { NotificationsPanel } from './NotificationsPanel';
import { SearchModal } from '../ui/SearchModal';
import { NewSaleModal } from '../modals/NewSaleModal';
import { NewPurchaseModal } from '../modals/NewPurchaseModal';
import { AddProductModal } from '../modals/AddProductModal';
import { AddCustomerModal } from '../modals/AddCustomerModal';
import { RecordExpenseModal } from '../modals/RecordExpenseModal';

import { NavigationSection, UserProfile, CompanySettings } from '../../types';
import { DashboardPage } from '../../pages/DashboardPage';
import { SalesPage } from '../../pages/SalesPage';
import { PurchasingPage } from '../../pages/PurchasingPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { CustomersPage } from '../../pages/CustomersPage';
import { SuppliersPage } from '../../pages/SuppliersPage';
import { DeliveryVanSalesPage } from '../../pages/DeliveryVanSalesPage';
import { FinancePage } from '../../pages/FinancePage';
import { ExpensesPage } from '../../pages/ExpensesPage';
import { ReportsPage } from '../../pages/ReportsPage';
import { UsersPermissionsPage } from '../../pages/UsersPermissionsPage';
import { SettingsPage } from '../../pages/SettingsPage';

interface AppShellProps {
  companySettings: CompanySettings;
  onUpdateSettings: (settings: CompanySettings) => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  companySettings,
  onUpdateSettings,
}) => {
  const [currentSection, setCurrentSection] = useState<NavigationSection>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Quick Action Modals
  const [activeQuickAction, setActiveQuickAction] = useState<string | null>(null);

  // Current Operator User
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: 'usr_zaid_01',
    name: 'Rashid Al-Zaid',
    email: 'zaidtrading.info@gmail.com',
    role: 'Owner / Administrator',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    status: 'active',
  });

  // Keyboard shortcut listener: '[' to collapse sidebar, Ctrl+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (e.key === '[' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenQuickAction = (action: string) => {
    setActiveQuickAction(action);
  };

  const renderActiveSection = () => {
    switch (currentSection) {
      case 'dashboard':
        return (
          <DashboardPage
            onOpenQuickAction={handleOpenQuickAction}
            currencySymbol={companySettings.currencySymbol}
            onNavigateToModule={setCurrentSection}
          />
        );
      case 'sales':
        return (
          <SalesPage
            onOpenNewSale={() => handleOpenQuickAction('sale')}
            currencySymbol={companySettings.currencySymbol}
          />
        );
      case 'purchasing':
        return (
          <PurchasingPage
            onOpenNewPurchase={() => handleOpenQuickAction('purchase')}
            currencySymbol={companySettings.currencySymbol}
          />
        );
      case 'inventory':
        return (
          <InventoryPage
            onOpenAddProduct={() => handleOpenQuickAction('product')}
            currencySymbol={companySettings.currencySymbol}
          />
        );
      case 'customers':
        return (
          <CustomersPage
            onOpenAddCustomer={() => handleOpenQuickAction('customer')}
            currencySymbol={companySettings.currencySymbol}
          />
        );
      case 'suppliers':
        return (
          <SuppliersPage
            currencySymbol={companySettings.currencySymbol}
          />
        );
      case 'delivery':
        return (
          <DeliveryVanSalesPage
            currencySymbol={companySettings.currencySymbol}
          />
        );
      case 'finance':
        return (
          <FinancePage
            currencySymbol={companySettings.currencySymbol}
          />
        );
      case 'expenses':
        return (
          <ExpensesPage
            onOpenRecordExpense={() => handleOpenQuickAction('expense')}
            currencySymbol={companySettings.currencySymbol}
          />
        );
      case 'reports':
        return (
          <ReportsPage
            currencySymbol={companySettings.currencySymbol}
          />
        );
      case 'users':
        return <UsersPermissionsPage currentUser={currentUser} />;
      case 'settings':
        return (
          <SettingsPage
            settings={companySettings}
            onSaveSettings={onUpdateSettings}
          />
        );
      default:
        return (
          <DashboardPage
            onOpenQuickAction={handleOpenQuickAction}
            currencySymbol={companySettings.currencySymbol}
            onNavigateToModule={setCurrentSection}
          />
        );
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FAFBF9] dark:bg-[#0f1311] text-[#1E2922] dark:text-[#E2E8E4]">
      {/* Sidebar Navigation */}
      <Sidebar
        currentSection={currentSection}
        onNavigate={setCurrentSection}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        currentUser={currentUser}
        onOpenUserMenu={() => setIsUserMenuOpen(true)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header
          currentSection={currentSection}
          onNavigate={setCurrentSection}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          unreadNotificationsCount={1}
          currentUser={currentUser}
          onOpenUserMenu={() => setIsUserMenuOpen(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        />

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
          {renderActiveSection()}
        </main>

        {/* Quiet Status Bar matching reference mockup */}
        <footer className="h-8 shrink-0 px-4 md:px-6 bg-[#F3F6F4] dark:bg-[#121614] border-t border-slate-200/80 dark:border-neutral-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-400 select-none">
          <div className="flex items-center gap-2 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">
              General Ledger Engine: Connected • Zero Pending Reconciliation
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] shrink-0">
            <span>SESSION ID: #ZD-98214-OPS</span>
            <span>•</span>
            <span>SYSTEM UTC+03:00</span>
          </div>
        </footer>
      </div>

      {/* Global Modals */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={setCurrentSection}
        onOpenQuickAction={handleOpenQuickAction}
      />

      <NotificationsPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      <UserMenuModal
        isOpen={isUserMenuOpen}
        onClose={() => setIsUserMenuOpen(false)}
        currentUser={currentUser}
        onUpdateRole={(newRole) => setCurrentUser((prev) => ({ ...prev, role: newRole }))}
      />

      {/* Quick Action Modals */}
      <NewSaleModal
        isOpen={activeQuickAction === 'sale'}
        onClose={() => setActiveQuickAction(null)}
        currencySymbol={companySettings.currencySymbol}
      />

      <NewPurchaseModal
        isOpen={activeQuickAction === 'purchase'}
        onClose={() => setActiveQuickAction(null)}
        currencySymbol={companySettings.currencySymbol}
      />

      <AddProductModal
        isOpen={activeQuickAction === 'product'}
        onClose={() => setActiveQuickAction(null)}
        currencySymbol={companySettings.currencySymbol}
      />

      <AddCustomerModal
        isOpen={activeQuickAction === 'customer'}
        onClose={() => setActiveQuickAction(null)}
        currencySymbol={companySettings.currencySymbol}
      />

      <RecordExpenseModal
        isOpen={activeQuickAction === 'expense'}
        onClose={() => setActiveQuickAction(null)}
        currencySymbol={companySettings.currencySymbol}
      />
    </div>
  );
};
