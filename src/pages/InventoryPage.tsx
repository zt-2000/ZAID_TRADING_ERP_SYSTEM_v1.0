import React, { useState } from 'react';
import { Plus, Search, Download, Layers, ArrowLeftRight, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Table, Column } from '../components/ui/Table';
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
  currencySymbol = '$',
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'on_hand' | 'warehouses' | 'transfers' | 'adjustments' | 'alerts'>('on_hand');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const inventoryData: ProductStockRow[] = [];

  const columns: Column<ProductStockRow>[] = [
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-neutral-400 uppercase">
            OPERATIONS & WAREHOUSING
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-neutral-100 mt-1">
            Inventory & Warehouse Stock
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
            Central depot balances, van float stock, weighted average valuation, and batch movements
          </p>
        </div>

        <div className="flex items-center gap-2">
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
        </div>
      </div>

      <div className="flex border-b border-slate-200 dark:border-neutral-800 space-x-6 text-xs font-semibold overflow-x-auto pb-px">
        {[
          { id: 'on_hand', label: 'On-Hand Stock' },
          { id: 'warehouses', label: 'Warehouse Bins & Locations' },
          { id: 'transfers', label: 'Inter-Warehouse Transfers' },
          { id: 'adjustments', label: 'Stock Adjustments & Counts' },
          { id: 'alerts', label: 'Low Stock Alerts' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
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
            <option value="central">Riyadh Central Hub</option>
            <option value="dammam">Dammam Depot</option>
            <option value="vans">Van Fleet Units</option>
          </select>
        </div>
      </div>

      <Table
        columns={columns}
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
  );
};
