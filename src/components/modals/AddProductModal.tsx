import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencySymbol?: string;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  currencySymbol = '$',
}) => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('dry_goods');
  const [unit, setUnit] = useState('carton');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [reorderLevel, setReorderLevel] = useState('10');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Validation Error', 'Product title is required', 'error');
      return;
    }
    if (!sku.trim()) {
      showToast('Validation Error', 'Unique SKU is required', 'error');
      return;
    }
    if (!wholesalePrice || parseFloat(wholesalePrice) <= 0) {
      showToast('Validation Error', 'Valid wholesale selling price is required', 'error');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      showToast(
        'Product Catalog Registered',
        `SKU ${sku.toUpperCase()} (${name}) added to product catalog.`,
        'success'
      );
      onClose();
      // Reset
      setName('');
      setSku('');
      setBarcode('');
      setPurchasePrice('');
      setWholesalePrice('');
      setDescription('');
    }, 500);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Catalog Product"
      description="Register wholesale item SKU, unit measurements, and pricing tiers"
      maxWidth="xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Save Product
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <Input
          label="Product Name"
          placeholder="e.g. Basmati Premium Rice 10kg"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="SKU / Item Code"
            placeholder="e.g. RIC-BAS-010"
            value={sku}
            onChange={(e) => setSku(e.target.value.toUpperCase())}
            required
            helperText="Must be unique across company catalog"
          />
          <Input
            label="Barcode (EAN/UPC)"
            placeholder="e.g. 6281002345678"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            optional
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[
              { value: 'dry_goods', label: 'Dry Grains & Rice' },
              { value: 'edible_oils', label: 'Cooking & Edible Oils' },
              { value: 'dairy_canned', label: 'Dairy & Canned Goods' },
              { value: 'beverages', label: 'Beverages & Juices' },
              { value: 'spices', label: 'Spices & Seasonings' },
              { value: 'packaging', label: 'Commercial Packaging' },
            ]}
          />
          <Select
            label="Primary Unit of Measure"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            options={[
              { value: 'carton', label: 'Carton (ctn)' },
              { value: 'box', label: 'Box (bx)' },
              { value: 'piece', label: 'Piece (pcs)' },
              { value: 'pack', label: 'Pack (pk)' },
              { value: 'kg', label: 'Kilogram (kg)' },
              { value: 'litre', label: 'Litre (L)' },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            label={`Cost Price (${currencySymbol})`}
            placeholder="0.00"
            type="number"
            step="0.01"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            optional
          />
          <Input
            label={`Wholesale Price (${currencySymbol})`}
            placeholder="0.00"
            type="number"
            step="0.01"
            value={wholesalePrice}
            onChange={(e) => setWholesalePrice(e.target.value)}
            required
          />
          <Input
            label="Reorder Alert Level"
            type="number"
            value={reorderLevel}
            onChange={(e) => setReorderLevel(e.target.value)}
            optional
          />
        </div>

        <Input
          label="Item Specifications & Storage Notes"
          placeholder="e.g. Temperature-controlled dry storage, pallet stack max 4 tiers"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          optional
        />
      </form>
    </Dialog>
  );
};
