import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { UserPreferences, ThemeMode } from '../../types';
import { Sliders, Sun, Moon, Laptop, Bell, Clock, Calendar, CheckCircle2 } from 'lucide-react';

interface UserPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserPreferencesModal: React.FC<UserPreferencesModalProps> = ({ isOpen, onClose }) => {
  const { preferences, updatePreferences } = useUser();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();

  const [formPrefs, setFormPrefs] = useState<UserPreferences>(preferences);
  const [isSaving, setIsSaving] = useState(false);

  const handleThemeChange = (newTheme: ThemeMode) => {
    setFormPrefs((prev) => ({ ...prev, theme: newTheme }));
    setTheme(newTheme);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      updatePreferences(formPrefs);
      setIsSaving(false);
      showToast('Preferences Saved', 'Your personal display and notification preferences have been saved.', 'success');
      onClose();
    }, 300);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Personal User Preferences"
      description="Configure your personal interface display, date format, and notifications"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} isLoading={isSaving}>
            Save Preferences
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSave} className="space-y-5">
        {/* Theme Preference */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-2">
            Personal Theme Appearance
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'system', label: 'System', icon: Laptop },
            ].map((opt) => {
              const Icon = opt.icon;
              const isSelected = formPrefs.theme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleThemeChange(opt.id as ThemeMode)}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#167a53] bg-[#167a53]/10 dark:bg-[#167a53]/20 text-[#167a53] dark:text-[#34d399] font-semibold'
                      : 'border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-[#161c19]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date & Time Preferences */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Preferred Date Format"
            value={formPrefs.dateFormat}
            onChange={(e) =>
              setFormPrefs((prev) => ({
                ...prev,
                dateFormat: e.target.value as any,
              }))
            }
            options={[
              { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2026-10-28)' },
              { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (28/10/2026)' },
              { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (10/28/2026)' },
            ]}
          />

          <Select
            label="Preferred Time Format"
            value={formPrefs.timeFormat}
            onChange={(e) =>
              setFormPrefs((prev) => ({
                ...prev,
                timeFormat: e.target.value as any,
              }))
            }
            options={[
              { value: '24h', label: '24-hour (14:30:00)' },
              { value: '12h', label: '12-hour AM/PM (02:30 PM)' },
            ]}
          />
        </div>

        {/* Notification Preferences */}
        <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-neutral-800">
          <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300">
            Notification Subscriptions
          </label>

          <div className="space-y-2">
            {[
              {
                id: 'emailNotifications',
                title: 'Email Notifications & Order Receipts',
                desc: 'Receive transaction confirmations and customer payment notices via email',
              },
              {
                id: 'lowStockAlerts',
                title: 'Low Stock & Reorder Threshold Alerts',
                desc: 'Real-time alert when inventory batches fall below minimum safety levels',
              },
              {
                id: 'financialAlerts',
                title: 'End-of-Day Financial Reconciliation Digest',
                desc: 'Daily ledger settlement summary with van sales and cash collections',
              },
            ].map((item) => {
              const isChecked = formPrefs[item.id as keyof UserPreferences] as boolean;
              return (
                <label
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-xl border border-slate-200/80 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-[#161c19] cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) =>
                      setFormPrefs((prev) => ({
                        ...prev,
                        [item.id]: e.target.checked,
                      }))
                    }
                    className="mt-0.5 rounded text-[#167a53] focus:ring-[#167a53] h-4 w-4 border-slate-300 dark:border-neutral-700"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-neutral-100">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Corporate Boundary Note */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-800 text-[11px] text-slate-500 dark:text-neutral-400">
          Personal preferences apply only to your operator session. The company base currency (<strong>LKR</strong>) and fiscal timezone (<strong>Asia/Colombo UTC+05:30</strong>) remain governed by Company Settings.
        </div>
      </form>
    </Dialog>
  );
};
