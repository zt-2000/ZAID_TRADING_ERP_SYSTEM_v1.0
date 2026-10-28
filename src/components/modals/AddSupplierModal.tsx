import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useTransactions } from '../../context/TransactionContext';
import { useToast } from '../../context/ToastContext';

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencySymbol?: string;
}

export const AddSupplierModal: React.FC<AddSupplierModalProps> = ({
  isOpen,
  onClose,
  currencySymbol = 'Rs.',
}) => {
  const { addSupplier } = useTransactions();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('30_days');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Validation Error', 'Supplier company name is required', 'error');
      return;
    }
    if (!code.trim()) {
      showToast('Validation Error', 'Supplier code is required', 'error');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const result = addSupplier({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        taxNumber: taxNumber.trim() || undefined,
        paymentTerms,
        status: 'active',
      });

      setIsSubmitting(false);
      if (!result.success) {
        showToast('Validation Error', result.error, 'error');
        return;
      }

      showToast(
        'Supplier Registered',
        `Supplier "${name}" has been registered to vendor master.`,
        'success'
      );
      onClose();

      setName('');
      setCode('');
      setPhone('');
      setEmail('');
      setAddress('');
      setTaxNumber('');
    }, 300);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Add Supplier Account"
      description="Register commercial supplier, vendor terms, and procurement address"
      maxWidth="xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Register Supplier
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Supplier Company Name"
            placeholder="e.g. Ceylon Agro Commodities Ltd"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
          <Input
            label="Supplier Code"
            placeholder="e.g. SUPP-001"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
            helperText="Unique identifier"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Phone"
            type="tel"
            placeholder="+94 11 987 6543"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            optional
          />
          <Input
            label="Email"
            type="email"
            placeholder="sales@ceylonagro.lk"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            optional
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Tax / VAT Number"
            placeholder="102345678-7000"
            value={taxNumber}
            onChange={(e) => setTaxNumber(e.target.value)}
            optional
          />
          <Select
            label="Payment Terms"
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            options={[
              { value: 'immediate', label: 'Cash on Delivery / Immediate' },
              { value: '30_days', label: 'Net 30 Days' },
              { value: '60_days', label: 'Net 60 Days' },
            ]}
          />
        </div>

        <Input
          label="Physical Address"
          placeholder="No. 12, Industrial Zone, Kelaniya"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          optional
        />
      </form>
    </Dialog>
  );
};
