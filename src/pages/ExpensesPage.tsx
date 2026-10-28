import React, { useState } from 'react';
import { Plus, Search, Download, Receipt, Tag } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Table, Column } from '../components/ui/Table';
import { useToast } from '../context/ToastContext';

interface ExpensesPageProps {
  onOpenRecordExpense: () => void;
  currencySymbol?: string;
}

interface ExpenseRow {
  id: string;
  voucherNo: string;
  date: string;
  description: string;
  category: string;
  account: string;
  payee: string;
  amount: number;
  status: string;
}

export const ExpensesPage: React.FC<ExpensesPageProps> = ({
  onOpenRecordExpense,
  currencySymbol = '$',
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'all' | 'categories' | 'summary'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const expenseData: ExpenseRow[] = [];

  const columns: Column<ExpenseRow>[] = [
    { key: 'voucherNo', header: 'VOUCHER #' },
    { key: 'date', header: 'DATE' },
    { key: 'description', header: 'DESCRIPTION / PURPOSE' },
    { key: 'category', header: 'EXPENSE CATEGORY' },
    { key: 'account', header: 'DISBURSEMENT ACCOUNT' },
    { key: 'payee', header: 'BENEFICIARY' },
    {
      key: 'amount',
      header: 'AMOUNT',
      align: 'right',
      render: (r) => `${currencySymbol}${r.amount.toFixed(2)}`,
    },
    { key: 'status', header: 'STATUS', align: 'center' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-neutral-400 uppercase">
            ACCOUNTING & OPERATING DISBURSEMENTS
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-neutral-100 mt-1">
            Expenses & Disbursements
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
            Operational expenditure tracking, fleet fuel vouchers, warehouse overheads, and vendor payments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => showToast('Categories', 'Manage expense categories', 'info')}
            leftIcon={<Tag className="w-3.5 h-3.5" />}
          >
            Manage Categories
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenRecordExpense}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Record Expense
          </Button>
        </div>
      </div>

      <div className="flex border-b border-slate-200 dark:border-neutral-800 space-x-6 text-xs font-semibold overflow-x-auto pb-px">
        {[
          { id: 'all', label: 'All Recorded Expenses' },
          { id: 'categories', label: 'Expense Categories' },
          { id: 'summary', label: 'Monthly Cost Summary' },
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
            placeholder="Search by voucher #, payee, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={expenseData}
        keyExtractor={(row) => row.id}
        emptyState={
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 flex items-center justify-center mb-3">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
              No operating expenses recorded for current period
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mt-1 leading-relaxed">
              Post fuel receipts, driver allowances, warehouse repairs, and utility bills. Entries automatically adjust your cash/bank ledger.
            </p>
            <div className="mt-4">
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenRecordExpense}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Record First Expense
              </Button>
            </div>
          </div>
        }
      />
    </div>
  );
};
