import React, { useState } from 'react';
import {
  Plus,
  Search,
  Download,
  ShoppingCart,
  PackageCheck,
  RotateCcw,
  Receipt,
  FileCheck2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Table, Column } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import {
  useTransactions,
  PurchaseRecord,
} from '../context/TransactionContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDateOnly } from '../utils/formatters';
import { GoodsReceivedNoteRecord, SupplierReturnRecord, DebitNoteRecord } from '../types';
import { NewGRNModal } from '../components/modals/NewGRNModal';
import { SupplierReturnModal } from '../components/modals/SupplierReturnModal';

interface PurchasingPageProps {
  onOpenNewPurchase: () => void;
  currencySymbol?: string;
}

export const PurchasingPage: React.FC<PurchasingPageProps> = ({
  onOpenNewPurchase,
  currencySymbol = 'Rs.',
}) => {
  const { showToast } = useToast();
  const { purchases, grns, supplierReturns, debitNotes } = useTransactions();

  const [activeTab, setActiveTab] = useState<'po' | 'grn' | 'bills' | 'returns'>('po');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewGRNOpen, setIsNewGRNOpen] = useState(false);
  const [isSupplierReturnOpen, setIsSupplierReturnOpen] = useState(false);

  // 1. Purchase Orders Filter
  const filteredPurchases = purchases.filter(
    (p) =>
      p.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 2. GRNs Filter
  const filteredGRNs = grns.filter(
    (g) =>
      g.grnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.warehouse.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 3. Supplier Returns Filter
  const filteredReturns = supplierReturns.filter(
    (r) =>
      r.returnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.poNumber && r.poNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Columns for Purchase Orders
  const poColumns: Column<PurchaseRecord>[] = [
    { key: 'poNumber', header: 'PO NUMBER', width: '130px' },
    { key: 'date', header: 'DATE', width: '120px' },
    { key: 'supplierName', header: 'SUPPLIER ENTITY' },
    {
      key: 'warehouse',
      header: 'RECEIVING DESTINATION',
      render: (r) => (
        <span>
          {r.warehouse === 'central_hub'
            ? 'Colombo Central Distribution Hub'
            : r.warehouse}
        </span>
      ),
    },
    {
      key: 'totalCost',
      header: 'ESTIMATED VALUE',
      align: 'right',
      render: (r) => (
        <span className="font-mono font-bold text-slate-900 dark:text-neutral-100">
          {formatCurrency(r.totalCost, currencySymbol)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'RECEIPT STATUS',
      align: 'center',
      render: (r) => (
        <Badge variant={r.status === 'received' ? 'success' : 'info'} dot>
          {r.status.toUpperCase()}
        </Badge>
      ),
    },
  ];

  // Columns for GRN
  const grnColumns: Column<GoodsReceivedNoteRecord>[] = [
    {
      key: 'grnNumber',
      header: 'GRN NUMBER',
      width: '130px',
      render: (g) => <span className="font-mono font-bold text-[#167a53]">{g.grnNumber}</span>,
    },
    {
      key: 'date',
      header: 'RECEIPT DATE',
      width: '110px',
      render: (g) => formatDateOnly(g.date),
    },
    {
      key: 'poNumber',
      header: 'PO REF',
      width: '120px',
      render: (g) => <span className="font-mono text-xs">{g.poNumber}</span>,
    },
    { key: 'supplierName', header: 'SUPPLIER ENTITY' },
    { key: 'warehouse', header: 'DESTINATION WAREHOUSE' },
    {
      key: 'items',
      header: 'ACCEPTED / DAMAGED',
      align: 'center',
      render: (g) => {
        const accepted = g.items.reduce((s, i) => s + i.acceptedQty, 0);
        const damaged = g.items.reduce((s, i) => s + i.damagedQty, 0);
        return (
          <div className="font-mono text-xs">
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">{accepted} Accepted</span>
            {damaged > 0 && <span className="text-rose-600 ml-1.5 font-bold">({damaged} Damaged)</span>}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'STATUS',
      align: 'center',
      render: (g) => (
        <Badge variant={g.status === 'received' ? 'success' : 'warning'} dot>
          {g.status.toUpperCase()}
        </Badge>
      ),
    },
  ];

  // Columns for Supplier Returns
  const supplierReturnColumns: Column<SupplierReturnRecord>[] = [
    {
      key: 'returnNumber',
      header: 'RETURN #',
      width: '120px',
      render: (r) => <span className="font-mono font-bold">{r.returnNumber}</span>,
    },
    { key: 'date', header: 'DATE', width: '110px' },
    {
      key: 'poNumber',
      header: 'PO / GRN REF',
      width: '120px',
      render: (r) => <span className="font-mono text-xs">{r.poNumber || 'Direct'}</span>,
    },
    { key: 'supplierName', header: 'VENDOR' },
    {
      key: 'totalAmount',
      header: 'DEBIT VALUE',
      align: 'right',
      render: (r) => (
        <span className="font-mono font-bold text-slate-900 dark:text-neutral-100">
          {formatCurrency(r.totalAmount, currencySymbol)}
        </span>
      ),
    },
    {
      key: 'debitNoteNumber',
      header: 'DEBIT NOTE #',
      align: 'center',
      render: (r) => (
        <span className="font-mono font-semibold text-[#167a53] bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded text-xs">
          {r.debitNoteNumber || 'Issued'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'DISPATCH STATUS',
      align: 'center',
      render: (r) => (
        <Badge variant="success" dot>
          {r.status.toUpperCase()}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title & Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-neutral-400 uppercase">
            OPERATIONS & PROCUREMENT
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-neutral-100 mt-1">
            Purchasing & Goods Receipts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
            Procurement orders, goods received notes (GRN), vendor bills, 3-way matching, and debit notes
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

          {activeTab === 'po' && (
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenNewPurchase}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              New Purchase Order
            </Button>
          )}

          {activeTab === 'grn' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsNewGRNOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              New Goods Receipt (GRN)
            </Button>
          )}

          {activeTab === 'returns' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsSupplierReturnOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              New Supplier Return
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-neutral-800 space-x-6 text-xs font-semibold overflow-x-auto pb-px">
        {[
          { id: 'po', label: `Purchase Orders (${purchases.length})` },
          { id: 'grn', label: `Goods Receipt Notes (${grns.length})` },
          { id: 'bills', label: 'Supplier Bills & 3-Way Match' },
          { id: 'returns', label: `Debit Notes & Returns (${supplierReturns.length})` },
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

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={
              activeTab === 'po'
                ? 'Search by PO # or supplier...'
                : activeTab === 'grn'
                ? 'Search by GRN #, PO #, or destination...'
                : activeTab === 'returns'
                ? 'Search by return # or vendor...'
                : 'Search vendor bills...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
          />
        </div>
      </div>

      {/* Tab 1: Purchase Orders */}
      {activeTab === 'po' && (
        <Table
          columns={poColumns}
          data={filteredPurchases}
          keyExtractor={(row) => row.id}
          emptyState={
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 flex items-center justify-center mb-3">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                No purchase orders issued yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mt-1 leading-relaxed">
                Issue purchase orders to suppliers for stock replenishment. Track estimated costs, warehouse destination, and receipt milestones.
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
      )}

      {/* Tab 2: Goods Received Notes (GRN) */}
      {activeTab === 'grn' && (
        <Table
          columns={grnColumns}
          data={filteredGRNs}
          keyExtractor={(row) => row.id}
          emptyState={
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 flex items-center justify-center mb-3">
                <PackageCheck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                No Goods Received Notes (GRN) logged yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mt-1 leading-relaxed">
                Log physical delivery of inbound shipments. Verify item condition, reject damaged items, and increment physical stock without prematurely creating supplier bills.
              </p>
              <div className="mt-4">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsNewGRNOpen(true)}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Post First GRN
                </Button>
              </div>
            </div>
          }
        />
      )}

      {/* Tab 3: Supplier Bills & 3-Way Match */}
      {activeTab === 'bills' && (
        <div className="p-6 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#181f1b] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#167a53] dark:text-[#34d399] flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                3-Way Matching Engine: Purchase Order → GRN → Vendor Bill
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Safeguards procurement: Accounts Payable bills are only approved for payment after reconciling against physical GRN receipts.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                STEP 1: PURCHASE ORDER
              </span>
              <p className="text-sm font-bold text-slate-800 dark:text-neutral-200">
                {purchases.length} Active Orders
              </p>
              <p className="text-xs text-slate-500 mt-1">Establishes contracted quantities and agreed unit pricing.</p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                STEP 2: PHYSICAL RECEIPT (GRN)
              </span>
              <p className="text-sm font-bold text-slate-800 dark:text-neutral-200">
                {grns.length} Verified Receipts
              </p>
              <p className="text-xs text-slate-500 mt-1">Confirms physical cargo arrival at warehouse bays before billing.</p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                STEP 3: AP BILL & DISBURSEMENT
              </span>
              <p className="text-sm font-bold text-slate-800 dark:text-neutral-200">
                Zero Discrepancies
              </p>
              <p className="text-xs text-slate-500 mt-1">Matched invoices are posted to Trade Accounts Payable (2010).</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Debit Notes & Supplier Returns */}
      {activeTab === 'returns' && (
        <div className="space-y-6">
          <Table
            columns={supplierReturnColumns}
            data={filteredReturns}
            keyExtractor={(row) => row.id}
            emptyState={
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 flex items-center justify-center mb-3">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                  No vendor returns logged
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mt-1 leading-relaxed">
                  Return damaged or rejected inventory to suppliers. Posts debit notes reducing Accounts Payable and balancing merchandise inventory assets.
                </p>
                <div className="mt-4">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsSupplierReturnOpen(true)}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Create Vendor Return
                  </Button>
                </div>
              </div>
            }
          />

          {debitNotes.length > 0 && (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#181f1b] space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-neutral-200">
                Issued Debit Notes Register ({debitNotes.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-[#151b18] text-slate-600 dark:text-neutral-400 border-b border-slate-200 dark:border-neutral-800 font-semibold">
                    <tr>
                      <th className="py-2 px-3">Debit Note #</th>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Return Ref</th>
                      <th className="py-2 px-3">Supplier Name</th>
                      <th className="py-2 px-3 text-right">Debit Amount</th>
                      <th className="py-2 px-3 text-center">GL Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/60 font-mono">
                    {debitNotes.map((dn) => (
                      <tr key={dn.id}>
                        <td className="py-2.5 px-3 font-bold text-[#167a53]">{dn.debitNoteNumber}</td>
                        <td className="py-2.5 px-3">{formatDateOnly(dn.date)}</td>
                        <td className="py-2.5 px-3">{dn.returnNumber}</td>
                        <td className="py-2.5 px-3 font-sans font-medium">{dn.supplierName}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-neutral-100">
                          {formatCurrency(dn.amount, currencySymbol)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <Badge variant="success">POSTED TO AP</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <NewGRNModal
        isOpen={isNewGRNOpen}
        onClose={() => setIsNewGRNOpen(false)}
      />

      <SupplierReturnModal
        isOpen={isSupplierReturnOpen}
        onClose={() => setIsSupplierReturnOpen(false)}
        currencySymbol={currencySymbol}
      />
    </div>
  );
};
