import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface ExpenseCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: 'active' | 'inactive';
  usageCount: number;
  createdAt: string;
}

interface ExpenseCategoryContextType {
  categories: ExpenseCategory[];
  activeCategories: ExpenseCategory[];
  addExpenseCategory: (data: {
    name: string;
    code?: string;
    description?: string;
    status?: 'active' | 'inactive';
  }) => { success: boolean; error?: string; category?: ExpenseCategory };
  updateExpenseCategory: (
    id: string,
    data: {
      name?: string;
      code?: string;
      description?: string;
      status?: 'active' | 'inactive';
    }
  ) => { success: boolean; error?: string };
  toggleCategoryStatus: (id: string) => { success: boolean; error?: string };
  deleteOrDeactivateCategory: (id: string) => {
    success: boolean;
    action: 'deleted' | 'deactivated';
    message: string;
  };
  incrementUsage: (id: string) => void;
  getCategoryById: (id: string) => ExpenseCategory | undefined;
}

const defaultExpenseCategories: ExpenseCategory[] = [
  {
    id: 'exp_cat_logistics',
    name: 'Logistics, Fuel & Transportation',
    code: 'EXP-LOG',
    description: 'Diesel, van fuel, road tolls, and freight delivery charges',
    status: 'active',
    usageCount: 0,
    createdAt: '2026-10-01',
  },
  {
    id: 'exp_cat_rent_util',
    name: 'Warehouse Rent & Utilities',
    code: 'EXP-RENT',
    description: 'Depot leasing, electricity, water, and facility overheads',
    status: 'active',
    usageCount: 0,
    createdAt: '2026-10-01',
  },
  {
    id: 'exp_cat_salaries',
    name: 'Staff Wages & Driver Allowances',
    code: 'EXP-SAL',
    description: 'Driver route stipends, warehouse labor, and logistics staff pay',
    status: 'active',
    usageCount: 0,
    createdAt: '2026-10-01',
  },
  {
    id: 'exp_cat_maintenance',
    name: 'Equipment & Vehicle Maintenance',
    code: 'EXP-MAINT',
    description: 'Van fleet servicing, tire replacements, and forklift maintenance',
    status: 'active',
    usageCount: 0,
    createdAt: '2026-10-01',
  },
  {
    id: 'exp_cat_packaging',
    name: 'Packaging & Dispatch Supplies',
    code: 'EXP-PACK',
    description: 'Strapping bands, pallet shrink film, tape, and cardboard cartons',
    status: 'active',
    usageCount: 0,
    createdAt: '2026-10-01',
  },
  {
    id: 'exp_cat_office',
    name: 'Office & Administrative Supplies',
    code: 'EXP-OFFICE',
    description: 'Stationery, receipt printer paper rolls, and telecom expenses',
    status: 'active',
    usageCount: 0,
    createdAt: '2026-10-01',
  },
  {
    id: 'exp_cat_banking',
    name: 'Bank Charges & Financial Fees',
    code: 'EXP-BANK',
    description: 'Inter-bank wire fees, POS merchant fees, and LC processing',
    status: 'active',
    usageCount: 0,
    createdAt: '2026-10-01',
  },
];

const ExpenseCategoryContext = createContext<ExpenseCategoryContextType | undefined>(undefined);

export const ExpenseCategoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<ExpenseCategory[]>(() => {
    const saved = localStorage.getItem('zaid_erp_expense_categories');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        // Fallback to defaults
      }
    }
    return defaultExpenseCategories;
  });

  useEffect(() => {
    localStorage.setItem('zaid_erp_expense_categories', JSON.stringify(categories));
  }, [categories]);

  const activeCategories = categories.filter((c) => c.status === 'active');

  const addExpenseCategory = useCallback(
    (data: {
      name: string;
      code?: string;
      description?: string;
      status?: 'active' | 'inactive';
    }) => {
      const trimmedName = data.name.trim();
      if (!trimmedName) {
        return { success: false, error: 'Category name is required' };
      }

      // Check for duplicate category name within company scope (case-insensitive)
      const duplicate = categories.some(
        (c) => c.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (duplicate) {
        return {
          success: false,
          error: `Expense category "${trimmedName}" already exists. Please choose a unique name.`,
        };
      }

      const generatedCode =
        data.code?.trim() ||
        `EXP-${trimmedName
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .slice(0, 6)}`;

      const newCategory: ExpenseCategory = {
        id: `exp_cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: trimmedName,
        code: generatedCode,
        description: data.description?.trim() || '',
        status: data.status || 'active',
        usageCount: 0,
        createdAt: new Date().toISOString().split('T')[0],
      };

      setCategories((prev) => [newCategory, ...prev]);
      return { success: true, category: newCategory };
    },
    [categories]
  );

  const updateExpenseCategory = useCallback(
    (
      id: string,
      data: {
        name?: string;
        code?: string;
        description?: string;
        status?: 'active' | 'inactive';
      }
    ) => {
      if (data.name !== undefined) {
        const trimmed = data.name.trim();
        if (!trimmed) {
          return { success: false, error: 'Category name cannot be empty' };
        }
        const duplicate = categories.some(
          (c) => c.id !== id && c.name.toLowerCase() === trimmed.toLowerCase()
        );
        if (duplicate) {
          return {
            success: false,
            error: `Another expense category with name "${trimmed}" already exists.`,
          };
        }
      }

      setCategories((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                ...(data.name !== undefined ? { name: data.name.trim() } : {}),
                ...(data.code !== undefined ? { code: data.code.trim() } : {}),
                ...(data.description !== undefined
                  ? { description: data.description.trim() }
                  : {}),
                ...(data.status !== undefined ? { status: data.status } : {}),
              }
            : c
        )
      );

      return { success: true };
    },
    [categories]
  );

  const toggleCategoryStatus = useCallback((id: string) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: c.status === 'active' ? 'inactive' : 'active' }
          : c
      )
    );
    return { success: true };
  }, []);

  const deleteOrDeactivateCategory = useCallback(
    (id: string) => {
      const target = categories.find((c) => c.id === id);
      if (!target) {
        return {
          success: false,
          action: 'deactivated' as const,
          message: 'Category not found',
        };
      }

      if (target.usageCount > 0) {
        // Prevent deletion if in use; deactivate instead
        setCategories((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: 'inactive' } : c))
        );
        return {
          success: true,
          action: 'deactivated' as const,
          message: `Category "${target.name}" is linked to existing expense vouchers and cannot be deleted. It has been deactivated instead.`,
        };
      }

      // Safe to delete if not in use
      setCategories((prev) => prev.filter((c) => c.id !== id));
      return {
        success: true,
        action: 'deleted' as const,
        message: `Category "${target.name}" has been removed.`,
      };
    },
    [categories]
  );

  const incrementUsage = useCallback((id: string) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === id || c.name === id ? { ...c, usageCount: c.usageCount + 1 } : c
      )
    );
  }, []);

  const getCategoryById = useCallback(
    (id: string) => categories.find((c) => c.id === id || c.name === id),
    [categories]
  );

  return (
    <ExpenseCategoryContext.Provider
      value={{
        categories,
        activeCategories,
        addExpenseCategory,
        updateExpenseCategory,
        toggleCategoryStatus,
        deleteOrDeactivateCategory,
        incrementUsage,
        getCategoryById,
      }}
    >
      {children}
    </ExpenseCategoryContext.Provider>
  );
};

export const useExpenseCategories = () => {
  const context = useContext(ExpenseCategoryContext);
  if (!context) {
    throw new Error('useExpenseCategories must be used within an ExpenseCategoryProvider');
  }
  return context;
};
