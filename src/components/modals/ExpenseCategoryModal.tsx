import React, { useState, useEffect } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useExpenseCategories, ExpenseCategory } from '../../context/ExpenseCategoryContext';
import { useToast } from '../../context/ToastContext';

interface ExpenseCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToEdit?: ExpenseCategory | null;
  onCategoryCreated?: (category: ExpenseCategory) => void;
}

export const ExpenseCategoryModal: React.FC<ExpenseCategoryModalProps> = ({
  isOpen,
  onClose,
  categoryToEdit,
  onCategoryCreated,
}) => {
  const { addExpenseCategory, updateExpenseCategory } = useExpenseCategories();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
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
      setError('Expense category name is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    setTimeout(() => {
      if (categoryToEdit) {
        const result = updateExpenseCategory(categoryToEdit.id, {
          name: trimmedName,
          code: code.trim(),
          description: description.trim(),
          status,
        });

        setIsSubmitting(false);
        if (!result.success) {
          setError(result.error || 'Failed to update category.');
          showToast('Validation Error', result.error, 'error');
          return;
        }

        showToast(
          'Expense Category Updated',
          `Category "${trimmedName}" updated successfully.`,
          'success'
        );
        onClose();
      } else {
        const result = addExpenseCategory({
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
          'Expense Category Created',
          `"${trimmedName}" is now active and ready for expense vouchers.`,
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
      title={categoryToEdit ? 'Edit Expense Category' : 'Create Expense Category'}
      description="Manage general ledger expense classification and cost-center allocations"
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
          placeholder="e.g. Vehicle Fleet Maintenance"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          required
          autoFocus
          helperText="Unique classification name within company accounts"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Category Code"
            placeholder="e.g. EXP-MAINT"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            optional
            helperText="Auto-generated if left blank"
          />

          <Select
            label="Operating Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
            options={[
              { value: 'active', label: 'Active (Available for Vouchers)' },
              { value: 'inactive', label: 'Inactive (Disabled for New Posts)' },
            ]}
          />
        </div>

        <Input
          label="Description / Expenditure Scope"
          placeholder="e.g. Regular engine oil servicing, tire changes, and van repairs"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          optional
        />
      </form>
    </Dialog>
  );
};
