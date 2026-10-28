import React, { useState } from 'react';
import {
  Plus,
  Search,
  Truck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Package,
  Printer,
  ChevronRight,
  UserCheck,
  RotateCw,
  XCircle,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Table, Column } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { useTransactions } from '../context/TransactionContext';
import { useToast } from '../context/ToastContext';
import { formatDateOnly } from '../utils/formatters';
import { DeliveryRecord, DeliveryStatus, CompanySettings } from '../types';
import { CreateDeliveryModal } from '../components/modals/CreateDeliveryModal';
import { ConfirmDeliveryPODModal } from '../components/modals/ConfirmDeliveryPODModal';
import { PrintableDeliveryNoteModal } from '../components/modals/PrintableDeliveryNoteModal';

interface DeliveryPageProps {
  companySettings?: CompanySettings;
}

export const DeliveryPage: React.FC<DeliveryPageProps> = ({ companySettings }) => {
  const { showToast } = useToast();
  const {
    deliveries,
    salesOrders,
    updateDeliveryStatus,
  } = useTransactions();

  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'queue'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSalesOrderIdForCreate, setSelectedSalesOrderIdForCreate] = useState<string | undefined>(undefined);
  const [deliveryToConfirmPOD, setDeliveryToConfirmPOD] = useState<DeliveryRecord | null>(null);
  const [deliveryToPrint, setDeliveryToPrint] = useState<DeliveryRecord | null>(null);

  // Status Filter options
  const activeDeliveries = deliveries.filter(
    (d) =>
      d.status === 'pending' ||
      d.status === 'scheduled' ||
      d.status === 'preparing' ||
      d.status === 'dispatched' ||
      d.status === 'in_transit'
  );

  const completedDeliveries = deliveries.filter(
    (d) => d.status === 'delivered' || d.status === 'failed' || d.status === 'cancelled'
  );

  // Unfulfilled Sales Orders Queue (orders that have not been fully delivered)
  const unfulfilledOrders = salesOrders.filter((o) => o.status !== 'cancelled' && o.status !== 'completed');

  // Filtered Deliveries List
  const targetList = activeTab === 'active' ? activeDeliveries : completedDeliveries;

  const filteredDeliveries = targetList.filter((d) => {
    const matchesSearch =
      d.deliveryNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.salesOrderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.assignedStaff.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.deliveryAddress.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (st: DeliveryStatus) => {
    switch (st) {
      case 'delivered':
        return <Badge variant="success">DELIVERED</Badge>;
      case 'in_transit':
        return <Badge variant="info">IN TRANSIT</Badge>;
      case 'dispatched':
        return <Badge variant="info">DISPATCHED</Badge>;
      case 'preparing':
        return <Badge variant="warning">PREPARING</Badge>;
      case 'scheduled':
        return <Badge variant="neutral">SCHEDULED</Badge>;
      case 'pending':
        return <Badge variant="neutral">PENDING</Badge>;
      case 'failed':
      case 'cancelled':
        return <Badge variant="danger">{st.toUpperCase()}</Badge>;
      default:
        return <Badge variant="neutral">{String(st).toUpperCase()}</Badge>;
    }
  };

  const handleAdvanceStatus = (d: DeliveryRecord, nextSt: DeliveryStatus) => {
    const res = updateDeliveryStatus(
      d.id,
      nextSt,
      `Delivery transitioned to ${nextSt.replace('_', ' ').toUpperCase()}`,
      'Operations Officer'
    );
    if (res.success) {
      showToast('Delivery Updated', `${d.deliveryNumber} status changed to ${nextSt.replace('_', ' ').toUpperCase()}.`, 'success');
    }
  };

  // Columns for Deliveries Table
  const deliveryColumns: Column<DeliveryRecord>[] = [
    {
      key: 'deliveryNumber',
      header: 'DELIVERY #',
      width: '130px',
      render: (d) => (
        <span className="font-mono font-bold text-[#167a53] dark:text-[#34d399]">
          {d.deliveryNumber}
        </span>
      ),
    },
    {
      key: 'salesOrderNumber',
      header: 'SALES ORDER',
      width: '130px',
      render: (d) => <span className="font-mono font-medium text-slate-800 dark:text-neutral-200">{d.salesOrderNumber}</span>,
    },
    {
      key: 'customerName',
      header: 'CUSTOMER & CONTACT',
      render: (d) => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-neutral-100">{d.customerName}</p>
          {d.customerPhone && <p className="text-[11px] text-slate-400 font-mono">{d.customerPhone}</p>}
        </div>
      ),
    },
    {
      key: 'deliveryAddress',
      header: 'DELIVERY ADDRESS',
      render: (d) => <span className="text-xs text-slate-600 dark:text-neutral-400 truncate max-w-xs">{d.deliveryAddress}</span>,
    },
    {
      key: 'assignedStaff',
      header: 'DRIVER & VEHICLE',
      render: (d) => (
        <div>
          <p className="font-semibold text-slate-800 dark:text-neutral-200">{d.assignedStaff}</p>
          {d.vehicleDetails && <p className="text-[10px] text-slate-400 font-mono">{d.vehicleDetails}</p>}
        </div>
      ),
    },
    {
      key: 'scheduledDate',
      header: 'SCHEDULED DATE',
      width: '120px',
      render: (d) => formatDateOnly(d.scheduledDate),
    },
    {
      key: 'status',
      header: 'STATUS',
      align: 'center',
      render: (d) => getStatusBadge(d.status),
    },
    {
      key: 'id',
      header: 'ACTIONS',
      align: 'right',
      render: (d) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeliveryToPrint(d)}
            leftIcon={<Printer className="w-3.5 h-3.5" />}
            title="Print Delivery Note"
          >
            Print
          </Button>

          {d.status === 'pending' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAdvanceStatus(d, 'scheduled')}
            >
              Schedule
            </Button>
          )}

          {d.status === 'scheduled' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAdvanceStatus(d, 'preparing')}
            >
              Prepare
            </Button>
          )}

          {d.status === 'preparing' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAdvanceStatus(d, 'dispatched')}
            >
              Dispatch
            </Button>
          )}

          {d.status === 'dispatched' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAdvanceStatus(d, 'in_transit')}
            >
              In Transit
            </Button>
          )}

          {d.status === 'in_transit' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setDeliveryToConfirmPOD(d)}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Confirm POD
            </Button>
          )}

          {d.status === 'delivered' && (
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" /> POD Signed
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title & Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-neutral-400 uppercase">
            OPERATIONS & LOGISTICS
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-neutral-100 mt-1">
            Delivery Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
            Sales order dispatching, driver scheduling, transit tracking, and proof-of-delivery (POD) confirmation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSelectedSalesOrderIdForCreate(undefined);
              setIsCreateModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Delivery Note
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-neutral-800 space-x-6 text-xs font-semibold overflow-x-auto pb-px">
        {[
          { id: 'active', label: `Active Deliveries (${activeDeliveries.length})` },
          { id: 'completed', label: `Completed & History (${completedDeliveries.length})` },
          { id: 'queue', label: `Unfulfilled Orders Queue (${unfulfilledOrders.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id as any);
              setSearchQuery('');
              setStatusFilter('all');
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

      {/* Search & Filter Bar */}
      {activeTab !== 'queue' && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search delivery #, order #, customer, driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-slate-700 dark:text-neutral-300 focus:outline-none"
            >
              <option value="all">All Delivery Statuses</option>
              <option value="pending">Pending</option>
              <option value="scheduled">Scheduled</option>
              <option value="preparing">Preparing</option>
              <option value="dispatched">Dispatched</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      )}

      {/* Table: Active or Completed Deliveries */}
      {(activeTab === 'active' || activeTab === 'completed') && (
        <Table
          columns={deliveryColumns}
          data={filteredDeliveries}
          keyExtractor={(row) => row.id}
          emptyState={
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 flex items-center justify-center mb-3">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                {activeTab === 'active' ? 'No active deliveries currently scheduled' : 'No completed deliveries in history'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mt-1 leading-relaxed">
                Create a delivery note from confirmed sales orders to assign drivers, schedule transit, and record recipient signature proof of delivery.
              </p>
              <div className="mt-4">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSelectedSalesOrderIdForCreate(undefined);
                    setIsCreateModalOpen(true);
                  }}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Create Delivery Note
                </Button>
              </div>
            </div>
          }
        />
      )}

      {/* Unfulfilled Sales Orders Queue */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-800 text-xs">
            <h3 className="font-bold text-slate-900 dark:text-neutral-100">
              Orders Awaiting Dispatch & Delivery
            </h3>
            <p className="text-slate-500 dark:text-neutral-400">
              Confirmed sales orders requiring driver dispatch. Click "Dispatch Order" to generate a delivery note with full line-item outstanding checks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {unfulfilledOrders.length > 0 ? (
              unfulfilledOrders.map((o) => (
                <div
                  key={o.id}
                  className="p-4 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-[#167a53] dark:text-[#34d399]">
                      {o.orderNumber}
                    </span>
                    <Badge variant="info">{o.status.toUpperCase()}</Badge>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-neutral-100">{o.customerName}</p>
                    <p className="text-xs text-slate-500">
                      Requested Delivery: {formatDateOnly(o.deliveryDate)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-neutral-800">
                    <span className="text-xs text-slate-600 dark:text-neutral-400">
                      {o.items.length} SKUs in Order
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setSelectedSalesOrderIdForCreate(o.id);
                        setIsCreateModalOpen(true);
                      }}
                      leftIcon={<Truck className="w-3.5 h-3.5" />}
                    >
                      Dispatch Order
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 py-8 text-center text-xs text-slate-500 italic">
                All sales orders are currently dispatched or completed.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateDeliveryModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedSalesOrderIdForCreate(undefined);
        }}
        initialSalesOrderId={selectedSalesOrderIdForCreate}
      />

      <ConfirmDeliveryPODModal
        isOpen={Boolean(deliveryToConfirmPOD)}
        onClose={() => setDeliveryToConfirmPOD(null)}
        delivery={deliveryToConfirmPOD}
      />

      {selectedDeliveryToPrint(deliveryToPrint, companySettings, () => setDeliveryToPrint(null))}
    </div>
  );
};

function selectedDeliveryToPrint(
  d: DeliveryRecord | null,
  settings?: CompanySettings,
  onClose?: () => void
) {
  if (!d || !onClose) return null;
  return (
    <PrintableDeliveryNoteModal
      isOpen={Boolean(d)}
      onClose={onClose}
      delivery={d}
      settings={
        settings || {
          companyName: 'Zaid Trading',
          legalName: 'Zaid Trading Wholesale (Pvt) Ltd',
          registrationNumber: 'PV-101088924',
          taxNumber: '101088924-7000',
          email: 'zaidtrading.info@gmail.com',
          phone: '+94 11 234 5678',
          address: 'No. 45, Old Moor Street, Colombo 12',
          city: 'Colombo',
          country: 'Sri Lanka',
          defaultCurrency: 'LKR',
          currencySymbol: 'Rs.',
          currencyPrecision: 2,
          multicurrencyEnabled: true,
          defaultTaxRate: 15,
          taxInclusivePricing: false,
          financialYearStartMonth: 1,
          dateFormat: 'YYYY-MM-DD',
          timeZone: 'Asia/Colombo',
          invoicePrefix: 'INV-',
          quotationPrefix: 'QT-',
          purchaseOrderPrefix: 'PO-',
          deliveryNotePrefix: 'DN-',
          defaultWarehouse: 'Colombo Central Distribution Hub',
          negativeStockAllowed: false,
          themePreference: 'light',
        }
      }
    />
  );
}
