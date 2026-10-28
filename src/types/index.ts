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
  email: string;
  role: 'Owner / Administrator' | 'Manager' | 'Salesperson' | 'Storekeeper' | 'Accountant' | 'Delivery Driver';
  avatarUrl?: string;
  status: 'active' | 'inactive';
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}
