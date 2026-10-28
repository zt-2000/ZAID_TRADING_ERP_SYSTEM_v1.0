import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useTransactions } from '../../context/TransactionContext';
import { useToast } from '../../context/ToastContext';
import { WarehouseRecord } from '../../types';

interface WarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseToEdit?: WarehouseRecord | null;
}

export const WarehouseModal: React.FC<WarehouseModalProps> = ({
  isOpen,
  onClose,
  warehouseToEdit,
}) => {
  const { addWarehouse, updateWarehouse } = useTransactions();
  const { showToast } = useToast();

  const [code, setCode] = useState(warehouseToEdit?.code || '');
  const [name, setName] = useState(warehouseToEdit?.name || '');
  const [type, setType] = useState<WarehouseRecord['type']>(warehouseToEdit?.type || 'central');
  const [address, setAddress] = useState(warehouseToEdit?.address || '');
  const [city, setCity] = useState(warehouseToEdit?.city || 'Colombo');
  const [capacity, setCapacity] = useState(warehouseToEdit?.totalCapacityBays?.toString() || '30');
  const [manager, setManager] = useState(warehouseToEdit?.managerName || '');
  const [status, setStatus] = useState<WarehouseRecord['status']>(warehouseToEdit?.status || 'active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (warehouseToEdit) {
      setCode(warehouseToEdit.code);
      setName(warehouseToEdit.name);
      setType(warehouseToEdit.type);
      setAddress(warehouseToEdit.address);
      setCity(warehouseToEdit.city);
      setCapacity(warehouseToEdit.totalCapacityBays?.toString() || '30');
      setManager(warehouseToEdit.managerName || '');
      setStatus(warehouseToEdit.status);
    } else {
      setCode('');
      setName('');
      setType('central');
      setAddress('');
      setCity('Colombo');
      setCapacity('30');
      setManager('');
      setStatus('active');
    }
  }, [warehouseToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Validation Error', 'Warehouse name is required', 'error');
      return;
    }
    if (!code.trim()) {
      showToast('Validation Error', 'Warehouse code is required', 'error');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      if (warehouseToEdit) {
        updateWarehouse(warehouseToEdit.id, {
          name: name.trim(),
          type,
          address: address.trim(),
          city: city.trim(),
          totalCapacityBays: parseInt(capacity, 10) || 10,
          managerName: manager.trim() || undefined,
          status,
        });
        showToast('Warehouse Updated', `Facility "${name}" updated successfully.`, 'success');
        setIsSubmitting(false);
        onClose();
      } else {
        const res = addWarehouse({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          type,
          address: address.trim(),
          city: city.trim(),
          isDefault: false,
          status,
          totalCapacityBays: parseInt(capacity, 10) || 10,
          managerName: manager.trim() || undefined,
        });
        setIsSubmitting(false);
        if (!res.success) {
          showToast('Validation Error', res.error, 'error');
          return;
        }
        showToast('Warehouse Registered', `New facility "${name}" added to distribution network.`, 'success');
        onClose();
      }
    }, 200);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={warehouseToEdit ? 'Edit Warehouse Facility' : 'Register Warehouse Facility'}
      description="Manage physical storage depots, distribution centers, and mobile van stocks"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            {warehouseToEdit ? 'Save Changes' : 'Create Warehouse'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Warehouse Facility Name"
            placeholder="e.g. Negombo Transit Depot"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
          <Input
            label="Facility Code"
            placeholder="e.g. WH-NEG-01"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
            disabled={Boolean(warehouseToEdit)}
            helperText={warehouseToEdit ? 'Code cannot be changed' : 'Unique identifier'}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Facility Type"
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            options={[
              { value: 'central', label: 'Central Distribution Hub' },
              { value: 'depot', label: 'Regional Transit Depot' },
              { value: 'van', label: 'Mobile Van Fleet Staging' },
              { value: 'bonded', label: 'Customs Bonded Warehouse' },
            ]}
          />
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            options={[
              { value: 'active', label: 'Active & Operating' },
              { value: 'inactive', label: 'Inactive / Maintenance' },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="City / District"
            placeholder="Colombo"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
          />
          <Input
            label="Total Storage Bays"
            type="number"
            min="1"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            required
          />
        </div>

        <Input
          label="Physical Street Address"
          placeholder="No. 12, Industrial Zone, Colombo 12"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          optional
        />

        <Input
          label="Facility Manager / Superintendent"
          placeholder="e.g. Kamil Perera"
          value={manager}
          onChange={(e) => setManager(e.target.value)}
          optional
        />
      </form>
    </Dialog>
  );
};
