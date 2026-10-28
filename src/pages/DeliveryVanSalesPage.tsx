import React, { useState } from 'react';
import {
  Plus,
  Search,
  Truck,
  RotateCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Package,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Table, Column } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import {
  useTransactions,
} from '../context/TransactionContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDateOnly } from '../utils/formatters';
import { DeliveryShipmentRecord, OrderTrackingRecord } from '../types';
import { NewDeliveryShipmentModal } from '../components/modals/NewDeliveryShipmentModal';
import { OrderTrackingModal } from '../components/modals/OrderTrackingModal';

interface DeliveryVanSalesPageProps {
  currencySymbol?: string;
}

interface VanFleetRow {
  id: string;
  vehiclePlate: string;
  driverName: string;
  assignedRoute: string;
  openingStockValue: number;
  salesCollected: number;
  status: string;
}

export const DeliveryVanSalesPage: React.FC<DeliveryVanSalesPageProps> = ({
  currencySymbol = 'Rs.',
}) => {
  const { showToast } = useToast();
  const {
    shipments,
    orderTracking,
    updateShipmentStatus,
  } = useTransactions();

  const [activeTab, setActiveTab] = useState<
    'deliveries' | 'van_fleet' | 'order_tracking' | 'reconciliation'
  >('deliveries');

  const [searchQuery, setSearchQuery] = useState('');
  const [isNewShipmentOpen, setIsNewShipmentOpen] = useState(false);
  const [selectedTracking, setSelectedTracking] = useState<OrderTrackingRecord | null>(null);

  // 1. Deliveries Filter
  const filteredShipments = shipments.filter(
    (s) =>
      s.shipmentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.driverName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 2. Order Tracking Filter
  const filteredTracking = orderTracking.filter(
    (t) =>
      t.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Default Van Fleet rows
  const vanFleetData: VanFleetRow[] = [
    {
      id: 'van_1',
      vehiclePlate: 'WP BAF-1044',
      driverName: 'Nimal Fernando',
      assignedRoute: 'Colombo Central Retail Zone (Route 01)',
      openingStockValue: 185000,
      salesCollected: 142000,
      status: 'In Transit',
    },
    {
      id: 'van_2',
      vehiclePlate: 'WP CAD-9021',
      driverName: 'Priyantha Bandara',
      assignedRoute: 'Negombo Coastal Wholesale Corridor',
      openingStockValue: 240000,
      salesCollected: 210000,
      status: 'Active Selling',
    },
  ];

  // Columns for Delivery Shipments
  const shipmentColumns: Column<DeliveryShipmentRecord>[] = [
    {
      key: 'shipmentNumber',
      header: 'DISPATCH #',
      width: '120px',
      render: (s) => <span className="font-mono font-bold text-[#167a53]">{s.shipmentNumber}</span>,
    },
    {
      key: 'orderNumber',
      header: 'SALES ORDER #',
      width: '130px',
      render: (s) => <span className="font-mono">{s.orderNumber}</span>,
    },
    { key: 'customerName', header: 'CUSTOMER & RECIPIENT' },
    {
      key: 'deliveryAddress',
      header: 'DELIVERY DESTINATION',
      render: (s) => <span className="text-xs truncate max-w-xs">{s.deliveryAddress}</span>,
    },
    {
      key: 'driverName',
      header: 'DRIVER & VEHICLE',
      render: (s) => (
        <div>
          <p className="font-semibold text-slate-800 dark:text-neutral-200">{s.driverName}</p>
          <p className="font-mono text-[10px] text-slate-400">{s.vehiclePlate}</p>
        </div>
      ),
    },
    {
      key: 'codAmount',
      header: 'COD TARGET',
      align: 'right',
      render: (s) => (
        <span className="font-mono text-xs font-semibold">
          {s.codAmount ? formatCurrency(s.codAmount, currencySymbol) : 'Prepaid'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'STATUS',
      align: 'center',
      render: (s) => {
        const variant =
          s.status === 'delivered'
            ? 'success'
            : s.status === 'in_transit'
            ? 'info'
            : s.status === 'failed'
            ? 'danger'
            : 'neutral';
        return (
          <Badge variant={variant} dot>
            {s.status.replace('_', ' ').toUpperCase()}
          </Badge>
        );
      },
    },
    {
      key: 'id',
      header: 'ACTIONS',
      align: 'right',
      render: (s) => (
        <div className="flex items-center justify-end gap-1.5">
          {s.status === 'assigned' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                updateShipmentStatus(s.id, 'in_transit');
                showToast('Status Updated', `Shipment ${s.shipmentNumber} is now In Transit.`, 'info');
              }}
            >
              Start Transit
            </Button>
          )}
          {s.status === 'in_transit' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                updateShipmentStatus(s.id, 'delivered');
                showToast('Shipment Completed', `Shipment ${s.shipmentNumber} marked Delivered.`, 'success');
              }}
            >
              Confirm Delivered
            </Button>
          )}
          {s.status === 'delivered' && (
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
            </span>
          )}
        </div>
      ),
    },
  ];

  // Columns for Van Fleet
  const vanFleetColumns: Column<VanFleetRow>[] = [
    {
      key: 'vehiclePlate',
      header: 'VEHICLE PLATE',
      width: '140px',
      render: (r) => <span className="font-mono font-bold">{r.vehiclePlate}</span>,
    },
    { key: 'driverName', header: 'ASSIGNED DRIVER' },
    { key: 'assignedRoute', header: 'FIELD SALES ROUTE' },
    {
      key: 'openingStockValue',
      header: 'LOADED VAN STOCK',
      align: 'right',
      render: (r) => formatCurrency(r.openingStockValue, currencySymbol),
    },
    {
      key: 'salesCollected',
      header: 'CASH/CREDIT COLLECTED',
      align: 'right',
      render: (r) => (
        <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
          {formatCurrency(r.salesCollected, currencySymbol)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'STATUS',
      align: 'center',
      render: (r) => <Badge variant="success" dot>{r.status.toUpperCase()}</Badge>,
    },
  ];

  // Columns for Order Tracking Pipeline
  const trackingColumns: Column<OrderTrackingRecord>[] = [
    {
      key: 'trackingNumber',
      header: 'TRACKING #',
      width: '130px',
      render: (t) => <span className="font-mono font-bold text-[#167a53]">{t.trackingNumber}</span>,
    },
    {
      key: 'orderNumber',
      header: 'SALES ORDER #',
      width: '130px',
      render: (t) => <span className="font-mono font-medium">{t.orderNumber}</span>,
    },
    { key: 'customerName', header: 'CUSTOMER' },
    { key: 'currentLocation', header: 'CURRENT STAGE / LOCATION' },
    {
      key: 'status',
      header: 'PIPELINE STATUS',
      align: 'center',
      render: (t) => {
        let variant: 'success' | 'info' | 'warning' | 'danger' | 'neutral' = 'neutral';
        if (t.status === 'completed') variant = 'success';
        else if (t.status === 'dispatched' || t.status === 'ready') variant = 'info';
        else if (t.status === 'processing') variant = 'warning';
        else if (t.status === 'cancelled' || t.status === 'on_hold') variant = 'danger';

        return (
          <Badge variant={variant} dot>
            {t.status.replace('_', ' ').toUpperCase()}
          </Badge>
        );
      },
    },
    {
      key: 'lastUpdated',
      header: 'LAST MILESTONE',
      render: (t) => (
        <span className="text-[11px] text-slate-500 font-mono">
          {new Date(t.lastUpdated).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'id',
      header: 'AUDIT TIMELINE',
      align: 'right',
      render: (t) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedTracking(t)}
          leftIcon={<Clock className="w-3.5 h-3.5 text-[#167a53]" />}
        >
          View Timeline & Advance
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-neutral-400 uppercase">
            OPERATIONS & FIELD DISTRIBUTION
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-neutral-100 mt-1">
            Delivery Management & Van Sales Fleet
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
            Distinct workflows for physical delivery tracking, mobile van sales floats, order pipeline milestones, and EOD cash reconciliation
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'deliveries' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsNewShipmentOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Assign Delivery Shipment
            </Button>
          )}

          {activeTab === 'reconciliation' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                showToast('Reconcile', 'All mobile van floats reconciled against Central Petty Cash (1010).', 'success')
              }
              leftIcon={<RotateCw className="w-3.5 h-3.5" />}
            >
              Close Daily Books
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-neutral-800 space-x-6 text-xs font-semibold overflow-x-auto pb-px">
        {[
          { id: 'deliveries', label: `Delivery Shipments (${shipments.length})` },
          { id: 'van_fleet', label: 'Mobile Van Sales & Routes' },
          { id: 'order_tracking', label: `Live Order Tracking Pipeline (${orderTracking.length})` },
          { id: 'reconciliation', label: 'End-of-Day Van Reconciliation' },
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

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={
              activeTab === 'deliveries'
                ? 'Search dispatch #, order #, or driver...'
                : activeTab === 'order_tracking'
                ? 'Search tracking #, order #, or customer...'
                : 'Search van plate or route...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
          />
        </div>
      </div>

      {/* Tab 1: Physical Delivery Shipments (Requirement 9) */}
      {activeTab === 'deliveries' && (
        <Table
          columns={shipmentColumns}
          data={filteredShipments}
          keyExtractor={(row) => row.id}
          emptyState={
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 flex items-center justify-center mb-3">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                No physical deliveries assigned yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mt-1 leading-relaxed">
                Assign fulfilled sales orders to fleet drivers and vehicles. Track transit progress and Cash on Delivery (COD) collections.
              </p>
              <div className="mt-4">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsNewShipmentOpen(true)}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Assign First Delivery
                </Button>
              </div>
            </div>
          }
        />
      )}

      {/* Tab 2: Mobile Van Fleet & Route Sales */}
      {activeTab === 'van_fleet' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-800 text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-neutral-100">
                Mobile Van Sales Operations
              </h4>
              <p className="text-slate-500 dark:text-neutral-400">
                Drivers carry floating warehouse stock, issue direct van invoices to retail stores, and collect immediate payments.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => showToast('Van Float', 'Warehouse stock loaded into Van WP BAF-1044', 'info')}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Load Van Float
            </Button>
          </div>

          <Table
            columns={vanFleetColumns}
            data={vanFleetData}
            keyExtractor={(row) => row.id}
          />
        </div>
      )}

      {/* Tab 3: Order Tracking Pipeline (Requirement 10) */}
      {activeTab === 'order_tracking' && (
        <Table
          columns={trackingColumns}
          data={filteredTracking}
          keyExtractor={(row) => row.id}
          emptyState={
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 flex items-center justify-center mb-3">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                No orders currently in tracking pipeline
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mt-1 leading-relaxed">
                When sales orders are created, an audit tracking timeline is automatically initialized with unique tracking numbers.
              </p>
            </div>
          }
        />
      )}

      {/* Tab 4: End-of-Day Reconciliation */}
      {activeTab === 'reconciliation' && (
        <div className="p-6 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#181f1b] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#167a53] dark:text-[#34d399] flex items-center justify-center">
              <RotateCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                End-of-Day (EOD) Driver & Stock Reconciliation
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Reconcile physical unsold goods returned to warehouse bays and deposit route cash collections into the Central Warehouse Petty Cash Vault (Account 1010).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                TOTAL ROUTE SALES
              </span>
              <p className="text-lg font-bold font-mono text-slate-800 dark:text-neutral-200">
                {formatCurrency(352000, currencySymbol)}
              </p>
              <p className="text-xs text-slate-500 mt-1">2 Vans settled today across 28 store visits</p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                CASH READY FOR VAULT DEPOSIT
              </span>
              <p className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400">
                {formatCurrency(295000, currencySymbol)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Direct deposit to Cash Vault (1010)</p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                UNSOLD STOCK RETURNED
              </span>
              <p className="text-lg font-bold font-mono text-slate-800 dark:text-neutral-200">
                100% Balanced
              </p>
              <p className="text-xs text-slate-500 mt-1">Zero stock shrinkage or discrepancies logged</p>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <NewDeliveryShipmentModal
        isOpen={isNewShipmentOpen}
        onClose={() => setIsNewShipmentOpen(false)}
        currencySymbol={currencySymbol}
      />

      <OrderTrackingModal
        isOpen={Boolean(selectedTracking)}
        onClose={() => setSelectedTracking(null)}
        trackingRecord={selectedTracking}
      />
    </div>
  );
};
