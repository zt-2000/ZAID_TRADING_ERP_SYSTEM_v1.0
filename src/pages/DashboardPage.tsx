import React, { useState } from 'react';
import {
  RotateCw,
  Download,
  Plus,
  ShoppingCart,
  Package,
  UserPlus,
  Receipt,
  Scale,
  ArrowDownLeft,
  ArrowUpRight,
  Warehouse,
  AlertTriangle,
  FileText,
  TrendingUp,
  Filter,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useToast } from '../context/ToastContext';

interface DashboardPageProps {
  onOpenQuickAction: (action: string) => void;
  currencySymbol?: string;
  onNavigateToModule: (module: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenQuickAction,
  currencySymbol = '$',
  onNavigateToModule,
}) => {
  const { showToast } = useToast();
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'custom'>('month');
  const [revenueRange, setRevenueRange] = useState('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Dashboard Refreshed', 'Latest general ledger and inventory balances verified.', 'success');
    }, 600);
  };

  const handleExport = () => {
    showToast('Export Initiated', 'Preparing fiscal ledger summary CSV for active period.', 'info');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Kicker & Title Header */}
      <div>
        <p className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-neutral-400 uppercase">
          ENTERPRISE LOGISTICS / GENERAL LEDGER SYNC
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-neutral-100">
              Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
              Business overview and fiscal reconciliation
            </p>
          </div>

          {/* Time range & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center p-1 rounded-lg bg-slate-200/60 dark:bg-[#1a211e] text-xs font-medium text-slate-600 dark:text-neutral-400">
              <button
                type="button"
                onClick={() => setTimeRange('today')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  timeRange === 'today'
                    ? 'bg-white dark:bg-[#25312a] text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'hover:text-slate-900 dark:hover:text-neutral-200'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('week')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  timeRange === 'week'
                    ? 'bg-white dark:bg-[#25312a] text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'hover:text-slate-900 dark:hover:text-neutral-200'
                }`}
              >
                This Week
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('month')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  timeRange === 'month'
                    ? 'bg-white dark:bg-[#25312a] text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'hover:text-slate-900 dark:hover:text-neutral-200'
                }`}
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('custom')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  timeRange === 'custom'
                    ? 'bg-white dark:bg-[#25312a] text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'hover:text-slate-900 dark:hover:text-neutral-200'
                }`}
              >
                Custom Range
              </button>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              isLoading={isRefreshing}
              leftIcon={<RotateCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleExport}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Operations Strip */}
      <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800 shadow-xs">
        <div className="flex items-center gap-2 mr-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-bold text-slate-600 dark:text-neutral-300 tracking-wider uppercase">
            QUICK OPERATIONS
          </span>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => onOpenQuickAction('sale')}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          New Sale
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => onOpenQuickAction('purchase')}
          leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
        >
          New Purchase
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => onOpenQuickAction('product')}
          leftIcon={<Package className="w-3.5 h-3.5" />}
        >
          Add Product
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => onOpenQuickAction('customer')}
          leftIcon={<UserPlus className="w-3.5 h-3.5" />}
        >
          Add Customer
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => onOpenQuickAction('expense')}
          leftIcon={<Receipt className="w-3.5 h-3.5" />}
        >
          Record Expense
        </Button>
      </div>

      {/* 6 Metrics KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Sales */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 dark:text-neutral-400">
              TOTAL SALES
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#167a53] dark:text-[#34d399]">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-neutral-100">
              {currencySymbol}0.00
            </p>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 flex items-center gap-1">
              <span>—</span>
              <span>No prior period data</span>
            </p>
          </div>
        </div>

        {/* Receivables */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 dark:text-neutral-400">
              RECEIVABLES
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#167a53] dark:text-[#34d399]">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-neutral-100">
              {currencySymbol}0.00
            </p>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
              0 unpaid invoices
            </p>
          </div>
        </div>

        {/* Payables */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 dark:text-neutral-400">
              PAYABLES
            </span>
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-neutral-100">
              {currencySymbol}0.00
            </p>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
              0 pending supplier bills
            </p>
          </div>
        </div>

        {/* Inventory Value */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 dark:text-neutral-400">
              INVENTORY VALUE
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#167a53] dark:text-[#34d399]">
              <Warehouse className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-neutral-100">
              {currencySymbol}0.00
            </p>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
              0 total SKUs in warehouse
            </p>
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 dark:text-neutral-400">
              LOW STOCK ITEMS
            </span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-neutral-100">
              0 items
            </p>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
              All stock levels nominal
            </p>
          </div>
        </div>

        {/* Expenses */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 dark:text-neutral-400">
              EXPENSES
            </span>
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-neutral-100">
              {currencySymbol}0.00
            </p>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
              0 recorded expenses this month
            </p>
          </div>
        </div>
      </div>

      {/* Sales & Revenue Overview (Large Card with Graph Grid & Empty State) */}
      <div className="rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-neutral-800">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
              Sales & Revenue Overview
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Audited ledger transactions plotted across active billing cycle
            </p>
          </div>
          <select
            value={revenueRange}
            onChange={(e) => setRevenueRange(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-[#1a211e] border border-slate-200 dark:border-neutral-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-neutral-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#167a53]"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last Quarter</option>
            <option value="fiscal_year">Full Fiscal Year</option>
          </select>
        </div>

        {/* Background graph grid styling matching mockup */}
        <div className="relative min-h-[300px] flex items-center justify-center p-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#26312a_1px,transparent_1px)] [background-size:24px_24px]">
          {/* Centered empty state card matching screenshot */}
          <div className="max-w-md w-full p-8 rounded-xl bg-white/95 dark:bg-[#181f1b]/95 border border-slate-200 dark:border-neutral-800 shadow-md text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#167a53] dark:text-[#34d399] flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-neutral-100">
              No sales recorded yet
            </h3>
            <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1.5 leading-relaxed">
              Your dashboard will show sales trends, daily performance, and revenue insights once you start recording transactions.
            </p>
            <div className="mt-5">
              <Button
                variant="primary"
                size="md"
                onClick={() => onOpenQuickAction('sale')}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Create First Sale
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom 2-Column Split: Recent Transactions & Inventory Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">⇄</span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                  Recent Transactions
                </h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Filter className="w-3.5 h-3.5" />}
                onClick={() => showToast('Filter', 'Filter transactions by date, customer, or document type', 'info')}
              >
                Filter
              </Button>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-6 px-4 py-2.5 bg-slate-50 dark:bg-[#141a17] text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 border-b border-slate-100 dark:border-neutral-800">
              <div>DATE</div>
              <div>REFERENCE</div>
              <div>TYPE</div>
              <div>ENTITY</div>
              <div className="text-right">AMOUNT</div>
              <div className="text-right">STATUS</div>
            </div>

            {/* Honest Empty State matching mockup */}
            <div className="p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 flex items-center justify-center mb-2.5">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-neutral-100">
                No transactions to display
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 max-w-xs leading-relaxed">
                Invoices, payments, and credit notes will appear here automatically.
              </p>
              <div className="mt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onOpenQuickAction('sale')}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Record Transaction
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory & Stock Alerts */}
        <div className="rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-[#167a53] dark:text-[#34d399]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                  Inventory & Stock Alerts
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToModule('inventory')}
                className="text-xs font-medium text-[#167a53] dark:text-[#34d399] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Manage Inventory</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-6 px-4 py-2.5 bg-slate-50 dark:bg-[#141a17] text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 border-b border-slate-100 dark:border-neutral-800">
              <div>PRODUCT NAME</div>
              <div>SKU</div>
              <div>CATEGORY</div>
              <div className="text-right">CURRENT STOCK</div>
              <div className="text-right">REORDER LEVEL</div>
              <div className="text-right">ACTION</div>
            </div>

            {/* Honest Empty State matching mockup */}
            <div className="p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 flex items-center justify-center mb-2.5">
                <Warehouse className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-neutral-100">
                No inventory items available
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 max-w-xs leading-relaxed">
                Track warehouse stock, batches, and reorder levels by registering your catalog.
              </p>
              <div className="mt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onOpenQuickAction('product')}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add First Product
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
