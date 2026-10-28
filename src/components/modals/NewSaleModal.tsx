import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useTransactions } from '../../context/TransactionContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import { Plus, Trash2 } from 'lucide-react';

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencySymbol?: string;
}

interface SaleLineItem {
  id: string;
  itemDescription: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export const NewSaleModal: React.FC<NewSaleModalProps> = ({
  isOpen,
  onClose,
  currencySymbol = 'Rs.',
}) => {
  const { recordSale } = useTransactions();
  const { showToast } = useToast();

  const [customerName, setCustomerName] = useState('');
  const [customerCode, setCustomerCode] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('30_days');
  const [warehouse, setWarehouse] = useState('central_hub');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [items, setItems] = useState<SaleLineItem[]>([
    { id: '1', itemDescription: '', quantity: 1, unitPrice: 0, taxRate: 15 },
  ]);

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 7),
        itemDescription: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: 15,
      },
    ]);
  };

  const removeItemRow = (id: string) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof SaleLineItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const subtotal = items.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice || 0), 0);
  const taxTotal = items.reduce(
    (acc, curr) => acc + ((curr.quantity * curr.unitPrice * curr.taxRate) / 100 || 0),
    0
  );
  const totalAmount = subtotal + taxTotal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      showToast('Validation Error', 'Customer name is required', 'error');
      return;
    }
    const hasInvalidItem = items.some((item) => !item.itemDescription.trim() || item.unitPrice <= 0);
    if (hasInvalidItem) {
      showToast('Validation Error', 'All line items must have a description and valid price', 'error');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const result = recordSale({
        customerName: customerName.trim(),
        customerCode: customerCode.trim() || undefined,
        paymentTerms,
        warehouse,
        subtotal,
        taxTotal,
        total: totalAmount,
        itemsCount: items.length,
        notes: notes.trim() || undefined,
      });

      setIsSubmitting(false);
      showToast(
        'Invoice Posted',
        `Sales invoice ${result.record?.invoiceNumber} for ${customerName} (${formatCurrency(totalAmount, currencySymbol)}) posted to ledger.`,
        'success'
      );
      onClose();

      // Reset form
      setCustomerName('');
      setCustomerCode('');
      setNotes('');
      setItems([{ id: '1', itemDescription: '', quantity: 1, unitPrice: 0, taxRate: 15 }]);
    }, 400);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create Sales Invoice"
      description="Draft wholesale commercial invoice with tax calculations and delivery location"
      maxWidth="2xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Post & Save Invoice
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Customer Name"
            placeholder="e.g. Colombo Super Centre / Al-Madina Wholesale"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            autoFocus
          />
          <Input
            label="Customer Account / Tax Code"
            placeholder="e.g. CUST-8491"
            value={customerCode}
            onChange={(e) => setCustomerCode(e.target.value)}
            optional
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select
            label="Payment Terms"
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            options={[
              { value: 'immediate', label: 'Cash on Delivery / Immediate Settlement' },
              { value: '15_days', label: 'Net 15 Days Credit' },
              { value: '30_days', label: 'Net 30 Days Standard' },
              { value: '60_days', label: 'Net 60 Days Distributor' },
            ]}
          />
          <Select
            label="Dispatch Warehouse / Van Location"
            value={warehouse}
            onChange={(e) => setWarehouse(e.target.value)}
            options={[
              { value: 'central_hub', label: 'Colombo Central Distribution Hub' },
              { value: 'van_01', label: 'Van Unit 01 — Western Province' },
              { value: 'van_02', label: 'Van Unit 02 — Central Province' },
            ]}
          />
        </div>

        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-neutral-300">
              Line Items
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItemRow}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Item
            </Button>
          </div>

          <div className="space-y-2 border border-slate-200 dark:border-neutral-800 rounded-lg p-3 bg-slate-50/50 dark:bg-[#151b18]">
            {items.map((item, index) => (
              <div key={item.id} className="flex items-center gap-2 text-xs">
                <div className="w-6 text-slate-400 text-center font-mono">{index + 1}</div>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Product description or SKU"
                    value={item.itemDescription}
                    onChange={(e) => updateItem(item.id, 'itemDescription', e.target.value)}
                    className="w-full bg-white dark:bg-[#1a211e] border border-slate-200 dark:border-neutral-700 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
                  />
                </div>
                <div className="w-20">
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-full bg-white dark:bg-[#1a211e] border border-slate-200 dark:border-neutral-700 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-neutral-100 text-right font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-[#167a53]"
                  />
                </div>
                <div className="w-28">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Price"
                    value={item.unitPrice || ''}
                    onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-full bg-white dark:bg-[#1a211e] border border-slate-200 dark:border-neutral-700 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-neutral-100 text-right font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-[#167a53]"
                  />
                </div>
                <div className="w-28 text-right font-mono tabular-nums font-medium text-slate-700 dark:text-neutral-300">
                  {formatCurrency(item.quantity * item.unitPrice, currencySymbol)}
                </div>
                <button
                  type="button"
                  onClick={() => removeItemRow(item.id)}
                  disabled={items.length === 1}
                  className="text-slate-400 hover:text-rose-500 disabled:opacity-30 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-3 flex justify-end">
            <div className="w-72 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-neutral-400">
                <span>Subtotal:</span>
                <span className="font-mono tabular-nums">{formatCurrency(subtotal, currencySymbol)}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-neutral-400">
                <span>Estimated Tax (15%):</span>
                <span className="font-mono tabular-nums">{formatCurrency(taxTotal, currencySymbol)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-slate-900 dark:text-neutral-100 pt-1.5 border-t border-slate-200 dark:border-neutral-700">
                <span>Total Due:</span>
                <span className="font-mono tabular-nums text-[#167a53] dark:text-[#34d399] font-bold">
                  {formatCurrency(totalAmount, currencySymbol)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <Input
          label="Internal Notes / Shipping Instructions"
          placeholder="e.g. Deliver before 10 AM, gate 3 unloading bay"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          optional
        />
      </form>
    </Dialog>
  );
};
