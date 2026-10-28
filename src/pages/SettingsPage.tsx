import React, { useState } from 'react';
import { CompanySettings } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { Building2, DollarSign, Receipt, MapPin, Palette, ShieldCheck, Save } from 'lucide-react';

interface SettingsPageProps {
  settings: CompanySettings;
  onSaveSettings: (settings: CompanySettings) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings: initialSettings,
  onSaveSettings,
}) => {
  const { showToast } = useToast();
  const { setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<
    'general' | 'currency' | 'tax' | 'warehouses' | 'theme'
  >('general');
  const [formData, setFormData] = useState<CompanySettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);

  const updateField = <K extends keyof CompanySettings>(key: K, value: CompanySettings[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim()) {
      showToast('Validation Error', 'Company commercial name cannot be empty', 'error');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      onSaveSettings(formData);
      if (formData.themePreference) {
        setTheme(formData.themePreference);
      }
      showToast(
        'Configuration Saved',
        'Zaid Trading ERP enterprise parameters have been synchronized.',
        'success'
      );
    }, 500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-neutral-400 uppercase">
            ADMINISTRATION & INFRASTRUCTURE
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-neutral-100 mt-1">
            Company & System Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
            Configure enterprise parameters, multi-currency accounting, tax compliance, and sequence prefixes
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleSave}
          isLoading={isSaving}
          leftIcon={<Save className="w-4 h-4" />}
        >
          Save Configuration
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-neutral-800 space-x-6 text-xs font-semibold overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'general'
              ? 'border-[#167a53] text-[#167a53] dark:text-[#34d399]'
              : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Company Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('currency')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'currency'
              ? 'border-[#167a53] text-[#167a53] dark:text-[#34d399]'
              : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Currencies & Localization</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tax')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'tax'
              ? 'border-[#167a53] text-[#167a53] dark:text-[#34d399]'
              : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Tax & Invoicing Prefixes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('warehouses')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'warehouses'
              ? 'border-[#167a53] text-[#167a53] dark:text-[#34d399]'
              : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Warehouses & Inventory Policy</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('theme')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'theme'
              ? 'border-[#167a53] text-[#167a53] dark:text-[#34d399]'
              : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Theme & Interface</span>
        </button>
      </div>

      {/* Tab Panels */}
      <form onSubmit={handleSave} className="space-y-6">
        {activeTab === 'general' && (
          <div className="p-6 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#167a53] dark:text-[#34d399]" />
              <span>Enterprise Commercial Identity</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Company Operating Name"
                value={formData.companyName}
                onChange={(e) => updateField('companyName', e.target.value)}
                required
              />
              <Input
                label="Full Registered Legal Entity"
                value={formData.legalName}
                onChange={(e) => updateField('legalName', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Commercial Registration (CR) Number"
                value={formData.registrationNumber}
                onChange={(e) => updateField('registrationNumber', e.target.value)}
              />
              <Input
                label="VAT / Tax Identification Number (TIN)"
                value={formData.taxNumber}
                onChange={(e) => updateField('taxNumber', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Official ERP Email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
              />
              <Input
                label="Commercial Phone / Hotline"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
              />
            </div>

            <Input
              label="Headquarters Street Address"
              value={formData.address}
              onChange={(e) => updateField('address', e.target.value)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="City / Hub"
                value={formData.city}
                onChange={(e) => updateField('city', e.target.value)}
              />
              <Input
                label="Country Jurisdiction"
                value={formData.country}
                onChange={(e) => updateField('country', e.target.value)}
              />
            </div>
          </div>
        )}

        {activeTab === 'currency' && (
          <div className="p-6 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#167a53] dark:text-[#34d399]" />
              <span>Currency, Precision & Fiscal Periods</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Base Operational Currency"
                value={formData.defaultCurrency}
                onChange={(e) => updateField('defaultCurrency', e.target.value)}
                options={[
                  { value: 'USD', label: 'USD - United States Dollar ($)' },
                  { value: 'SAR', label: 'SAR - Saudi Riyal (ر.س)' },
                  { value: 'AED', label: 'AED - UAE Dirham (د.إ)' },
                  { value: 'EUR', label: 'EUR - Euro (€)' },
                  { value: 'GBP', label: 'GBP - British Pound (£)' },
                ]}
              />

              <Input
                label="Currency Symbol"
                value={formData.currencySymbol}
                onChange={(e) => updateField('currencySymbol', e.target.value)}
              />

              <Select
                label="Decimal Precision"
                value={String(formData.currencyPrecision)}
                onChange={(e) => updateField('currencyPrecision', parseInt(e.target.value, 10))}
                options={[
                  { value: '2', label: '2 Decimals (e.g. $0.00)' },
                  { value: '3', label: '3 Decimals (e.g. 0.000)' },
                  { value: '0', label: '0 Decimals (Whole numbers)' },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="System Timezone"
                value={formData.timeZone}
                onChange={(e) => updateField('timeZone', e.target.value)}
                options={[
                  { value: 'Asia/Riyadh', label: 'Asia/Riyadh (UTC+03:00)' },
                  { value: 'Asia/Dubai', label: 'Asia/Dubai (UTC+04:00)' },
                  { value: 'UTC', label: 'UTC (Universal Coordinated Time)' },
                  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
                  { value: 'America/New_York', label: 'America/New York (EST/EDT)' },
                ]}
              />

              <Select
                label="Date Display Format"
                value={formData.dateFormat}
                onChange={(e) => updateField('dateFormat', e.target.value)}
                options={[
                  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO 8601)' },
                  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (Day first)' },
                  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US style)' },
                ]}
              />
            </div>

            <div className="p-3.5 rounded-lg bg-emerald-50/50 dark:bg-[#152019] border border-emerald-200/50 dark:border-emerald-900/40 text-xs text-slate-700 dark:text-neutral-300">
              <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                Multi-Currency Historical Preservation Rule:
              </p>
              <p className="mt-0.5 text-slate-600 dark:text-neutral-400">
                Changing base currency preserves all historical transactions with their recorded spot exchange rate and currency at posting time. No historical ledger entries will be retroactively mutated.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'tax' && (
          <div className="p-6 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#167a53] dark:text-[#34d399]" />
              <span>Tax Configuration & Document Sequence Prefixes</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Standard Tax / VAT Rate (%)"
                type="number"
                step="0.1"
                value={String(formData.defaultTaxRate)}
                onChange={(e) => updateField('defaultTaxRate', parseFloat(e.target.value) || 0)}
              />
              <Select
                label="Catalog Pricing Mode"
                value={formData.taxInclusivePricing ? 'inclusive' : 'exclusive'}
                onChange={(e) => updateField('taxInclusivePricing', e.target.value === 'inclusive')}
                options={[
                  { value: 'exclusive', label: 'Tax Exclusive (Tax calculated on top of price)' },
                  { value: 'inclusive', label: 'Tax Inclusive (Tax included in selling price)' },
                ]}
              />
            </div>

            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 pt-2">
              Sequential Document Prefixes
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Input
                label="Invoice Prefix"
                value={formData.invoicePrefix}
                onChange={(e) => updateField('invoicePrefix', e.target.value)}
              />
              <Input
                label="Quotation Prefix"
                value={formData.quotationPrefix}
                onChange={(e) => updateField('quotationPrefix', e.target.value)}
              />
              <Input
                label="Purchase Order Prefix"
                value={formData.purchaseOrderPrefix}
                onChange={(e) => updateField('purchaseOrderPrefix', e.target.value)}
              />
              <Input
                label="Delivery Note Prefix"
                value={formData.deliveryNotePrefix}
                onChange={(e) => updateField('deliveryNotePrefix', e.target.value)}
              />
            </div>
          </div>
        )}

        {activeTab === 'warehouses' && (
          <div className="p-6 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#167a53] dark:text-[#34d399]" />
              <span>Primary Warehouse & Stock Valuation Policy</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Default Fulfillment Warehouse"
                value={formData.defaultWarehouse}
                onChange={(e) => updateField('defaultWarehouse', e.target.value)}
              />
              <Select
                label="Negative Stock Policy"
                value={formData.negativeStockAllowed ? 'allowed' : 'strict'}
                onChange={(e) => updateField('negativeStockAllowed', e.target.value === 'allowed')}
                options={[
                  { value: 'strict', label: 'Strict Prohibition (Prevent sales exceeding available stock)' },
                  { value: 'allowed', label: 'Permit Negative Balance (With warning audit log)' },
                ]}
              />
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-800 text-xs text-slate-600 dark:text-neutral-400 space-y-1">
              <p className="font-semibold text-slate-900 dark:text-neutral-200">
                Audited Costing Valuation Method:
              </p>
              <p>
                Inventory valuation is computed using <strong>Weighted Average Cost (WAC)</strong> synchronized atomically with Goods Receipts and Delivery Notes across all warehouse and van bins.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'theme' && (
          <div className="p-6 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#167a53] dark:text-[#34d399]" />
              <span>Theme Appearance & Display Preferences</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'light', title: 'Light Theme', desc: 'Warm white, light grey surfaces, charcoal type, muted green accents' },
                { id: 'dark', title: 'Dark Theme', desc: 'Charcoal & neutral dark surfaces, readable text, muted green accents' },
                { id: 'system', title: 'System Default', desc: 'Automatically harmonize with operating system color preference' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    updateField('themePreference', opt.id as any);
                    setTheme(opt.id as any);
                  }}
                  className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                    formData.themePreference === opt.id
                      ? 'border-[#167a53] bg-[#167a53]/5 dark:bg-[#167a53]/20 ring-1 ring-[#167a53]'
                      : 'border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 bg-slate-50/50 dark:bg-[#151b18]'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-900 dark:text-neutral-100">
                    {opt.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                    {opt.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
