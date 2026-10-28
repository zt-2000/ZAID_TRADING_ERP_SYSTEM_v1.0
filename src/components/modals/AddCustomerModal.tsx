import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useTransactions, chartOfAccounts } from '../../context/TransactionContext';
import { useToast } from '../../context/ToastContext';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencySymbol?: string;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  isOpen,
  onClose,
  currencySymbol = 'Rs.',
}) => {
  const { addCustomer } = useTransactions();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [customerCode, setCustomerCode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [address, setAddress] = useState('');
  const [pricingTier, setPricingTier] = useState('wholesale');
  const [creditLimit, setCreditLimit] = useState('');
  const [creditDays, setCreditDays] = useState('');

  // Accounting & Payment Settings
  const cashAccounts = chartOfAccounts
    .filter((a) => a.type === 'Asset' && (a.code.startsWith('10') || a.code.startsWith('11')))
    .map((a) => ({ value: a.code, label: `${a.code} — ${a.name}` }));

  const [cashAccountId, setCashAccountId] = useState('1010');
  const [codAccountId, setCodAccountId] = useState('1015');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Validation Error', 'Customer commercial name is required', 'error');
      return;
    }
    if (!customerCode.trim()) {
      showToast('Validation Error', 'Unique customer account code is required', 'error');
      return;
    }

    const numCreditLimit = creditLimit.trim() ? parseFloat(creditLimit) : null;
    const numCreditDays = creditDays.trim() ? parseInt(creditDays, 10) : null;

    const selectedCash = chartOfAccounts.find((a) => a.code === cashAccountId);
    const selectedCOD = chartOfAccounts.find((a) => a.code === codAccountId);

    setIsSubmitting(true);
    setTimeout(() => {
      const result = addCustomer({
        name: name.trim(),
        code: customerCode.trim().toUpperCase(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        taxNumber: taxNumber.trim() || undefined,
        creditLimit: numCreditLimit,
        creditDays: numCreditDays,
        cashAccountId,
        cashAccountName: selectedCash?.name,
        codAccountId,
        codAccountName: selectedCOD?.name,
        status: 'active',
      });

      setIsSubmitting(false);
      if (!result.success) {
        showToast('Validation Error', result.error, 'error');
        return;
      }

      showToast(
        'Customer Profile Registered',
        `${name} (${customerCode}) has been registered to customer master with GL payment accounts.`,
        'success'
      );
      onClose();

      // Reset
      setName('');
      setCustomerCode('');
      setPhone('');
      setEmail('');
      setTaxNumber('');
      setAddress('');
      setCreditLimit('');
      setCreditDays('');
      setCashAccountId('1010');
      setCodAccountId('1015');
    }, 250);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Add Wholesale Customer"
      description="Register client company with credit terms, VAT registration, and general ledger settlement accounts"
      maxWidth="xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Register Customer
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Customer Name / Business Title"
            placeholder="e.g. Lanka Wholesale Stores / Colombo Mart"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
          <Input
            label="Customer Code"
            placeholder="e.g. CUST-2026-081"
            value={customerCode}
            onChange={(e) => setCustomerCode(e.target.value.toUpperCase())}
            required
            helperText="Unique ERP identifier"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Contact Phone"
            type="tel"
            placeholder="+94 77 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            optional
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="billing@lankastores.lk"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            optional
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Tax / VAT Identification Number"
            placeholder="109821430-7000"
            value={taxNumber}
            onChange={(e) => setTaxNumber(e.target.value)}
            optional
          />
          <Select
            label="Pricing Tier"
            value={pricingTier}
            onChange={(e) => setPricingTier(e.target.value)}
            options={[
              { value: 'wholesale', label: 'Wholesale Standard (Default)' },
              { value: 'vip_distributor', label: 'VIP High Volume Distributor' },
              { value: 'retail_cash', label: 'Walk-in Cash Pricing' },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label={`Credit Limit (${currencySymbol})`}
            placeholder="Leave empty if unset or cash-only"
            type="number"
            value={creditLimit}
            onChange={(e) => setCreditLimit(e.target.value)}
            optional
            helperText="Unset remains explicitly null (not zero)"
          />
          <Input
            label="Credit Payment Days"
            placeholder="e.g. 30"
            type="number"
            value={creditDays}
            onChange={(e) => setCreditDays(e.target.value)}
            optional
            helperText="Due date calculated from invoice post date"
          />
        </div>

        <Input
          label="Billing & Delivery Address"
          placeholder="No. 88, Commercial District, Main Street, Colombo 11"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          optional
        />

        {/* Accounting & Payment Settings */}
        <div className="pt-3 border-t border-slate-200 dark:border-neutral-800">
          <div className="mb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-neutral-200">
              Accounting & Payment Settings
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400">
              Assign dedicated general ledger settlement accounts for cash walk-ins and Cash On Delivery (COD) collections.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select
              label="Cash Settlement Account (COA)"
              value={cashAccountId}
              onChange={(e) => setCashAccountId(e.target.value)}
              options={cashAccounts}
            />
            <Select
              label="COD Clearing Account (COA)"
              value={codAccountId}
              onChange={(e) => setCodAccountId(e.target.value)}
              options={cashAccounts}
            />
          </div>
        </div>
      </form>
    </Dialog>
  );
};
