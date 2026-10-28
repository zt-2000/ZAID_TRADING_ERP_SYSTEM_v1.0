import React, { useState, useEffect } from 'react';
import { Search, X, ArrowRight, LayoutDashboard, ShoppingBag, ShoppingCart, Layers, Users, Truck, Building2, Landmark, Receipt, BarChart3, ShieldCheck, Settings } from 'lucide-react';
import { NavigationSection } from '../../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: NavigationSection) => void;
  onOpenQuickAction: (action: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenQuickAction,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const navigationItems = [
    { id: 'dashboard' as NavigationSection, title: 'Dashboard', icon: LayoutDashboard, group: 'Navigation' },
    { id: 'sales' as NavigationSection, title: 'Sales & Invoices', icon: ShoppingBag, group: 'Navigation' },
    { id: 'purchasing' as NavigationSection, title: 'Purchasing & POs', icon: ShoppingCart, group: 'Navigation' },
    { id: 'inventory' as NavigationSection, title: 'Inventory & Warehouses', icon: Layers, group: 'Navigation' },
    { id: 'customers' as NavigationSection, title: 'Customers & Receivables', icon: Users, group: 'Navigation' },
    { id: 'suppliers' as NavigationSection, title: 'Suppliers & Payables', icon: Building2, group: 'Navigation' },
    { id: 'delivery' as NavigationSection, title: 'Delivery & Van Sales', icon: Truck, group: 'Navigation' },
    { id: 'finance' as NavigationSection, title: 'Finance & General Ledger', icon: Landmark, group: 'Navigation' },
    { id: 'expenses' as NavigationSection, title: 'Expenses & Payments', icon: Receipt, group: 'Navigation' },
    { id: 'reports' as NavigationSection, title: 'Financial & Inventory Reports', icon: BarChart3, group: 'Navigation' },
    { id: 'users' as NavigationSection, title: 'Users & Permissions', icon: ShieldCheck, group: 'Navigation' },
    { id: 'settings' as NavigationSection, title: 'Company Settings & Currencies', icon: Settings, group: 'Navigation' },
  ];

  const quickActions = [
    { id: 'new_sale', title: 'Create New Sale Invoice', subtitle: 'Post sales transaction', action: 'sale' },
    { id: 'new_purchase', title: 'Create Purchase Order', subtitle: 'Order from verified supplier', action: 'purchase' },
    { id: 'add_product', title: 'Register New Product', subtitle: 'Add SKU and wholesale price', action: 'product' },
    { id: 'add_customer', title: 'Register New Customer', subtitle: 'Add customer account and credit limits', action: 'customer' },
    { id: 'record_expense', title: 'Record Operating Expense', subtitle: 'Post cash/bank expense voucher', action: 'expense' },
  ];

  const filteredNav = navigationItems.filter(item =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );

  const filteredActions = quickActions.filter(action =>
    action.title.toLowerCase().includes(query.toLowerCase()) ||
    action.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-slate-200 dark:border-neutral-800">
          <Search className="w-5 h-5 text-slate-400 dark:text-neutral-500 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search modules, commands, or quick actions..."
            className="w-full px-3 py-1 bg-transparent text-sm text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2 space-y-4">
          {filteredActions.length > 0 && (
            <div>
              <p className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">
                Quick Actions
              </p>
              <div className="space-y-0.5">
                {filteredActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => {
                      onOpenQuickAction(action.action);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs hover:bg-[#167a53]/10 dark:hover:bg-[#167a53]/20 group transition-colors cursor-pointer"
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-neutral-100 group-hover:text-[#167a53] dark:group-hover:text-[#34d399]">
                        {action.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                        {action.subtitle}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#167a53] dark:group-hover:text-[#34d399] transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredNav.length > 0 && (
            <div>
              <p className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">
                ERP Navigation Modules
              </p>
              <div className="space-y-0.5">
                {filteredNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        onClose();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs hover:bg-slate-100 dark:hover:bg-[#202924] transition-colors cursor-pointer"
                    >
                      <Icon className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
                      <span className="font-medium text-slate-800 dark:text-neutral-200">
                        {item.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {filteredNav.length === 0 && filteredActions.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-neutral-400">
              No matching ERP modules or actions found for &quot;{query}&quot;
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
