import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useTransactions } from '../../context/TransactionContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import { Plus, Trash2 } from 'lucide-react';
import { SalesOrderLineItem } from '../../types';

interface NewSalesOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencySymbol?: string;
}

export const NewSalesOrderModal: React.FC<NewSalesOrderModalProps> = ({
  isOpen,
  onClose,
  currencySymbol = 'Rs.',
}) => {
  const { customers, warehouses, recordSalesOrder } = useTransactions();
  const { showToast } = useToast();

  const today = new Date().toISOString().split('T')[0];
  const nextWeekObj = new Date();
  nextWeekObj.setDate(nextWeekObj.getDate() + 3);
  const nextWeek = nextWeekObj.toISOString().split('T')[0];

  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerCode, setCustomerCode] = useState('');
  const [date, setDate] = useState(today);
  const [deliveryDate, setDeliveryDate] = useState(nextWeek);
  const [warehouse, setWarehouse] = useState(warehouses[0]?.name || 'Colombo Central Distribution Hub');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [items, setItems] = useState<SalesOrderLineItem[]>([
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

  const updateItem = (id: string, field: keyof SalesOrderLineItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        const qty = Number(updated.quantity) || 0;
        const price = Number(updated.unitPrice) || 0;
        const disc = Number(updated.discount) || 0;
        const tax = Number(updated.taxRate) || 0;

        const base = qty * price;
        const discAmt = (base * disc) / 100;
        const taxable = base - discAmt;
        const taxAmt = (taxable * tax) / 100;
        updated.total = taxable + taxAmt;
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

  const taxTotal = items.reduce((acc, curr) => {
    const base = (Number(curr.quantity) || 0) * (Number(curr.unitPrice) || 0);
    const discAmt = (base * (Number(curr.discount) || 0)) / 100;
    const taxable = base - discAmt;
    return acc + (taxable * (Number(curr.taxRate) || 0)) / 100;
  }, 0);

  const totalAmount = subtotal - discountTotal + taxTotal;

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
      const result = recordSalesOrder({
        date,
        deliveryDate,
        customerId: customerId || `cust_direct_${Date.now()}`,
        customerName: customerName.trim(),
        customerCode: customerCode || undefined,
        warehouse,
        items,
        subtotal,
        discountTotal,
        taxTotal,
        total: totalAmount,
        notes: notes.trim() || undefined,
      });

      setIsSubmitting(false);
      if (result.success && result.salesOrder) {
        showToast(
          'Sales Order Created',
          `Order ${result.salesOrder.orderNumber} placed. Tracking ID: ${result.salesOrder.trackingNumber}.`,
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
      title="Create Wholesale Sales Order"
      description="Book customer order into fulfillment pipeline and initialize live order tracking"
      maxWidth="3xl"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Place Sales Order
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
              Select Customer <span className="text-rose-500">*</span>
            </label>
            {customers.length > 0 ? (
              <select
                value={customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full text-xs bg-white dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
              >
                <option value="">-- Choose from Customer Master or enter below --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            ) : null}
            <div className="mt-1.5">
              <Input
                label="Customer Name"
                placeholder="e.g. Lanka Wholesale Stores"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>
          </div>

          <Select
            label="Fulfillment Warehouse"
            value={warehouse}
            onChange={(e) => setWarehouse(e.target.value)}
            options={warehouses.map((w) => ({ value: w.name, label: w.name }))}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Order Booking Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <Input
            label="Requested Delivery Date"
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            required
          />
        </div>

        {/* Line Items */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 uppercase tracking-wider">
              Ordered SKUs & Quantities
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
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-2 w-20 text-right">Qty</th>
                  <th className="py-2 px-2 w-28 text-right">Unit Price</th>
                  <th className="py-2 px-2 w-20 text-right">Disc %</th>
                  <th className="py-2 px-2 w-20 text-right">Tax %</th>
                  <th className="py-2 px-2 w-28 text-right">Total</th>
                  <th className="py-2 px-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/60 font-mono">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 px-2 font-sans font-medium text-slate-900 dark:text-neutral-100">
                      <input
                        type="text"
                        placeholder="e.g. Edible Palm Oil 20L Jerry Can"
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
                        className="w-full text-right bg-transparent border-none p-1 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53] rounded text-xs"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full text-right bg-transparent border-none p-1 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53] rounded text-xs"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={item.discount}
                        onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                        className="w-full text-right bg-transparent border-none p-1 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53] rounded text-xs"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={item.taxRate}
                        onChange={(e) => updateItem(item.id, 'taxRate', parseFloat(e.target.value) || 0)}
                        className="w-full text-right bg-transparent border-none p-1 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53] rounded text-xs"
                      />
                    </td>
                    <td className="py-2 px-2 text-right font-bold text-slate-900 dark:text-neutral-100">
                      {formatCurrency(item.total, currencySymbol)}
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

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="w-full sm:w-1/2">
            <Input
              label="Fulfillment & Dispatch Instructions"
              placeholder="e.g. Contact receiver 30 mins before arrival at Colombo 11 depot"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              optional
            />
          </div>

          <div className="w-full sm:w-64 bg-slate-50 dark:bg-[#151b18] p-3 rounded-lg border border-slate-200 dark:border-neutral-800 text-xs space-y-1 self-end">
            <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-neutral-100">
              <span>Total Order Value:</span>
              <span className="font-mono text-[#167a53] dark:text-[#34d399]">
                {formatCurrency(totalAmount, currencySymbol)}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Initiates picking & dispatch queue</p>
          </div>
        </div>
      </form>
    </Dialog>
  );
};
