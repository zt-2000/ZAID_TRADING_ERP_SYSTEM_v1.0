import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Building2,
  Receipt,
  FileCheck2,
  Plus,
  Search,
  Printer,
  Download,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Clock,
  History,
  Coins,
  ChevronRight,
  X,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Table, Column } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import {
  useTransactions,
  SupplierRecord,
  PurchaseBillRecord,
  SupplierPaymentRecord,
} from '../context/TransactionContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDateOnly } from '../utils/formatters';
import { PrintablePaymentVoucherModal } from '../components/modals/PrintablePaymentVoucherModal';
import { CompanySettings } from '../types';

interface SupplierPaymentsPageProps {
  currencySymbol?: string;
}

const defaultCompanySettings: CompanySettings = {
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
};

export const SupplierPaymentsPage: React.FC<SupplierPaymentsPageProps> = ({
  currencySymbol = 'Rs.',
}) => {
  const { showToast } = useToast();
  const {
    suppliers,
    bills,
    supplierPayments,
    recordSupplierPayment,
    createPurchaseBill,
  } = useTransactions();

  const [activeTab, setActiveTab] = useState<'record' | 'history'>('record');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(() => {
    return suppliers.length > 0 ? suppliers[0].id : '';
  });

  // Payment Form state
  const [selectedBillId, setSelectedBillId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [paymentMethod, setPaymentMethod] = useState<
    'bank_transfer' | 'cash' | 'cheque' | 'online_transfer'
  >('bank_transfer');
  const [selectedAccount, setSelectedAccount] = useState<'1020' | '1010'>('1020');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isAdjustmentOverride, setIsAdjustmentOverride] = useState<boolean>(false);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Quick Bill Creation Modal state (to add vendor bills easily)
  const [isNewBillModalOpen, setIsNewBillModalOpen] = useState(false);
  const [newBillPO, setNewBillPO] = useState('');
  const [newBillAmount, setNewBillAmount] = useState('');
  const [newBillDueDate, setNewBillDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [newBillNotes, setNewBillNotes] = useState('');

  // Printable Voucher state
  const [selectedVoucherForPrint, setSelectedVoucherForPrint] = useState<SupplierPaymentRecord | null>(null);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historySupplierFilter, setHistorySupplierFilter] = useState('all');

  // Currently selected supplier
  const currentSupplier = useMemo(() => {
    return suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0] || null;
  }, [suppliers, selectedSupplierId]);

  // Bills for selected supplier
  const supplierBills = useMemo(() => {
    if (!currentSupplier) return [];
    return bills.filter((b) => b.supplierId === currentSupplier.id);
  }, [bills, currentSupplier]);

  // Unpaid/partial bills
  const outstandingBills = useMemo(() => {
    return supplierBills.filter((b) => b.remainingBalance > 0);
  }, [supplierBills]);

  // Selected Bill record
  const currentBill = useMemo(() => {
    return bills.find((b) => b.id === selectedBillId) || null;
  }, [bills, selectedBillId]);

  // Handle selecting a bill to pay
  const handleSelectBillToPay = (bill: PurchaseBillRecord) => {
    setSelectedBillId(bill.id);
    setPaymentAmount(String(bill.remainingBalance));
    setIsAdjustmentOverride(false);
    setAdjustmentReason('');
  };

  // Live overpayment detection
  const numAmount = parseFloat(paymentAmount) || 0;
  const isOverpayment = Boolean(
    currentBill && numAmount > currentBill.remainingBalance + 0.001
  );

  // Handle Form Submission
  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSupplier) {
      showToast('Validation Error', 'Please select a supplier entity.', 'error');
      return;
    }

    if (numAmount <= 0) {
      showToast('Invalid Amount', 'Payment amount must be greater than zero.', 'error');
      return;
    }

    if (!referenceNumber.trim()) {
      showToast(
        'Reference Required',
        'Please enter a Cheque #, Bank Transfer Ref, or Slip # for audit verification.',
        'error'
      );
      return;
    }

    if (isOverpayment && !isAdjustmentOverride) {
      showToast(
        'Overpayment Prevented',
        `Payment (Rs. ${numAmount.toLocaleString()}) exceeds the bill remaining balance (Rs. ${currentBill?.remainingBalance.toLocaleString()}). Check "Authorized Adjustment" to proceed.`,
        'error'
      );
      return;
    }

    setIsSubmitting(true);

    const accountName =
      selectedAccount === '1020'
        ? 'Corporate Operating Bank Account'
        : 'Central Warehouse Petty Cash Vault';

    const result = recordSupplierPayment({
      supplierId: currentSupplier.id,
      supplierName: currentSupplier.name,
      supplierCode: currentSupplier.code,
      billId: currentBill?.id,
      billNumber: currentBill?.billNumber,
      paymentDate,
      amount: numAmount,
      paymentMethod,
      accountCode: selectedAccount,
      accountName,
      referenceNumber: referenceNumber.trim(),
      notes: paymentNotes + (isAdjustmentOverride ? ` [Authorized Adjustment: ${adjustmentReason}]` : ''),
      allowOverpaymentOverride: isAdjustmentOverride,
      overrideReason: adjustmentReason,
    });

    setIsSubmitting(false);

    if (result.success && result.payment) {
      showToast(
        'Payment Recorded Successfully',
        `Voucher ${result.payment.voucherNumber} posted. Supplier payable reduced by ${formatCurrency(numAmount, currencySymbol)}.`,
        'success'
      );

      // Reset form
      setPaymentAmount('');
      setReferenceNumber('');
      setPaymentNotes('');
      setSelectedBillId('');
      setIsAdjustmentOverride(false);
      setAdjustmentReason('');

      // Open printable voucher modal immediately
      setSelectedVoucherForPrint(result.payment);
    } else {
      showToast('Payment Failed', result.error || 'Failed to record supplier payment.', 'error');
    }
  };

  // Handle Add New Bill
  const handleCreateNewBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSupplier) return;
    const amount = parseFloat(newBillAmount);
    if (!amount || amount <= 0) {
      showToast('Invalid Amount', 'Bill amount must be greater than zero.', 'error');
      return;
    }

    const res = createPurchaseBill({
      supplierId: currentSupplier.id,
      supplierName: currentSupplier.name,
      supplierCode: currentSupplier.code,
      poNumber: newBillPO || undefined,
      date: new Date().toISOString().split('T')[0],
      dueDate: newBillDueDate,
      originalAmount: amount,
      notes: newBillNotes,
    });

    if (res.success && res.bill) {
      showToast(
        'Purchase Bill Recorded',
        `Bill ${res.bill.billNumber} posted for ${currentSupplier.name} (${formatCurrency(amount, currencySymbol)}).`,
        'success'
      );
      setIsNewBillModalOpen(false);
      setNewBillAmount('');
      setNewBillPO('');
      setNewBillNotes('');
    } else {
      showToast('Error', res.error || 'Failed to create bill', 'error');
    }
  };

  // Filtered History
  const filteredPayments = useMemo(() => {
    return supplierPayments.filter((p) => {
      const matchesSearch =
        p.voucherNumber.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        p.supplierName.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        p.referenceNumber.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        (p.billNumber && p.billNumber.toLowerCase().includes(historySearchQuery.toLowerCase()));

      const matchesSupplier =
        historySupplierFilter === 'all' || p.supplierId === historySupplierFilter;

      return matchesSearch && matchesSupplier;
    });
  }, [supplierPayments, historySearchQuery, historySupplierFilter]);

  // Outstanding Bills Columns
  const billColumns: Column<PurchaseBillRecord>[] = [
    {
      key: 'billNumber',
      header: 'BILL NUMBER',
      width: '140px',
      render: (b) => (
        <span className="font-mono font-bold text-[#167a53] dark:text-[#34d399]">
          {b.billNumber}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'BILL DATE',
      width: '100px',
      render: (b) => formatDateOnly(b.date),
    },
    {
      key: 'dueDate',
      header: 'DUE DATE',
      width: '100px',
      render: (b) => {
        const isPast = new Date(b.dueDate) < new Date();
        return (
          <span className={isPast && b.remainingBalance > 0 ? 'text-rose-600 font-semibold' : ''}>
            {formatDateOnly(b.dueDate)}
          </span>
        );
      },
    },
    {
      key: 'originalAmount',
      header: 'ORIGINAL BILL',
      align: 'right',
      render: (b) => (
        <span className="font-mono text-slate-700 dark:text-neutral-300">
          {formatCurrency(b.originalAmount, currencySymbol)}
        </span>
      ),
    },
    {
      key: 'paidAmount',
      header: 'PREVIOUSLY PAID',
      align: 'right',
      render: (b) => (
        <span className="font-mono text-emerald-700 dark:text-emerald-400">
          {formatCurrency(b.paidAmount, currencySymbol)}
        </span>
      ),
    },
    {
      key: 'remainingBalance',
      header: 'REMAINING BALANCE',
      align: 'right',
      render: (b) => (
        <span className="font-mono font-bold text-slate-900 dark:text-neutral-100 text-sm">
          {formatCurrency(b.remainingBalance, currencySymbol)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'STATUS',
      align: 'center',
      render: (b) => (
        <Badge
          variant={
            b.status === 'paid'
              ? 'success'
              : b.status === 'partial'
              ? 'warning'
              : 'danger'
          }
          dot
        >
          {b.status.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'id',
      header: 'ACTION',
      align: 'center',
      render: (b) => {
        const isSelected = selectedBillId === b.id;
        return (
          <Button
            type="button"
            variant={isSelected ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => handleSelectBillToPay(b)}
            className="text-xs"
          >
            {isSelected ? 'Selected' : 'Pay Bill'}
          </Button>
        );
      },
    },
  ];

  // Payment History Columns
  const historyColumns: Column<SupplierPaymentRecord>[] = [
    {
      key: 'voucherNumber',
      header: 'VOUCHER #',
      width: '120px',
      render: (p) => (
        <span className="font-mono font-bold text-[#167a53] dark:text-[#34d399]">
          {p.voucherNumber}
        </span>
      ),
    },
    {
      key: 'paymentDate',
      header: 'PAYMENT DATE',
      width: '110px',
      render: (p) => formatDateOnly(p.paymentDate),
    },
    {
      key: 'supplierName',
      header: 'SUPPLIER ENTITY',
      render: (p) => (
        <div>
          <span className="font-semibold text-slate-900 dark:text-neutral-100">
            {p.supplierName}
          </span>
          {p.supplierCode && (
            <span className="text-[10px] font-mono text-slate-400 ml-1.5">
              ({p.supplierCode})
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'billNumber',
      header: 'BILL SETTLED',
      width: '140px',
      render: (p) => (
        <span className="font-mono text-xs text-slate-700 dark:text-neutral-300">
          {p.billNumber || 'On Account'}
        </span>
      ),
    },
    {
      key: 'paymentMethod',
      header: 'METHOD & ACCOUNT',
      render: (p) => (
        <div className="text-xs">
          <span className="capitalize font-medium text-slate-800 dark:text-neutral-200">
            {p.paymentMethod.replace('_', ' ')}
          </span>
          <span className="text-[11px] text-slate-400 block truncate">
            {p.accountCode} • {p.accountName}
          </span>
        </div>
      ),
    },
    {
      key: 'referenceNumber',
      header: 'AUDIT REFERENCE',
      render: (p) => (
        <span className="font-mono text-xs bg-slate-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-slate-700 dark:text-neutral-300">
          {p.referenceNumber}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'AMOUNT PAID',
      align: 'right',
      render: (p) => (
        <span className="font-mono font-bold text-slate-900 dark:text-neutral-100 text-sm">
          {formatCurrency(p.amount, currencySymbol)}
        </span>
      ),
    },
    {
      key: 'id',
      header: 'VOUCHER',
      align: 'center',
      render: (p) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setSelectedVoucherForPrint(p)}
          leftIcon={<Printer className="w-3.5 h-3.5" />}
        >
          Print
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-neutral-400 uppercase">
            ACCOUNTS PAYABLE & DISBURSEMENTS
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-neutral-100 mt-1">
            Supplier Payments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
            Settle vendor purchase bills, prevent duplicate disbursements, update payables in real time, and generate printable payment vouchers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsNewBillModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Vendor Bill
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => showToast('Export', 'Exporting payment records', 'info')}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-neutral-800 space-x-6 text-xs font-semibold overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('record')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'record'
              ? 'border-[#167a53] text-[#167a53] dark:text-[#34d399]'
              : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Pay Supplier Bills & Issue Voucher</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-[#167a53] text-[#167a53] dark:text-[#34d399]'
              : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Payment History & Vouchers ({supplierPayments.length})</span>
        </button>
      </div>

      {activeTab === 'record' && (
        <div className="space-y-6">
          {/* Supplier Selector & Balance Overview Cards */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-neutral-800/80 pb-4">
              <div className="w-full sm:w-96">
                <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider block mb-1.5">
                  Select Supplier to Settle
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => {
                    setSelectedSupplierId(e.target.value);
                    setSelectedBillId('');
                    setPaymentAmount('');
                  }}
                  className="w-full bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#167a53]"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}) — Balance: {formatCurrency(s.balance, currencySymbol)}
                    </option>
                  ))}
                </select>
              </div>

              {currentSupplier && (
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-neutral-400">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Terms</span>
                    <span className="font-semibold text-slate-800 dark:text-neutral-200 capitalize">
                      {currentSupplier.paymentTerms.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="h-6 w-px bg-slate-200 dark:bg-neutral-800" />
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Contact</span>
                    <span className="font-semibold text-slate-800 dark:text-neutral-200">
                      {currentSupplier.phone || 'N/A'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* KPI Cards for Selected Supplier */}
            {currentSupplier && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-800">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider block">
                    TOTAL OUTSTANDING PAYABLE
                  </span>
                  <p className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
                    {formatCurrency(currentSupplier.balance, currencySymbol)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Accounts Payable Account 2010
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-800">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider block">
                    PENDING BILLS TO SETTLE
                  </span>
                  <p className="text-2xl font-bold font-mono text-slate-900 dark:text-neutral-100 mt-1">
                    {outstandingBills.length} Bills
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Total unpaid balance: {formatCurrency(
                      outstandingBills.reduce((s, b) => s + b.remainingBalance, 0),
                      currencySymbol
                    )}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-800">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider block">
                    LAST PAYMENT DISBURSED
                  </span>
                  {(() => {
                    const lastPay = supplierPayments.find((p) => p.supplierId === currentSupplier.id);
                    if (!lastPay) {
                      return (
                        <p className="text-sm font-semibold text-slate-500 mt-2">
                          No previous payments on file
                        </p>
                      );
                    }
                    return (
                      <>
                        <p className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
                          {formatCurrency(lastPay.amount, currencySymbol)}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {lastPay.voucherNumber} • {formatDateOnly(lastPay.paymentDate)}
                        </p>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Grid Layout: Outstanding Bills Table & Payment Voucher Form */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Columns: Outstanding Purchase Bills */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#167a53]" />
                    Outstanding Purchase Bills ({outstandingBills.length})
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">
                    Select a bill to auto-populate payment amount and settle invoices precisely.
                  </p>
                </div>
                {selectedBillId && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBillId('');
                      setPaymentAmount('');
                    }}
                    className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    Clear Selected Bill
                  </button>
                )}
              </div>

              <Table
                columns={billColumns}
                data={outstandingBills}
                keyExtractor={(b) => b.id}
                emptyState={
                  <div className="py-10 text-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-800 dark:text-neutral-200">
                      All bills fully settled for this supplier
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      No unpaid purchase bills remain. You can still make on-account disbursements below.
                    </p>
                  </div>
                }
              />
            </div>

            {/* Right 5 Columns: Payment Voucher Form */}
            <div className="lg:col-span-5">
              <div className="p-6 rounded-2xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800 shadow-sm space-y-5">
                <div className="border-b border-slate-100 dark:border-neutral-800 pb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#167a53]" />
                    Record Payment Voucher
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                    Post disbursement to General Ledger & update vendor balances.
                  </p>
                </div>

                <form onSubmit={handleSavePayment} className="space-y-4 text-xs">
                  {/* Selected Bill Banner */}
                  {currentBill ? (
                    <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">
                          Allocating to Bill
                        </span>
                        <p className="text-sm font-bold text-slate-900 dark:text-neutral-100 font-mono">
                          {currentBill.billNumber}
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-neutral-400 mt-0.5">
                          Remaining Bill Balance: <strong>{formatCurrency(currentBill.remainingBalance, currencySymbol)}</strong>
                        </p>
                      </div>
                      <Badge variant="success" dot>LINKED</Badge>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 text-[11px]">
                      No specific bill selected. Payment will be posted on-account to reduce the supplier's overall Accounts Payable balance.
                    </div>
                  )}

                  {/* Payment Amount */}
                  <div>
                    <label className="font-bold text-slate-700 dark:text-neutral-300 block mb-1">
                      Payment Amount ({currencySymbol}) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="0.00"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className={`w-full bg-slate-50 dark:bg-[#151b18] border rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-2 ${
                        isOverpayment
                          ? 'border-rose-400 focus:ring-rose-500'
                          : 'border-slate-200 dark:border-neutral-700 focus:ring-[#167a53]'
                      }`}
                    />
                    {isOverpayment && (
                      <div className="mt-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300 text-[11px] space-y-2">
                        <div className="flex items-center gap-1.5 font-bold">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>Amount exceeds bill remaining balance!</span>
                        </div>
                        <p>
                          Remaining balance is {formatCurrency(currentBill?.remainingBalance || 0, currencySymbol)}. Payments exceeding balance are blocked unless authorized.
                        </p>
                        <label className="flex items-center gap-2 font-semibold pt-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isAdjustmentOverride}
                            onChange={(e) => setIsAdjustmentOverride(e.target.checked)}
                            className="rounded text-[#167a53] focus:ring-[#167a53]"
                          />
                          <span>Authorize Overpayment / Advance Adjustment</span>
                        </label>
                        {isAdjustmentOverride && (
                          <input
                            type="text"
                            required
                            placeholder="Reason for adjustment (e.g. advance deposit, agreed price variance)..."
                            value={adjustmentReason}
                            onChange={(e) => setAdjustmentReason(e.target.value)}
                            className="w-full bg-white dark:bg-[#181f1b] border border-rose-300 rounded px-2.5 py-1 text-xs text-slate-900 dark:text-neutral-100"
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Payment Date & Payment Method */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-neutral-300 block mb-1">
                        Payment Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-neutral-300 block mb-1">
                        Payment Method *
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="w-full bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
                      >
                        <option value="bank_transfer">Bank Wire / Transfer</option>
                        <option value="cheque">Cheque</option>
                        <option value="cash">Cash Vault</option>
                        <option value="online_transfer">Online Transfer</option>
                      </select>
                    </div>
                  </div>

                  {/* Bank / Cash Account */}
                  <div>
                    <label className="font-bold text-slate-700 dark:text-neutral-300 block mb-1">
                      Disbursement Account *
                    </label>
                    <select
                      value={selectedAccount}
                      onChange={(e) => setSelectedAccount(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
                    >
                      <option value="1020">
                        1020 — Corporate Operating Bank Account (Commercial Bank)
                      </option>
                      <option value="1010">
                        1010 — Central Warehouse Petty Cash Vault
                      </option>
                    </select>
                  </div>

                  {/* Reference Number (Cheque #, Bank Ref, Slip #) */}
                  <div>
                    <label className="font-bold text-slate-700 dark:text-neutral-300 block mb-1">
                      Audit Reference / Cheque # *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CHQ-98124, UTR-8812904, or SLIP-441"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Required for reconciliation and anti-duplicate audit tracking.
                    </p>
                  </div>

                  {/* Payment Notes */}
                  <div>
                    <label className="font-bold text-slate-700 dark:text-neutral-300 block mb-1">
                      Payment Notes / Memo
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Optional notes or remittance remarks..."
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={isSubmitting || (isOverpayment && !isAdjustmentOverride)}
                      className="w-full justify-center"
                      leftIcon={<CreditCard className="w-4 h-4" />}
                    >
                      {isSubmitting ? 'Posting Voucher...' : 'Save & Post Payment Voucher'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Complete Payment History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* History Search & Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by voucher #, supplier, or ref..."
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
              />
            </div>

            <div className="w-full sm:w-64">
              <select
                value={historySupplierFilter}
                onChange={(e) => setHistorySupplierFilter(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
              >
                <option value="all">All Suppliers ({supplierPayments.length} Vouchers)</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Table
            columns={historyColumns}
            data={filteredPayments}
            keyExtractor={(p) => p.id}
            emptyState={
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 flex items-center justify-center mb-3">
                  <Coins className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                  No payment vouchers posted yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mt-1 leading-relaxed">
                  Record supplier disbursements in the "Pay Supplier Bills" tab to settle Accounts Payable invoices.
                </p>
              </div>
            }
          />
        </div>
      )}

      {/* Add Vendor Bill Modal */}
      {isNewBillModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                  Add Vendor Purchase Bill
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  Record an outstanding supplier bill into Accounts Payable.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewBillModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewBill} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-neutral-300 block mb-1">
                  Supplier Entity *
                </label>
                <input
                  type="text"
                  disabled
                  value={currentSupplier ? `${currentSupplier.name} (${currentSupplier.code})` : ''}
                  className="w-full bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 dark:text-neutral-300"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-neutral-300 block mb-1">
                  Purchase Order Ref (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. PO-0504"
                  value={newBillPO}
                  onChange={(e) => setNewBillPO(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-neutral-300 block mb-1">
                  Total Bill Amount ({currencySymbol}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={newBillAmount}
                  onChange={(e) => setNewBillAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-neutral-300 block mb-1">
                  Payment Due Date *
                </label>
                <input
                  type="date"
                  required
                  value={newBillDueDate}
                  onChange={(e) => setNewBillDueDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-neutral-300 block mb-1">
                  Description / Items
                </label>
                <textarea
                  rows={2}
                  placeholder="Description of invoiced cargo or merchandise..."
                  value={newBillNotes}
                  onChange={(e) => setNewBillNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsNewBillModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Save Purchase Bill
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Voucher Modal */}
      {selectedVoucherForPrint && (
        <PrintablePaymentVoucherModal
          isOpen={Boolean(selectedVoucherForPrint)}
          onClose={() => setSelectedVoucherForPrint(null)}
          payment={selectedVoucherForPrint}
          bill={bills.find((b) => b.id === selectedVoucherForPrint.billId) || null}
          settings={defaultCompanySettings}
        />
      )}
    </div>
  );
};
