import React, { useState } from 'react';
import {
  Plus,
  Search,
  Layers,
  ArrowLeftRight,
  FolderTree,
  Edit2,
  Trash2,
  Archive,
  RefreshCw,
  Building2,
  Boxes,
  MapPin,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Table, Column } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Dialog } from '../components/ui/Dialog';
import { CategoryModal } from '../components/modals/CategoryModal';
import { WarehouseModal } from '../components/modals/WarehouseModal';
import { WarehouseBinModal } from '../components/modals/WarehouseBinModal';
import { useCategories, ProductCategory } from '../context/CategoryContext';
import {
  useTransactions,
  WarehouseRecord,
  WarehouseBinRecord,
} from '../context/TransactionContext';
import { useToast } from '../context/ToastContext';

interface InventoryPageProps {
  onOpenAddProduct: () => void;
  currencySymbol?: string;
}

interface ProductStockRow {
  id: string;
  sku: string;
  productName: string;
  category: string;
  unit: string;
  availableStock: number;
  reservedStock: number;
  onHandStock: number;
  unitCost: number;
  valuation: number;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({
  onOpenAddProduct,
  currencySymbol = 'Rs.',
}) => {
  const { showToast } = useToast();
  const { categories, archiveCategory, restoreCategory, deleteCategory } = useCategories();
  const {
    warehouses,
    warehouseBins,
    deleteWarehouseBin,
  } = useTransactions();

  const [activeTab, setActiveTab] = useState<
    'on_hand' | 'categories' | 'warehouses' | 'transfers' | 'adjustments' | 'alerts'
  >('on_hand');

  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryStatusFilter, setCategoryStatusFilter] = useState<'all' | 'active' | 'archived'>('all');

  // Category modal states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<ProductCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<ProductCategory | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  // Warehouse & Bin modal states
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [warehouseToEdit, setWarehouseToEdit] = useState<WarehouseRecord | null>(null);
  const [isBinModalOpen, setIsBinModalOpen] = useState(false);
  const [binToEdit, setBinToEdit] = useState<WarehouseBinRecord | null>(null);
  const [selectedWarehouseForBins, setSelectedWarehouseForBins] = useState('all');

  // Honest production database starts with 0 inventory rows
  const inventoryData: ProductStockRow[] = [];

  const inventoryColumns: Column<ProductStockRow>[] = [
    { key: 'sku', header: 'SKU / ITEM CODE' },
    { key: 'productName', header: 'PRODUCT NAME' },
    { key: 'category', header: 'CATEGORY' },
    { key: 'unit', header: 'UNIT' },
    {
      key: 'availableStock',
      header: 'AVAILABLE',
      align: 'right',
      render: (r) => r.availableStock.toLocaleString(),
    },
    {
      key: 'reservedStock',
      header: 'RESERVED',
      align: 'right',
      render: (r) => r.reservedStock.toLocaleString(),
    },
    {
      key: 'onHandStock',
      header: 'ON-HAND',
      align: 'right',
      render: (r) => r.onHandStock.toLocaleString(),
    },
    {
      key: 'unitCost',
      header: 'WAC COST',
      align: 'right',
      render: (r) => `${currencySymbol}${r.unitCost.toFixed(2)}`,
    },
    {
      key: 'valuation',
      header: 'TOTAL VALUE',
      align: 'right',
      render: (r) => `${currencySymbol}${r.valuation.toFixed(2)}`,
    },
  ];

  // Category management logic
  const filteredCategories = categories.filter((cat) => {
    const matchesSearch =
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      categoryStatusFilter === 'all' || cat.status === categoryStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleEditCategory = (cat: ProductCategory) => {
    setCategoryToEdit(cat);
    setIsCategoryModalOpen(true);
  };

  const handleCreateCategory = () => {
    setCategoryToEdit(null);
    setIsCategoryModalOpen(true);
  };

  const handleToggleArchive = (cat: ProductCategory) => {
    if (cat.status === 'active') {
      archiveCategory(cat.id);
      showToast('Category Archived', `"${cat.name}" has been archived.`, 'info');
    } else {
      restoreCategory(cat.id);
      showToast('Category Restored', `"${cat.name}" is now active.`, 'success');
    }
  };

  const handleConfirmDeleteCategory = () => {
    if (!categoryToDelete) return;
    setIsDeletingCategory(true);

    const res = deleteCategory(categoryToDelete.id);
    setIsDeletingCategory(false);

    if (!res.success) {
      showToast('Cannot Delete Category', res.error, 'error');
      setCategoryToDelete(null);
      return;
    }

    showToast(
      'Category Deleted',
      `Category "${categoryToDelete.name}" has been permanently removed from catalog master.`,
      'success'
    );
    setCategoryToDelete(null);
  };

  const categoryColumns: Column<ProductCategory>[] = [
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
      header: 'CATEGORY NAME',
      render: (c) => (
        <span className="font-semibold text-slate-900 dark:text-neutral-100">
          {c.name}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'DESCRIPTION / SCOPE',
      render: (c) => (
        <span className="text-slate-600 dark:text-neutral-400 text-xs">
          {c.description || '—'}
        </span>
      ),
    },
    {
      key: 'productCount',
      header: 'LINKED SKUS',
      align: 'right',
      render: (c) => (
        <span className="font-mono text-xs text-slate-700 dark:text-neutral-300">
          {c.productCount} SKUs
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
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditCategory(c)}
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            title="Edit Category"
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleArchive(c)}
            leftIcon={
              c.status === 'active' ? (
                <Archive className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              )
            }
            title={c.status === 'active' ? 'Archive Category' : 'Restore Category'}
          >
            {c.status === 'active' ? 'Archive' : 'Restore'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCategoryToDelete(c)}
            leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
            title="Delete Category"
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  // Warehouse Bins filtering
  const filteredBins = warehouseBins.filter((b) => {
    const matchesWh =
      selectedWarehouseForBins === 'all' || b.warehouseId === selectedWarehouseForBins;
    const matchesSearch =
      b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.warehouseName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesWh && matchesSearch;
  });

  const binColumns: Column<WarehouseBinRecord>[] = [
    {
      key: 'code',
      header: 'BIN CODE',
      width: '120px',
      render: (b) => <span className="font-mono font-bold text-[#167a53]">{b.code}</span>,
    },
    { key: 'name', header: 'LOCATION NAME' },
    { key: 'warehouseName', header: 'FACILITY' },
    {
      key: 'type',
      header: 'BIN TYPE',
      render: (b) => (
        <span className="capitalize font-mono text-xs">
          {b.type.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'aisle',
      header: 'AISLE / RACK / SHELF',
      align: 'center',
      render: (b) => (
        <span className="font-mono text-xs">
          {b.aisle}-{b.rack}-{b.shelf}
        </span>
      ),
    },
    {
      key: 'maxWeightKg',
      header: 'CAPACITY',
      align: 'right',
      render: (b) => <span className="font-mono text-xs">{b.maxWeightKg} kg</span>,
    },
    {
      key: 'status',
      header: 'STATUS',
      align: 'center',
      render: (b) => (
        <Badge
          variant={
            b.status === 'active'
              ? 'success'
              : b.status === 'full'
              ? 'warning'
              : 'neutral'
          }
          dot
        >
          {b.status.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      align: 'right',
      render: (b) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setBinToEdit(b);
              setIsBinModalOpen(true);
            }}
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const res = deleteWarehouseBin(b.id);
              if (!res.success) {
                showToast('Cannot Delete Bin', res.error, 'error');
              } else {
                showToast('Bin Removed', `Location ${b.code} deleted.`, 'info');
              }
            }}
            leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-neutral-400 uppercase">
            OPERATIONS & WAREHOUSING
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-neutral-100 mt-1">
            Inventory & Warehouse Stock
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
            Central depot balances, product categories, warehouse bins & rack locations, and valuation
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'categories' && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateCategory}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Category
            </Button>
          )}

          {activeTab === 'warehouses' && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setWarehouseToEdit(null);
                  setIsWarehouseModalOpen(true);
                }}
                leftIcon={<Building2 className="w-3.5 h-3.5" />}
              >
                Add Facility
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setBinToEdit(null);
                  setIsBinModalOpen(true);
                }}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Bin Location
              </Button>
            </>
          )}

          {activeTab === 'on_hand' && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => showToast('Stock Transfer', 'Warehouse-to-van transfer workflow', 'info')}
                leftIcon={<ArrowLeftRight className="w-3.5 h-3.5" />}
              >
                Transfer Stock
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenAddProduct}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Product
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-neutral-800 space-x-6 text-xs font-semibold overflow-x-auto pb-px">
        {[
          { id: 'on_hand', label: 'On-Hand Stock' },
          { id: 'categories', label: `Product Categories (${categories.length})` },
          { id: 'warehouses', label: `Warehouse Bins & Locations (${warehouseBins.length})` },
          { id: 'transfers', label: 'Inter-Warehouse Transfers' },
          { id: 'adjustments', label: 'Stock Adjustments & Counts' },
          { id: 'alerts', label: 'Low Stock Alerts' },
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

      {/* Categories View */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search categories by name, code, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={categoryStatusFilter}
                onChange={(e) =>
                  setCategoryStatusFilter(e.target.value as 'all' | 'active' | 'archived')
                }
                className="text-xs bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-slate-700 dark:text-neutral-300 focus:outline-none"
              >
                <option value="all">All Category Statuses</option>
                <option value="active">Active Categories Only</option>
                <option value="archived">Archived Categories</option>
              </select>

              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateCategory}
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
                  No product categories match your query
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mt-1 leading-relaxed">
                  Organize your wholesale inventory into distinct classification hierarchies to streamline purchasing, sales pricing, and valuation reporting.
                </p>
                <div className="mt-4">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCreateCategory}
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

      {/* Warehouse Bins & Locations View (Requirement 7) */}
      {activeTab === 'warehouses' && (
        <div className="space-y-6">
          {/* Facilities Cards Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-neutral-200 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#167a53]" />
                Registered Storage Facilities & Depots ({warehouses.length})
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setWarehouseToEdit(null);
                  setIsWarehouseModalOpen(true);
                }}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Depot
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {warehouses.map((wh) => (
                <div
                  key={wh.id}
                  className="p-4 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[11px] text-[#167a53] font-bold">
                        {wh.code}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-neutral-100">
                        {wh.name}
                      </h4>
                    </div>
                    {wh.isDefault && (
                      <span className="text-[10px] font-bold bg-[#167a53]/10 text-[#167a53] px-2 py-0.5 rounded">
                        PRIMARY HUB
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-neutral-400">
                    {wh.address}, {wh.city}
                  </p>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-neutral-800/80">
                    <span className="text-slate-500">
                      Capacity: <span className="font-mono font-semibold text-slate-800 dark:text-neutral-200">{wh.totalCapacityBays} Bays</span>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setWarehouseToEdit(wh);
                        setIsWarehouseModalOpen(true);
                      }}
                      leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bins Management Table */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search bin code (e.g. A-01-01) or aisle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={selectedWarehouseForBins}
                  onChange={(e) => setSelectedWarehouseForBins(e.target.value)}
                  className="text-xs bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-slate-700 dark:text-neutral-300 focus:outline-none"
                >
                  <option value="all">All Facilities</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setBinToEdit(null);
                    setIsBinModalOpen(true);
                  }}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Add Bin
                </Button>
              </div>
            </div>

            <Table
              columns={binColumns}
              data={filteredBins}
              keyExtractor={(row) => row.id}
              emptyState={
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 flex items-center justify-center mb-3">
                    <Boxes className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                    No warehouse bins found
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mt-1 leading-relaxed">
                    Set up aisles, pallet racks, and shelf bin codes to organize stock put-away and wave picking.
                  </p>
                  <div className="mt-4">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setBinToEdit(null);
                        setIsBinModalOpen(true);
                      }}
                      leftIcon={<Plus className="w-4 h-4" />}
                    >
                      Add First Bin Location
                    </Button>
                  </div>
                </div>
              }
            />
          </div>
        </div>
      )}

      {/* On-Hand & Other Tabs */}
      {activeTab === 'on_hand' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search catalog SKU, barcode, or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={warehouseFilter}
                onChange={(e) => setWarehouseFilter(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-slate-700 dark:text-neutral-300 focus:outline-none"
              >
                <option value="all">All Storage Locations (Central Hub + Vans)</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.name}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Table
            columns={inventoryColumns}
            data={inventoryData}
            keyExtractor={(row) => row.id}
            emptyState={
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 flex items-center justify-center mb-3">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                  No inventory recorded in warehouse catalog
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mt-1 leading-relaxed">
                  Add your wholesale trading SKUs, units of measure, and purchase prices. Movements will be tracked through an auditable stock ledger.
                </p>
                <div className="mt-4">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={onOpenAddProduct}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Add First Product
                  </Button>
                </div>
              </div>
            }
          />
        </div>
      )}

      {/* Transfers, Adjustments, Alerts Tabs */}
      {(activeTab === 'transfers' || activeTab === 'adjustments' || activeTab === 'alerts') && (
        <div className="p-8 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#181f1b] text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 flex items-center justify-center mx-auto">
            {activeTab === 'transfers' ? (
              <ArrowLeftRight className="w-6 h-6" />
            ) : activeTab === 'adjustments' ? (
              <Layers className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            )}
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100 capitalize">
            {activeTab.replace('_', ' ')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-md mx-auto">
            {activeTab === 'transfers'
              ? 'Move physical stock between Central Hub, Regional Depots, and Mobile Van floats.'
              : activeTab === 'adjustments'
              ? 'Reconcile stock takes, spoilage write-offs, and batch re-counts.'
              : 'Automated warnings triggered when SKUs fall below designated reorder points.'}
          </p>
        </div>
      )}

      {/* Category Modal Dialog */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setCategoryToEdit(null);
        }}
        categoryToEdit={categoryToEdit}
      />

      {/* Category Delete Confirmation Modal */}
      <Dialog
        isOpen={Boolean(categoryToDelete)}
        onClose={() => setCategoryToDelete(null)}
        title="Confirm Category Deletion"
        description="Verify catalog integrity before removing product classification"
        maxWidth="sm"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCategoryToDelete(null)}
              disabled={isDeletingCategory}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmDeleteCategory}
              isLoading={isDeletingCategory}
            >
              Confirm Delete
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <p className="text-slate-700 dark:text-neutral-300">
            Are you sure you want to delete category{' '}
            <strong className="text-slate-900 dark:text-neutral-100 font-semibold">
              "{categoryToDelete?.name}"
            </strong>
            ?
          </p>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-300 space-y-1">
            <p className="font-semibold">Integrity Check:</p>
            <p>
              Deletion is permanently blocked if any catalog SKUs or transaction lines are linked to this category. If linked, please archive it instead.
            </p>
          </div>
        </div>
      </Dialog>

      {/* Warehouse Modal */}
      <WarehouseModal
        isOpen={isWarehouseModalOpen}
        onClose={() => {
          setIsWarehouseModalOpen(false);
          setWarehouseToEdit(null);
        }}
        warehouseToEdit={warehouseToEdit}
      />

      {/* Warehouse Bin Modal */}
      <WarehouseBinModal
        isOpen={isBinModalOpen}
        onClose={() => {
          setIsBinModalOpen(false);
          setBinToEdit(null);
        }}
        binToEdit={binToEdit}
      />
    </div>
  );
};
