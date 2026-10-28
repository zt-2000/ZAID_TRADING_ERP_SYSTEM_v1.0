import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useTransactions } from '../../context/TransactionContext';
import { useToast } from '../../context/ToastContext';
import { Plus, Trash2 } from 'lucide-react';

interface NewJournalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencySymbol?: string;
}

interface JournalLine {
  id: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

const standardAccounts = [
  { code: '1010', name: 'Central Warehouse Petty Cash' },
  { code: '1020', name: 'Corporate Operating Bank Account' },
  { code: '1050', name: 'Trade Accounts Receivable' },
  { code: '1100', name: 'Merchandise Inventory Asset' },
  { code: '2010', name: 'Trade Accounts Payable' },
  { code: '2050', name: 'Output VAT / Tax Payable' },
  { code: '3010', name: 'Owners Contributed Capital' },
  { code: '4010', name: 'Wholesale Merchandise Sales' },
  { code: '5010', name: 'Cost of Goods Sold (COGS)' },
  { code: '6010', name: 'Logistics & Operating Expenses' },
];

export const NewJournalEntryModal: React.FC<NewJournalEntryModalProps> = ({
  isOpen,
  onClose,
  currencySymbol = 'Rs.',
}) => {
  const { recordJournalEntry } = useTransactions();
  const { showToast } = useToast();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [voucherRef, setVoucherRef] = useState(`JV-${Date.now().toString().slice(-4)}`);
  const [memo, setMemo] = useState('');
  const [lines, setLines] = useState<JournalLine[]>([
    { id: '1', accountCode: '1010', accountName: 'Central Warehouse Petty Cash', debit: 0, credit: 0 },
    { id: '2', accountCode: '3010', accountName: 'Owners Contributed Capital', debit: 0, credit: 0 },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 7),
        accountCode: '1020',
        accountName: 'Corporate Operating Bank Account',
        debit: 0,
        credit: 0,
      },
    ]);
  };

  const removeLine = (id: string) => {
    if (lines.length <= 2) return;
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const updateLineAccount = (id: string, code: string) => {
    const acc = standardAccounts.find((a) => a.code === code);
    setLines((prev) =>
      prev.map((l) =>
        l.id === id
          ? { ...l, accountCode: code, accountName: acc?.name || '' }
          : l
      )
    );
  };

  const updateLineAmount = (id: string, field: 'debit' | 'credit', val: number) => {
    setLines((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              [field]: val,
              // If entering debit, clear credit and vice versa
              ...(field === 'debit' && val > 0 ? { credit: 0 } : {}),
              ...(field === 'credit' && val > 0 ? { debit: 0 } : {}),
            }
          : l
      )
    );
  };

  const totalDebit = lines.reduce((acc, l) => acc + (l.debit || 0), 0);
  const totalCredit = lines.reduce((acc, l) => acc + (l.credit || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!memo.trim()) {
      setError('Please provide a memo/narrative for this journal entry.');
      return;
    }

    if (totalDebit <= 0 || totalCredit <= 0) {
      setError('Journal entry must have non-zero debits and credits.');
      return;
    }

    if (!isBalanced) {
      setError(
        `Debits (${currencySymbol} ${totalDebit.toFixed(2)}) must equal Credits (${currencySymbol} ${totalCredit.toFixed(2)}). Difference: ${currencySymbol} ${Math.abs(totalDebit - totalCredit).toFixed(2)}`
      );
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const result = recordJournalEntry({
        date,
        voucherRef,
        memo: memo.trim(),
        entries: lines.map((l) => ({
          accountCode: l.accountCode,
          accountName: l.accountName,
          debit: l.debit || 0,
          credit: l.credit || 0,
        })),
      });

      setIsSubmitting(false);
      if (!result.success) {
        setError(result.error || 'Failed to post journal entry.');
        return;
      }

      showToast(
        'Journal Entry Posted',
        `Voucher ${voucherRef} successfully balanced and posted to General Ledger.`,
        'success'
      );
      onClose();
    }, 300);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create Double-Entry Journal Voucher"
      description="Record opening balances, depreciation, or manual ledger adjustments"
      maxWidth="2xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!isBalanced}
          >
            Post Journal Entry
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Entry Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <Input
            label="Voucher Reference #"
            value={voucherRef}
            onChange={(e) => setVoucherRef(e.target.value)}
            required
          />
        </div>

        <Input
          label="Memo / Business Purpose"
          placeholder="e.g. Initial Owner Equity Capital Deposit or Adjustment"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          required
        />

        {/* Lines */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-neutral-300">
              General Ledger Accounts & Allocation
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLine}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Line
            </Button>
          </div>

          <div className="space-y-2 border border-slate-200 dark:border-neutral-800 rounded-lg p-3 bg-slate-50/50 dark:bg-[#151b18]">
            {lines.map((line, idx) => (
              <div key={line.id} className="flex items-center gap-2 text-xs">
                <span className="w-5 text-slate-400 font-mono text-center">{idx + 1}</span>
                <div className="flex-1">
                  <select
                    value={line.accountCode}
                    onChange={(e) => updateLineAccount(line.id, e.target.value)}
                    className="w-full bg-white dark:bg-[#1a211e] border border-slate-200 dark:border-neutral-700 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
                  >
                    {standardAccounts.map((acc) => (
                      <option key={acc.code} value={acc.code}>
                        {acc.code} — {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-28">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Debit"
                    value={line.debit || ''}
                    onChange={(e) =>
                      updateLineAmount(line.id, 'debit', parseFloat(e.target.value) || 0)
                    }
                    className="w-full bg-white dark:bg-[#1a211e] border border-slate-200 dark:border-neutral-700 rounded px-2.5 py-1.5 text-xs text-right font-mono tabular-nums text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
                  />
                </div>
                <div className="w-28">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Credit"
                    value={line.credit || ''}
                    onChange={(e) =>
                      updateLineAmount(line.id, 'credit', parseFloat(e.target.value) || 0)
                    }
                    className="w-full bg-white dark:bg-[#1a211e] border border-slate-200 dark:border-neutral-700 rounded px-2.5 py-1.5 text-xs text-right font-mono tabular-nums text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeLine(line.id)}
                  disabled={lines.length <= 2}
                  className="text-slate-400 hover:text-rose-500 disabled:opacity-30 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Balance summary */}
          <div className="flex items-center justify-between pt-2 px-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-neutral-400">Ledger Balance Status:</span>
              <span
                className={`font-semibold ${
                  isBalanced
                    ? 'text-[#167a53] dark:text-[#34d399]'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {isBalanced
                  ? '✓ Balanced (Debits = Credits)'
                  : `Out of balance by ${currencySymbol} ${Math.abs(totalDebit - totalCredit).toFixed(2)}`}
              </span>
            </div>
            <div className="flex items-center gap-6 font-mono tabular-nums text-xs">
              <div>
                <span className="text-slate-400 mr-1.5">DR:</span>
                <span className="font-semibold text-slate-900 dark:text-neutral-100">
                  {currencySymbol} {totalDebit.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 mr-1.5">CR:</span>
                <span className="font-semibold text-slate-900 dark:text-neutral-100">
                  {currencySymbol} {totalCredit.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Dialog>
  );
};
