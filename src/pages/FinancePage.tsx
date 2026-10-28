import React, { useState } from 'react';
import { Plus, Search, Download, Landmark, BookOpen, Layers } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Table, Column } from '../components/ui/Table';
import { useToast } from '../context/ToastContext';

interface FinancePageProps {
  currencySymbol?: string;
}

interface AccountRow {
  code: string;
  name: string;
  type: string;
  category: string;
  debit: number;
  credit: number;
  netBalance: number;
}

export const FinancePage: React.FC<FinancePageProps> = ({
  currencySymbol = '$',
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'coa' | 'ledger' | 'journals' | 'cash_bank' | 'reconciliation'>('coa');
  const [searchQuery, setSearchQuery] = useState('');

  // Initial standard wholesale Chart of Accounts template with 0-balance starting state
  const accountsData: AccountRow[] = [
    { code: '1010', name: 'Central Warehouse Petty Cash', type: 'Asset', category: 'Cash & Cash Equivalents', debit: 0, credit: 0, netBalance: 0 },
    { code: '1020', name: 'Corporate Operating Bank Account', type: 'Asset', category: 'Cash & Cash Equivalents', debit: 0, credit: 0, netBalance: 0 },
    { code: '1050', name: 'Trade Accounts Receivable', type: 'Asset', category: 'Current Assets', debit: 0, credit: 0, netBalance: 0 },
    { code: '1100', name: 'Merchandise Inventory Asset', type: 'Asset', category: 'Inventory', debit: 0, credit: 0, netBalance: 0 },
    { code: '2010', name: 'Trade Accounts Payable', type: 'Liability', category: 'Current Liabilities', debit: 0, credit: 0, netBalance: 0 },
    { code: '2050', name: 'Output VAT / Tax Payable', type: 'Liability', category: 'Taxes Payable', debit: 0, credit: 0, netBalance: 0 },
    { code: '3010', name: 'Owners Contributed Capital', type: 'Equity', category: 'Equity', debit: 0, credit: 0, netBalance: 0 },
    { code: '4010', name: 'Wholesale Merchandise Sales', type: 'Revenue', category: 'Operating Revenue', debit: 0, credit: 0, netBalance: 0 },
    { code: '5010', name: 'Cost of Goods Sold (COGS)', type: 'Expense', category: 'Direct Cost', debit: 0, credit: 0, netBalance: 0 },
    { code: '6010', name: 'Logistics & Van Fleet Expenses', type: 'Expense', category: 'Operating Expenses', debit: 0, credit: 0, netBalance: 0 },
  ];

  const columns: Column<AccountRow>[] = [
    { key: 'code', header: 'CODE', width: '100px' },
    { key: 'name', header: 'ACCOUNT TITLE' },
    { key: 'type', header: 'ACCOUNT TYPE' },
    { key: 'category', header: 'REPORTING CLASSIFICATION' },
    {
      key: 'debit',
      header: 'PERIOD DEBIT',
      align: 'right',
      render: (r) => `${currencySymbol}${r.debit.toFixed(2)}`,
    },
    {
      key: 'credit',
      header: 'PERIOD CREDIT',
      align: 'right',
      render: (r) => `${currencySymbol}${r.credit.toFixed(2)}`,
    },
    {
      key: 'netBalance',
      header: 'AUDITED BALANCE',
      align: 'right',
      render: (r) => (
        <span className="font-bold text-slate-900 dark:text-neutral-100">
          {currencySymbol}{r.netBalance.toFixed(2)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-neutral-400 uppercase">
            ACCOUNTING & GENERAL LEDGER
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-neutral-100 mt-1">
            Finance & General Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
            Double-entry chart of accounts, journal entries, balanced ledgers, and trial balances
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => showToast('Trial Balance', 'Exporting Trial Balance to PDF/CSV', 'info')}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export Trial Balance
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => showToast('Journal Entry', 'Manual journal entry adjustment voucher', 'info')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Journal Entry
          </Button>
        </div>
      </div>

      <div className="flex border-b border-slate-200 dark:border-neutral-800 space-x-6 text-xs font-semibold overflow-x-auto pb-px">
        {[
          { id: 'coa', label: 'Chart of Accounts' },
          { id: 'ledger', label: 'General Ledger View' },
          { id: 'journals', label: 'Journal Entries & Vouchers' },
          { id: 'cash_bank', label: 'Cash & Bank Accounts' },
          { id: 'reconciliation', label: 'Bank Statement Reconciliation' },
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
            placeholder="Search account code or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
          />
        </div>

        <div className="text-xs text-slate-500 dark:text-neutral-400 flex items-center gap-3">
          <span>General Ledger Status: <strong className="text-[#167a53] dark:text-[#34d399]">Balanced (Debits = Credits)</strong></span>
        </div>
      </div>

      <Table
        columns={columns}
        data={accountsData}
        keyExtractor={(row) => row.code}
      />
    </div>
  );
};
