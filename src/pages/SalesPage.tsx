import React, { useState } from 'react';
import { Plus, Search, Filter, Download, ShoppingBag, FileText, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Table, Column } from '../components/ui/Table';
import { useToast } from '../context/ToastContext';

interface SalesPageProps {
  onOpenNewSale: () => void;
  currencySymbol?: string;
}

interface SaleRow {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  customerName: string;
  total: number;
  paid: number;
  balance: number;
  status: string;
}

export const SalesPage: React.FC<SalesPageProps> = ({
  onOpenNewSale,
  currencySymbol = '$',
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'invoices' | 'quotations' | 'orders' | 'returns'>('invoices');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Honest production database starts with 0 records
  const salesData: SaleRow[] = [];

  const columns: Column<SaleRow>[] = [
    { key: 'invoiceNumber', header: 'INVOICE #' },
    { key: 'date', header: 'DATE' },
    { key: 'dueDate', header: 'DUE DATE' },
    { key: 'customerName', header: 'CUSTOMER' },
    {
      key: 'total',
      header: 'TOTAL',
      align: 'right',
      render: (r) => `${currencySymbol}${r.total.toFixed(2)}`,
    },
    {
      key: 'paid',
      header: 'PAID',
      align: 'right',
      render: (r) => `${currencySymbol}${r.paid.toFixed(2)}`,
    },
    {
      key: 'balance',
      header: 'OUTSTANDING',
      align: 'right',
      render: (r) => `${currencySymbol}${r.balance.toFixed(2)}`,
    },
    { key: 'status', header: 'STATUS', align: 'center' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-neutral-400 uppercase">
            OPERATIONS & REVENUE
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-neutral-100 mt-1">
            Sales & Invoicing
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
            Commercial wholesale invoices, quotations, credit notes, and customer receivables
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => showToast('Export', 'Exporting sales ledger to CSV', 'info')}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenNewSale}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Sale
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-neutral-800 space-x-6 text-xs font-semibold overflow-x-auto pb-px">
        {[
          { id: 'invoices', label: 'Commercial Invoices' },
          { id: 'quotations', label: 'Quotations / Proformas' },
          { id: 'orders', label: 'Sales Orders' },
          { id: 'returns', label: 'Returns & Credit Notes' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-[#167a53] text-[#167a53] dark:text-[#34d399]'
                : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by invoice # or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-slate-700 dark:text-neutral-300 focus:outline-none"
          >
            <option value="all">All Posting Statuses</option>
            <option value="draft">Drafts Only</option>
            <option value="posted">Posted & Unpaid</option>
            <option value="partial">Partially Paid</option>
            <option value="paid">Fully Settled</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Table with Honest Empty State */}
      <Table
        columns={columns}
        data={salesData}
        keyExtractor={(row) => row.id}
        emptyState={
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 flex items-center justify-center mb-3">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
              No sales invoices posted yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mt-1 leading-relaxed">
              When sales invoices or proformas are created, their tax breakdown, customer balances, and delivery assignments will be managed here.
            </p>
            <div className="mt-4">
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenNewSale}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Create First Sale Invoice
              </Button>
            </div>
          </div>
        }
      />
    </div>
  );
};
