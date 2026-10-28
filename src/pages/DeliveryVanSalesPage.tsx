import React, { useState } from 'react';
import { Plus, Search, Truck, ArrowLeftRight, CheckCircle2, RotateCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Table, Column } from '../components/ui/Table';
import { useToast } from '../context/ToastContext';

interface DeliveryVanSalesPageProps {
  currencySymbol?: string;
}

interface VanDeliveryRow {
  id: string;
  vehiclePlate: string;
  driverName: string;
  assignedRoute: string;
  openingStockValue: number;
  salesCollected: number;
  status: string;
}

export const DeliveryVanSalesPage: React.FC<DeliveryVanSalesPageProps> = ({
  currencySymbol = '$',
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'routes' | 'van_stock' | 'reconciliation' | 'drivers'>('routes');
  const [searchQuery, setSearchQuery] = useState('');

  const vanData: VanDeliveryRow[] = [];

  const columns: Column<VanDeliveryRow>[] = [
    { key: 'vehiclePlate', header: 'VEHICLE / VAN PLATE' },
    { key: 'driverName', header: 'ASSIGNED DRIVER' },
    { key: 'assignedRoute', header: 'DISPATCH ROUTE / ZONE' },
    {
      key: 'openingStockValue',
      header: 'LOADED VAN STOCK',
      align: 'right',
      render: (r) => `${currencySymbol}${r.openingStockValue.toFixed(2)}`,
    },
    {
      key: 'salesCollected',
      header: 'CASH/CREDIT COLLECTED',
      align: 'right',
      render: (r) => `${currencySymbol}${r.salesCollected.toFixed(2)}`,
    },
    { key: 'status', header: 'DISPATCH STATUS', align: 'center' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-neutral-400 uppercase">
            OPERATIONS & FIELD DISTRIBUTION
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-neutral-100 mt-1">
            Delivery & Van Sales Fleet
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
            Van inventory floats, field sales invoices, driver cash collections, and end-of-day stock reconciliation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => showToast('Reconcile', 'End-of-day cash and unsold stock reconciliation', 'info')}
            leftIcon={<RotateCw className="w-3.5 h-3.5" />}
          >
            EOD Reconciliation
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => showToast('Dispatch', 'Dispatch van assignment workflow', 'info')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Assign Van Route
          </Button>
        </div>
      </div>

      <div className="flex border-b border-slate-200 dark:border-neutral-800 space-x-6 text-xs font-semibold overflow-x-auto pb-px">
        {[
          { id: 'routes', label: 'Active Delivery Routes' },
          { id: 'van_stock', label: 'Mobile Van Inventory' },
          { id: 'reconciliation', label: 'End-of-Day Reconciliation' },
          { id: 'drivers', label: 'Drivers & Fleet Vehicles' },
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
            placeholder="Search van by plate or driver..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={vanData}
        keyExtractor={(row) => row.id}
        emptyState={
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 flex items-center justify-center mb-3">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
              No active van sales dispatches
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mt-1 leading-relaxed">
              Dispatch delivery drivers with transferred warehouse stock. Drivers can issue invoices directly from van inventory and record cash/credit collections.
            </p>
            <div className="mt-4">
              <Button
                variant="primary"
                size="sm"
                onClick={() => showToast('Dispatch', 'Dispatching first delivery van', 'info')}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Assign First Van Route
              </Button>
            </div>
          </div>
        }
      />
    </div>
  );
};
