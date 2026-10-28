import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { ExpenseCategoryModal } from './ExpenseCategoryModal';
import { useExpenseCategories } from '../../context/ExpenseCategoryContext';
import { useTransactions } from '../../context/TransactionContext';
import { useToast } from '../../context/ToastContext';
import { Plus } from 'lucide-react';

interface RecordExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencySymbol?: string;
}

export const RecordExpenseModal: React.FC<RecordExpenseModalProps> = ({
  isOpen,
  onClose,
  currencySymbol = 'Rs.',
}) => {
  const { showToast } = useToast();
  const { activeCategories } = useExpenseCategories();
  const { recordExpense } = useTransactions();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(
    activeCategories[0]?.id || 'exp_cat_logistics'
  );
  const [paymentAccount, setPaymentAccount] = useState('petty_cash');
  const [payee, setPayee] = useState('');
  const [reference, setReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);

  // Synchronize category selection if activeCategories change
  React.useEffect(() => {
    if (activeCategories.length > 0 && !activeCategories.some((c) => c.id === category)) {
      setCategory(activeCategories[0].id);
    }
  }, [activeCategories, category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      showToast('Validation Error', 'Expense description is required', 'error');
      return;
    }
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      showToast('Validation Error', 'Valid expense amount is required', 'error');
      return;
    }

    const catObj = activeCategories.find((c) => c.id === category) || {
      id: category,
      name: category,
    };

    setIsSubmitting(true);
    setTimeout(() => {
      recordExpense({
        description: description.trim(),
        amount: numAmount,
        categoryId: catObj.id,
        categoryName: catObj.name,
        paymentAccount,
        payee: payee.trim(),
        reference: reference.trim(),
      });

      setIsSubmitting(false);
      showToast(
        'Expense Voucher Posted',
        `Expense of ${currencySymbol} ${numAmount.toFixed(2)} posted to General Ledger.`,
        'success'
      );
      onClose();

      // Reset
      setDescription('');
      setAmount('');
      setPayee('');
      setReference('');
    }, 300);
  };

  const categoryOptions = activeCategories.map((c) => ({
    value: c.id,
    label: `${c.name} (${c.code})`,
  }));

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title="Record Operating Expense"
        description="Post expense voucher linked to chart of accounts and cash/bank balance"
        maxWidth="lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
              Post Expense Entry
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Input
            label="Expense Description / Purpose"
            placeholder="e.g. Fuel and maintenance for Van Fleet Unit 01"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            autoFocus
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label={`Amount (${currencySymbol})`}
              placeholder="0.00"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300">
                  Expense Category
                </label>
                <button
                  type="button"
                  onClick={() => setIsCreateCategoryOpen(true)}
                  className="text-[11px] font-medium text-[#167a53] dark:text-[#34d399] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add New Category</span>
                </button>
              </div>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={categoryOptions}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select
              label="Paid From Account"
              value={paymentAccount}
              onChange={(e) => setPaymentAccount(e.target.value)}
              options={[
                { value: 'petty_cash', label: '1010 — Central Warehouse Petty Cash Vault' },
                { value: 'alrajhi_bank', label: '1020 — Corporate Operating Bank Account' },
                { value: 'van_cash', label: '1015 — Van Float Cash Drawer' },
              ]}
            />
            <Input
              label="Payee / Vendor"
              placeholder="e.g. Lanka IOC Fuel Station / National Power"
              value={payee}
              onChange={(e) => setPayee(e.target.value)}
              optional
            />
          </div>

          <Input
            label="Voucher / Receipt Reference #"
            placeholder="e.g. REC-88391"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            optional
          />
        </form>
      </Dialog>

      {/* Embedded Expense Category Creation Dialog — preserves form fields */}
      <ExpenseCategoryModal
        isOpen={isCreateCategoryOpen}
        onClose={() => setIsCreateCategoryOpen(false)}
        onCategoryCreated={(newCat) => {
          setCategory(newCat.id);
        }}
      />
    </>
  );
};
