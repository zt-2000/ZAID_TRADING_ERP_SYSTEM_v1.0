import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useTransactions } from '../../context/TransactionContext';
import { useToast } from '../../context/ToastContext';
import { DeliveryLineItem } from '../../types';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

interface CreateDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSalesOrderId?: string;
}

export const CreateDeliveryModal: React.FC<CreateDeliveryModalProps> = ({
  isOpen,
  onClose,
  initialSalesOrderId,
}) => {
  const { salesOrders, customers, createDeliveryFromSalesOrder } = useTransactions();
  const { showToast } = useToast();

  const today = new Date().toISOString().split('T')[0];

  const [salesOrderId, setSalesOrderId] = useState(initialSalesOrderId || '');
  const [salesOrderNumber, setSalesOrderNumber] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [scheduledDate, setScheduledDate] = useState(today);
  const [assignedStaff, setAssignedStaff] = useState('Nimal Fernando (Delivery Driver)');
  const [vehicleDetails, setVehicleDetails] = useState('WP CAD-9021 (Isuzu ELF 3.5T)');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [items, setItems] = useState<DeliveryLineItem[]>([
    {
      id: '1',
      itemDescription: 'Wholesale Commercial Goods Lot',
      orderedQty: 10,
      previouslyDeliveredQty: 0,
      deliveredQty: 10,
      outstandingQty: 0,
      unitPrice: 1500,
    },
  ]);

  // Handle Sales Order Selection
  const handleOrderSelect = (sId: string) => {
    setSalesOrderId(sId);
    const order = salesOrders.find((o) => o.id === sId || o.orderNumber === sId);
    if (order) {
      setSalesOrderNumber(order.orderNumber);
      setCustomerId(order.customerId);
      setCustomerName(order.customerName);

      const cust = customers.find((c) => c.id === order.customerId || c.name === order.customerName);
      if (cust) {
        setCustomerPhone(cust.phone || '');
        setDeliveryAddress(cust.address || 'Colombo Distribution Terminal');
      } else {
        setDeliveryAddress('Colombo Distribution Terminal');
      }

      // Convert order items to delivery line items
      if (order.items && order.items.length > 0) {
        setItems(
          order.items.map((item) => ({
            id: item.id,
            itemDescription: item.itemDescription,
            orderedQty: item.quantity,
            previouslyDeliveredQty: 0,
            deliveredQty: item.quantity,
            outstandingQty: 0,
            unitPrice: item.unitPrice,
          }))
        );
      }
    }
  };

  React.useEffect(() => {
    if (initialSalesOrderId && isOpen) {
      handleOrderSelect(initialSalesOrderId);
    }
  }, [initialSalesOrderId, isOpen]);

  const updateItemQty = (id: string, qty: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const availableMax = Math.max(0, item.orderedQty - item.previouslyDeliveredQty);
        const validQty = Math.min(Math.max(0, qty), availableMax);
        const newOutstanding = Math.max(0, availableMax - validQty);

        return {
          ...item,
          deliveredQty: validQty,
          outstandingQty: newOutstanding,
        };
      })
    );
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 7),
        itemDescription: '',
        orderedQty: 1,
        previouslyDeliveredQty: 0,
        deliveredQty: 1,
        outstandingQty: 0,
        unitPrice: 0,
      },
    ]);
  };

  const removeItemRow = (id: string) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      showToast('Validation Error', 'Customer name is required', 'error');
      return;
    }
    if (!deliveryAddress.trim()) {
      showToast('Validation Error', 'Delivery destination address is required', 'error');
      return;
    }

    const hasExcess = items.some(
      (item) => item.deliveredQty > (item.orderedQty - item.previouslyDeliveredQty)
    );
    if (hasExcess) {
      showToast(
        'Validation Error',
        'Delivered quantity cannot exceed the outstanding order balance.',
        'error'
      );
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const res = createDeliveryFromSalesOrder({
        salesOrderId: salesOrderId || `SO-DIRECT-${Date.now()}`,
        salesOrderNumber: salesOrderNumber || 'SO-DIRECT',
        customerId: customerId || 'CUST-DIRECT',
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        deliveryAddress: deliveryAddress.trim(),
        scheduledDate,
        assignedStaff,
        vehicleDetails,
        items,
        notes: notes.trim() || undefined,
      });

      setIsSubmitting(false);
      if (res.success && res.delivery) {
        showToast(
          'Delivery Note Created',
          `Delivery ${res.delivery.deliveryNumber} generated and scheduled for ${scheduledDate}.`,
          'success'
        );
        onClose();
      } else {
        showToast('Error', res.error || 'Failed to create delivery note', 'error');
      }
    }, 250);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create Delivery Note from Sales Order"
      description="Schedule order dispatch, assign delivery driver, and record line item quantities"
      maxWidth="3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] text-slate-500 dark:text-neutral-400">
            Does not mark invoices as paid; payment is recorded in Finance
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
              Create Delivery Note
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Sales Order Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
            Select Confirmed Sales Order
          </label>
          {salesOrders.length > 0 ? (
            <select
              value={salesOrderId}
              onChange={(e) => handleOrderSelect(e.target.value)}
              className="w-full text-xs bg-white dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
            >
              <option value="">-- Choose Sales Order or manual entry --</option>
              {salesOrders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.orderNumber} — {o.customerName} ({o.status})
                </option>
              ))}
            </select>
          ) : (
            <p className="text-xs text-slate-500 italic">No existing sales orders found (Manual delivery entry)</p>
          )}
        </div>

        {/* Customer & Address Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Customer Commercial Name"
            placeholder="e.g. Lanka Wholesale Stores"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
          />
          <Input
            label="Contact Phone Number"
            placeholder="+94 77 123 4567"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            optional
          />
        </div>

        <Input
          label="Delivery Destination Address"
          placeholder="No. 45, Commercial District, Main Street, Colombo 11"
          value={deliveryAddress}
          onChange={(e) => setDeliveryAddress(e.target.value)}
          required
        />

        {/* Dispatch Staff & Schedule */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Scheduled Delivery Date"
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            required
          />
          <Select
            label="Assigned Staff / Driver"
            value={assignedStaff}
            onChange={(e) => setAssignedStaff(e.target.value)}
            options={[
              { value: 'Nimal Fernando (Delivery Driver)', label: 'Nimal Fernando (Delivery Driver)' },
              { value: 'Priyantha Bandara (Courier)', label: 'Priyantha Bandara (Courier)' },
              { value: 'Mohamed Rizwan (Heavy Vehicle)', label: 'Mohamed Rizwan (Heavy Vehicle)' },
            ]}
          />
          <Select
            label="Vehicle Details (Optional)"
            value={vehicleDetails}
            onChange={(e) => setVehicleDetails(e.target.value)}
            options={[
              { value: 'WP CAD-9021 (Isuzu ELF 3.5T)', label: 'WP CAD-9021 (Isuzu ELF 3.5T)' },
              { value: 'WP BAF-1044 (Toyota HiAce Van)', label: 'WP BAF-1044 (Toyota HiAce Van)' },
              { value: 'WP LI-5510 (Mitsubishi Canter)', label: 'WP LI-5510 (Mitsubishi Canter)' },
            ]}
          />
        </div>

        {/* Delivery Quantities Table */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 uppercase tracking-wider">
              Dispatched Items & Quantities
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
                  <th className="py-2 px-3">Item Description</th>
                  <th className="py-2 px-2 w-20 text-right">Ordered</th>
                  <th className="py-2 px-2 w-20 text-right">Prev. Del.</th>
                  <th className="py-2 px-2 w-24 text-right">Current Delivery</th>
                  <th className="py-2 px-2 w-20 text-right">Outstanding</th>
                  <th className="py-2 px-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/60 font-mono">
                {items.map((item) => {
                  const maxAllowed = Math.max(0, item.orderedQty - item.previouslyDeliveredQty);
                  return (
                    <tr key={item.id}>
                      <td className="py-2 px-2 font-sans font-medium text-slate-900 dark:text-neutral-100">
                        <input
                          type="text"
                          value={item.itemDescription}
                          onChange={(e) =>
                            setItems((prev) =>
                              prev.map((i) => (i.id === item.id ? { ...i, itemDescription: e.target.value } : i))
                            )
                          }
                          placeholder="SKU / description"
                          className="w-full bg-transparent border-none p-1 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53] rounded text-xs"
                          required
                        />
                      </td>
                      <td className="py-2 px-2 text-right">{item.orderedQty}</td>
                      <td className="py-2 px-2 text-right text-slate-400">{item.previouslyDeliveredQty}</td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min="0"
                          max={maxAllowed}
                          value={item.deliveredQty}
                          onChange={(e) => updateItemQty(item.id, parseFloat(e.target.value) || 0)}
                          className="w-full text-right bg-transparent border-none p-1 font-bold text-[#167a53] dark:text-[#34d399] focus:outline-none focus:ring-1 focus:ring-[#167a53] rounded text-xs"
                        />
                      </td>
                      <td className="py-2 px-2 text-right font-bold text-slate-700 dark:text-neutral-300">
                        {item.outstandingQty}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <Input
          label="Special Delivery Instructions"
          placeholder="e.g. Unload at rear bay 2. Store manager signature required."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          optional
        />
      </form>
    </Dialog>
  );
};
