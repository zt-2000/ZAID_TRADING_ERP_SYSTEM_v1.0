import React, { useState } from 'react';
import { Plus, Search, Download, ShoppingCart } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Table, Column } from '../components/ui/Table';
import { useToast } from '../context/ToastContext';

interface PurchasingPageProps {
  onOpenNewPurchase: () => void;
  currencySymbol?: string;
}

interface PurchaseRow {
  id: string;
  poNumber: string;
  date: string;
  supplierName: string;
  warehouse: string;
  totalCost: number;
  status: string;
}

export const PurchasingPage: React.FC<PurchasingPageProps> = ({
  onOpenNewPurchase,
  currencySymbol = '$',
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'po' | 'grn' | 'bills' | 'returns'>('po');
  const [searchQuery, setSearchQuery] = useState('');

  const purchaseData: PurchaseRow[] = [];

  const columns: Column<PurchaseRow>[] = [
    { key: 'poNumber', header: 'PO NUMBER' },
    { key: 'date', header: 'DATE' },
    { key: 'supplierName', header: 'SUPPLIER ENTITY' },
    { key: 'warehouse', header: 'RECEIVING DESTINATION' },
    {
      key: 'totalCost',
      header: 'ESTIMATED VALUE',
      align: 'right',
      render: (r) => `${currencySymbol}${r.totalCost.toFixed(2)}`,
    },
    { key: 'status', header: 'RECEIPT STATUS', align: 'center' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-neutral-400 uppercase">
            OPERATIONS & PROCUREMENT
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-neutral-100 mt-1">
            Purchasing & Goods Receipts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
            Procurement orders, vendor bills, 3-way matching, and inventory stock increments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => showToast('Export', 'Exporting purchasing records', 'info')}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenNewPurchase}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Purchase Order
          </Button>
        </div>
      </div>

      <div className="flex border-b border-slate-200 dark:border-neutral-800 space-x-6 text-xs font-semibold overflow-x-auto pb-px">
        {[
          { id: 'po', label: 'Purchase Orders' },
          { id: 'grn', label: 'Goods Receipt Notes (GRN)' },
          { id: 'bills', label: 'Supplier Bills' },
          { id: 'returns', label: 'Debit Notes & Returns' },
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
            placeholder="Search by PO # or supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={purchaseData}
        keyExtractor={(row) => row.id}
        emptyState={
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 flex items-center justify-center mb-3">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
              No purchase orders on record
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mt-1 leading-relaxed">
              Issue purchase orders to suppliers. When goods arrive at the warehouse, receiving them will update the audited stock ledger automatically.
            </p>
            <div className="mt-4">
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenNewPurchase}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Create First Purchase Order
              </Button>
            </div>
          </div>
        }
      />
    </div>
  );
};
