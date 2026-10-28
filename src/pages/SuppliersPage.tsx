import React, { useState } from 'react';
import { Plus, Search, Download, Building2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Table, Column } from '../components/ui/Table';
import { useToast } from '../context/ToastContext';

interface SuppliersPageProps {
  currencySymbol?: string;
}

interface SupplierRow {
  id: string;
  code: string;
  name: string;
  phone: string;
  email?: string;
  paymentTerms: string;
  balance: number;
  status: 'active' | 'archived';
}

export const SuppliersPage: React.FC<SuppliersPageProps> = ({
  currencySymbol = '$',
}) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const supplierData: SupplierRow[] = [];

  const columns: Column<SupplierRow>[] = [
    { key: 'code', header: 'SUPPLIER CODE' },
    { key: 'name', header: 'COMPANY ENTITY' },
    {
      key: 'phone',
      header: 'PHONE & CONTACT',
      render: (r) => (
        <div className="flex flex-col">
          <span>{r.phone || '—'}</span>
          {r.email && <span className="text-[11px] text-slate-400">{r.email}</span>}
        </div>
      ),
    },
    { key: 'paymentTerms', header: 'PAYMENT TERMS' },
    {
      key: 'balance',
      header: 'OUTSTANDING PAYABLE',
      align: 'right',
      render: (r) => `${currencySymbol}${r.balance.toFixed(2)}`,
    },
    {
      key: 'status',
      header: 'STATUS',
      align: 'center',
      render: (r) => (
        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          {r.status.toUpperCase()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-neutral-400 uppercase">
            OPERATIONS & ACCOUNTS PAYABLE
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-neutral-100 mt-1">
            Suppliers & Vendor Accounts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
            Vendor profiles, trade payables, purchase agreements, and statement reconciliations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => showToast('Export', 'Exporting suppliers directory', 'info')}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => showToast('Add Supplier', 'Supplier registration workflow initialized', 'info')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Supplier
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search suppliers by name, code, or contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={supplierData}
        keyExtractor={(row) => row.id}
        emptyState={
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 flex items-center justify-center mb-3">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
              No suppliers registered in vendor master
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mt-1 leading-relaxed">
              Register commercial manufacturers, importers, and suppliers to manage purchase orders and vendor bills.
            </p>
            <div className="mt-4">
              <Button
                variant="primary"
                size="sm"
                onClick={() => showToast('Add Supplier', 'Supplier registration modal', 'info')}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Register First Supplier
              </Button>
            </div>
          </div>
        }
      />
    </div>
  );
};
