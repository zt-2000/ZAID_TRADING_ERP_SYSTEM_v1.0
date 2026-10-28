import React, { useState, useRef } from 'react';
import { CompanySettings } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import {
  Building2,
  DollarSign,
  Receipt,
  MapPin,
  Palette,
  ShieldCheck,
  Save,
  Upload,
  Image as ImageIcon,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Lock,
  Database,
  RefreshCw,
  Cloud,
} from 'lucide-react';
import { checkSupabaseConnection, migrateLocalDataToCloud } from '../services/supabaseSync';

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
  const { currentUser, isSuperAdmin } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<
    'general' | 'currency' | 'tax' | 'warehouses' | 'theme' | 'database'
  >('general');
  const [formData, setFormData] = useState<CompanySettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [dbStatus, setDbStatus] = useState<{ isConfigured: boolean; connected: boolean; message: string } | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);

  const handleTestConnection = async () => {
    const res = await checkSupabaseConnection();
    setDbStatus(res);
    if (res.connected) {
      showToast('Database Connected', res.message, 'success');
    } else {
      showToast('Database Status', res.message, res.isConfigured ? 'warning' : 'info');
    }
  };

  const handleMigrateCloud = async () => {
    setIsMigrating(true);
    const res = await migrateLocalDataToCloud();
    setIsMigrating(false);
    if (res.success) {
      showToast('Migration Complete', 'Local storage entities successfully upserted to Supabase cloud DB.', 'success');
    } else {
      showToast('Migration Warning', res.errors.join('; '), 'error');
    }
  };

  // Logo state
  const [logoPreview, setLogoPreview] = useState<string | null>(initialSettings.logoUrl || null);
  const [isNewLogoStaged, setIsNewLogoStaged] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [confirmRemoveLogo, setConfirmRemoveLogo] = useState(false);

  const updateField = <K extends keyof CompanySettings>(key: K, value: CompanySettings[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoError(null);
    setConfirmRemoveLogo(false);

    // 1. File Type Validation
    const validMimes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!validMimes.includes(file.type)) {
      setLogoError('Invalid file format. Please upload a PNG, JPEG, or WebP image.');
      showToast('Invalid File', 'Only PNG, JPEG, and WebP files are supported for company logos.', 'error');
      return;
    }

    // 2. File Size Validation (2 MB limit)
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setLogoError(`File size (${sizeMB} MB) exceeds the maximum allowed limit of 2 MB.`);
      showToast('File Too Large', `Company logo must be under 2 MB (your file is ${sizeMB} MB).`, 'error');
      return;
    }

    // 3. Image Content Validation (read and load into Image object)
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUri = event.target?.result as string;
      const testImg = new Image();
      testImg.onload = () => {
        if (testImg.naturalWidth < 10 || testImg.naturalHeight < 10) {
          setLogoError('The uploaded image is too small or corrupted.');
          showToast('Corrupted Image', 'The image dimensions are invalid.', 'error');
          return;
        }

        setLogoPreview(dataUri);
        setIsNewLogoStaged(true);
        updateField('logoUrl', dataUri);
        showToast('Logo Staged', 'Logo preview loaded. Click "Save Configuration" to commit.', 'info');
      };
      testImg.onerror = () => {
        setLogoError('Failed to parse image file. File content may be corrupted.');
        showToast('Parse Error', 'Could not read image content.', 'error');
      };
      testImg.src = dataUri;
    };
    reader.readAsDataURL(file);
  };

  const handleCancelLogoStaging = () => {
    setLogoPreview(initialSettings.logoUrl || null);
    setIsNewLogoStaged(false);
    setLogoError(null);
    updateField('logoUrl', initialSettings.logoUrl || '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = () => {
    if (!confirmRemoveLogo) {
      setConfirmRemoveLogo(true);
      return;
    }

    setLogoPreview(null);
    setIsNewLogoStaged(false);
    setConfirmRemoveLogo(false);
    setLogoError(null);
    updateField('logoUrl', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showToast('Logo Removed', 'Company logo removed. Reverted to default corporate badge.', 'info');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSuperAdmin) {
      showToast('Unauthorized', 'Only system administrators can modify company-wide settings.', 'error');
      return;
    }

    if (!formData.companyName.trim()) {
      showToast('Validation Error', 'Company commercial name cannot be empty', 'error');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsNewLogoStaged(false);
      onSaveSettings(formData);
      if (formData.themePreference) {
        setTheme(formData.themePreference);
      }
      showToast(
        'Configuration Saved',
        'Zaid Trading ERP enterprise parameters and branding have been synchronized.',
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
          disabled={!isSuperAdmin}
          leftIcon={<Save className="w-4 h-4" />}
        >
          Save Configuration
        </Button>
      </div>

      {!isSuperAdmin && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <Lock className="w-4 h-4 shrink-0" />
          <span>
            You are signed in as <strong>{currentUser.role}</strong>. Only authorized Administrators can modify company-wide identity and branding settings.
          </span>
        </div>
      )}

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
          <span>Company Profile & Logo</span>
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

        <button
          type="button"
          onClick={() => {
            setActiveTab('database');
            handleTestConnection();
          }}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'database'
              ? 'border-[#167a53] text-[#167a53] dark:text-[#34d399]'
              : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Supabase & Multi-User DB</span>
        </button>
      </div>

      {/* Tab Panels */}
      <form onSubmit={handleSave} className="space-y-6">
        {activeTab === 'general' && (
          <div className="space-y-6">
            {/* Dedicated Company Logo Section */}
            <div className="p-6 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-neutral-800 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#167a53] dark:text-[#34d399]" />
                    <span>Company Logo & Corporate Branding</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                    Rendered in application navigation, commercial invoices, delivery notes, and audited reports
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleLogoFileChange}
                    disabled={!isSuperAdmin}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!isSuperAdmin}
                    leftIcon={<Upload className="w-3.5 h-3.5" />}
                  >
                    {logoPreview ? 'Replace Logo' : 'Upload Logo'}
                  </Button>

                  {logoPreview && (
                    <Button
                      type="button"
                      variant={confirmRemoveLogo ? 'danger' : 'ghost'}
                      size="sm"
                      onClick={handleRemoveLogo}
                      disabled={!isSuperAdmin}
                      className={confirmRemoveLogo ? '' : 'text-rose-600 dark:text-rose-400'}
                      leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                    >
                      {confirmRemoveLogo ? 'Confirm Remove?' : 'Remove'}
                    </Button>
                  )}

                  {isNewLogoStaged && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelLogoStaging}
                      leftIcon={<X className="w-3.5 h-3.5" />}
                    >
                      Cancel Staging
                    </Button>
                  )}
                </div>
              </div>

              {logoError && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{logoError}</span>
                </div>
              )}

              {/* Dual Surface Preview Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Light Surface Preview */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center min-h-[140px] text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Light Surface & Print Preview
                  </p>
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo on light surface"
                      className="max-h-16 max-w-[200px] object-contain drop-shadow-xs"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-slate-400">
                      <div className="w-12 h-12 rounded-xl bg-[#167a53] flex items-center justify-center text-white font-bold text-xl shadow-xs">
                        {formData.companyName.charAt(0) || 'Z'}
                      </div>
                      <span className="text-[11px]">Default Corporate Monogram</span>
                    </div>
                  )}
                </div>

                {/* Dark Surface Preview */}
                <div className="p-4 rounded-xl border border-neutral-800 bg-[#121614] flex flex-col items-center justify-center min-h-[140px] text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-3">
                    Dark Surface & Sidebar Preview
                  </p>
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo on dark surface"
                      className="max-h-16 max-w-[200px] object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-neutral-500">
                      <div className="w-12 h-12 rounded-xl bg-[#167a53] flex items-center justify-center text-white font-bold text-xl shadow-xs">
                        {formData.companyName.charAt(0) || 'Z'}
                      </div>
                      <span className="text-[11px]">Default Corporate Monogram</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Logo Specs & Policy */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-lg bg-slate-50 dark:bg-[#151b18] text-[11px] text-slate-500 dark:text-neutral-400">
                <span>
                  Supported: <strong>PNG (transparent)</strong>, <strong>JPEG</strong>, <strong>WebP</strong> • Max: <strong>2 MB</strong> • Proportional scaling preserved.
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ready for Supabase Storage</span>
                </span>
              </div>
            </div>

            {/* Enterprise Commercial Identity */}
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
                onChange={(e) => {
                  const val = e.target.value;
                  let sym = '$';
                  if (val === 'LKR') sym = 'Rs.';
                  else if (val === 'SAR') sym = 'ر.س';
                  else if (val === 'AED') sym = 'د.إ';
                  else if (val === 'EUR') sym = '€';
                  else if (val === 'GBP') sym = '£';
                  setFormData((prev) => ({
                    ...prev,
                    defaultCurrency: val,
                    currencySymbol: sym,
                  }));
                }}
                options={[
                  { value: 'LKR', label: 'LKR - Sri Lankan Rupee (Rs.)' },
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
                  { value: '2', label: '2 Decimals (e.g. Rs. 0.00)' },
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
                  { value: 'Asia/Colombo', label: 'Asia/Colombo (UTC+05:30 - Sri Lanka)' },
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

        {activeTab === 'database' && (
          <div className="p-6 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-neutral-800 pb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#167a53] dark:text-[#34d399]" />
                  <span>Supabase PostgreSQL & Multi-User Shared Persistence</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  Verify cloud connection status, execute idempotent migrations, and audit RLS security
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestConnection}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Test Connection
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleMigrateCloud}
                  isLoading={isMigrating}
                  leftIcon={<Cloud className="w-3.5 h-3.5" />}
                >
                  Migrate Local Data
                </Button>
              </div>
            </div>

            {/* Connection Status Box */}
            <div className={`p-4 rounded-xl border text-xs space-y-2 ${
              dbStatus?.connected
                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300'
                : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300'
            }`}>
              <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px]">
                {dbStatus?.connected ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Supabase Cloud Database Connected</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Operating Mode: Local Storage Browser Persistence</span>
                  </>
                )}
              </div>
              <p className="leading-relaxed">
                {dbStatus?.message || 'Click "Test Connection" to inspect Supabase cloud connectivity status.'}
              </p>
            </div>

            {/* Migration Schema Notice */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-800 text-xs space-y-2">
              <p className="font-bold text-slate-800 dark:text-neutral-200">
                SQL Schema Migration Path:
              </p>
              <code className="block p-2 rounded bg-slate-100 dark:bg-[#111613] font-mono text-[11px] text-slate-700 dark:text-neutral-300">
                /supabase/migrations/20261028_zaid_erp_initial_schema.sql
              </code>
              <p className="text-slate-500 dark:text-neutral-400 text-[11px] leading-relaxed">
                Includes DDL definitions for 17 relational tables, foreign key constraints, indexes on `sku` and `invoice_number`, and Row Level Security (RLS) policies enforcing multi-tenant company isolation via `auth.uid()`.
              </p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
