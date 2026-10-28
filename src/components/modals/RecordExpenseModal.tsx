import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';

interface RecordExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencySymbol?: string;
}

export const RecordExpenseModal: React.FC<RecordExpenseModalProps> = ({
  isOpen,
  onClose,
  currencySymbol = '$',
}) => {
  const { showToast } = useToast();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('logistics');
  const [paymentAccount, setPaymentAccount] = useState('petty_cash');
  const [payee, setPayee] = useState('');
  const [reference, setReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      showToast('Validation Error', 'Expense description is required', 'error');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      showToast('Validation Error', 'Valid expense amount is required', 'error');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      showToast(
        'Expense Voucher Posted',
        `Expense of ${currencySymbol}${parseFloat(amount).toFixed(2)} recorded to General Ledger.`,
        'success'
      );
      onClose();
      setDescription('');
      setAmount('');
      setPayee('');
      setReference('');
    }, 500);
  };

  return (
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
          <Select
            label="Expense Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[
              { value: 'logistics', label: 'Logistics, Fuel & Transportation' },
              { value: 'utilities', label: 'Warehouse Rent & Utilities' },
              { value: 'salaries', label: 'Staff Wages & Driver Allowances' },
              { value: 'maintenance', label: 'Equipment & Vehicle Maintenance' },
              { value: 'packaging', label: 'Packaging Supplies' },
              { value: 'office', label: 'Office & Administrative Supplies' },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select
            label="Paid From Account"
            value={paymentAccount}
            onChange={(e) => setPaymentAccount(e.target.value)}
            options={[
              { value: 'petty_cash', label: 'Main Warehouse Petty Cash (1010)' },
              { value: 'alrajhi_bank', label: 'Corporate Operating Bank Account (1020)' },
              { value: 'van_cash', label: 'Van Float Cash Drawer (1015)' },
            ]}
          />
          <Input
            label="Payee / Vendor"
            placeholder="e.g. National Fuel Services"
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
  );
};
