import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import { Plus, Trash2 } from 'lucide-react';

interface NewPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencySymbol?: string;
}

export const NewPurchaseModal: React.FC<NewPurchaseModalProps> = ({
  isOpen,
  onClose,
  currencySymbol = '$',
}) => {
  const { showToast } = useToast();
  const [supplierName, setSupplierName] = useState('');
  const [supplierInvoiceRef, setSupplierInvoiceRef] = useState('');
  const [warehouse, setWarehouse] = useState('central_hub');
  const [paymentTerms, setPaymentTerms] = useState('30_days');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [items, setItems] = useState([
    { id: '1', sku: '', description: '', quantity: 10, unitCost: 0 },
  ]);

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 7),
        sku: '',
        description: '',
        quantity: 10,
        unitCost: 0,
      },
    ]);
  };

  const removeItemRow = (id: string) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: string, value: string | number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const totalCost = items.reduce((acc, curr) => acc + (curr.quantity * curr.unitCost || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      showToast('Validation Error', 'Supplier name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      showToast(
        'Purchase Order Generated',
        `Purchase order PO-001 for ${supplierName} (${currencySymbol}${totalCost.toFixed(2)}) created successfully.`,
        'success'
      );
      onClose();
      setSupplierName('');
      setSupplierInvoiceRef('');
      setItems([{ id: '1', sku: '', description: '', quantity: 10, unitCost: 0 }]);
    }, 600);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create Purchase Order"
      description="Issue purchase order to authorized supplier with receiving warehouse selection"
      maxWidth="2xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Create Purchase Order
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Supplier Entity"
            placeholder="e.g. Gulf Food Industries Ltd"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            required
          />
          <Input
            label="Supplier Reference / Proforma #"
            placeholder="e.g. PRO-2026-904"
            value={supplierInvoiceRef}
            onChange={(e) => setSupplierInvoiceRef(e.target.value)}
            optional
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select
            label="Receiving Warehouse"
            value={warehouse}
            onChange={(e) => setWarehouse(e.target.value)}
            options={[
              { value: 'central_hub', label: 'Main Central Hub (Riyadh)' },
              { value: 'dammam_facility', label: 'Dammam Port Depot' },
              { value: 'jeddah_hub', label: 'Jeddah Distribution Center' },
            ]}
          />
          <Select
            label="Supplier Payment Terms"
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            options={[
              { value: 'advance', label: '100% Advance Payment' },
              { value: 'receipt', label: 'Payment Upon Receipt of Goods' },
              { value: '30_days', label: 'Net 30 Days' },
              { value: '60_days', label: 'Net 60 Days' },
            ]}
          />
        </div>

        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-neutral-300">
              Procured Stock Items
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
                <div className="w-28">
                  <input
                    type="text"
                    placeholder="SKU Code"
                    value={item.sku}
                    onChange={(e) => updateItem(item.id, 'sku', e.target.value)}
                    className="w-full bg-white dark:bg-[#1a211e] border border-slate-200 dark:border-neutral-700 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Item description"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
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
                <div className="w-24">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Unit Cost"
                    value={item.unitCost || ''}
                    onChange={(e) => updateItem(item.id, 'unitCost', parseFloat(e.target.value) || 0)}
                    className="w-full bg-white dark:bg-[#1a211e] border border-slate-200 dark:border-neutral-700 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-neutral-100 text-right font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-[#167a53]"
                  />
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
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-800 dark:text-neutral-200">
              <span>Total Estimated PO Value:</span>
              <span className="text-sm font-mono tabular-nums text-[#167a53] dark:text-[#34d399] font-bold">
                {currencySymbol}{totalCost.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </form>
    </Dialog>
  );
};
