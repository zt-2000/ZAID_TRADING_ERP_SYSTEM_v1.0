import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useTransactions } from '../../context/TransactionContext';
import { useToast } from '../../context/ToastContext';

interface NewDeliveryShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencySymbol?: string;
}

export const NewDeliveryShipmentModal: React.FC<NewDeliveryShipmentModalProps> = ({
  isOpen,
  onClose,
  currencySymbol = 'Rs.',
}) => {
  const { salesOrders, customers, recordDeliveryShipment } = useTransactions();
  const { showToast } = useToast();

  const today = new Date().toISOString().split('T')[0];

  const [orderNumber, setOrderNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [driverName, setDriverName] = useState('Nimal Fernando');
  const [vehiclePlate, setVehiclePlate] = useState('WP CAD-9021 (Isuzu ELF 3.5T)');
  const [scheduledDate, setScheduledDate] = useState(today);
  const [codAmount, setCodAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOrderSelect = (oNum: string) => {
    setOrderNumber(oNum);
    const order = salesOrders.find((o) => o.orderNumber === oNum);
    if (order) {
      setCustomerName(order.customerName);
      const cust = customers.find((c) => c.name === order.customerName || c.id === order.customerId);
      if (cust?.address) {
        setDeliveryAddress(cust.address);
      }
      setCodAmount(order.total.toString());
    }
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

    setIsSubmitting(true);
    setTimeout(() => {
      const res = recordDeliveryShipment({
        orderNumber: orderNumber || `DIRECT-DISPATCH-${Date.now()}`,
        customerName: customerName.trim(),
        deliveryAddress: deliveryAddress.trim(),
        driverName: driverName.trim(),
        vehiclePlate: vehiclePlate.trim(),
        scheduledDate,
        codAmount: codAmount ? parseFloat(codAmount) : undefined,
        notes: notes.trim() || undefined,
      });

      setIsSubmitting(false);
      if (res.success && res.shipment) {
        showToast(
          'Shipment Dispatched',
          `Shipment ${res.shipment.shipmentNumber} assigned to driver ${driverName}.`,
          'success'
        );
        onClose();
      }
    }, 200);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Physical Delivery Shipment"
      description="Dispatch warehouse order with delivery fleet vehicle, driver, and Cash on Delivery (COD) route"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Assign Delivery
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
            Link to Sales Order (Optional)
          </label>
          {salesOrders.length > 0 ? (
            <select
              value={orderNumber}
              onChange={(e) => handleOrderSelect(e.target.value)}
              className="w-full text-xs bg-white dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
            >
              <option value="">-- Choose Sales Order or manual entry --</option>
              {salesOrders.map((o) => (
                <option key={o.id} value={o.orderNumber}>
                  {o.orderNumber} — {o.customerName} ({o.status})
                </option>
              ))}
            </select>
          ) : null}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Customer Name"
            placeholder="e.g. Lanka Wholesale Stores"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
          />
          <Input
            label="Scheduled Delivery Date"
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            required
          />
        </div>

        <Input
          label="Physical Delivery Address"
          placeholder="No. 12, Main Street, Colombo 11"
          value={deliveryAddress}
          onChange={(e) => setDeliveryAddress(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Assigned Fleet Driver"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            options={[
              { value: 'Nimal Fernando', label: 'Nimal Fernando (Senior Courier)' },
              { value: 'Priyantha Bandara', label: 'Priyantha Bandara (Van Driver)' },
              { value: 'Mohamed Rizwan', label: 'Mohamed Rizwan (Heavy Truck)' },
            ]}
          />
          <Select
            label="Vehicle & Plate"
            value={vehiclePlate}
            onChange={(e) => setVehiclePlate(e.target.value)}
            options={[
              { value: 'WP CAD-9021 (Isuzu ELF 3.5T)', label: 'WP CAD-9021 (Isuzu ELF 3.5T)' },
              { value: 'WP BAF-1044 (Toyota HiAce Van)', label: 'WP BAF-1044 (Toyota HiAce Van)' },
              { value: 'WP LI-5510 (Mitsubishi Canter 4.5T)', label: 'WP LI-5510 (Mitsubishi Canter 4.5T)' },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label={`COD Collection Target (${currencySymbol})`}
            placeholder="0 if prepaid / credit"
            type="number"
            value={codAmount}
            onChange={(e) => setCodAmount(e.target.value)}
            optional
          />
          <Input
            label="Driver Dispatch Notes"
            placeholder="Call store manager before unloading"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            optional
          />
        </div>
      </form>
    </Dialog>
  );
};
