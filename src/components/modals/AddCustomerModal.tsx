import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencySymbol?: string;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  isOpen,
  onClose,
  currencySymbol = '$',
}) => {
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

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      showToast(
        'Customer Profile Registered',
        `${name} (${customerCode}) has been registered to customer database.`,
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
    }, 500);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Add Wholesale Customer"
      description="Register client company with credit terms, VAT registration, and contacts"
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
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Customer Name / Business Title"
            placeholder="e.g. Al-Nukhba Hypermarket LLC"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
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
            placeholder="+966 50 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            optional
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="billing@alnukhba.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            optional
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Tax / VAT Identification Number"
            placeholder="300012345600003"
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
            helperText="Unset remains non-restrictive or cash-basis"
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
          placeholder="Building 14, Commercial District, Exit 8, Riyadh"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          optional
        />
      </form>
    </Dialog>
  );
};
