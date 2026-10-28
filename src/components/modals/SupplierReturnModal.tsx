import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useTransactions } from '../../context/TransactionContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import { SupplierReturnItem } from '../../types';
import { Plus, Trash2 } from 'lucide-react';

interface SupplierReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencySymbol?: string;
}

export const SupplierReturnModal: React.FC<SupplierReturnModalProps> = ({
  isOpen,
  onClose,
  currencySymbol = 'Rs.',
}) => {
  const { suppliers, purchases, recordSupplierReturn } = useTransactions();
  const { showToast } = useToast();

  const [supplierName, setSupplierName] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [reason, setReason] = useState('Substandard batch identified during QA');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [items, setItems] = useState<SupplierReturnItem[]>([
    {
      id: '1',
      description: 'Defective / Damaged Lot',
      quantity: 10,
      unitCost: 1200,
      reason: 'Damaged packaging / QA failure',
    },
  ]);

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 7),
        description: '',
        quantity: 1,
        unitCost: 0,
        reason: 'Vendor defect',
      },
    ]);
  };

  const removeItemRow = (id: string) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: keyof SupplierReturnItem, value: any) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  const totalDebitAmount = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitCost) || 0),
    0
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      showToast('Validation Error', 'Supplier name is required', 'error');
      return;
    }
    if (items.some((i) => !i.description.trim() || Number(i.quantity) <= 0 || Number(i.unitCost) <= 0)) {
      showToast('Validation Error', 'All items must have valid description, quantity and cost', 'error');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const result = recordSupplierReturn({
        poNumber: poNumber.trim() || undefined,
        supplierName: supplierName.trim(),
        items,
        reason,
      });

      setIsSubmitting(false);
      if (result.success && result.debitNote) {
        showToast(
          'Supplier Return & Debit Note Created',
          `Return ${result.returnRecord?.returnNumber} posted. Debit Note ${result.debitNote.debitNoteNumber} issued (${formatCurrency(totalDebitAmount, currencySymbol)}). Accounts Payable reduced.`,
          'success'
        );
        onClose();
      }
    }, 250);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create Supplier Return & Debit Note"
      description="Return inventory to vendor, decrement warehouse stock, and debit Accounts Payable"
      maxWidth="3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] text-slate-500 dark:text-neutral-400">
            Posts DR 2010 Accounts Payable / CR 1100 Merchandise Inventory Asset
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
              Issue Debit Note
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
              Select Vendor / Supplier
            </label>
            {suppliers.length > 0 ? (
              <select
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full text-xs bg-white dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
              >
                <option value="">-- Choose registered supplier or enter custom below --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            ) : null}
            <div className="mt-1.5">
              <Input
                label="Supplier Name"
                placeholder="e.g. Lanka Grains Importers Ltd"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <Input
              label="Associated Purchase Order / GRN #"
              placeholder="e.g. PO-00501 or GRN-01002"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              optional
            />
            <Select
              label="Return Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              options={[
                { value: 'Substandard batch identified during QA', label: 'Substandard batch identified during QA' },
                { value: 'Expired / short-expiry goods delivered', label: 'Expired / short-expiry goods delivered' },
                { value: 'Damaged packaging during container offloading', label: 'Damaged packaging during container offloading' },
                { value: 'Discrepancy against purchase order specifications', label: 'Discrepancy against purchase order specifications' },
              ]}
            />
          </div>
        </div>

        {/* Item rows */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 uppercase tracking-wider">
              Returned Items
            </span>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={addItemRow}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Item
            </Button>
          </div>

          <div className="border border-slate-200 dark:border-neutral-800 rounded-lg overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-[#151b18] text-slate-600 dark:text-neutral-400 border-b border-slate-200 dark:border-neutral-800 font-semibold">
                <tr>
                  <th className="py-2 px-3">Item Description</th>
                  <th className="py-2 px-2 w-20 text-right">Qty</th>
                  <th className="py-2 px-2 w-28 text-right">Unit Cost</th>
                  <th className="py-2 px-2 w-28 text-right">Total Debit</th>
                  <th className="py-2 px-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/60 font-mono">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 px-2 font-sans font-medium text-slate-900 dark:text-neutral-100">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        placeholder="SKU / description"
                        className="w-full bg-transparent border-none p-1 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53] rounded text-xs"
                        required
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-right bg-transparent border-none p-1 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53] rounded text-xs"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitCost}
                        onChange={(e) =>
                          updateItem(item.id, 'unitCost', parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-right bg-transparent border-none p-1 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53] rounded text-xs"
                      />
                    </td>
                    <td className="py-2 px-2 text-right font-bold text-slate-900 dark:text-neutral-100">
                      {formatCurrency((item.quantity || 0) * (item.unitCost || 0), currencySymbol)}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeItemRow(item.id)}
                        disabled={items.length === 1}
                        className="text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <div className="w-full sm:w-64 bg-slate-50 dark:bg-[#151b18] p-3 rounded-lg border border-slate-200 dark:border-neutral-800 text-xs space-y-1">
            <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-neutral-100">
              <span>Debit Note Total:</span>
              <span className="font-mono text-[#167a53] dark:text-[#34d399]">
                {formatCurrency(totalDebitAmount, currencySymbol)}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Reduces Accounts Payable balance</p>
          </div>
        </div>
      </form>
    </Dialog>
  );
};
