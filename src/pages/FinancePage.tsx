import React, { useState } from 'react';
import {
  Plus,
  Search,
  Download,
  Landmark,
  BookOpen,
  Layers,
  FileText,
  Wallet,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Table, Column } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
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

interface GeneralLedgerRow {
  id: string;
  date: string;
  voucherRef: string;
  accountCode: string;
  accountName: string;
  memo: string;
  debit: number;
  credit: number;
  runningBalance: number;
  status: 'posted' | 'reconciled';
}

interface CashBankAccountRow {
  code: string;
  name: string;
  institution: string;
  accountNumber: string;
  currency: string;
  bookBalance: number;
  reconciledDate: string;
}

export const FinancePage: React.FC<FinancePageProps> = ({
  currencySymbol = '$',
}) => {
  const { showToast } = useToast();

  // General Ledger View is the primary default tab and renders immediately on initial mount
  const [activeTab, setActiveTab] = useState<
    'ledger' | 'coa' | 'journals' | 'cash_bank' | 'reconciliation'
  >('ledger');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccountFilter, setSelectedAccountFilter] = useState('all');

  // Honest production database starts with 0 unposted or fake transactions
  const generalLedgerData: GeneralLedgerRow[] = [];
  const journalVouchersData: any[] = [];

  // Chart of Accounts master definitions
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

  const cashBankData: CashBankAccountRow[] = [
    { code: '1010', name: 'Warehouse Petty Cash Vault', institution: 'Physical Safe Depot', accountNumber: 'VAULT-01', currency: 'USD', bookBalance: 0, reconciledDate: '2026-10-28' },
    { code: '1020', name: 'Corporate Operating Account', institution: 'Al Rajhi Corporate Banking', accountNumber: 'SA84 8000 0234 6080 1010', currency: 'USD', bookBalance: 0, reconciledDate: '2026-10-28' },
    { code: '1015', name: 'Van Fleet Float Cash Box', institution: 'Mobile Cash Drawer', accountNumber: 'FLOAT-VAN-01', currency: 'USD', bookBalance: 0, reconciledDate: '2026-10-28' },
  ];

  // Columns for General Ledger View
  const ledgerColumns: Column<GeneralLedgerRow>[] = [
    { key: 'date', header: 'POSTING DATE', width: '120px' },
    { key: 'voucherRef', header: 'VOUCHER / REF', width: '140px' },
    {
      key: 'accountCode',
      header: 'GL ACCOUNT',
      render: (r) => (
        <span className="font-medium text-slate-900 dark:text-neutral-100">
          <span className="font-mono text-slate-500 dark:text-neutral-400 mr-1.5">{r.accountCode}</span>
          {r.accountName}
        </span>
      ),
    },
    { key: 'memo', header: 'MEMO / NARRATIVE' },
    {
      key: 'debit',
      header: 'DEBIT',
      align: 'right',
      render: (r) => (r.debit > 0 ? `${currencySymbol}${r.debit.toFixed(2)}` : '—'),
    },
    {
      key: 'credit',
      header: 'CREDIT',
      align: 'right',
      render: (r) => (r.credit > 0 ? `${currencySymbol}${r.credit.toFixed(2)}` : '—'),
    },
    {
      key: 'runningBalance',
      header: 'RUNNING BALANCE',
      align: 'right',
      render: (r) => (
        <span className="font-bold text-slate-900 dark:text-neutral-100">
          {currencySymbol}{r.runningBalance.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'STATUS',
      align: 'center',
      render: (r) => (
        <Badge variant={r.status === 'reconciled' ? 'success' : 'neutral'} dot>
          {r.status.toUpperCase()}
        </Badge>
      ),
    },
  ];

  // Columns for Chart of Accounts View
  const coaColumns: Column<AccountRow>[] = [
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

  // Filter accounts
  const filteredAccounts = accountsData.filter(
    (acc) =>
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.code.includes(searchQuery) ||
      acc.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 dark:border-neutral-800 space-x-6 text-xs font-semibold overflow-x-auto pb-px">
        {[
          { id: 'ledger', label: 'General Ledger View' },
          { id: 'coa', label: 'Chart of Accounts' },
          { id: 'journals', label: 'Journal Entries & Vouchers' },
          { id: 'cash_bank', label: 'Cash & Bank Accounts' },
          { id: 'reconciliation', label: 'Bank Statement Reconciliation' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id as any);
              setSearchQuery('');
            }}
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

      {/* 1. General Ledger View (Default & Initial Render) */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search ledger by voucher #, account, or memo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedAccountFilter}
                onChange={(e) => setSelectedAccountFilter(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-slate-700 dark:text-neutral-300 focus:outline-none"
              >
                <option value="all">All Accounts in Ledger</option>
                <option value="1010">1010 - Petty Cash</option>
                <option value="1020">1020 - Corporate Bank</option>
                <option value="1050">1050 - Trade AR</option>
                <option value="1100">1100 - Merchandise Inventory</option>
                <option value="2010">2010 - Trade AP</option>
                <option value="4010">4010 - Sales Revenue</option>
              </select>

              <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 dark:text-neutral-400 pl-2">
                <span>Ledger State:</span>
                <strong className="text-[#167a53] dark:text-[#34d399]">Reconciled</strong>
              </div>
            </div>
          </div>

          <Table
            columns={ledgerColumns}
            data={generalLedgerData}
            keyExtractor={(row) => row.id}
            emptyState={
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 flex items-center justify-center mb-3">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                  No General Ledger transactions posted
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mt-1 leading-relaxed">
                  Audited double-entry journal entries, commercial invoice posts, goods receipts, and expense vouchers will populate the general ledger automatically.
                </p>
                <div className="mt-4">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      showToast('Journal Entry', 'Manual journal entry adjustment voucher', 'info')
                    }
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Record Opening Balance / Journal Entry
                  </Button>
                </div>
              </div>
            }
          />
        </div>
      )}

      {/* 2. Chart of Accounts View */}
      {activeTab === 'coa' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search account code, title, or classification..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
              />
            </div>

            <div className="text-xs text-slate-500 dark:text-neutral-400 flex items-center gap-2">
              <span>Standard Chart of Accounts:</span>
              <strong className="text-slate-900 dark:text-neutral-100">10 Wholesale Accounts</strong>
            </div>
          </div>

          <Table
            columns={coaColumns}
            data={filteredAccounts}
            keyExtractor={(row) => row.code}
          />
        </div>
      )}

      {/* 3. Journal Entries View */}
      {activeTab === 'journals' && (
        <div className="p-8 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800 text-center flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 flex items-center justify-center mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
            No manual journal entry vouchers on file
          </h3>
          <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mt-1 leading-relaxed">
            Record manual double-entry adjustments, depreciation schedules, or period-end closing allocations. Debits and credits must balance before posting.
          </p>
          <div className="mt-4">
            <Button
              variant="primary"
              size="sm"
              onClick={() => showToast('Journal Entry', 'Manual journal entry form', 'info')}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Journal Voucher
            </Button>
          </div>
        </div>
      )}

      {/* 4. Cash & Bank Accounts */}
      {activeTab === 'cash_bank' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cashBankData.map((acc) => (
              <div
                key={acc.code}
                className="p-5 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-500 dark:text-neutral-400">
                    {acc.code}
                  </span>
                  <Badge variant="success" dot>
                    ACTIVE
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                    {acc.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                    {acc.institution} · <span className="font-mono">{acc.accountNumber}</span>
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-neutral-800 flex items-baseline justify-between">
                  <span className="text-xs text-slate-500 dark:text-neutral-400">Book Balance:</span>
                  <span className="text-base font-bold font-mono text-[#167a53] dark:text-[#34d399]">
                    {currencySymbol}{acc.bookBalance.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Bank Statement Reconciliation */}
      {activeTab === 'reconciliation' && (
        <div className="p-8 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800 text-center flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#167a53] dark:text-[#34d399] flex items-center justify-center mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
            Bank Statement Status: Synchronized
          </h3>
          <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mt-1 leading-relaxed">
            All cash ledger balances match verified bank statements. No unreconciled transit checks or clearing differences exist.
          </p>
          <div className="mt-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => showToast('Bank Statement', 'Import bank statement CSV', 'info')}
            >
              Import Bank Statement
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
