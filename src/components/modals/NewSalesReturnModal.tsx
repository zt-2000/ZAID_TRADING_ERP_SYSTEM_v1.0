import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useTransactions } from '../../context/TransactionContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { SalesReturnItem } from '../../types';

interface NewSalesReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencySymbol?: string;
}

export const NewSalesReturnModal: React.FC<NewSalesReturnModalProps> = ({
  isOpen,
  onClose,
  currencySymbol = 'Rs.',
}) => {
  const { sales, recordSalesReturn } = useTransactions();
  const { showToast } = useToast();

  const [selectedInvoiceNumber, setSelectedInvoiceNumber] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [reason, setReason] = useState('Damaged packaging during store transit');
  const [restockDecision, setRestockDecision] = useState<
    'restocked' | 'damaged_discarded' | 'pending_inspection'
  >('restocked');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [items, setItems] = useState<SalesReturnItem[]>([
    {
      id: '1',
      description: 'Merchandise Item Batch',
      returnedQty: 1,
      unitPrice: 1000,
      condition: 'good',
      restockApproved: true,
      refundAmount: 1000,
    },
  ]);

  const handleInvoiceSelect = (invNum: string) => {
    setSelectedInvoiceNumber(invNum);
    const inv = sales.find((s) => s.invoiceNumber === invNum);
    if (inv) {
      setCustomerId(inv.customerCode || inv.customerName);
      setCustomerName(inv.customerName);
      // Auto-set line item estimate based on invoice total
      setItems([
        {
          id: '1',
          description: `Items from Invoice ${inv.invoiceNumber}`,
          returnedQty: 1,
          unitPrice: Math.min(inv.total, 5000),
          condition: 'good',
          restockApproved: restockDecision === 'restocked',
          refundAmount: Math.min(inv.total, 5000),
        },
      ]);
    }
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 7),
        description: '',
        returnedQty: 1,
        unitPrice: 0,
        condition: 'good',
        restockApproved: restockDecision === 'restocked',
        refundAmount: 0,
      },
    ]);
  };

  const removeItemRow = (id: string) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: keyof SalesReturnItem, value: any) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const updated = { ...i, [field]: value };
        const qty = Number(updated.returnedQty) || 0;
        const price = Number(updated.unitPrice) || 0;
        updated.refundAmount = qty * price;
        return updated;
      })
    );
  };

  const totalCreditAmount = items.reduce(
    (sum, item) => sum + (Number(item.returnedQty) || 0) * (Number(item.unitPrice) || 0),
    0
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      showToast('Validation Error', 'Customer name is required', 'error');
      return;
    }
    if (items.some((i) => !i.description.trim() || Number(i.returnedQty) <= 0 || Number(i.unitPrice) <= 0)) {
      showToast('Validation Error', 'All items must have valid description, quantity and price', 'error');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const result = recordSalesReturn({
        invoiceId: selectedInvoiceNumber || `INV-REF-${Date.now()}`,
        invoiceNumber: selectedInvoiceNumber || 'INV-DIRECT',
        customerId: customerId || 'CUST-DIRECT',
        customerName: customerName.trim(),
        reason,
        items,
        restockDecision,
        notes: notes.trim() || undefined,
      });

      setIsSubmitting(false);
      if (result.success && result.creditNote) {
        showToast(
          'Return & Credit Note Issued',
          `Return ${result.returnRecord?.returnNumber} posted. Credit Note ${result.creditNote.creditNoteNumber} issued to customer balance (${formatCurrency(totalCreditAmount, currencySymbol)}). No cash refund deducted.`,
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
      title="Create Sales Return & Credit Note"
      description="Authorize customer return of wholesale merchandise and issue ledger credit note against receivables"
      maxWidth="3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] text-slate-500 dark:text-neutral-400">
            Credit note applies directly to Accounts Receivable (no cash disbursement)
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
              Issue Credit Note
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Invoice and Customer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
              Select Commercial Invoice
            </label>
            {sales.length > 0 ? (
              <select
                value={selectedInvoiceNumber}
                onChange={(e) => handleInvoiceSelect(e.target.value)}
                className="w-full text-xs bg-white dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
              >
                <option value="">-- Choose posted invoice or enter customer below --</option>
                {sales.map((s) => (
                  <option key={s.id} value={s.invoiceNumber}>
                    {s.invoiceNumber} — {s.customerName} ({formatCurrency(s.total, currencySymbol)})
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-slate-500 italic">No existing invoices found (Manual return mode)</p>
            )}
          </div>

          <Input
            label="Customer Commercial Name"
            placeholder="e.g. Colombo Mart"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Reason for Return"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            options={[
              { value: 'Damaged packaging during store transit', label: 'Damaged packaging during store transit' },
              { value: 'Wrong SKU delivered by warehouse', label: 'Wrong SKU delivered by warehouse' },
              { value: 'Quality / expiry inspection rejection', label: 'Quality / expiry inspection rejection' },
              { value: 'Excess merchant consignment return', label: 'Excess merchant consignment return' },
            ]}
          />

          <Select
            label="Restock Disposition"
            value={restockDecision}
            onChange={(e) => {
              const val = e.target.value as any;
              setRestockDecision(val);
              setItems((prev) =>
                prev.map((i) => ({ ...i, restockApproved: val === 'restocked' }))
              );
            }}
            options={[
              { value: 'restocked', label: 'Approved for Restock (Returns to warehouse on-hand stock)' },
              { value: 'damaged_discarded', label: 'Damaged / Discarded (No inventory increment)' },
              { value: 'pending_inspection', label: 'Quarantined for QA Inspection' },
            ]}
          />
        </div>

        {/* Returned Items */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 uppercase tracking-wider">
              Returned Item Details
            </span>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={addItemRow}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Row
            </Button>
          </div>

          <div className="border border-slate-200 dark:border-neutral-800 rounded-lg overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-[#151b18] text-slate-600 dark:text-neutral-400 border-b border-slate-200 dark:border-neutral-800 font-semibold">
                <tr>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-2 w-20 text-right">Qty</th>
                  <th className="py-2 px-2 w-28 text-right">Unit Price</th>
                  <th className="py-2 px-2 w-28">Condition</th>
                  <th className="py-2 px-2 w-28 text-right">Credit Value</th>
                  <th className="py-2 px-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/60">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Item name / SKU"
                        className="w-full bg-transparent border-none p-1 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53] rounded text-xs"
                        required
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="1"
                        value={item.returnedQty}
                        onChange={(e) =>
                          updateItem(item.id, 'returnedQty', parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-right bg-transparent border-none p-1 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53] rounded text-xs font-mono"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-right bg-transparent border-none p-1 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53] rounded text-xs font-mono"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <select
                        value={item.condition}
                        onChange={(e) => updateItem(item.id, 'condition', e.target.value as any)}
                        className="w-full text-xs bg-transparent border border-slate-200 dark:border-neutral-700 rounded p-1 text-slate-800 dark:text-neutral-200"
                      >
                        <option value="good">Good Condition</option>
                        <option value="damaged">Damaged Box</option>
                        <option value="unopened">Unopened Cartons</option>
                        <option value="expired">Expired / Expiring</option>
                      </select>
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-medium text-slate-900 dark:text-neutral-100">
                      {formatCurrency(item.refundAmount, currencySymbol)}
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

        {/* Restock notice */}
        {restockDecision === 'restocked' ? (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
            <span className="font-semibold">Inventory Update:</span> Items marked approved will be credited back into on-hand warehouse inventory.
          </div>
        ) : (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Items will NOT be added to on-hand stock (marked discarded/quarantined). Credit note will still adjust accounts receivable.</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="w-full sm:w-1/2">
            <Input
              label="Auditor / Inspection Remarks"
              placeholder="e.g. Inspected by Colombo Central Receiving Officer"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              optional
            />
          </div>

          <div className="w-full sm:w-64 bg-slate-50 dark:bg-[#151b18] p-3 rounded-lg border border-slate-200 dark:border-neutral-800 text-xs space-y-1 self-end">
            <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-neutral-100">
              <span>Total Credit Note:</span>
              <span className="font-mono text-[#167a53] dark:text-[#34d399]">
                {formatCurrency(totalCreditAmount, currencySymbol)}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Double Entry: DR 4020 Returns / CR 1050 AR
            </p>
          </div>
        </div>
      </form>
    </Dialog>
  );
};
