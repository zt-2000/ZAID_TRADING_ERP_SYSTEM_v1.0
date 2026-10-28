import React, { useState } from 'react';
import {
  Plus,
  Search,
  Download,
  Receipt,
  Tag,
  Edit2,
  Trash2,
  Power,
  FolderTree,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Table, Column } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { ExpenseCategoryModal } from '../components/modals/ExpenseCategoryModal';
import { useExpenseCategories, ExpenseCategory } from '../context/ExpenseCategoryContext';
import { useTransactions, ExpenseRecord } from '../context/TransactionContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDateTime } from '../utils/formatters';

interface ExpensesPageProps {
  onOpenRecordExpense: () => void;
  currencySymbol?: string;
}

export const ExpensesPage: React.FC<ExpensesPageProps> = ({
  onOpenRecordExpense,
  currencySymbol = 'Rs.',
}) => {
  const { showToast } = useToast();
  const { categories, toggleCategoryStatus, deleteOrDeactivateCategory } = useExpenseCategories();
  const { expenses } = useTransactions();

  const [activeTab, setActiveTab] = useState<'all' | 'categories' | 'summary'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryStatusFilter, setCategoryStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Category modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<ExpenseCategory | null>(null);

  const handleOpenCreateCategory = () => {
    setCategoryToEdit(null);
    setIsCategoryModalOpen(true);
  };

  const handleEditCategory = (cat: ExpenseCategory) => {
    setCategoryToEdit(cat);
    setIsCategoryModalOpen(true);
  };

  const handleToggleStatus = (cat: ExpenseCategory) => {
    toggleCategoryStatus(cat.id);
    const nextStatus = cat.status === 'active' ? 'deactivated' : 'activated';
    showToast('Category Updated', `Category "${cat.name}" has been ${nextStatus}.`, 'info');
  };

  const handleDeleteCategory = (cat: ExpenseCategory) => {
    const result = deleteOrDeactivateCategory(cat.id);
    showToast(
      result.action === 'deleted' ? 'Category Removed' : 'Category Deactivated',
      result.message,
      result.action === 'deleted' ? 'success' : 'warning'
    );
  };

  // Filtered Expense Records
  const filteredExpenses = expenses.filter(
    (e) =>
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.voucherNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.payee.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtered Categories
  const filteredCategories = categories.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      categoryStatusFilter === 'all' || c.status === categoryStatusFilter;

    return matchesSearch && matchesStatus;
  });

  // Table Columns for Expenses
  const expenseColumns: Column<ExpenseRecord>[] = [
    { key: 'voucherNo', header: 'VOUCHER #', width: '130px' },
    { key: 'date', header: 'DATE', width: '120px' },
    { key: 'description', header: 'DESCRIPTION / PURPOSE' },
    {
      key: 'categoryName',
      header: 'EXPENSE CATEGORY',
      render: (r) => (
        <span className="font-medium text-slate-800 dark:text-neutral-200">
          {r.categoryName}
        </span>
      ),
    },
    { key: 'accountName', header: 'DISBURSEMENT ACCOUNT' },
    { key: 'payee', header: 'BENEFICIARY' },
    {
      key: 'amount',
      header: 'AMOUNT',
      align: 'right',
      render: (r) => (
        <span className="font-bold text-slate-900 dark:text-neutral-100">
          {formatCurrency(r.amount, currencySymbol)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'STATUS',
      align: 'center',
      render: (r) => (
        <Badge variant={r.status === 'posted' ? 'success' : 'neutral'} dot>
          {r.status.toUpperCase()}
        </Badge>
      ),
    },
  ];

  // Table Columns for Expense Categories
  const categoryColumns: Column<ExpenseCategory>[] = [
    {
      key: 'code',
      header: 'CATEGORY CODE',
      width: '140px',
      render: (c) => (
        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-neutral-300">
          {c.code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'CATEGORY TITLE',
      render: (c) => (
        <span className="font-semibold text-slate-900 dark:text-neutral-100">
          {c.name}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'EXPENDITURE SCOPE',
      render: (c) => (
        <span className="text-slate-600 dark:text-neutral-400 text-xs">
          {c.description || '—'}
        </span>
      ),
    },
    {
      key: 'usageCount',
      header: 'USAGE IN VOUCHERS',
      align: 'right',
      render: (c) => (
        <span className="font-mono text-xs text-slate-700 dark:text-neutral-300">
          {c.usageCount} vouchers
        </span>
      ),
    },
    {
      key: 'status',
      header: 'STATUS',
      align: 'center',
      render: (c) => (
        <Badge variant={c.status === 'active' ? 'success' : 'neutral'} dot>
          {c.status.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      align: 'right',
      render: (c) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditCategory(c)}
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            title="Edit Category Name & Details"
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleStatus(c)}
            leftIcon={<Power className="w-3.5 h-3.5" />}
            title={c.status === 'active' ? 'Deactivate Category' : 'Activate Category'}
          >
            {c.status === 'active' ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteCategory(c)}
            leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
            title={c.usageCount > 0 ? 'Linked to vouchers: will deactivate instead of deleting' : 'Delete category'}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-neutral-400 uppercase">
            ACCOUNTING & OPERATING DISBURSEMENTS
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-neutral-100 mt-1">
            Expenses & Disbursements
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
            Operational expenditure tracking, fleet fuel vouchers, warehouse overheads, and vendor payments
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'categories' ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreateCategory}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Expense Category
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveTab('categories')}
                leftIcon={<Tag className="w-3.5 h-3.5" />}
              >
                Manage Expense Categories
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenRecordExpense}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Record Expense
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-neutral-800 space-x-6 text-xs font-semibold overflow-x-auto pb-px">
        {[
          { id: 'all', label: `All Recorded Expenses (${expenses.length})` },
          { id: 'categories', label: `Expense Categories (${categories.length})` },
          { id: 'summary', label: 'Monthly Cost Summary' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id as any);
              setSearchQuery('');
            }}
            className={`pb-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-[#167a53] text-[#167a53] dark:text-[#34d399]'
                : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: All Recorded Expenses */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by voucher #, payee, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('categories')}
                leftIcon={<Tag className="w-3.5 h-3.5" />}
              >
                Categories
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenRecordExpense}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Record Expense
              </Button>
            </div>
          </div>

          <Table
            columns={expenseColumns}
            data={filteredExpenses}
            keyExtractor={(row) => row.id}
            emptyState={
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 flex items-center justify-center mb-3">
                  <Receipt className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                  No operating expenses recorded for current period
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mt-1 leading-relaxed">
                  Post fuel receipts, driver allowances, warehouse repairs, and utility bills. Entries automatically adjust your cash/bank ledger.
                </p>
                <div className="mt-4">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={onOpenRecordExpense}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Record First Expense
                  </Button>
                </div>
              </div>
            }
          />
        </div>
      )}

      {/* Tab 2: Expense Categories Management */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search expense categories by title or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={categoryStatusFilter}
                onChange={(e) =>
                  setCategoryStatusFilter(e.target.value as 'all' | 'active' | 'inactive')
                }
                className="text-xs bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-slate-700 dark:text-neutral-300 focus:outline-none"
              >
                <option value="all">All Category Statuses</option>
                <option value="active">Active Only (Available for vouchers)</option>
                <option value="inactive">Inactive Only (Disabled)</option>
              </select>

              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenCreateCategory}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Create Category
              </Button>
            </div>
          </div>

          <Table
            columns={categoryColumns}
            data={filteredCategories}
            keyExtractor={(row) => row.id}
            emptyState={
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 flex items-center justify-center mb-3">
                  <FolderTree className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                  No expense categories found
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mt-1 leading-relaxed">
                  Define expenditure classifications to organize operating costs, driver fleet allowances, and facility overheads.
                </p>
                <div className="mt-4">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleOpenCreateCategory}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Create Category
                  </Button>
                </div>
              </div>
            }
          />
        </div>
      )}

      {/* Tab 3: Monthly Cost Summary */}
      {activeTab === 'summary' && (
        <div className="p-8 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800 text-center flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#167a53] dark:text-[#34d399] flex items-center justify-center mb-3">
            <Receipt className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
            Monthly Expenditure Ledger
          </h3>
          <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mt-1 leading-relaxed">
            Total expenses posted across all operational categories:{' '}
            <strong className="text-slate-900 dark:text-neutral-100">
              {formatCurrency(
                expenses.reduce((sum, e) => sum + e.amount, 0),
                currencySymbol
              )}
            </strong>
          </p>
          <div className="mt-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => showToast('Export', 'Exporting monthly expense report', 'info')}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export Monthly Summary
            </Button>
          </div>
        </div>
      )}

      {/* Reusable Category Creation & Edit Modal */}
      <ExpenseCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setCategoryToEdit(null);
        }}
        categoryToEdit={categoryToEdit}
      />
    </div>
  );
};
