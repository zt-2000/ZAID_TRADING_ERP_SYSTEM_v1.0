export type ThemeMode = 'light' | 'dark' | 'system';

export type NavigationSection =
  | 'dashboard'
  | 'sales'
  | 'purchasing'
  | 'inventory'
  | 'customers'
  | 'suppliers'
  | 'delivery'
  | 'finance'
  | 'expenses'
  | 'reports'
  | 'users'
  | 'settings';

export interface CompanySettings {
  companyName: string;
  legalName: string;
  registrationNumber: string;
  taxNumber: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  logoUrl?: string;
  defaultCurrency: string;
  currencySymbol: string;
  currencyPrecision: number;
  multicurrencyEnabled: boolean;
  defaultTaxRate: number;
  taxInclusivePricing: boolean;
  financialYearStartMonth: number;
  dateFormat: string;
  timeZone: string;
  invoicePrefix: string;
  quotationPrefix: string;
  purchaseOrderPrefix: string;
  deliveryNotePrefix: string;
  defaultWarehouse: string;
  negativeStockAllowed: boolean;
  themePreference: ThemeMode;
}

export interface UserProfile {
  id: string;
  name: string;
  displayName?: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  role: 'Owner / Administrator' | 'Manager' | 'Salesperson' | 'Storekeeper' | 'Accountant' | 'Delivery Driver';
  avatarUrl?: string;
  preferredLanguage?: string;
  createdAt?: string;
  status: 'active' | 'inactive';
  assignedWarehouse?: string;
  lastActive?: string;
}

export interface UserPreferences {
  theme: ThemeMode;
  dateFormat: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
  timeFormat: '12h' | '24h';
  emailNotifications: boolean;
  lowStockAlerts: boolean;
  financialAlerts: boolean;
  marketingEmails?: boolean;
}

export interface UserSession {
  id: string;
  device: string;
  browser: string;
  ipAddress: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export interface QuotationLineItem {
  id: string;
  itemDescription: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  total: number;
}

export interface QuotationRecord {
  id: string;
  quotationNumber: string;
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
  taxTotal: number;
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';
  notes?: string;
  convertedSalesOrderId?: string;
  convertedSalesOrderNumber?: string;
  createdAt: string;
}

export interface SalesOrderLineItem {
  id: string;
  itemDescription: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  total: number;
}

export interface SalesOrderRecord {
  id: string;
  orderNumber: string;
  sourceQuotationId?: string;
  sourceQuotationNumber?: string;
  date: string;
  deliveryDate: string;
  customerId: string;
  customerName: string;
  customerCode?: string;
  warehouse: string;
  items: SalesOrderLineItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  status:
    | 'new'
    | 'confirmed'
    | 'processing'
    | 'ready'
    | 'awaiting_dispatch'
    | 'dispatched'
    | 'completed'
    | 'on_hold'
    | 'cancelled';
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface SalesReturnItem {
  id: string;
  description: string;
  returnedQty: number;
  unitPrice: number;
  condition: 'good' | 'damaged' | 'unopened' | 'expired';
  restockApproved: boolean;
  refundAmount: number;
}

export interface SalesReturnRecord {
  id: string;
  returnNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  reason: string;
  items: SalesReturnItem[];
  totalReturnAmount: number;
  restockDecision: 'restocked' | 'damaged_discarded' | 'pending_inspection';
  creditNoteId?: string;
  creditNoteNumber?: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  createdAt: string;
}

export interface CreditNoteRecord {
  id: string;
  creditNoteNumber: string;
  returnId: string;
  returnNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  date: string;
  amount: number;
  status: 'posted' | 'draft';
  memo: string;
  createdAt: string;
}

export interface GRNLineItem {
  id: string;
  description: string;
  orderedQty: number;
  receivedQty: number;
  damagedQty: number;
  acceptedQty: number;
  unitCost: number;
}

export interface GoodsReceivedNoteRecord {
  id: string;
  grnNumber: string;
  purchaseOrderId: string;
  poNumber: string;
  supplierName: string;
  date: string;
  warehouse: string;
  items: GRNLineItem[];
  status: 'received' | 'partial' | 'inspected';
  notes?: string;
  receivedBy: string;
  createdAt: string;
}

export interface SupplierReturnItem {
  id: string;
  description: string;
  quantity: number;
  unitCost: number;
  reason: string;
}

export interface SupplierReturnRecord {
  id: string;
  returnNumber: string;
  poNumber?: string;
  supplierName: string;
  date: string;
  items: SupplierReturnItem[];
  totalAmount: number;
  debitNoteId?: string;
  debitNoteNumber?: string;
  status: 'dispatched' | 'draft';
  createdAt: string;
}

export interface DebitNoteRecord {
  id: string;
  debitNoteNumber: string;
  returnId: string;
  returnNumber: string;
  supplierName: string;
  date: string;
  amount: number;
  status: 'posted' | 'draft';
  memo: string;
  createdAt: string;
}

export interface OrderTrackingEvent {
  id: string;
  status:
    | 'new'
    | 'confirmed'
    | 'processing'
    | 'ready'
    | 'awaiting_dispatch'
    | 'dispatched'
    | 'completed'
    | 'on_hold'
    | 'cancelled';
  timestamp: string;
  updatedBy: string;
  location?: string;
  note: string;
}

export interface OrderTrackingRecord {
  id: string;
  trackingNumber: string;
  sourceOrderId?: string;
  orderNumber: string;
  customerName: string;
  status:
    | 'new'
    | 'confirmed'
    | 'processing'
    | 'ready'
    | 'awaiting_dispatch'
    | 'dispatched'
    | 'completed'
    | 'on_hold'
    | 'cancelled';
  currentLocation: string;
  assignedStaff: string;
  estimatedDelivery?: string;
  notes?: string;
  createdAt: string;
  lastUpdated: string;
  events: OrderTrackingEvent[];
}

export interface WarehouseRecord {
  id: string;
  code: string;
  name: string;
  type: 'central' | 'depot' | 'van' | 'bonded';
  address: string;
  city: string;
  isDefault: boolean;
  status: 'active' | 'inactive';
  totalCapacityBays: number;
  managerName?: string;
  createdAt: string;
}

export interface WarehouseBinRecord {
  id: string;
  warehouseId: string;
  warehouseName: string;
  code: string;
  name: string;
  aisle: string;
  rack: string;
  shelf: string;
  type: 'pallet' | 'shelf' | 'bulk' | 'cold_storage';
  maxWeightKg: number;
  status: 'active' | 'full' | 'maintenance';
  currentSKUsCount: number;
  createdAt: string;
}

export type DeliveryStatus =
  | 'pending'
  | 'scheduled'
  | 'preparing'
  | 'dispatched'
  | 'in_transit'
  | 'delivered'
  | 'failed'
  | 'cancelled';

export interface DeliveryLineItem {
  id: string;
  itemDescription: string;
  orderedQty: number;
  previouslyDeliveredQty: number;
  deliveredQty: number;
  outstandingQty: number;
  unitPrice: number;
}

export interface DeliveryHistoryLog {
  id: string;
  status: DeliveryStatus;
  timestamp: string;
  updatedBy: string;
  note: string;
}

export interface DeliveryRecord {
  id: string;
  deliveryNumber: string;
  salesOrderId: string;
  salesOrderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  scheduledDate: string;
  actualDeliveryDate?: string;
  assignedStaff: string;
  vehicleDetails?: string;
  status: DeliveryStatus;
  items: DeliveryLineItem[];
  recipientName?: string;
  proofOfDeliveryRef?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  history: DeliveryHistoryLog[];
}

export interface DeliveryShipmentRecord {
  id: string;
  shipmentNumber: string;
  orderNumber: string;
  customerName: string;
  deliveryAddress: string;
  driverName: string;
  vehiclePlate: string;
  scheduledDate: string;
  status: 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'failed';
  codAmount?: number;
  notes?: string;
  createdAt: string;
}


