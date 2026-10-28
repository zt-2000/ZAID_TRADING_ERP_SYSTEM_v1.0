import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useTransactions } from '../../context/TransactionContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import { Plus, Trash2 } from 'lucide-react';
import { QuotationLineItem } from '../../types';

interface NewQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencySymbol?: string;
}

export const NewQuotationModal: React.FC<NewQuotationModalProps> = ({
  isOpen,
  onClose,
  currencySymbol = 'Rs.',
}) => {
  const { customers, warehouses, recordQuotation } = useTransactions();
  const { showToast } = useToast();

  const today = new Date().toISOString().split('T')[0];
  const nextMonthObj = new Date();
  nextMonthObj.setDate(nextMonthObj.getDate() + 30);
  const nextMonth = nextMonthObj.toISOString().split('T')[0];

  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerCode, setCustomerCode] = useState('');
  const [date, setDate] = useState(today);
  const [expiryDate, setExpiryDate] = useState(nextMonth);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [warehouse, setWarehouse] = useState(warehouses[0]?.name || 'Colombo Central Distribution Hub');
  const [notes, setNotes] = useState('');
  const [saveAsDraft, setSaveAsDraft] = useState(false);
  const [applyVat, setApplyVat] = useState(false);
  const [vatRate, setVatRate] = useState(15);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [items, setItems] = useState<QuotationLineItem[]>([
    {
      id: '1',
      itemDescription: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      taxRate: 15,
      total: 0,
    },
  ]);

  const handleCustomerChange = (cId: string) => {
    setCustomerId(cId);
    const selected = customers.find((c) => c.id === cId);
    if (selected) {
      setCustomerName(selected.name);
      setCustomerCode(selected.code);
    } else {
      setCustomerName('');
      setCustomerCode('');
    }
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 7),
        itemDescription: '',
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        taxRate: 15,
        total: 0,
      },
    ]);
  };

  const removeItemRow = (id: string) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof QuotationLineItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        const qty = Number(updated.quantity) || 0;
        const price = Number(updated.unitPrice) || 0;
        const disc = Number(updated.discount) || 0;

        const base = qty * price;
        const discAmt = (base * disc) / 100;
        const taxable = base - discAmt;
        updated.total = taxable;
        return updated;
      })
    );
  };

  const subtotal = items.reduce(
    (acc, curr) => acc + (Number(curr.quantity) || 0) * (Number(curr.unitPrice) || 0),
    0
  );

  const discountTotal = items.reduce((acc, curr) => {
    const base = (Number(curr.quantity) || 0) * (Number(curr.unitPrice) || 0);
    return acc + (base * (Number(curr.discount) || 0)) / 100;
  }, 0);

  const netTaxable = subtotal - discountTotal;
  const taxTotal = applyVat ? (netTaxable * (Number(vatRate) || 0)) / 100 : 0;
  const totalAmount = netTaxable + taxTotal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      showToast('Validation Error', 'Please select or enter customer name', 'error');
      return;
    }
    const hasInvalid = items.some(
      (item) => !item.itemDescription.trim() || Number(item.quantity) <= 0 || Number(item.unitPrice) <= 0
    );
    if (hasInvalid) {
      showToast('Validation Error', 'All line items must have description, positive quantity and unit price', 'error');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const result = recordQuotation({
        date,
        expiryDate,
        customerId: customerId || `cust_walkin_${Date.now()}`,
        customerName: customerName.trim(),
        customerCode: customerCode || undefined,
        referenceNumber: referenceNumber.trim() || undefined,
        warehouse,
        items,
        subtotal,
        discountTotal,
        applyVat,
        vatRate,
        taxTotal,
        total: totalAmount,
        notes: notes.trim() || undefined,
        status: saveAsDraft ? 'draft' : 'sent',
      });

      setIsSubmitting(false);
      if (result.success && result.quotation) {
        showToast(
          'Quotation Created',
          `Quotation ${result.quotation.quotationNumber} has been generated (${saveAsDraft ? 'Draft' : 'Sent to Client'}).`,
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
      title="Create Wholesale Quotation / Proforma"
      description="Prepare formal price quotation with line-item discounts, taxes, and expiration terms"
      maxWidth="3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-neutral-300">
            <input
              type="checkbox"
              checked={saveAsDraft}
              onChange={(e) => setSaveAsDraft(e.target.checked)}
              className="rounded border-slate-300 text-[#167a53] focus:ring-[#167a53]"
            />
            Save as Draft (Do not mark Sent)
          </label>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
              Generate Quotation
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer & Document Information */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
              Select Registered Customer <span className="text-rose-500">*</span>
            </label>
            {customers.length > 0 ? (
              <select
                value={customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full text-xs bg-white dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
              >
                <option value="">-- Choose from Customer Master or enter custom below --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            ) : null}
            <div className="mt-1.5">
              <Input
                label={customers.length > 0 ? 'Or Custom Customer Name' : 'Customer Name'}
                placeholder="e.g. Royal Supermarkets Ltd"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Input
              label="Customer RFQ / Ref #"
              placeholder="e.g. RFQ-9021"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              optional
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Quotation Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <Input
            label="Validity / Expiry Date"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            required
          />
          <Select
            label="Dispatch Warehouse"
            value={warehouse}
            onChange={(e) => setWarehouse(e.target.value)}
            options={warehouses.map((w) => ({ value: w.name, label: w.name }))}
          />
        </div>

        {/* Line Items */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 uppercase tracking-wider">
              Quotation Line Items
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
                  <th className="py-2 px-2 w-28 text-right">Unit Price</th>
                  <th className="py-2 px-2 w-20 text-right">Disc %</th>
                  <th className="py-2 px-2 w-20 text-right">Tax %</th>
                  <th className="py-2 px-2 w-28 text-right">Total</th>
                  <th className="py-2 px-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/60">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-neutral-800/30">
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        placeholder="e.g. Samba Rice 25kg Bag"
                        value={item.itemDescription}
                        onChange={(e) => updateItem(item.id, 'itemDescription', e.target.value)}
                        className="w-full bg-transparent border-none p-1 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53] rounded text-xs"
                        required
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full text-right bg-transparent border-none p-1 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53] rounded text-xs font-mono"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full text-right bg-transparent border-none p-1 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53] rounded text-xs font-mono"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={item.discount}
                        onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                        className="w-full text-right bg-transparent border-none p-1 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53] rounded text-xs font-mono"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={item.taxRate}
                        onChange={(e) => updateItem(item.id, 'taxRate', parseFloat(e.target.value) || 0)}
                        className="w-full text-right bg-transparent border-none p-1 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53] rounded text-xs font-mono"
                      />
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-medium text-slate-900 dark:text-neutral-100">
                      {formatCurrency(item.total, currencySymbol)}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeItemRow(item.id)}
                        disabled={items.length === 1}
                        className="text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                        title="Remove line"
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

        {/* Summary & Totals */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pt-2">
          <div className="w-full sm:w-1/2">
            <Input
              label="Terms & Conditions / Special Notes"
              placeholder="e.g. Valid for 30 days. Delivery within Colombo municipality included."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              optional
            />
          </div>

          <div className="w-full sm:w-72 bg-slate-50 dark:bg-[#151b18] p-3 rounded-lg border border-slate-200 dark:border-neutral-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-neutral-400">
              <span>Gross Subtotal:</span>
              <span className="font-mono">{formatCurrency(subtotal, currencySymbol)}</span>
            </div>
            {discountTotal > 0 && (
              <div className="flex justify-between text-amber-600 dark:text-amber-400">
                <span>Total Discount:</span>
                <span className="font-mono">-{formatCurrency(discountTotal, currencySymbol)}</span>
              </div>
            )}
            <div className="pt-1 border-t border-slate-200/60 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-800 dark:text-neutral-200">
                  <input
                    type="checkbox"
                    checked={applyVat}
                    onChange={(e) => setApplyVat(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-[#167a53] focus:ring-[#167a53] cursor-pointer"
                  />
                  <span>Apply Output VAT</span>
                </label>
                {applyVat ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={vatRate}
                      onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                      className="w-12 px-1 py-0.5 text-right font-mono rounded border border-slate-300 dark:border-neutral-700 bg-white dark:bg-[#1a231e] text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
                    />
                    <span className="text-slate-500">%</span>
                  </div>
                ) : (
                  <span className="text-slate-400 dark:text-neutral-500 font-mono">0% (Off)</span>
                )}
              </div>
              <div className="flex justify-between text-slate-600 dark:text-neutral-400 mt-1">
                <span>Output VAT Amount:</span>
                <span className="font-mono">{formatCurrency(taxTotal, currencySymbol)}</span>
              </div>
            </div>
            <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-neutral-100 border-t border-slate-200 dark:border-neutral-700 pt-1.5">
              <span>Net Quotation Value:</span>
              <span className="font-mono text-[#167a53] dark:text-[#34d399]">
                {formatCurrency(totalAmount, currencySymbol)}
              </span>
            </div>
          </div>
        </div>
      </form>
    </Dialog>
  );
};
