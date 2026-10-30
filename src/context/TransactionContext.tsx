import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useExpenseCategories } from './ExpenseCategoryContext';
import {
  QuotationRecord,
  QuotationLineItem,
  SalesOrderRecord,
  SalesOrderLineItem,
  SalesReturnRecord,
  SalesReturnItem,
  CreditNoteRecord,
  GoodsReceivedNoteRecord,
  GRNLineItem,
  SupplierReturnRecord,
  SupplierReturnItem,
  DebitNoteRecord,
  OrderTrackingRecord,
  OrderTrackingEvent,
  WarehouseRecord,
  WarehouseBinRecord,
  DeliveryShipmentRecord,
  DeliveryRecord,
  DeliveryStatus,
  DeliveryLineItem,
  DeliveryHistoryLog,
  PurchaseBillRecord,
  SupplierPaymentRecord,
} from '../types';

export type {
  PurchaseBillRecord,
  SupplierPaymentRecord,
  QuotationRecord,
  QuotationLineItem,
  SalesOrderRecord,
  SalesOrderLineItem,
  SalesReturnRecord,
  SalesReturnItem,
  CreditNoteRecord,
  GoodsReceivedNoteRecord,
  GRNLineItem,
  SupplierReturnRecord,
  SupplierReturnItem,
  DebitNoteRecord,
  OrderTrackingRecord,
  OrderTrackingEvent,
  WarehouseRecord,
  WarehouseBinRecord,
  DeliveryShipmentRecord,
  DeliveryRecord,
  DeliveryStatus,
  DeliveryLineItem,
  DeliveryHistoryLog,
};

export interface GeneralLedgerEntry {
  id: string;
  date: string;
  voucherRef: string;
  accountCode: string;
  accountName: string;
  memo: string;
  debit: number;
  credit: number;
  runningBalance: number;
  status: 'posted' | 'reconciled';
}

export interface ExpenseRecord {
  id: string;
  voucherNo: string;
  date: string;
  description: string;
  categoryId: string;
  categoryName: string;
  paymentAccount: string;
  accountName: string;
  payee: string;
  reference?: string;
  amount: number;
  status: 'posted' | 'draft';
}

export interface SaleRecord {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  customerName: string;
  customerCode?: string;
  paymentTerms: string;
  warehouse: string;
  subtotal: number;
  applyVat?: boolean;
  vatRate?: number;
  taxTotal: number;
  total: number;
  paid: number;
  balance: number;
  status: 'posted' | 'draft' | 'paid' | 'overdue';
  itemsCount: number;
  notes?: string;
}

export interface PurchaseRecord {
  id: string;
  poNumber: string;
  date: string;
  supplierName: string;
  supplierReference?: string;
  warehouse: string;
  paymentTerms: string;
  totalCost: number;
  status: 'sent' | 'draft' | 'received' | 'closed';
  itemsCount: number;
}

export interface CustomerRecord {
  id: string;
  code: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  creditLimit: number | null;
  creditDays: number | null;
  balance: number;
  cashAccountId?: string;
  cashAccountName?: string;
  codAccountId?: string;
  codAccountName?: string;
  status: 'active' | 'archived';
  createdAt: string;
}

export interface SupplierRecord {
  id: string;
  code: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  paymentTerms: string;
  balance: number;
  status: 'active' | 'archived';
  createdAt: string;
}

export interface COAAccount {
  code: string;
  name: string;
  type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  category: string;
}

export const chartOfAccounts: COAAccount[] = [
  { code: '1010', name: 'Central Warehouse Petty Cash Vault', type: 'Asset', category: 'Cash & Cash Equivalents' },
  { code: '1015', name: 'Delivery COD Clearing Account', type: 'Asset', category: 'Cash & Cash Equivalents' },
  { code: '1020', name: 'Corporate Operating Bank Account', type: 'Asset', category: 'Cash & Cash Equivalents' },
  { code: '1050', name: 'Trade Accounts Receivable', type: 'Asset', category: 'Current Assets' },
  { code: '1100', name: 'Merchandise Inventory Asset', type: 'Asset', category: 'Inventory' },
  { code: '2010', name: 'Trade Accounts Payable', type: 'Liability', category: 'Current Liabilities' },
  { code: '2050', name: 'Output VAT / Tax Payable', type: 'Liability', category: 'Taxes Payable' },
  { code: '3010', name: 'Owners Contributed Capital', type: 'Equity', category: 'Equity' },
  { code: '4010', name: 'Wholesale Merchandise Sales', type: 'Revenue', category: 'Operating Revenue' },
  { code: '4020', name: 'Sales Returns & Allowances', type: 'Revenue', category: 'Contra Revenue' },
  { code: '5010', name: 'Cost of Goods Sold (COGS)', type: 'Expense', category: 'Direct Cost' },
  { code: '6010', name: 'Logistics & Operating Expenses', type: 'Expense', category: 'Operating Expenses' },
];

export const defaultWarehouses: WarehouseRecord[] = [
  {
    id: 'wh_col_central',
    code: 'WH-COL-01',
    name: 'Colombo Central Distribution Hub',
    type: 'central',
    address: 'No. 45, Old Moor Street, Colombo 12',
    city: 'Colombo',
    isDefault: true,
    status: 'active',
    totalCapacityBays: 50,
    managerName: 'Rashid Al-Zaid',
    createdAt: '2026-10-01',
  },
  {
    id: 'wh_dmm_depot',
    code: 'WH-DMM-02',
    name: 'Dammam Port Free Zone Depot',
    type: 'depot',
    address: 'Depot Road, Industrial Area 2',
    city: 'Dammam',
    isDefault: false,
    status: 'active',
    totalCapacityBays: 30,
    managerName: 'Kamil Perera',
    createdAt: '2026-10-01',
  },
];

export const defaultBins: WarehouseBinRecord[] = [
  {
    id: 'bin_a_01_01',
    warehouseId: 'wh_col_central',
    warehouseName: 'Colombo Central Distribution Hub',
    code: 'A-01-01',
    name: 'Bay A1 High-Rack Tier 1',
    aisle: 'A',
    rack: '01',
    shelf: '01',
    type: 'pallet',
    maxWeightKg: 1200,
    status: 'active',
    currentSKUsCount: 0,
    createdAt: '2026-10-01',
  },
  {
    id: 'bin_a_01_02',
    warehouseId: 'wh_col_central',
    warehouseName: 'Colombo Central Distribution Hub',
    code: 'A-01-02',
    name: 'Bay A1 High-Rack Tier 2',
    aisle: 'A',
    rack: '01',
    shelf: '02',
    type: 'pallet',
    maxWeightKg: 1000,
    status: 'active',
    currentSKUsCount: 0,
    createdAt: '2026-10-01',
  },
  {
    id: 'bin_b_02_01',
    warehouseId: 'wh_col_central',
    warehouseName: 'Colombo Central Distribution Hub',
    code: 'B-02-01',
    name: 'Aisle B Bulk Dry Grains Bay',
    aisle: 'B',
    rack: '02',
    shelf: '01',
    type: 'bulk',
    maxWeightKg: 2500,
    status: 'active',
    currentSKUsCount: 0,
    createdAt: '2026-10-01',
  },
  {
    id: 'bin_c_cold_01',
    warehouseId: 'wh_col_central',
    warehouseName: 'Colombo Central Distribution Hub',
    code: 'C-01-01',
    name: 'Cold Chamber 1 Dairy Rack',
    aisle: 'C',
    rack: '01',
    shelf: '01',
    type: 'cold_storage',
    maxWeightKg: 1500,
    status: 'active',
    currentSKUsCount: 0,
    createdAt: '2026-10-01',
  },
];

interface TransactionContextType {
  expenses: ExpenseRecord[];
  sales: SaleRecord[];
  purchases: PurchaseRecord[];
  bills: PurchaseBillRecord[];
  supplierPayments: SupplierPaymentRecord[];
  customers: CustomerRecord[];
  suppliers: SupplierRecord[];
  glEntries: GeneralLedgerEntry[];
  quotations: QuotationRecord[];
  salesOrders: SalesOrderRecord[];
  salesReturns: SalesReturnRecord[];
  creditNotes: CreditNoteRecord[];
  grns: GoodsReceivedNoteRecord[];
  supplierReturns: SupplierReturnRecord[];
  debitNotes: DebitNoteRecord[];
  orderTracking: OrderTrackingRecord[];
  warehouses: WarehouseRecord[];
  warehouseBins: WarehouseBinRecord[];
  shipments: DeliveryShipmentRecord[];
  deliveries: DeliveryRecord[];

  // Supplier Payments & Bills Management
  recordSupplierPayment: (data: {
    supplierId: string;
    supplierName: string;
    supplierCode?: string;
    billId?: string;
    billNumber?: string;
    paymentDate: string;
    amount: number;
    paymentMethod: 'bank_transfer' | 'cash' | 'cheque' | 'online_transfer';
    accountCode: string;
    accountName: string;
    referenceNumber: string;
    notes?: string;
    allowOverpaymentOverride?: boolean;
    overrideReason?: string;
  }) => { success: boolean; payment?: SupplierPaymentRecord; error?: string };

  createPurchaseBill: (data: {
    supplierId: string;
    supplierName: string;
    supplierCode?: string;
    poNumber?: string;
    date: string;
    dueDate: string;
    originalAmount: number;
    notes?: string;
  }) => { success: boolean; bill?: PurchaseBillRecord; error?: string };

  // Delivery Management
  createDeliveryFromSalesOrder: (data: {
    salesOrderId: string;
    salesOrderNumber: string;
    customerId: string;
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    scheduledDate: string;
    assignedStaff: string;
    vehicleDetails?: string;
    items: {
      id?: string;
      itemDescription: string;
      orderedQty: number;
      previouslyDeliveredQty: number;
      deliveredQty: number;
      unitPrice: number;
    }[];
    notes?: string;
  }) => { success: boolean; delivery?: DeliveryRecord; error?: string };

  updateDeliveryStatus: (
    deliveryId: string,
    newStatus: DeliveryStatus,
    note?: string,
    updatedBy?: string
  ) => { success: boolean; delivery?: DeliveryRecord; error?: string };

  confirmDeliveryPOD: (
    deliveryId: string,
    recipientName: string,
    proofOfDeliveryRef?: string,
    actualDeliveryDate?: string,
    note?: string
  ) => { success: boolean; delivery?: DeliveryRecord; error?: string };

  // Mutators
  recordExpense: (data: {
    description: string;
    amount: number;
    categoryId: string;
    categoryName: string;
    paymentAccount: string;
    payee?: string;
    reference?: string;
  }) => { success: boolean; record?: ExpenseRecord };

  recordSale: (data: {
    customerName: string;
    customerCode?: string;
    paymentTerms: string;
    warehouse: string;
    subtotal: number;
    applyVat?: boolean;
    vatRate?: number;
    taxTotal: number;
    total: number;
    itemsCount: number;
    notes?: string;
  }) => { success: boolean; record?: SaleRecord };

  recordPurchase: (data: {
    supplierName: string;
    supplierReference?: string;
    warehouse: string;
    paymentTerms: string;
    totalCost: number;
    itemsCount: number;
  }) => { success: boolean; record?: PurchaseRecord };

  addCustomer: (data: Omit<CustomerRecord, 'id' | 'balance' | 'createdAt'>) => {
    success: boolean;
    customer?: CustomerRecord;
    error?: string;
  };

  addSupplier: (data: Omit<SupplierRecord, 'id' | 'balance' | 'createdAt'>) => {
    success: boolean;
    supplier?: SupplierRecord;
    error?: string;
  };

  recordJournalEntry: (data: {
    date: string;
    voucherRef: string;
    memo: string;
    entries: {
      accountCode: string;
      accountName: string;
      debit: number;
      credit: number;
    }[];
  }) => { success: boolean; error?: string };

  // Quotation Management
  recordQuotation: (data: {
    date: string;
    expiryDate: string;
    customerId: string;
    customerName: string;
    customerCode?: string;
    referenceNumber?: string;
    warehouse: string;
    items: QuotationLineItem[];
    subtotal: number;
    discountTotal: number;
    applyVat?: boolean;
    vatRate?: number;
    taxTotal: number;
    total: number;
    notes?: string;
    status?: QuotationRecord['status'];
  }) => { success: boolean; quotation?: QuotationRecord };

  updateQuotation: (
    id: string,
    updates: Partial<QuotationRecord>
  ) => { success: boolean; quotation?: QuotationRecord; error?: string };

  convertQuotationToSalesOrder: (
    quotationId: string
  ) => { success: boolean; salesOrder?: SalesOrderRecord; error?: string };

  // Sales Order Management
  recordSalesOrder: (data: {
    date: string;
    deliveryDate: string;
    customerId: string;
    customerName: string;
    customerCode?: string;
    warehouse: string;
    items: SalesOrderLineItem[];
    subtotal: number;
    discountTotal: number;
    applyVat?: boolean;
    vatRate?: number;
    taxTotal: number;
    total: number;
    notes?: string;
    sourceQuotationId?: string;
    sourceQuotationNumber?: string;
  }) => { success: boolean; salesOrder?: SalesOrderRecord };

  updateSalesOrderStatus: (
    orderId: string,
    newStatus: SalesOrderRecord['status'],
    note?: string,
    updatedBy?: string
  ) => { success: boolean; error?: string };

  // Sales Returns & Credit Notes
  recordSalesReturn: (data: {
    invoiceId: string;
    invoiceNumber: string;
    customerId: string;
    customerName: string;
    reason: string;
    items: SalesReturnItem[];
    restockDecision: 'restocked' | 'damaged_discarded' | 'pending_inspection';
    notes?: string;
  }) => { success: boolean; returnRecord?: SalesReturnRecord; creditNote?: CreditNoteRecord };

  // Goods Receipt Notes (GRN)
  recordGRN: (data: {
    purchaseOrderId: string;
    poNumber: string;
    supplierName: string;
    warehouse: string;
    items: GRNLineItem[];
    notes?: string;
    receivedBy: string;
  }) => { success: boolean; grn?: GoodsReceivedNoteRecord };

  // Supplier Returns & Debit Notes
  recordSupplierReturn: (data: {
    poNumber?: string;
    supplierName: string;
    items: SupplierReturnItem[];
    reason: string;
  }) => { success: boolean; returnRecord?: SupplierReturnRecord; debitNote?: DebitNoteRecord };

  // Warehouses & Bins
  addWarehouse: (data: Omit<WarehouseRecord, 'id' | 'createdAt'>) => {
    success: boolean;
    warehouse?: WarehouseRecord;
    error?: string;
  };

  updateWarehouse: (
    id: string,
    data: Partial<WarehouseRecord>
  ) => { success: boolean; error?: string };

  addWarehouseBin: (data: Omit<WarehouseBinRecord, 'id' | 'currentSKUsCount' | 'createdAt'>) => {
    success: boolean;
    bin?: WarehouseBinRecord;
    error?: string;
  };

  updateWarehouseBin: (
    id: string,
    data: Partial<WarehouseBinRecord>
  ) => { success: boolean; error?: string };

  deleteWarehouseBin: (id: string) => { success: boolean; error?: string };

  // Shipments
  recordDeliveryShipment: (data: {
    orderNumber: string;
    customerName: string;
    deliveryAddress: string;
    driverName: string;
    vehiclePlate: string;
    scheduledDate: string;
    codAmount?: number;
    notes?: string;
  }) => { success: boolean; shipment?: DeliveryShipmentRecord };

  updateShipmentStatus: (
    id: string,
    status: DeliveryShipmentRecord['status']
  ) => { success: boolean };
}

export const defaultSuppliers: SupplierRecord[] = [];

export const defaultSupplierBills: PurchaseBillRecord[] = [];

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { incrementUsage } = useExpenseCategories();

  // Core state from storage
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => {
    const saved = localStorage.getItem('zaid_erp_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  const [sales, setSales] = useState<SaleRecord[]>(() => {
    const saved = localStorage.getItem('zaid_erp_sales');
    return saved ? JSON.parse(saved) : [];
  });

  const [purchases, setPurchases] = useState<PurchaseRecord[]>(() => {
    const saved = localStorage.getItem('zaid_erp_purchases');
    return saved ? JSON.parse(saved) : [];
  });

  const [customers, setCustomers] = useState<CustomerRecord[]>(() => {
    const saved = localStorage.getItem('zaid_erp_customers');
    return saved ? JSON.parse(saved) : [];
  });

  const [suppliers, setSuppliers] = useState<SupplierRecord[]>(() => {
    const saved = localStorage.getItem('zaid_erp_suppliers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Purge legacy demo vendors
          const clean = parsed.filter(
            (s) => !['supp_001', 'supp_002', 'supp_003'].includes(s?.id)
          );
          return clean;
        }
      } catch {
        // fallback
      }
    }
    return [];
  });

  const [bills, setBills] = useState<PurchaseBillRecord[]>(() => {
    const saved = localStorage.getItem('zaid_erp_supplier_bills');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Purge legacy demo bills
          const clean = parsed.filter(
            (b) => !['bill_1001', 'bill_1002', 'bill_1003'].includes(b?.id)
          );
          return clean;
        }
      } catch {
        // fallback
      }
    }
    return [];
  });

  const [supplierPayments, setSupplierPayments] = useState<SupplierPaymentRecord[]>(() => {
    const saved = localStorage.getItem('zaid_erp_supplier_payments');
    return saved ? JSON.parse(saved) : [];
  });

  const [glEntries, setGlEntries] = useState<GeneralLedgerEntry[]>(() => {
    const saved = localStorage.getItem('zaid_erp_gl_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  // Quotations
  const [quotations, setQuotations] = useState<QuotationRecord[]>(() => {
    const saved = localStorage.getItem('zaid_erp_quotations');
    return saved ? JSON.parse(saved) : [];
  });

  // Sales Orders
  const [salesOrders, setSalesOrders] = useState<SalesOrderRecord[]>(() => {
    const saved = localStorage.getItem('zaid_erp_sales_orders');
    return saved ? JSON.parse(saved) : [];
  });

  // Sales Returns
  const [salesReturns, setSalesReturns] = useState<SalesReturnRecord[]>(() => {
    const saved = localStorage.getItem('zaid_erp_sales_returns');
    return saved ? JSON.parse(saved) : [];
  });

  // Credit Notes
  const [creditNotes, setCreditNotes] = useState<CreditNoteRecord[]>(() => {
    const saved = localStorage.getItem('zaid_erp_credit_notes');
    return saved ? JSON.parse(saved) : [];
  });

  // Goods Received Notes (GRN)
  const [grns, setGrns] = useState<GoodsReceivedNoteRecord[]>(() => {
    const saved = localStorage.getItem('zaid_erp_grns');
    return saved ? JSON.parse(saved) : [];
  });

  // Supplier Returns
  const [supplierReturns, setSupplierReturns] = useState<SupplierReturnRecord[]>(() => {
    const saved = localStorage.getItem('zaid_erp_supplier_returns');
    return saved ? JSON.parse(saved) : [];
  });

  // Debit Notes
  const [debitNotes, setDebitNotes] = useState<DebitNoteRecord[]>(() => {
    const saved = localStorage.getItem('zaid_erp_debit_notes');
    return saved ? JSON.parse(saved) : [];
  });

  // Order Tracking
  const [orderTracking, setOrderTracking] = useState<OrderTrackingRecord[]>(() => {
    const saved = localStorage.getItem('zaid_erp_order_tracking');
    return saved ? JSON.parse(saved) : [];
  });

  // Warehouses
  const [warehouses, setWarehouses] = useState<WarehouseRecord[]>(() => {
    const saved = localStorage.getItem('zaid_erp_warehouses');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fallback
      }
    }
    return defaultWarehouses;
  });

  // Bins
  const [warehouseBins, setWarehouseBins] = useState<WarehouseBinRecord[]>(() => {
    const saved = localStorage.getItem('zaid_erp_warehouse_bins');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fallback
      }
    }
    return defaultBins;
  });

  // Deliveries & Shipments
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>(() => {
    const saved = localStorage.getItem('zaid_erp_deliveries');
    return saved ? JSON.parse(saved) : [];
  });

  const [shipments, setShipments] = useState<DeliveryShipmentRecord[]>(() => {
    const saved = localStorage.getItem('zaid_erp_shipments');
    return saved ? JSON.parse(saved) : [];
  });

  // Local storage synchronization
  useEffect(() => {
    localStorage.setItem('zaid_erp_deliveries', JSON.stringify(deliveries));
  }, [deliveries]);
  useEffect(() => {
    localStorage.setItem('zaid_erp_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('zaid_erp_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('zaid_erp_purchases', JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem('zaid_erp_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('zaid_erp_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('zaid_erp_supplier_bills', JSON.stringify(bills));
  }, [bills]);

  useEffect(() => {
    localStorage.setItem('zaid_erp_supplier_payments', JSON.stringify(supplierPayments));
  }, [supplierPayments]);

  useEffect(() => {
    localStorage.setItem('zaid_erp_gl_transactions', JSON.stringify(glEntries));
  }, [glEntries]);

  useEffect(() => {
    localStorage.setItem('zaid_erp_quotations', JSON.stringify(quotations));
  }, [quotations]);

  useEffect(() => {
    localStorage.setItem('zaid_erp_sales_orders', JSON.stringify(salesOrders));
  }, [salesOrders]);

  useEffect(() => {
    localStorage.setItem('zaid_erp_sales_returns', JSON.stringify(salesReturns));
  }, [salesReturns]);

  useEffect(() => {
    localStorage.setItem('zaid_erp_credit_notes', JSON.stringify(creditNotes));
  }, [creditNotes]);

  useEffect(() => {
    localStorage.setItem('zaid_erp_grns', JSON.stringify(grns));
  }, [grns]);

  useEffect(() => {
    localStorage.setItem('zaid_erp_supplier_returns', JSON.stringify(supplierReturns));
  }, [supplierReturns]);

  useEffect(() => {
    localStorage.setItem('zaid_erp_debit_notes', JSON.stringify(debitNotes));
  }, [debitNotes]);

  useEffect(() => {
    localStorage.setItem('zaid_erp_order_tracking', JSON.stringify(orderTracking));
  }, [orderTracking]);

  useEffect(() => {
    localStorage.setItem('zaid_erp_warehouses', JSON.stringify(warehouses));
  }, [warehouses]);

  useEffect(() => {
    localStorage.setItem('zaid_erp_warehouse_bins', JSON.stringify(warehouseBins));
  }, [warehouseBins]);

  useEffect(() => {
    localStorage.setItem('zaid_erp_shipments', JSON.stringify(shipments));
  }, [shipments]);

  // Record Expense
  const recordExpense = useCallback(
    (data: {
      description: string;
      amount: number;
      categoryId: string;
      categoryName: string;
      paymentAccount: string;
      payee?: string;
      reference?: string;
    }) => {
      const today = new Date().toISOString().split('T')[0];
      const voucherNo = `EXP-${String(expenses.length + 101).padStart(4, '0')}`;

      const accountLabels: Record<string, { code: string; name: string }> = {
        petty_cash: { code: '1010', name: 'Central Warehouse Petty Cash' },
        alrajhi_bank: { code: '1020', name: 'Corporate Operating Bank Account' },
        delivery_cod: { code: '1015', name: 'Delivery COD Clearing Account' },
        van_cash: { code: '1015', name: 'Delivery COD Clearing Account' },
      };

      const creditAccount = accountLabels[data.paymentAccount] || {
        code: '1010',
        name: 'Operating Cash',
      };

      const newExpense: ExpenseRecord = {
        id: `exp_${Date.now()}`,
        voucherNo,
        date: today,
        description: data.description,
        categoryId: data.categoryId,
        categoryName: data.categoryName,
        paymentAccount: data.paymentAccount,
        accountName: creditAccount.name,
        payee: data.payee || 'Direct Expense',
        reference: data.reference,
        amount: data.amount,
        status: 'posted',
      };

      const lastBal = glEntries[glEntries.length - 1]?.runningBalance || 0;

      const glLine1: GeneralLedgerEntry = {
        id: `gl_${Date.now()}_1`,
        date: today,
        voucherRef: voucherNo,
        accountCode: '6010',
        accountName: `Operating Expense: ${data.categoryName}`,
        memo: `${data.description} (Payee: ${data.payee || 'Direct'})`,
        debit: data.amount,
        credit: 0,
        runningBalance: lastBal + data.amount,
        status: 'posted',
      };

      const glLine2: GeneralLedgerEntry = {
        id: `gl_${Date.now()}_2`,
        date: today,
        voucherRef: voucherNo,
        accountCode: creditAccount.code,
        accountName: creditAccount.name,
        memo: `Disbursement for ${voucherNo}`,
        debit: 0,
        credit: data.amount,
        runningBalance: lastBal,
        status: 'posted',
      };

      setExpenses((prev) => [newExpense, ...prev]);
      setGlEntries((prev) => [glLine1, glLine2, ...prev]);
      incrementUsage(data.categoryId);

      return { success: true, record: newExpense };
    },
    [expenses, glEntries, incrementUsage]
  );

  // Record Sale Invoice
  const recordSale = useCallback(
    (data: {
      customerName: string;
      customerCode?: string;
      paymentTerms: string;
      warehouse: string;
      subtotal: number;
      applyVat?: boolean;
      vatRate?: number;
      taxTotal: number;
      total: number;
      itemsCount: number;
      notes?: string;
    }) => {
      const today = new Date().toISOString().split('T')[0];
      const invNo = `INV-${String(sales.length + 1001).padStart(5, '0')}`;

      let days = 30;
      if (data.paymentTerms === 'immediate') days = 0;
      else if (data.paymentTerms === '15_days') days = 15;
      else if (data.paymentTerms === '60_days') days = 60;

      const dueDateObj = new Date();
      dueDateObj.setDate(dueDateObj.getDate() + days);
      const dueDate = dueDateObj.toISOString().split('T')[0];

      const isVatApplied = data.applyVat ?? (data.taxTotal > 0);
      const effectiveVatRate = data.vatRate || 15;

      const newSale: SaleRecord = {
        id: `sale_${Date.now()}`,
        invoiceNumber: invNo,
        date: today,
        dueDate,
        customerName: data.customerName,
        customerCode: data.customerCode,
        paymentTerms: data.paymentTerms,
        warehouse: data.warehouse,
        subtotal: data.subtotal,
        applyVat: isVatApplied,
        vatRate: effectiveVatRate,
        taxTotal: isVatApplied ? data.taxTotal : 0,
        total: data.total,
        paid: data.paymentTerms === 'immediate' ? data.total : 0,
        balance: data.paymentTerms === 'immediate' ? 0 : data.total,
        status: data.paymentTerms === 'immediate' ? 'paid' : 'posted',
        itemsCount: data.itemsCount,
        notes: data.notes,
      };

      const lastBal = glEntries[glEntries.length - 1]?.runningBalance || 0;

      const glLine1: GeneralLedgerEntry = {
        id: `gl_${Date.now()}_1`,
        date: today,
        voucherRef: invNo,
        accountCode: '1050',
        accountName: 'Trade Accounts Receivable',
        memo: `Commercial Invoice for ${data.customerName}`,
        debit: data.total,
        credit: 0,
        runningBalance: lastBal + data.total,
        status: 'posted',
      };

      const glLine2: GeneralLedgerEntry = {
        id: `gl_${Date.now()}_2`,
        date: today,
        voucherRef: invNo,
        accountCode: '4010',
        accountName: 'Wholesale Merchandise Sales',
        memo: `Revenue from ${invNo}`,
        debit: 0,
        credit: data.subtotal,
        runningBalance: lastBal + (isVatApplied ? data.taxTotal : 0),
        status: 'posted',
      };

      const newEntries = [glLine1, glLine2];
      if (isVatApplied && data.taxTotal > 0) {
        newEntries.push({
          id: `gl_${Date.now()}_3`,
          date: today,
          voucherRef: invNo,
          accountCode: '2050',
          accountName: 'Output VAT / Tax Payable',
          memo: `Tax collected on ${invNo}`,
          debit: 0,
          credit: data.taxTotal,
          runningBalance: lastBal,
          status: 'posted',
        });
      }

      setSales((prev) => [newSale, ...prev]);
      setGlEntries((prev) => [...newEntries, ...prev]);

      // Update customer balance if credit sale
      if (data.customerCode && data.paymentTerms !== 'immediate') {
        setCustomers((prev) =>
          prev.map((c) =>
            c.code === data.customerCode ? { ...c, balance: c.balance + data.total } : c
          )
        );
      }

      return { success: true, record: newSale };
    },
    [sales, glEntries]
  );

  // Record Purchase Order
  const recordPurchase = useCallback(
    (data: {
      supplierName: string;
      supplierReference?: string;
      warehouse: string;
      paymentTerms: string;
      totalCost: number;
      itemsCount: number;
    }) => {
      const today = new Date().toISOString().split('T')[0];
      const poNo = `PO-${String(purchases.length + 501).padStart(4, '0')}`;

      const newPurchase: PurchaseRecord = {
        id: `po_${Date.now()}`,
        poNumber: poNo,
        date: today,
        supplierName: data.supplierName,
        supplierReference: data.supplierReference,
        warehouse: data.warehouse,
        paymentTerms: data.paymentTerms,
        totalCost: data.totalCost,
        status: 'sent',
        itemsCount: data.itemsCount,
      };

      setPurchases((prev) => [newPurchase, ...prev]);
      return { success: true, record: newPurchase };
    },
    [purchases]
  );

  // Record Supplier Payment
  const recordSupplierPayment = useCallback(
    (data: {
      supplierId: string;
      supplierName: string;
      supplierCode?: string;
      billId?: string;
      billNumber?: string;
      paymentDate: string;
      amount: number;
      paymentMethod: 'bank_transfer' | 'cash' | 'cheque' | 'online_transfer';
      accountCode: string;
      accountName: string;
      referenceNumber: string;
      notes?: string;
      allowOverpaymentOverride?: boolean;
      overrideReason?: string;
    }) => {
      if (data.amount <= 0) {
        return { success: false, error: 'Payment amount must be strictly greater than zero.' };
      }
      if (!data.referenceNumber?.trim()) {
        return { success: false, error: 'Payment reference number (Cheque #, Bank Ref, or Deposit Slip #) is required for audit verification.' };
      }

      // Verify supplier exists
      const targetSupplier = suppliers.find((s) => s.id === data.supplierId);
      if (!targetSupplier) {
        return { success: false, error: 'Specified supplier does not exist in master records.' };
      }

      // Prevent duplicate payments (same supplier, same reference, same amount)
      const isDuplicate = supplierPayments.some(
        (p) =>
          p.status === 'posted' &&
          p.supplierId === data.supplierId &&
          p.referenceNumber.trim().toLowerCase() === data.referenceNumber.trim().toLowerCase() &&
          Math.abs(p.amount - data.amount) < 0.01
      );
      if (isDuplicate) {
        return {
          success: false,
          error: `Duplicate payment detected: A posted voucher with reference "${data.referenceNumber.trim()}" and amount Rs. ${data.amount.toLocaleString()} already exists for this supplier.`
        };
      }

      // Validate against target bill if specified
      let targetBill: PurchaseBillRecord | undefined;
      if (data.billId) {
        targetBill = bills.find((b) => b.id === data.billId);
        if (!targetBill) {
          return {
            success: false,
            error: 'Specified purchase bill could not be found or has already been removed.'
          };
        }
        if (data.amount > targetBill.remainingBalance && !data.allowOverpaymentOverride) {
          return {
            success: false,
            error: `Payment amount (Rs. ${data.amount.toLocaleString()}) exceeds outstanding bill balance (Rs. ${targetBill.remainingBalance.toLocaleString()}). Check 'Authorized Adjustment' to permit overpayment.`
          };
        }
      }

      // Generate Voucher Number: PV-1001, PV-1002, etc.
      const voucherNo = `PV-${String(supplierPayments.length + 1001).padStart(4, '0')}`;
      const today = data.paymentDate || new Date().toISOString().split('T')[0];

      const newPayment: SupplierPaymentRecord = {
        id: `spay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        voucherNumber: voucherNo,
        supplierId: data.supplierId,
        supplierName: data.supplierName,
        supplierCode: data.supplierCode,
        billId: data.billId,
        billNumber: data.billNumber || targetBill?.billNumber,
        paymentDate: today,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        accountCode: data.accountCode,
        accountName: data.accountName,
        referenceNumber: data.referenceNumber.trim(),
        notes: data.notes || '',
        recordedBy: 'Owner / Administrator',
        status: 'posted',
        createdAt: new Date().toISOString(),
      };

      // Update Bill balance and status
      if (targetBill) {
        setBills((prev) =>
          prev.map((b) => {
            if (b.id !== targetBill!.id) return b;
            const newPaid = b.paidAmount + data.amount;
            const newRemaining = Math.max(0, b.originalAmount - newPaid);
            const newStatus: 'unpaid' | 'partial' | 'paid' =
              newRemaining <= 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';
            return {
              ...b,
              paidAmount: newPaid,
              remainingBalance: newRemaining,
              status: newStatus,
            };
          })
        );
      }

      // Automatically update supplier outstanding balance
      setSuppliers((prev) =>
        prev.map((s) => {
          if (s.id !== data.supplierId) return s;
          const newBalance = Math.max(0, s.balance - data.amount);
          return {
            ...s,
            balance: newBalance,
          };
        })
      );

      // Post General Ledger double-entry transaction
      // Debit: Trade Accounts Payable (2010)
      // Credit: Selected Cash / Bank Account (e.g. 1020 Operating Bank or 1010 Petty Cash)
      const memo = `Supplier payment to ${data.supplierName} ${data.billNumber ? `for ${data.billNumber}` : ''} [Ref: ${data.referenceNumber.trim()}]`;

      const glDebit: GeneralLedgerEntry = {
        id: `gl_${Date.now()}_pv_dr`,
        date: today,
        voucherRef: voucherNo,
        accountCode: '2010',
        accountName: 'Trade Accounts Payable',
        memo,
        debit: data.amount,
        credit: 0,
        runningBalance: 0,
        status: 'posted',
      };

      const glCredit: GeneralLedgerEntry = {
        id: `gl_${Date.now()}_pv_cr`,
        date: today,
        voucherRef: voucherNo,
        accountCode: data.accountCode,
        accountName: data.accountName,
        memo,
        debit: 0,
        credit: data.amount,
        runningBalance: 0,
        status: 'posted',
      };

      setGlEntries((prev) => [glDebit, glCredit, ...prev]);
      setSupplierPayments((prev) => [newPayment, ...prev]);

      return { success: true, payment: newPayment };
    },
    [bills, suppliers, supplierPayments]
  );

  // Create Purchase Bill
  const createPurchaseBill = useCallback(
    (data: {
      supplierId: string;
      supplierName: string;
      supplierCode?: string;
      poNumber?: string;
      date: string;
      dueDate: string;
      originalAmount: number;
      notes?: string;
    }) => {
      const billNo = `BILL-${new Date().getFullYear()}-${String(bills.length + 101).padStart(3, '0')}`;
      const newBill: PurchaseBillRecord = {
        id: `bill_${Date.now()}`,
        billNumber: billNo,
        supplierId: data.supplierId,
        supplierName: data.supplierName,
        supplierCode: data.supplierCode,
        poNumber: data.poNumber,
        date: data.date,
        dueDate: data.dueDate,
        originalAmount: data.originalAmount,
        paidAmount: 0,
        remainingBalance: data.originalAmount,
        status: 'unpaid',
        notes: data.notes,
        createdAt: new Date().toISOString(),
      };

      // Increment supplier payable balance
      setSuppliers((prev) =>
        prev.map((s) => {
          if (s.id !== data.supplierId) return s;
          return { ...s, balance: s.balance + data.originalAmount };
        })
      );

      // Post GL Entry: DR Merchandise Inventory Asset (1100), CR Trade Accounts Payable (2010)
      const glDebit: GeneralLedgerEntry = {
        id: `gl_${Date.now()}_bill_dr`,
        date: data.date,
        voucherRef: billNo,
        accountCode: '1100',
        accountName: 'Merchandise Inventory Asset',
        memo: `Purchase bill from ${data.supplierName} (${billNo})`,
        debit: data.originalAmount,
        credit: 0,
        runningBalance: 0,
        status: 'posted',
      };

      const glCredit: GeneralLedgerEntry = {
        id: `gl_${Date.now()}_bill_cr`,
        date: data.date,
        voucherRef: billNo,
        accountCode: '2010',
        accountName: 'Trade Accounts Payable',
        memo: `Purchase bill from ${data.supplierName} (${billNo})`,
        debit: 0,
        credit: data.originalAmount,
        runningBalance: 0,
        status: 'posted',
      };

      setGlEntries((prev) => [glDebit, glCredit, ...prev]);
      setBills((prev) => [newBill, ...prev]);

      return { success: true, bill: newBill };
    },
    [bills]
  );

  // Add Customer
  const addCustomer = useCallback(
    (data: Omit<CustomerRecord, 'id' | 'balance' | 'createdAt'>) => {
      const isDuplicate = customers.some(
        (c) => c.code.toLowerCase() === data.code.trim().toLowerCase()
      );
      if (isDuplicate) {
        return { success: false, error: `Customer code "${data.code}" already exists.` };
      }

      const newCustomer: CustomerRecord = {
        ...data,
        id: `cust_${Date.now()}`,
        balance: 0,
        createdAt: new Date().toISOString().split('T')[0],
      };

      setCustomers((prev) => [newCustomer, ...prev]);
      return { success: true, customer: newCustomer };
    },
    [customers]
  );

  // Add Supplier
  const addSupplier = useCallback(
    (data: Omit<SupplierRecord, 'id' | 'balance' | 'createdAt'>) => {
      const isDuplicate = suppliers.some(
        (s) => s.code.toLowerCase() === data.code.trim().toLowerCase()
      );
      if (isDuplicate) {
        return { success: false, error: `Supplier code "${data.code}" already exists.` };
      }

      const newSupplier: SupplierRecord = {
        ...data,
        id: `supp_${Date.now()}`,
        balance: 0,
        createdAt: new Date().toISOString().split('T')[0],
      };

      setSuppliers((prev) => [newSupplier, ...prev]);
      return { success: true, supplier: newSupplier };
    },
    [suppliers]
  );

  // Record Manual Journal Entry
  const recordJournalEntry = useCallback(
    (data: {
      date: string;
      voucherRef: string;
      memo: string;
      entries: {
        accountCode: string;
        accountName: string;
        debit: number;
        credit: number;
      }[];
    }) => {
      const totalDebit = data.entries.reduce((sum, e) => sum + (e.debit || 0), 0);
      const totalCredit = data.entries.reduce((sum, e) => sum + (e.credit || 0), 0);

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return {
          success: false,
          error: `Journal voucher does not balance: Debits (${totalDebit.toFixed(2)}) must equal Credits (${totalCredit.toFixed(2)}).`,
        };
      }

      let running = glEntries[glEntries.length - 1]?.runningBalance || 0;
      const newGlLines: GeneralLedgerEntry[] = data.entries.map((entry, idx) => {
        running = running + (entry.debit || 0) - (entry.credit || 0);
        return {
          id: `gl_jv_${Date.now()}_${idx}`,
          date: data.date,
          voucherRef: data.voucherRef,
          accountCode: entry.accountCode,
          accountName: entry.accountName,
          memo: data.memo,
          debit: entry.debit || 0,
          credit: entry.credit || 0,
          runningBalance: running,
          status: 'posted',
        };
      });

      setGlEntries((prev) => [...newGlLines, ...prev]);
      return { success: true };
    },
    [glEntries]
  );

  // Record Quotation
  const recordQuotation = useCallback(
    (data: {
      date: string;
      expiryDate: string;
      customerId: string;
      customerName: string;
      customerCode?: string;
      referenceNumber?: string;
      warehouse: string;
      items: QuotationLineItem[];
      subtotal: number;
      discountTotal: number;
      applyVat?: boolean;
      vatRate?: number;
      taxTotal: number;
      total: number;
      notes?: string;
      status?: QuotationRecord['status'];
    }) => {
      const qNum = `QT-${String(quotations.length + 1001).padStart(5, '0')}`;
      const newQuotation: QuotationRecord = {
        id: `qt_${Date.now()}`,
        quotationNumber: qNum,
        date: data.date,
        expiryDate: data.expiryDate,
        customerId: data.customerId,
        customerName: data.customerName,
        customerCode: data.customerCode,
        referenceNumber: data.referenceNumber,
        warehouse: data.warehouse,
        items: data.items,
        subtotal: data.subtotal,
        discountTotal: data.discountTotal,
        applyVat: data.applyVat ?? (data.taxTotal > 0),
        vatRate: data.vatRate || 15,
        taxTotal: data.taxTotal,
        total: data.total,
        status: data.status || 'draft',
        notes: data.notes,
        createdAt: new Date().toISOString(),
      };

      setQuotations((prev) => [newQuotation, ...prev]);
      return { success: true, quotation: newQuotation };
    },
    [quotations]
  );

  // Update Quotation
  const updateQuotation = useCallback(
    (id: string, updates: Partial<QuotationRecord>) => {
      let updated: QuotationRecord | undefined;
      setQuotations((prev) =>
        prev.map((q) => {
          if (q.id === id) {
            updated = { ...q, ...updates };
            return updated;
          }
          return q;
        })
      );
      return { success: true, quotation: updated };
    },
    []
  );

  // Convert Quotation to Sales Order
  const convertQuotationToSalesOrder = useCallback(
    (quotationId: string) => {
      const quotation = quotations.find((q) => q.id === quotationId);
      if (!quotation) {
        return { success: false, error: 'Quotation not found.' };
      }
      if (quotation.status === 'converted') {
        return {
          success: false,
          error: `Quotation ${quotation.quotationNumber} has already been converted to Sales Order ${quotation.convertedSalesOrderNumber || ''}.`,
        };
      }

      const today = new Date().toISOString().split('T')[0];
      const deliveryDateObj = new Date();
      deliveryDateObj.setDate(deliveryDateObj.getDate() + 3);
      const deliveryDate = deliveryDateObj.toISOString().split('T')[0];

      const soNum = `SO-${String(salesOrders.length + 1001).padStart(5, '0')}`;
      const trkNum = `TRK-${String(orderTracking.length + 5001).padStart(5, '0')}`;

      const soItems: SalesOrderLineItem[] = quotation.items.map((item) => ({
        id: `so_item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        itemDescription: item.itemDescription,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        taxRate: item.taxRate,
        total: item.total,
      }));

      const newSalesOrder: SalesOrderRecord = {
        id: `so_${Date.now()}`,
        orderNumber: soNum,
        sourceQuotationId: quotation.id,
        sourceQuotationNumber: quotation.quotationNumber,
        date: today,
        deliveryDate,
        customerId: quotation.customerId,
        customerName: quotation.customerName,
        customerCode: quotation.customerCode,
        warehouse: quotation.warehouse,
        items: soItems,
        subtotal: quotation.subtotal,
        discountTotal: quotation.discountTotal,
        applyVat: quotation.applyVat ?? (quotation.taxTotal > 0),
        vatRate: quotation.vatRate || 15,
        taxTotal: quotation.taxTotal,
        total: quotation.total,
        status: 'confirmed',
        trackingNumber: trkNum,
        notes: quotation.notes ? `From Quote ${quotation.quotationNumber}: ${quotation.notes}` : `Converted from Quote ${quotation.quotationNumber}`,
        createdAt: new Date().toISOString(),
      };

      // Create tracking entry
      const initialEvent: OrderTrackingEvent = {
        id: `evt_${Date.now()}`,
        status: 'confirmed',
        timestamp: new Date().toISOString(),
        updatedBy: 'Operations Staff',
        location: quotation.warehouse,
        note: `Sales Order ${soNum} converted from Quotation ${quotation.quotationNumber}. Confirmed for picking.`,
      };

      const newTracking: OrderTrackingRecord = {
        id: `trk_${Date.now()}`,
        trackingNumber: trkNum,
        sourceOrderId: newSalesOrder.id,
        orderNumber: soNum,
        customerName: quotation.customerName,
        status: 'confirmed',
        currentLocation: quotation.warehouse,
        assignedStaff: 'Dispatch Manager',
        estimatedDelivery: deliveryDate,
        notes: `Converted from ${quotation.quotationNumber}`,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        events: [initialEvent],
      };

      // Update quotation status
      setQuotations((prev) =>
        prev.map((q) =>
          q.id === quotationId
            ? {
                ...q,
                status: 'converted',
                convertedSalesOrderId: newSalesOrder.id,
                convertedSalesOrderNumber: soNum,
              }
            : q
        )
      );

      setSalesOrders((prev) => [newSalesOrder, ...prev]);
      setOrderTracking((prev) => [newTracking, ...prev]);

      return { success: true, salesOrder: newSalesOrder };
    },
    [quotations, salesOrders, orderTracking]
  );

  // Record Manual Sales Order
  const recordSalesOrder = useCallback(
    (data: {
      date: string;
      deliveryDate: string;
      customerId: string;
      customerName: string;
      customerCode?: string;
      warehouse: string;
      items: SalesOrderLineItem[];
      subtotal: number;
      discountTotal: number;
      applyVat?: boolean;
      vatRate?: number;
      taxTotal: number;
      total: number;
      notes?: string;
      sourceQuotationId?: string;
      sourceQuotationNumber?: string;
    }) => {
      const soNum = `SO-${String(salesOrders.length + 1001).padStart(5, '0')}`;
      const trkNum = `TRK-${String(orderTracking.length + 5001).padStart(5, '0')}`;

      const newSalesOrder: SalesOrderRecord = {
        id: `so_${Date.now()}`,
        orderNumber: soNum,
        sourceQuotationId: data.sourceQuotationId,
        sourceQuotationNumber: data.sourceQuotationNumber,
        date: data.date,
        deliveryDate: data.deliveryDate,
        customerId: data.customerId,
        customerName: data.customerName,
        customerCode: data.customerCode,
        warehouse: data.warehouse,
        items: data.items,
        subtotal: data.subtotal,
        discountTotal: data.discountTotal,
        applyVat: data.applyVat ?? (data.taxTotal > 0),
        vatRate: data.vatRate || 15,
        taxTotal: data.taxTotal,
        total: data.total,
        status: 'new',
        trackingNumber: trkNum,
        notes: data.notes,
        createdAt: new Date().toISOString(),
      };

      const initialEvent: OrderTrackingEvent = {
        id: `evt_${Date.now()}`,
        status: 'new',
        timestamp: new Date().toISOString(),
        updatedBy: 'Sales Representative',
        location: data.warehouse,
        note: `Sales Order ${soNum} registered in order processing pipeline.`,
      };

      const newTracking: OrderTrackingRecord = {
        id: `trk_${Date.now()}`,
        trackingNumber: trkNum,
        sourceOrderId: newSalesOrder.id,
        orderNumber: soNum,
        customerName: data.customerName,
        status: 'new',
        currentLocation: data.warehouse,
        assignedStaff: 'Order Processing',
        estimatedDelivery: data.deliveryDate,
        notes: data.notes,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        events: [initialEvent],
      };

      setSalesOrders((prev) => [newSalesOrder, ...prev]);
      setOrderTracking((prev) => [newTracking, ...prev]);

      return { success: true, salesOrder: newSalesOrder };
    },
    [salesOrders, orderTracking]
  );

  // Update Sales Order Status & Timeline
  const updateSalesOrderStatus = useCallback(
    (
      orderId: string,
      newStatus: SalesOrderRecord['status'],
      note?: string,
      updatedBy: string = 'Operations Team'
    ) => {
      const order = salesOrders.find((o) => o.id === orderId);
      if (!order) return { success: false, error: 'Order not found.' };

      setSalesOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );

      // Update matching tracking record
      setOrderTracking((prev) =>
        prev.map((trk) => {
          if (trk.orderNumber === order.orderNumber || trk.sourceOrderId === orderId) {
            const newEvent: OrderTrackingEvent = {
              id: `evt_${Date.now()}`,
              status: newStatus,
              timestamp: new Date().toISOString(),
              updatedBy,
              location: trk.currentLocation,
              note: note || `Status transitioned to ${newStatus.replace('_', ' ').toUpperCase()}`,
            };
            return {
              ...trk,
              status: newStatus,
              lastUpdated: new Date().toISOString(),
              events: [newEvent, ...trk.events],
            };
          }
          return trk;
        })
      );

      return { success: true };
    },
    [salesOrders]
  );

  // Record Sales Return & Issue Credit Note
  const recordSalesReturn = useCallback(
    (data: {
      invoiceId: string;
      invoiceNumber: string;
      customerId: string;
      customerName: string;
      reason: string;
      items: SalesReturnItem[];
      restockDecision: 'restocked' | 'damaged_discarded' | 'pending_inspection';
      notes?: string;
    }) => {
      const today = new Date().toISOString().split('T')[0];
      const retNum = `SR-${String(salesReturns.length + 1001).padStart(5, '0')}`;
      const cnNum = `CN-${String(creditNotes.length + 1001).padStart(5, '0')}`;

      const totalRefund = data.items.reduce((sum, item) => sum + (item.refundAmount || 0), 0);

      const newCreditNote: CreditNoteRecord = {
        id: `cn_${Date.now()}`,
        creditNoteNumber: cnNum,
        returnId: `sr_${Date.now()}`,
        returnNumber: retNum,
        invoiceId: data.invoiceId,
        invoiceNumber: data.invoiceNumber,
        customerName: data.customerName,
        date: today,
        amount: totalRefund,
        status: 'posted',
        memo: `Credit note for return ${retNum} against ${data.invoiceNumber}. ${data.reason}`,
        createdAt: new Date().toISOString(),
      };

      const newSalesReturn: SalesReturnRecord = {
        id: `sr_${Date.now()}`,
        returnNumber: retNum,
        invoiceId: data.invoiceId,
        invoiceNumber: data.invoiceNumber,
        customerId: data.customerId,
        customerName: data.customerName,
        date: today,
        reason: data.reason,
        items: data.items,
        totalReturnAmount: totalRefund,
        restockDecision: data.restockDecision,
        creditNoteId: newCreditNote.id,
        creditNoteNumber: cnNum,
        status: 'approved',
        notes: data.notes,
        createdAt: new Date().toISOString(),
      };

      // Post General Ledger lines:
      // DR 4020 (Sales Returns & Allowances)
      // CR 1050 (Trade Accounts Receivable)
      const lastBal = glEntries[glEntries.length - 1]?.runningBalance || 0;

      const glLine1: GeneralLedgerEntry = {
        id: `gl_${Date.now()}_1`,
        date: today,
        voucherRef: cnNum,
        accountCode: '4020',
        accountName: 'Sales Returns & Allowances',
        memo: `Return goods from ${data.customerName} (${retNum})`,
        debit: totalRefund,
        credit: 0,
        runningBalance: lastBal + totalRefund,
        status: 'posted',
      };

      const glLine2: GeneralLedgerEntry = {
        id: `gl_${Date.now()}_2`,
        date: today,
        voucherRef: cnNum,
        accountCode: '1050',
        accountName: 'Trade Accounts Receivable',
        memo: `Credit customer balance for ${cnNum}`,
        debit: 0,
        credit: totalRefund,
        runningBalance: lastBal,
        status: 'posted',
      };

      setSalesReturns((prev) => [newSalesReturn, ...prev]);
      setCreditNotes((prev) => [newCreditNote, ...prev]);
      setGlEntries((prev) => [glLine1, glLine2, ...prev]);

      // Adjust customer balance
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === data.customerId || c.name === data.customerName
            ? { ...c, balance: Math.max(0, c.balance - totalRefund) }
            : c
        )
      );

      // Adjust invoice outstanding balance
      setSales((prev) =>
        prev.map((s) =>
          s.invoiceNumber === data.invoiceNumber
            ? {
                ...s,
                balance: Math.max(0, s.balance - totalRefund),
                status: Math.max(0, s.balance - totalRefund) === 0 ? 'paid' : s.status,
              }
            : s
        )
      );

      return { success: true, returnRecord: newSalesReturn, creditNote: newCreditNote };
    },
    [salesReturns, creditNotes, glEntries]
  );

  // Record Goods Received Note (GRN)
  const recordGRN = useCallback(
    (data: {
      purchaseOrderId: string;
      poNumber: string;
      supplierName: string;
      warehouse: string;
      items: GRNLineItem[];
      notes?: string;
      receivedBy: string;
    }) => {
      const today = new Date().toISOString().split('T')[0];
      const grnNum = `GRN-${String(grns.length + 1001).padStart(5, '0')}`;

      const totalAccepted = data.items.reduce((sum, item) => sum + item.acceptedQty, 0);
      const totalOrdered = data.items.reduce((sum, item) => sum + item.orderedQty, 0);

      const status: GoodsReceivedNoteRecord['status'] =
        totalAccepted >= totalOrdered ? 'received' : 'partial';

      const newGRN: GoodsReceivedNoteRecord = {
        id: `grn_${Date.now()}`,
        grnNumber: grnNum,
        purchaseOrderId: data.purchaseOrderId,
        poNumber: data.poNumber,
        supplierName: data.supplierName,
        date: today,
        warehouse: data.warehouse,
        items: data.items,
        status,
        notes: data.notes,
        receivedBy: data.receivedBy,
        createdAt: new Date().toISOString(),
      };

      setGrns((prev) => [newGRN, ...prev]);

      // Update purchase order status to received or partial without auto-posting supplier bill
      setPurchases((prev) =>
        prev.map((p) =>
          p.poNumber === data.poNumber || p.id === data.purchaseOrderId
            ? { ...p, status: status === 'received' ? 'received' : 'sent' }
            : p
        )
      );

      return { success: true, grn: newGRN };
    },
    [grns]
  );

  // Record Supplier Return & Issue Debit Note
  const recordSupplierReturn = useCallback(
    (data: {
      poNumber?: string;
      supplierName: string;
      items: SupplierReturnItem[];
      reason: string;
    }) => {
      const today = new Date().toISOString().split('T')[0];
      const retNum = `PR-${String(supplierReturns.length + 1001).padStart(5, '0')}`;
      const dnNum = `DN-${String(debitNotes.length + 1001).padStart(5, '0')}`;

      const totalAmount = data.items.reduce(
        (sum, item) => sum + item.quantity * item.unitCost,
        0
      );

      const newDebitNote: DebitNoteRecord = {
        id: `dn_${Date.now()}`,
        debitNoteNumber: dnNum,
        returnId: `pr_${Date.now()}`,
        returnNumber: retNum,
        supplierName: data.supplierName,
        date: today,
        amount: totalAmount,
        status: 'posted',
        memo: `Debit note for returned inventory (${retNum}) to ${data.supplierName}. ${data.reason}`,
        createdAt: new Date().toISOString(),
      };

      const newReturn: SupplierReturnRecord = {
        id: `pr_${Date.now()}`,
        returnNumber: retNum,
        poNumber: data.poNumber,
        supplierName: data.supplierName,
        date: today,
        items: data.items,
        totalAmount,
        debitNoteId: newDebitNote.id,
        debitNoteNumber: dnNum,
        status: 'dispatched',
        createdAt: new Date().toISOString(),
      };

      // Double entry GL:
      // DR 2010 (Trade Accounts Payable)
      // CR 1100 (Merchandise Inventory Asset)
      const lastBal = glEntries[glEntries.length - 1]?.runningBalance || 0;

      const glLine1: GeneralLedgerEntry = {
        id: `gl_${Date.now()}_1`,
        date: today,
        voucherRef: dnNum,
        accountCode: '2010',
        accountName: 'Trade Accounts Payable',
        memo: `Debit vendor balance for goods return ${retNum}`,
        debit: totalAmount,
        credit: 0,
        runningBalance: lastBal + totalAmount,
        status: 'posted',
      };

      const glLine2: GeneralLedgerEntry = {
        id: `gl_${Date.now()}_2`,
        date: today,
        voucherRef: dnNum,
        accountCode: '1100',
        accountName: 'Merchandise Inventory Asset',
        memo: `Reduction of physical stock on vendor return ${retNum}`,
        debit: 0,
        credit: totalAmount,
        runningBalance: lastBal,
        status: 'posted',
      };

      setSupplierReturns((prev) => [newReturn, ...prev]);
      setDebitNotes((prev) => [newDebitNote, ...prev]);
      setGlEntries((prev) => [glLine1, glLine2, ...prev]);

      // Reduce supplier balance
      setSuppliers((prev) =>
        prev.map((s) =>
          s.name === data.supplierName
            ? { ...s, balance: Math.max(0, s.balance - totalAmount) }
            : s
        )
      );

      return { success: true, returnRecord: newReturn, debitNote: newDebitNote };
    },
    [supplierReturns, debitNotes, glEntries]
  );

  // Warehouses
  const addWarehouse = useCallback(
    (data: Omit<WarehouseRecord, 'id' | 'createdAt'>) => {
      const exists = warehouses.some(
        (w) => w.code.toLowerCase() === data.code.trim().toLowerCase()
      );
      if (exists) {
        return { success: false, error: `Warehouse code "${data.code}" already exists.` };
      }

      const newWh: WarehouseRecord = {
        ...data,
        id: `wh_${Date.now()}`,
        createdAt: new Date().toISOString().split('T')[0],
      };

      setWarehouses((prev) => [...prev, newWh]);
      return { success: true, warehouse: newWh };
    },
    [warehouses]
  );

  const updateWarehouse = useCallback((id: string, data: Partial<WarehouseRecord>) => {
    setWarehouses((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...data } : w))
    );
    return { success: true };
  }, []);

  // Bins
  const addWarehouseBin = useCallback(
    (data: Omit<WarehouseBinRecord, 'id' | 'currentSKUsCount' | 'createdAt'>) => {
      const exists = warehouseBins.some(
        (b) =>
          b.warehouseId === data.warehouseId &&
          b.code.toLowerCase() === data.code.trim().toLowerCase()
      );
      if (exists) {
        return {
          success: false,
          error: `Bin code "${data.code}" already exists in the selected warehouse.`,
        };
      }

      const newBin: WarehouseBinRecord = {
        ...data,
        id: `bin_${Date.now()}`,
        currentSKUsCount: 0,
        createdAt: new Date().toISOString().split('T')[0],
      };

      setWarehouseBins((prev) => [newBin, ...prev]);
      return { success: true, bin: newBin };
    },
    [warehouseBins]
  );

  const updateWarehouseBin = useCallback((id: string, data: Partial<WarehouseBinRecord>) => {
    setWarehouseBins((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...data } : b))
    );
    return { success: true };
  }, []);

  const deleteWarehouseBin = useCallback(
    (id: string) => {
      const bin = warehouseBins.find((b) => b.id === id);
      if (!bin) return { success: false, error: 'Bin not found.' };
      if (bin.currentSKUsCount > 0) {
        return {
          success: false,
          error: `Cannot delete bin "${bin.code}" while items are assigned to it.`,
        };
      }
      setWarehouseBins((prev) => prev.filter((b) => b.id !== id));
      return { success: true };
    },
    [warehouseBins]
  );

  // Shipments
  const recordDeliveryShipment = useCallback(
    (data: {
      orderNumber: string;
      customerName: string;
      deliveryAddress: string;
      driverName: string;
      vehiclePlate: string;
      scheduledDate: string;
      codAmount?: number;
      notes?: string;
    }) => {
      const shipNum = `SHP-${String(shipments.length + 1001).padStart(5, '0')}`;
      const newShipment: DeliveryShipmentRecord = {
        id: `shp_${Date.now()}`,
        shipmentNumber: shipNum,
        orderNumber: data.orderNumber,
        customerName: data.customerName,
        deliveryAddress: data.deliveryAddress,
        driverName: data.driverName,
        vehiclePlate: data.vehiclePlate,
        scheduledDate: data.scheduledDate,
        status: 'assigned',
        codAmount: data.codAmount,
        notes: data.notes,
        createdAt: new Date().toISOString(),
      };

      setShipments((prev) => [newShipment, ...prev]);
      return { success: true, shipment: newShipment };
    },
    [shipments]
  );

  // Delivery Management Callbacks
  const createDeliveryFromSalesOrder = useCallback(
    (data: {
      salesOrderId: string;
      salesOrderNumber: string;
      customerId: string;
      customerName: string;
      customerPhone: string;
      deliveryAddress: string;
      scheduledDate: string;
      assignedStaff: string;
      vehicleDetails?: string;
      items: {
        id?: string;
        itemDescription: string;
        orderedQty: number;
        previouslyDeliveredQty: number;
        deliveredQty: number;
        unitPrice: number;
      }[];
      notes?: string;
    }) => {
      // Validate quantity caps
      for (const item of data.items) {
        const maxAvailable = Math.max(0, item.orderedQty - item.previouslyDeliveredQty);
        if (item.deliveredQty > maxAvailable) {
          return {
            success: false,
            error: `Delivered quantity (${item.deliveredQty}) for "${item.itemDescription}" exceeds remaining balance (${maxAvailable}).`,
          };
        }
      }

      const dlvNum = `DLV-${String(deliveries.length + 1001).padStart(5, '0')}`;
      const nowIso = new Date().toISOString();

      const deliveryItems: DeliveryLineItem[] = data.items.map((item, idx) => ({
        id: item.id || `dlv_item_${Date.now()}_${idx}`,
        itemDescription: item.itemDescription,
        orderedQty: item.orderedQty,
        previouslyDeliveredQty: item.previouslyDeliveredQty,
        deliveredQty: item.deliveredQty,
        outstandingQty: Math.max(0, item.orderedQty - item.previouslyDeliveredQty - item.deliveredQty),
        unitPrice: item.unitPrice,
      }));

      const initialHistory: DeliveryHistoryLog = {
        id: `log_${Date.now()}_1`,
        status: 'scheduled',
        timestamp: nowIso,
        updatedBy: 'Logistics Operations',
        note: `Delivery Note ${dlvNum} generated for Sales Order ${data.salesOrderNumber}. Scheduled for ${data.scheduledDate}.`,
      };

      const newDelivery: DeliveryRecord = {
        id: `dlv_${Date.now()}`,
        deliveryNumber: dlvNum,
        salesOrderId: data.salesOrderId,
        salesOrderNumber: data.salesOrderNumber,
        customerId: data.customerId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        deliveryAddress: data.deliveryAddress,
        scheduledDate: data.scheduledDate,
        assignedStaff: data.assignedStaff,
        vehicleDetails: data.vehicleDetails,
        status: 'scheduled',
        items: deliveryItems,
        notes: data.notes,
        createdAt: nowIso,
        updatedAt: nowIso,
        history: [initialHistory],
      };

      setDeliveries((prev) => [newDelivery, ...prev]);

      // Update Sales Order status to dispatched
      setSalesOrders((prev) =>
        prev.map((o) => {
          if (o.id === data.salesOrderId || o.orderNumber === data.salesOrderNumber) {
            return { ...o, status: 'dispatched' };
          }
          return o;
        })
      );

      return { success: true, delivery: newDelivery };
    },
    [deliveries]
  );

  const updateDeliveryStatus = useCallback(
    (
      deliveryId: string,
      newStatus: DeliveryStatus,
      note?: string,
      updatedBy: string = 'Logistics Officer'
    ) => {
      const nowIso = new Date().toISOString();
      let updated: DeliveryRecord | undefined;

      setDeliveries((prev) =>
        prev.map((d) => {
          if (d.id === deliveryId) {
            const newHistory: DeliveryHistoryLog = {
              id: `log_${Date.now()}`,
              status: newStatus,
              timestamp: nowIso,
              updatedBy,
              note: note || `Status updated to ${newStatus.replace('_', ' ').toUpperCase()}`,
            };

            updated = {
              ...d,
              status: newStatus,
              updatedAt: nowIso,
              history: [newHistory, ...d.history],
            };
            return updated;
          }
          return d;
        })
      );

      return { success: true, delivery: updated };
    },
    []
  );

  const confirmDeliveryPOD = useCallback(
    (
      deliveryId: string,
      recipientName: string,
      proofOfDeliveryRef?: string,
      actualDeliveryDate?: string,
      note?: string
    ) => {
      const nowIso = new Date().toISOString();
      let updated: DeliveryRecord | undefined;

      setDeliveries((prev) =>
        prev.map((d) => {
          if (d.id === deliveryId) {
            const podNote = `Proof of Delivery signed by recipient "${recipientName}". ${
              proofOfDeliveryRef ? `POD Ref: ${proofOfDeliveryRef}.` : ''
            } ${note || ''}`;

            const newHistory: DeliveryHistoryLog = {
              id: `log_${Date.now()}`,
              status: 'delivered',
              timestamp: nowIso,
              updatedBy: 'Delivery Driver',
              note: podNote,
            };

            updated = {
              ...d,
              status: 'delivered',
              recipientName,
              proofOfDeliveryRef,
              actualDeliveryDate: actualDeliveryDate || nowIso,
              updatedAt: nowIso,
              history: [newHistory, ...d.history],
            };
            return updated;
          }
          return d;
        })
      );

      return { success: true, delivery: updated };
    },
    []
  );

  return (
    <TransactionContext.Provider
      value={{
        expenses,
        sales,
        purchases,
        bills,
        supplierPayments,
        customers,
        suppliers,
        glEntries,
        quotations,
        salesOrders,
        salesReturns,
        creditNotes,
        grns,
        supplierReturns,
        debitNotes,
        orderTracking,
        warehouses,
        warehouseBins,
        shipments: [],
        deliveries,
        recordExpense,
        recordSale,
        recordPurchase,
        recordSupplierPayment,
        createPurchaseBill,
        addCustomer,
        addSupplier,
        recordJournalEntry,
        recordQuotation,
        updateQuotation,
        convertQuotationToSalesOrder,
        recordSalesOrder,
        updateSalesOrderStatus,
        recordSalesReturn,
        recordGRN,
        recordSupplierReturn,
        addWarehouse,
        updateWarehouse,
        addWarehouseBin,
        updateWarehouseBin,
        deleteWarehouseBin,
        recordDeliveryShipment: () => ({ success: true }),
        updateShipmentStatus: () => ({ success: true }),
        createDeliveryFromSalesOrder,
        updateDeliveryStatus,
        confirmDeliveryPOD,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};
