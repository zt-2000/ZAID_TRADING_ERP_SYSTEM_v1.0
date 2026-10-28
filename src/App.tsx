/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AppShell } from './components/layout/AppShell';
import { CompanySettings } from './types';

const defaultSettings: CompanySettings = {
  companyName: 'Zaid Trading',
  legalName: 'Zaid Trading & Wholesale Logistics W.L.L.',
  registrationNumber: 'CR-1010889240',
  taxNumber: '300098214300003',
  email: 'zaidtrading.info@gmail.com',
  phone: '+966 11 489 2000',
  address: 'District 4, Industrial Wholesale City, Al-Sulay',
  city: 'Riyadh',
  country: 'Saudi Arabia',
  defaultCurrency: 'USD',
  currencySymbol: '$',
  currencyPrecision: 2,
  multicurrencyEnabled: true,
  defaultTaxRate: 15,
  taxInclusivePricing: false,
  financialYearStartMonth: 1,
  dateFormat: 'YYYY-MM-DD',
  timeZone: 'Asia/Riyadh',
  invoicePrefix: 'INV-',
  quotationPrefix: 'QT-',
  purchaseOrderPrefix: 'PO-',
  deliveryNotePrefix: 'DN-',
  defaultWarehouse: 'Riyadh Central Logistics Hub',
  negativeStockAllowed: false,
  themePreference: 'light',
};

export default function App() {
  const [settings, setSettings] = useState<CompanySettings>(() => {
    const saved = localStorage.getItem('zaid_erp_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  const handleUpdateSettings = (newSettings: CompanySettings) => {
    setSettings(newSettings);
    localStorage.setItem('zaid_erp_settings', JSON.stringify(newSettings));
  };

  return (
    <ThemeProvider>
      <ToastProvider>
        <AppShell
          companySettings={settings}
          onUpdateSettings={handleUpdateSettings}
        />
      </ToastProvider>
    </ThemeProvider>
  );
}
