import React, { useState } from 'react';
import { Plus, Search, Download, Users } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Table, Column } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { useTransactions, CustomerRecord } from '../context/TransactionContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/formatters';

interface CustomersPageProps {
  onOpenAddCustomer: () => void;
  currencySymbol?: string;
}

export const CustomersPage: React.FC<CustomersPageProps> = ({
  onOpenAddCustomer,
  currencySymbol = 'Rs.',
}) => {
  const { showToast } = useToast();
  const { customers } = useTransactions();
  const [activeTab, setActiveTab] = useState<'all' | 'credit' | 'cash' | 'statements'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);

    if (activeTab === 'credit') return matchesSearch && c.creditLimit !== null;
    if (activeTab === 'cash') return matchesSearch && c.creditLimit === null;
    return matchesSearch;
  });

  const columns: Column<CustomerRecord>[] = [
    { key: 'code', header: 'CUSTOMER CODE', width: '130px' },
    {
      key: 'name',
      header: 'COMMERCIAL NAME',
      render: (r) => (
        <div>
          <span className="font-semibold text-slate-900 dark:text-neutral-100">{r.name}</span>
          {(r.cashAccountId || r.codAccountId) && (
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Settlement: {r.cashAccountId ? `Cash (${r.cashAccountId})` : ''} {r.codAccountId ? `• COD (${r.codAccountId})` : ''}
            </p>
          )}
        </div>
      ),
    },
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
    {
      key: 'creditLimit',
      header: 'CREDIT LIMIT',
      align: 'right',
      render: (r) =>
        r.creditLimit !== null
          ? formatCurrency(r.creditLimit, currencySymbol)
          : <span className="text-slate-400">Unset (Cash)</span>,
    },
    {
      key: 'creditDays',
      header: 'CREDIT DAYS',
      align: 'right',
      render: (r) =>
        r.creditDays !== null ? `${r.creditDays} days` : <span className="text-slate-400">Immediate</span>,
    },
    {
      key: 'balance',
      header: 'OUTSTANDING',
      align: 'right',
      render: (r) => (
        <span className="font-mono font-bold text-slate-900 dark:text-neutral-100">
          {formatCurrency(r.balance, currencySymbol)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'STATUS',
      align: 'center',
      render: (r) => (
        <Badge variant={r.status === 'active' ? 'success' : 'neutral'} dot>
          {r.status.toUpperCase()}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-neutral-400 uppercase">
            OPERATIONS & ACCOUNTS RECEIVABLE
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-neutral-100 mt-1">
            Customers & Receivables
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
            Client accounts, credit limit utilization, payment terms, and ledger statements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => showToast('Export', 'Exporting customer accounts ledger', 'info')}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenAddCustomer}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Customer
          </Button>
        </div>
      </div>

      <div className="flex border-b border-slate-200 dark:border-neutral-800 space-x-6 text-xs font-semibold overflow-x-auto pb-px">
        {[
          { id: 'all', label: `All Customer Accounts (${customers.length})` },
          { id: 'credit', label: 'Credit Term Accounts' },
          { id: 'cash', label: 'Cash / COD Accounts' },
          { id: 'statements', label: 'Account Statements' },
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

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search customer by name, code, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={filteredCustomers}
        keyExtractor={(row) => row.id}
        emptyState={
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 flex items-center justify-center mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
              No customer accounts registered
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mt-1 leading-relaxed">
              Register wholesale clients, supermarkets, and distributors with their tax identification, credit limits, and payment terms.
            </p>
            <div className="mt-4">
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenAddCustomer}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Register First Customer
              </Button>
            </div>
          </div>
        }
      />
    </div>
  );
};
