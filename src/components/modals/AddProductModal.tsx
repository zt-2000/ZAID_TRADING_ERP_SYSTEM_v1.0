import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { CategoryModal } from './CategoryModal';
import { useCategories } from '../../context/CategoryContext';
import { useToast } from '../../context/ToastContext';
import { Plus } from 'lucide-react';

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
  const { activeCategories } = useCategories();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState(
    activeCategories[0]?.id || 'cat_dry_grains'
  );
  const [unit, setUnit] = useState('carton');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [reorderLevel, setReorderLevel] = useState('10');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);

  // Keep category in sync if activeCategories loads or updates
  React.useEffect(() => {
    if (activeCategories.length > 0 && !activeCategories.some((c) => c.id === category)) {
      setCategory(activeCategories[0].id);
    }
  }, [activeCategories, category]);

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
      // Reset form
      setName('');
      setSku('');
      setBarcode('');
      setPurchasePrice('');
      setWholesalePrice('');
      setDescription('');
    }, 500);
  };

  const categoryOptions = activeCategories.map((c) => ({
    value: c.id,
    label: `${c.name} (${c.code})`,
  }));

  return (
    <>
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
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300">
                  Category
                </label>
                <button
                  type="button"
                  onClick={() => setIsCreateCategoryOpen(true)}
                  className="text-[11px] font-medium text-[#167a53] dark:text-[#34d399] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Category</span>
                </button>
              </div>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={categoryOptions}
              />
            </div>

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

      {/* Embedded Category Creation Dialog */}
      <CategoryModal
        isOpen={isCreateCategoryOpen}
        onClose={() => setIsCreateCategoryOpen(false)}
        onCategoryCreated={(newCat) => {
          setCategory(newCat.id);
        }}
      />
    </>
  );
};
