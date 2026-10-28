import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface ProductCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  productCount: number;
  status: 'active' | 'archived';
  createdAt: string;
}

interface CategoryContextType {
  categories: ProductCategory[];
  activeCategories: ProductCategory[];
  addCategory: (data: {
    name: string;
    code?: string;
    description?: string;
    status?: 'active' | 'archived';
  }) => { success: boolean; error?: string; category?: ProductCategory };
  updateCategory: (
    id: string,
    data: {
      name?: string;
      code?: string;
      description?: string;
      status?: 'active' | 'archived';
    }
  ) => { success: boolean; error?: string };
  archiveCategory: (id: string) => void;
  restoreCategory: (id: string) => void;
  deleteCategory: (id: string) => { success: boolean; error?: string };
  getCategoryById: (id: string) => ProductCategory | undefined;
}

const defaultCategories: ProductCategory[] = [
  {
    id: 'cat_dry_grains',
    name: 'Dry Grains & Rice',
    code: 'CAT-GRAIN',
    description: 'Bulk packaged rice, grains, and pulses',
    productCount: 0,
    status: 'active',
    createdAt: '2026-10-01',
  },
  {
    id: 'cat_edible_oils',
    name: 'Cooking & Edible Oils',
    code: 'CAT-OIL',
    description: 'Vegetable, corn, palm, and olive oils in tins and drums',
    productCount: 0,
    status: 'active',
    createdAt: '2026-10-01',
  },
  {
    id: 'cat_dairy_canned',
    name: 'Dairy & Canned Goods',
    code: 'CAT-CANNED',
    description: 'Powdered milk, evaporated milk, canned tomatoes and beans',
    productCount: 0,
    status: 'active',
    createdAt: '2026-10-01',
  },
  {
    id: 'cat_beverages',
    name: 'Beverages & Juices',
    code: 'CAT-BEV',
    description: 'Bottled water, wholesale juice cartons, soft drinks',
    productCount: 0,
    status: 'active',
    createdAt: '2026-10-01',
  },
  {
    id: 'cat_spices',
    name: 'Spices & Seasonings',
    code: 'CAT-SPICE',
    description: 'Whole and ground bulk commercial spices',
    productCount: 0,
    status: 'active',
    createdAt: '2026-10-01',
  },
  {
    id: 'cat_packaging',
    name: 'Commercial Packaging',
    code: 'CAT-PACK',
    description: 'Cartons, shrink wrap, and shipping containers',
    productCount: 0,
    status: 'active',
    createdAt: '2026-10-01',
  },
];

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const CategoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<ProductCategory[]>(() => {
    const saved = localStorage.getItem('zaid_erp_categories');
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
    return defaultCategories;
  });

  useEffect(() => {
    localStorage.setItem('zaid_erp_categories', JSON.stringify(categories));
  }, [categories]);

  const activeCategories = categories.filter((c) => c.status === 'active');

  const addCategory = useCallback(
    (data: {
      name: string;
      code?: string;
      description?: string;
      status?: 'active' | 'archived';
    }) => {
      const trimmedName = data.name.trim();
      if (!trimmedName) {
        return { success: false, error: 'Category name is required' };
      }

      // Check for duplicate name (case-insensitive) within active or archived categories
      const isDuplicate = categories.some(
        (c) => c.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (isDuplicate) {
        return {
          success: false,
          error: `Category "${trimmedName}" already exists in the catalog`,
        };
      }

      // Auto-generate code if omitted
      const generatedCode =
        data.code?.trim() ||
        `CAT-${trimmedName
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .slice(0, 6)}`;

      const newCategory: ProductCategory = {
        id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: trimmedName,
        code: generatedCode,
        description: data.description?.trim() || '',
        productCount: 0,
        status: data.status || 'active',
        createdAt: new Date().toISOString().split('T')[0],
      };

      setCategories((prev) => [newCategory, ...prev]);
      return { success: true, category: newCategory };
    },
    [categories]
  );

  const updateCategory = useCallback(
    (
      id: string,
      data: {
        name?: string;
        code?: string;
        description?: string;
        status?: 'active' | 'archived';
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
            error: `Another category with name "${trimmed}" already exists`,
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

  const archiveCategory = useCallback((id: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'archived' } : c))
    );
  }, []);

  const restoreCategory = useCallback((id: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'active' } : c))
    );
  }, []);

  const deleteCategory = useCallback(
    (id: string) => {
      const cat = categories.find((c) => c.id === id);
      if (!cat) {
        return { success: false, error: 'Category not found.' };
      }
      if (cat.productCount > 0) {
        return {
          success: false,
          error: `Cannot delete category "${cat.name}" because ${cat.productCount} SKUs are assigned to it. Deactivate or archive it instead to preserve catalog data integrity.`,
        };
      }
      setCategories((prev) => prev.filter((c) => c.id !== id));
      return { success: true };
    },
    [categories]
  );

  const getCategoryById = useCallback(
    (id: string) => categories.find((c) => c.id === id),
    [categories]
  );

  return (
    <CategoryContext.Provider
      value={{
        categories,
        activeCategories,
        addCategory,
        updateCategory,
        archiveCategory,
        restoreCategory,
        deleteCategory,
        getCategoryById,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
};
