import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useTransactions } from '../../context/TransactionContext';
import { useToast } from '../../context/ToastContext';
import { GRNLineItem } from '../../types';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface NewGRNModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewGRNModal: React.FC<NewGRNModalProps> = ({ isOpen, onClose }) => {
  const { purchases, warehouses, recordGRN } = useTransactions();
  const { showToast } = useToast();

  const [selectedPOId, setSelectedPOId] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [warehouse, setWarehouse] = useState(
    warehouses[0]?.name || 'Colombo Central Distribution Hub'
  );
  const [receivedBy, setReceivedBy] = useState('Rashid Al-Zaid (Storekeeper)');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [items, setItems] = useState<GRNLineItem[]>([
    {
      id: '1',
      description: 'Bulk Grains Cargo Lot',
      orderedQty: 50,
      receivedQty: 50,
      damagedQty: 0,
      acceptedQty: 50,
      unitCost: 1500,
    },
  ]);

  const handlePOSelect = (pId: string) => {
    setSelectedPOId(pId);
    const po = purchases.find((p) => p.id === pId);
    if (po) {
      setPoNumber(po.poNumber);
      setSupplierName(po.supplierName);
      setWarehouse(
        po.warehouse === 'central_hub'
          ? 'Colombo Central Distribution Hub'
          : po.warehouse || warehouses[0]?.name || 'Colombo Central Distribution Hub'
      );
      setItems([
        {
          id: '1',
          description: `Items for Purchase Order ${po.poNumber}`,
          orderedQty: 100,
          receivedQty: 100,
          damagedQty: 0,
          acceptedQty: 100,
          unitCost: Math.round(po.totalCost / 100) || 500,
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
        orderedQty: 1,
        receivedQty: 1,
        damagedQty: 0,
        acceptedQty: 1,
        unitCost: 0,
      },
    ]);
  };

  const removeItemRow = (id: string) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: keyof GRNLineItem, value: any) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const updated = { ...i, [field]: value };
        const rec = Number(updated.receivedQty) || 0;
        const dam = Number(updated.damagedQty) || 0;
        updated.acceptedQty = Math.max(0, rec - dam);
        return updated;
      })
    );
  };

  const totalAcceptedUnits = items.reduce(
    (sum, item) => sum + (Number(item.acceptedQty) || 0),
    0
  );
  const totalDamagedUnits = items.reduce(
    (sum, item) => sum + (Number(item.damagedQty) || 0),
    0
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      showToast('Validation Error', 'Supplier entity name is required', 'error');
      return;
    }
    if (items.some((i) => !i.description.trim() || Number(i.receivedQty) <= 0)) {
      showToast('Validation Error', 'All items must have a description and received quantity', 'error');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const result = recordGRN({
        purchaseOrderId: selectedPOId || `PO-DIRECT-${Date.now()}`,
        poNumber: poNumber || 'PO-DIRECT',
        supplierName: supplierName.trim(),
        warehouse,
        items,
        notes: notes.trim() || undefined,
        receivedBy: receivedBy.trim(),
      });

      setIsSubmitting(false);
      if (result.success && result.grn) {
        showToast(
          'Goods Receipt Note Posted',
          `GRN ${result.grn.grnNumber} generated. ${totalAcceptedUnits} units added to ${warehouse} stock. (Supplier bills are created separately for 3-way match).`,
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
      title="Create Goods Received Note (GRN)"
      description="Inspect inbound vendor shipment, record damages, and increment physical warehouse stock"
      maxWidth="3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] text-slate-500 dark:text-neutral-400">
            Stock increments on receipt; vendor bills are matched separately
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
              Post GRN Receipt
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Source PO and Supplier */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
              Select Purchase Order
            </label>
            {purchases.length > 0 ? (
              <select
                value={selectedPOId}
                onChange={(e) => handlePOSelect(e.target.value)}
                className="w-full text-xs bg-white dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
              >
                <option value="">-- Choose PO or enter direct receipt below --</option>
                {purchases.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.poNumber} — {p.supplierName} ({p.status})
                  </option>
                ))}
              </select>
            ) : null}
            <div className="mt-1.5">
              <Input
                label="Supplier Name"
                placeholder="e.g. Lanka Grains Distributors"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <Select
              label="Receiving Warehouse Facility"
              value={warehouse}
              onChange={(e) => setWarehouse(e.target.value)}
              options={warehouses.map((w) => ({ value: w.name, label: w.name }))}
            />
            <Input
              label="Receiving Officer / Storekeeper"
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Line Items Receiving Table */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 uppercase tracking-wider">
              Cargo Inspection & Receipt
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
                  <th className="py-2 px-2 w-20 text-right">Ordered</th>
                  <th className="py-2 px-2 w-20 text-right">Received</th>
                  <th className="py-2 px-2 w-20 text-right">Damaged</th>
                  <th className="py-2 px-2 w-24 text-right">Accepted (Stock+)</th>
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
                        placeholder="Cargo SKU / lot description"
                        className="w-full bg-transparent border-none p-1 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53] rounded text-xs"
                        required
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="1"
                        value={item.orderedQty}
                        onChange={(e) =>
                          updateItem(item.id, 'orderedQty', parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-right bg-transparent border-none p-1 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53] rounded text-xs"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="0"
                        value={item.receivedQty}
                        onChange={(e) =>
                          updateItem(item.id, 'receivedQty', parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-right bg-transparent border-none p-1 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53] rounded text-xs"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="0"
                        value={item.damagedQty}
                        onChange={(e) =>
                          updateItem(item.id, 'damagedQty', parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-right bg-transparent border-none p-1 text-rose-600 dark:text-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-500 rounded text-xs font-bold"
                      />
                    </td>
                    <td className="py-2 px-2 text-right font-bold text-emerald-700 dark:text-emerald-400">
                      {item.acceptedQty}
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
              label="Delivery Note / Bill of Lading / Carrier Notes"
              placeholder="e.g. Container #MSKU-9821, driver delivered with seal intact"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              optional
            />
          </div>

          <div className="w-full sm:w-64 bg-slate-50 dark:bg-[#151b18] p-3 rounded-lg border border-slate-200 dark:border-neutral-800 text-xs space-y-1.5 self-end">
            <div className="flex justify-between text-slate-600 dark:text-neutral-400">
              <span>Accepted Units (Stock +):</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {totalAcceptedUnits}
              </span>
            </div>
            {totalDamagedUnits > 0 && (
              <div className="flex justify-between text-rose-600 dark:text-rose-400">
                <span>Damaged / Rejected:</span>
                <span className="font-mono font-bold">{totalDamagedUnits}</span>
              </div>
            )}
            <div className="text-[10px] text-slate-400 border-t border-slate-200 dark:border-neutral-700 pt-1">
              Receipt status: {totalDamagedUnits > 0 || totalAcceptedUnits < 50 ? 'Partial Receipt' : 'Full Inbound Receipt'}
            </div>
          </div>
        </div>
      </form>
    </Dialog>
  );
};
