import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useTransactions } from '../../context/TransactionContext';
import { useToast } from '../../context/ToastContext';
import { WarehouseBinRecord } from '../../types';

interface WarehouseBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  binToEdit?: WarehouseBinRecord | null;
  defaultWarehouseId?: string;
}

export const WarehouseBinModal: React.FC<WarehouseBinModalProps> = ({
  isOpen,
  onClose,
  binToEdit,
  defaultWarehouseId,
}) => {
  const { warehouses, addWarehouseBin, updateWarehouseBin } = useTransactions();
  const { showToast } = useToast();

  const [warehouseId, setWarehouseId] = useState(
    binToEdit?.warehouseId || defaultWarehouseId || warehouses[0]?.id || ''
  );
  const [code, setCode] = useState(binToEdit?.code || '');
  const [name, setName] = useState(binToEdit?.name || '');
  const [aisle, setAisle] = useState(binToEdit?.aisle || 'A');
  const [rack, setRack] = useState(binToEdit?.rack || '01');
  const [shelf, setShelf] = useState(binToEdit?.shelf || '01');
  const [type, setType] = useState<WarehouseBinRecord['type']>(binToEdit?.type || 'pallet');
  const [maxWeight, setMaxWeight] = useState(binToEdit?.maxWeightKg?.toString() || '1000');
  const [status, setStatus] = useState<WarehouseBinRecord['status']>(binToEdit?.status || 'active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (binToEdit) {
      setWarehouseId(binToEdit.warehouseId);
      setCode(binToEdit.code);
      setName(binToEdit.name);
      setAisle(binToEdit.aisle);
      setRack(binToEdit.rack);
      setShelf(binToEdit.shelf);
      setType(binToEdit.type);
      setMaxWeight(binToEdit.maxWeightKg?.toString() || '1000');
      setStatus(binToEdit.status);
    } else {
      setWarehouseId(defaultWarehouseId || warehouses[0]?.id || '');
      setCode('');
      setName('');
      setAisle('A');
      setRack('01');
      setShelf('01');
      setType('pallet');
      setMaxWeight('1000');
      setStatus('active');
    }
  }, [binToEdit, defaultWarehouseId, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      showToast('Validation Error', 'Bin code is required (e.g. A-01-01)', 'error');
      return;
    }

    const selectedWh = warehouses.find((w) => w.id === warehouseId);
    if (!selectedWh) {
      showToast('Validation Error', 'Please select a valid warehouse', 'error');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      if (binToEdit) {
        updateWarehouseBin(binToEdit.id, {
          name: name.trim() || `Bin ${code}`,
          aisle: aisle.trim().toUpperCase(),
          rack: rack.trim(),
          shelf: shelf.trim(),
          type,
          maxWeightKg: parseFloat(maxWeight) || 500,
          status,
        });
        showToast('Bin Updated', `Location ${binToEdit.code} updated successfully.`, 'success');
        setIsSubmitting(false);
        onClose();
      } else {
        const res = addWarehouseBin({
          warehouseId,
          warehouseName: selectedWh.name,
          code: code.trim().toUpperCase(),
          name: name.trim() || `Bin ${code.trim().toUpperCase()}`,
          aisle: aisle.trim().toUpperCase(),
          rack: rack.trim(),
          shelf: shelf.trim(),
          type,
          maxWeightKg: parseFloat(maxWeight) || 500,
          status,
        });
        setIsSubmitting(false);
        if (!res.success) {
          showToast('Validation Error', res.error, 'error');
          return;
        }
        showToast('Storage Bin Registered', `Bin location "${code.toUpperCase()}" created.`, 'success');
        onClose();
      }
    }, 200);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={binToEdit ? 'Edit Warehouse Bin Location' : 'Add Warehouse Storage Bin'}
      description="Define aisles, racks, pallet bays, and specialized storage zones"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            {binToEdit ? 'Save Changes' : 'Create Bin'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <Select
          label="Warehouse Facility"
          value={warehouseId}
          onChange={(e) => setWarehouseId(e.target.value)}
          disabled={Boolean(binToEdit)}
          options={warehouses.map((w) => ({ value: w.id, label: `${w.name} (${w.code})` }))}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Bin Location Code"
            placeholder="e.g. A-02-03"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
            disabled={Boolean(binToEdit)}
            helperText="Format: [Aisle]-[Rack]-[Shelf]"
          />
          <Input
            label="Display Description"
            placeholder="e.g. High-Bay Pallet Tier 3"
            value={name}
            onChange={(e) => setName(e.target.value)}
            optional
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Input
            label="Aisle"
            placeholder="A"
            value={aisle}
            onChange={(e) => setAisle(e.target.value.toUpperCase())}
            required
          />
          <Input
            label="Rack / Bay"
            placeholder="02"
            value={rack}
            onChange={(e) => setRack(e.target.value)}
            required
          />
          <Input
            label="Shelf / Tier"
            placeholder="03"
            value={shelf}
            onChange={(e) => setShelf(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Bin Type"
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            options={[
              { value: 'pallet', label: 'Heavy Pallet Bay' },
              { value: 'shelf', label: 'Standard Shelving' },
              { value: 'bulk', label: 'Bulk Floor Storage' },
              { value: 'cold_storage', label: 'Cold Storage Room' },
            ]}
          />
          <Input
            label="Max Capacity (kg)"
            type="number"
            value={maxWeight}
            onChange={(e) => setMaxWeight(e.target.value)}
            required
          />
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            options={[
              { value: 'active', label: 'Active & Available' },
              { value: 'full', label: 'Full / Occupied' },
              { value: 'maintenance', label: 'Maintenance Lock' },
            ]}
          />
        </div>
      </form>
    </Dialog>
  );
};
