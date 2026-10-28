import React, { useState, useEffect } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useCategories, ProductCategory } from '../../context/CategoryContext';
import { useToast } from '../../context/ToastContext';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToEdit?: ProductCategory | null;
  onCategoryCreated?: (category: ProductCategory) => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  categoryToEdit,
  onCategoryCreated,
}) => {
  const { addCategory, updateCategory } = useCategories();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active' | 'archived'>('active');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name);
      setCode(categoryToEdit.code);
      setDescription(categoryToEdit.description || '');
      setStatus(categoryToEdit.status);
    } else {
      setName('');
      setCode('');
      setDescription('');
      setStatus('active');
    }
    setError(null);
  }, [categoryToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Category name is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    setTimeout(() => {
      if (categoryToEdit) {
        const result = updateCategory(categoryToEdit.id, {
          name: trimmedName,
          code: code.trim(),
          description: description.trim(),
          status,
        });

        setIsSubmitting(false);
        if (!result.success) {
          setError(result.error || 'Failed to update category.');
          showToast('Error Updating Category', result.error, 'error');
          return;
        }

        showToast(
          'Category Updated',
          `Category "${trimmedName}" has been updated.`,
          'success'
        );
        onClose();
      } else {
        const result = addCategory({
          name: trimmedName,
          code: code.trim(),
          description: description.trim(),
          status,
        });

        setIsSubmitting(false);
        if (!result.success) {
          setError(result.error || 'Failed to create category.');
          showToast('Validation Error', result.error, 'error');
          return;
        }

        showToast(
          'Category Created',
          `New category "${trimmedName}" is now available in your catalog and forms.`,
          'success'
        );
        if (result.category && onCategoryCreated) {
          onCategoryCreated(result.category);
        }
        onClose();
      }
    }, 200);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={categoryToEdit ? 'Edit Product Category' : 'Create Product Category'}
      description="Manage catalog classification hierarchy and inventory grouping"
      maxWidth="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            {categoryToEdit ? 'Save Changes' : 'Create Category'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        <Input
          label="Category Name"
          placeholder="e.g. Dairy & Frozen Goods"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          required
          autoFocus
          helperText="Required unique name within wholesale catalog"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Category Code / Identifier"
            placeholder="e.g. CAT-DAIRY"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            optional
            helperText="Auto-generated if left blank"
          />

          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'active' | 'archived')}
            options={[
              { value: 'active', label: 'Active (Available in forms)' },
              { value: 'archived', label: 'Archived (Hidden from new items)' },
            ]}
          />
        </div>

        <Input
          label="Description / Scope"
          placeholder="e.g. Chilled milk cartons, yogurts, and imported cheeses"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          optional
        />
      </form>
    </Dialog>
  );
};
