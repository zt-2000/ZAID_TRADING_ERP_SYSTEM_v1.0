/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { CategoryProvider } from './context/CategoryContext';
import { ExpenseCategoryProvider } from './context/ExpenseCategoryContext';
import { TransactionProvider } from './context/TransactionContext';
import { UserProvider } from './context/UserContext';
import { AppShell } from './components/layout/AppShell';
import { CompanySettings } from './types';

const defaultSettings: CompanySettings = {
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
  defaultApplyVat: false,
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

export default function App() {
  const [settings, setSettings] = useState<CompanySettings>(() => {
    const saved = localStorage.getItem('zaid_erp_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Seamlessly migrate legacy USD default to LKR requirement
        if (parsed.defaultCurrency === 'USD' && parsed.currencySymbol === '$') {
          return {
            ...defaultSettings,
            ...parsed,
            defaultCurrency: 'LKR',
            currencySymbol: 'Rs.',
            timeZone: 'Asia/Colombo',
            legalName: defaultSettings.legalName,
            country: defaultSettings.country,
            city: defaultSettings.city,
            address: defaultSettings.address,
            phone: defaultSettings.phone,
            defaultWarehouse: defaultSettings.defaultWarehouse,
          };
        }
        return { ...defaultSettings, ...parsed };
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
        <CategoryProvider>
          <ExpenseCategoryProvider>
            <TransactionProvider>
              <UserProvider>
                <AppShell
                  companySettings={settings}
                  onUpdateSettings={handleUpdateSettings}
                />
              </UserProvider>
            </TransactionProvider>
          </ExpenseCategoryProvider>
        </CategoryProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
