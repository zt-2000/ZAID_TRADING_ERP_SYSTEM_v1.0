import React, { useState } from 'react';
import {
  Plus,
  Search,
  Download,
  ShoppingBag,
  FileText,
  RotateCcw,
  Truck,
  ArrowRight,
  Eye,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Table, Column } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { useTransactions, SaleRecord } from '../context/TransactionContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDateOnly } from '../utils/formatters';
import {
  CompanySettings,
  QuotationRecord,
  SalesOrderRecord,
  SalesReturnRecord,
  CreditNoteRecord,
  OrderTrackingRecord,
} from '../types';
import { PrintableInvoiceModal } from '../components/modals/PrintableInvoiceModal';
import { NewQuotationModal } from '../components/modals/NewQuotationModal';
import { QuotationViewModal } from '../components/modals/QuotationViewModal';
import { NewSalesOrderModal } from '../components/modals/NewSalesOrderModal';
import { NewSalesReturnModal } from '../components/modals/NewSalesReturnModal';
import { OrderTrackingModal } from '../components/modals/OrderTrackingModal';

interface SalesPageProps {
  onOpenNewSale: () => void;
  currencySymbol?: string;
  companySettings?: CompanySettings;
}

export const SalesPage: React.FC<SalesPageProps> = ({
  onOpenNewSale,
  currencySymbol = 'Rs.',
  companySettings,
}) => {
  const { showToast } = useToast();
  const {
    sales,
    quotations,
    salesOrders,
    salesReturns,
    creditNotes,
    orderTracking,
    convertQuotationToSalesOrder,
  } = useTransactions();

  const [activeTab, setActiveTab] = useState<'invoices' | 'quotations' | 'orders' | 'returns'>('invoices');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [selectedInvoice, setSelectedInvoice] = useState<SaleRecord | null>(null);
  const [isNewQuotationOpen, setIsNewQuotationOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<QuotationRecord | null>(null);
  const [isNewSalesOrderOpen, setIsNewSalesOrderOpen] = useState(false);
  const [isNewReturnOpen, setIsNewReturnOpen] = useState(false);
  const [selectedTracking, setSelectedTracking] = useState<OrderTrackingRecord | null>(null);

  // 1. Invoices Filtering
  const filteredSales = sales.filter((s) => {
    const matchesSearch =
      s.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.customerCode && s.customerCode.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 2. Quotations Filtering
  const filteredQuotations = quotations.filter((q) => {
    const matchesSearch =
      q.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.referenceNumber && q.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 3. Sales Orders Filtering
  const filteredOrders = salesOrders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.trackingNumber && o.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 4. Returns Filtering
  const filteredReturns = salesReturns.filter((r) => {
    return (
      r.returnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleConvertQuotation = (q: QuotationRecord) => {
    const res = convertQuotationToSalesOrder(q.id);
    if (!res.success) {
      showToast('Conversion Error', res.error, 'error');
      return;
    }
    showToast(
      'Converted to Sales Order',
      `Quotation ${q.quotationNumber} successfully converted to Sales Order ${res.salesOrder?.orderNumber}. View in Sales Orders tab.`,
      'success'
    );
  };

  const handleOpenTrackingForOrder = (order: SalesOrderRecord) => {
    const trk = orderTracking.find(
      (t) => t.orderNumber === order.orderNumber || t.sourceOrderId === order.id
    );
    if (trk) {
      setSelectedTracking(trk);
    } else {
      showToast('Tracking Info', `Tracking entry initialized for ${order.orderNumber}.`, 'info');
    }
  };

  // --- Columns Definitions ---

  // Invoices Columns
  const invoiceColumns: Column<SaleRecord>[] = [
    { key: 'invoiceNumber', header: 'INVOICE #', width: '130px' },
    { key: 'date', header: 'DATE', width: '110px' },
    { key: 'dueDate', header: 'DUE DATE', width: '110px' },
    {
      key: 'customerName',
      header: 'CUSTOMER',
      render: (r) => (
        <span className="font-medium text-slate-900 dark:text-neutral-100">
          {r.customerName}
          {r.customerCode && (
            <span className="text-slate-400 font-mono text-[11px] ml-1.5">
              ({r.customerCode})
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'total',
      header: 'TOTAL',
      align: 'right',
      render: (r) => (
        <span className="font-mono text-slate-900 dark:text-neutral-100 font-semibold">
          {formatCurrency(r.total, currencySymbol)}
        </span>
      ),
    },
    {
      key: 'paid',
      header: 'PAID',
      align: 'right',
      render: (r) => (
        <span className="font-mono text-emerald-700 dark:text-emerald-400">
          {formatCurrency(r.paid, currencySymbol)}
        </span>
      ),
    },
    {
      key: 'balance',
      header: 'OUTSTANDING',
      align: 'right',
      render: (r) => (
        <span className="font-mono font-bold text-slate-900 dark:text-neutral-100">
          {formatCurrency(r.balance, currencySymbol)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'STATUS',
      align: 'center',
      render: (r) => {
        const variant =
          r.status === 'paid' ? 'success' : r.status === 'posted' ? 'info' : 'warning';
        return (
          <Badge variant={variant} dot>
            {r.status.toUpperCase()}
          </Badge>
        );
      },
    },
    {
      key: 'id',
      header: 'ACTION',
      align: 'right',
      render: (r) => (
        <Button variant="outline" size="sm" onClick={() => setSelectedInvoice(r)}>
          View / Print
        </Button>
      ),
    },
  ];

  // Quotations Columns
  const quotationColumns: Column<QuotationRecord>[] = [
    {
      key: 'quotationNumber',
      header: 'QUOTATION #',
      width: '130px',
      render: (q) => (
        <span className="font-mono font-semibold text-slate-900 dark:text-neutral-100">
          {q.quotationNumber}
        </span>
      ),
    },
    { key: 'date', header: 'DATE', width: '110px' },
    { key: 'expiryDate', header: 'VALID UNTIL', width: '110px' },
    {
      key: 'customerName',
      header: 'CUSTOMER',
      render: (q) => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-neutral-100">{q.customerName}</p>
          {q.referenceNumber && (
            <span className="text-[11px] text-slate-400">Ref: {q.referenceNumber}</span>
          )}
        </div>
      ),
    },
    {
      key: 'total',
      header: 'TOTAL VALUE',
      align: 'right',
      render: (q) => (
        <span className="font-mono font-bold text-slate-900 dark:text-neutral-100">
          {formatCurrency(q.total, currencySymbol)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'STATUS',
      align: 'center',
      render: (q) => {
        const variant =
          q.status === 'converted'
            ? 'success'
            : q.status === 'accepted'
            ? 'success'
            : q.status === 'sent'
            ? 'info'
            : q.status === 'rejected'
            ? 'danger'
            : 'warning';
        return (
          <Badge variant={variant} dot>
            {q.status.toUpperCase()}
          </Badge>
        );
      },
    },
    {
      key: 'id',
      header: 'ACTIONS',
      align: 'right',
      render: (q) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedQuotation(q)}
            leftIcon={<Eye className="w-3.5 h-3.5" />}
          >
            View
          </Button>
          {q.status !== 'converted' ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleConvertQuotation(q)}
              leftIcon={<ArrowRight className="w-3.5 h-3.5" />}
              title="Convert to Sales Order"
            >
              Convert to SO
            </Button>
          ) : (
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded">
              {q.convertedSalesOrderNumber}
            </span>
          )}
        </div>
      ),
    },
  ];

  // Sales Orders Columns
  const salesOrderColumns: Column<SalesOrderRecord>[] = [
    {
      key: 'orderNumber',
      header: 'ORDER #',
      width: '130px',
      render: (o) => (
        <span className="font-mono font-bold text-slate-900 dark:text-neutral-100">
          {o.orderNumber}
        </span>
      ),
    },
    { key: 'date', header: 'BOOKED', width: '105px' },
    { key: 'deliveryDate', header: 'EXP. DELIVERY', width: '115px' },
    {
      key: 'customerName',
      header: 'CUSTOMER',
      render: (o) => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-neutral-100">{o.customerName}</p>
          {o.sourceQuotationNumber && (
            <span className="text-[11px] text-slate-400">From Quote: {o.sourceQuotationNumber}</span>
          )}
        </div>
      ),
    },
    {
      key: 'total',
      header: 'TOTAL VALUE',
      align: 'right',
      render: (o) => (
        <span className="font-mono font-bold text-slate-900 dark:text-neutral-100">
          {formatCurrency(o.total, currencySymbol)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'LIFECYCLE STATUS',
      align: 'center',
      render: (o) => {
        let variant: 'success' | 'info' | 'warning' | 'danger' | 'neutral' = 'neutral';
        if (o.status === 'completed') variant = 'success';
        else if (o.status === 'dispatched' || o.status === 'ready') variant = 'info';
        else if (o.status === 'processing') variant = 'warning';
        else if (o.status === 'cancelled' || o.status === 'on_hold') variant = 'danger';

        return (
          <Badge variant={variant} dot>
            {o.status.replace('_', ' ').toUpperCase()}
          </Badge>
        );
      },
    },
    {
      key: 'id',
      header: 'TRACKING & ACTIONS',
      align: 'right',
      render: (o) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleOpenTrackingForOrder(o)}
          leftIcon={<Truck className="w-3.5 h-3.5 text-[#167a53]" />}
        >
          Track ({o.trackingNumber || 'Live'})
        </Button>
      ),
    },
  ];

  // Sales Returns Columns
  const returnColumns: Column<SalesReturnRecord>[] = [
    {
      key: 'returnNumber',
      header: 'RETURN #',
      width: '120px',
      render: (r) => <span className="font-mono font-bold">{r.returnNumber}</span>,
    },
    { key: 'date', header: 'DATE', width: '105px' },
    { key: 'invoiceNumber', header: 'INVOICE REF', width: '130px' },
    { key: 'customerName', header: 'CUSTOMER' },
    {
      key: 'restockDecision',
      header: 'RESTOCK STATUS',
      render: (r) => (
        <Badge
          variant={
            r.restockDecision === 'restocked'
              ? 'success'
              : r.restockDecision === 'pending_inspection'
              ? 'warning'
              : 'danger'
          }
        >
          {r.restockDecision.replace('_', ' ').toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'totalReturnAmount',
      header: 'CREDIT AMOUNT',
      align: 'right',
      render: (r) => (
        <span className="font-mono font-bold text-slate-900 dark:text-neutral-100">
          {formatCurrency(r.totalReturnAmount, currencySymbol)}
        </span>
      ),
    },
    {
      key: 'creditNoteNumber',
      header: 'CREDIT NOTE #',
      align: 'center',
      render: (r) => (
        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded text-xs">
          {r.creditNoteNumber || 'Issued'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title & Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-neutral-400 uppercase">
            OPERATIONS & REVENUE
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-neutral-100 mt-1">
            Sales & Invoicing
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
            Sales invoices, quotations, sales orders, customer returns, and credit notes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => showToast('Export', 'Exporting sales records to CSV', 'info')}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>

          {activeTab === 'invoices' && (
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenNewSale}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              New Sale Invoice
            </Button>
          )}

          {activeTab === 'quotations' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsNewQuotationOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Quotation
            </Button>
          )}

          {activeTab === 'orders' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsNewSalesOrderOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Sales Order
            </Button>
          )}

          {activeTab === 'returns' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsNewReturnOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              New Return & Credit Note
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-neutral-800 space-x-6 text-xs font-semibold overflow-x-auto pb-px">
        {[
          { id: 'invoices', label: `Sales Invoices (${sales.length})` },
          { id: 'quotations', label: `Quotations / Proformas (${quotations.length})` },
          { id: 'orders', label: `Sales Orders (${salesOrders.length})` },
          { id: 'returns', label: `Returns & Credit Notes (${salesReturns.length})` },
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={
              activeTab === 'invoices'
                ? 'Search invoice # or customer...'
                : activeTab === 'quotations'
                ? 'Search quotation # or client...'
                : activeTab === 'orders'
                ? 'Search order # or tracking #...'
                : 'Search return #, invoice # or customer...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
          />
        </div>

        {activeTab !== 'returns' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-slate-700 dark:text-neutral-300 focus:outline-none"
            >
              <option value="all">All Document Statuses</option>
              {activeTab === 'invoices' && (
                <>
                  <option value="draft">Drafts Only</option>
                  <option value="posted">Posted & Unpaid</option>
                  <option value="paid">Fully Settled</option>
                </>
              )}
              {activeTab === 'quotations' && (
                <>
                  <option value="draft">Drafts</option>
                  <option value="sent">Sent to Customer</option>
                  <option value="converted">Converted to SO</option>
                  <option value="rejected">Rejected / Cancelled</option>
                </>
              )}
              {activeTab === 'orders' && (
                <>
                  <option value="new">New</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="ready">Ready for Dispatch</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="completed">Completed</option>
                </>
              )}
            </select>
          </div>
        )}
      </div>

      {/* Tab 1: Sales Invoices */}
      {activeTab === 'invoices' && (
        <Table
          columns={invoiceColumns}
          data={filteredSales}
          keyExtractor={(row) => row.id}
          emptyState={
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 flex items-center justify-center mb-3">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                No sales invoices posted yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mt-1 leading-relaxed">
                When sales invoices are posted, customer receivables, double-entry GL postings, and printable documents are managed here.
              </p>
              <div className="mt-4">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onOpenNewSale}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Create First Sale Invoice
                </Button>
              </div>
            </div>
          }
        />
      )}

      {/* Tab 2: Quotations / Proformas */}
      {activeTab === 'quotations' && (
        <Table
          columns={quotationColumns}
          data={filteredQuotations}
          keyExtractor={(row) => row.id}
          emptyState={
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 flex items-center justify-center mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                No quotations generated yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mt-1 leading-relaxed">
                Issue formal price proformas with line-item discounts and taxes. Convert accepted quotations directly into sales orders without duplicate data entry.
              </p>
              <div className="mt-4">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsNewQuotationOpen(true)}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Create First Quotation
                </Button>
              </div>
            </div>
          }
        />
      )}

      {/* Tab 3: Sales Orders */}
      {activeTab === 'orders' && (
        <Table
          columns={salesOrderColumns}
          data={filteredOrders}
          keyExtractor={(row) => row.id}
          emptyState={
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 flex items-center justify-center mb-3">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                No sales orders currently in queue
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mt-1 leading-relaxed">
                Orders created from quotations or booked directly appear here. Track pick, pack, dispatch, and final fulfillment progress.
              </p>
              <div className="mt-4">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsNewSalesOrderOpen(true)}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Create Sales Order
                </Button>
              </div>
            </div>
          }
        />
      )}

      {/* Tab 4: Returns & Credit Notes */}
      {activeTab === 'returns' && (
        <div className="space-y-6">
          <Table
            columns={returnColumns}
            data={filteredReturns}
            keyExtractor={(row) => row.id}
            emptyState={
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 flex items-center justify-center mb-3">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                  No merchandise returns recorded
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mt-1 leading-relaxed">
                  Process goods returns against original invoices. Authorized returns issue ledger credit notes against customer receivables with optional restock approval.
                </p>
                <div className="mt-4">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsNewReturnOpen(true)}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Create Sales Return
                  </Button>
                </div>
              </div>
            }
          />

          {creditNotes.length > 0 && (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#181f1b] space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-neutral-200">
                Audited Credit Notes Register ({creditNotes.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-[#151b18] text-slate-600 dark:text-neutral-400 border-b border-slate-200 dark:border-neutral-800 font-semibold">
                    <tr>
                      <th className="py-2 px-3">Credit Note #</th>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Return Ref</th>
                      <th className="py-2 px-3">Customer Entity</th>
                      <th className="py-2 px-3 text-right">Credit Amount</th>
                      <th className="py-2 px-3 text-center">GL Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/60 font-mono">
                    {creditNotes.map((cn) => (
                      <tr key={cn.id}>
                        <td className="py-2.5 px-3 font-bold text-[#167a53]">{cn.creditNoteNumber}</td>
                        <td className="py-2.5 px-3">{formatDateOnly(cn.date)}</td>
                        <td className="py-2.5 px-3">{cn.returnNumber}</td>
                        <td className="py-2.5 px-3 font-sans font-medium">{cn.customerName}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-neutral-100">
                          {formatCurrency(cn.amount, currencySymbol)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <Badge variant="success">POSTED TO AR</Badge>
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
      {selectedInvoice && (
        <PrintableInvoiceModal
          isOpen={Boolean(selectedInvoice)}
          onClose={() => setSelectedInvoice(null)}
          invoice={selectedInvoice}
          settings={
            companySettings || {
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
              currencySymbol,
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
      )}

      <NewQuotationModal
        isOpen={isNewQuotationOpen}
        onClose={() => setIsNewQuotationOpen(false)}
        currencySymbol={currencySymbol}
      />

      <QuotationViewModal
        isOpen={Boolean(selectedQuotation)}
        onClose={() => setSelectedQuotation(null)}
        quotation={selectedQuotation}
        currencySymbol={currencySymbol}
        settings={companySettings}
      />

      <NewSalesOrderModal
        isOpen={isNewSalesOrderOpen}
        onClose={() => setIsNewSalesOrderOpen(false)}
        currencySymbol={currencySymbol}
      />

      <NewSalesReturnModal
        isOpen={isNewReturnOpen}
        onClose={() => setIsNewReturnOpen(false)}
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
