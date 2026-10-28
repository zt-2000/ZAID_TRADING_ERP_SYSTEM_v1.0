import React, { useState } from 'react';
import { BarChart3, Download, Calendar, Filter, FileSpreadsheet, FileText, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useToast } from '../context/ToastContext';

interface ReportsPageProps {
  currencySymbol?: string;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  currencySymbol = '$',
}) => {
  const { showToast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dateRange, setDateRange] = useState('this_month');

  const reportDefinitions = [
    {
      id: 'sales_detailed',
      title: 'Sales & Revenue Summary',
      category: 'sales',
      description: 'Audited sales invoices grouped by customer, item category, and sales rep.',
      period: 'Monthly / Custom',
    },
    {
      id: 'customer_aging',
      title: 'Accounts Receivable Aging',
      category: 'sales',
      description: 'Overdue receivables categorized into 0-30, 31-60, 61-90, and 90+ days.',
      period: 'Point in Time',
    },
    {
      id: 'inventory_valuation',
      title: 'Inventory Valuation by WAC',
      category: 'inventory',
      description: 'Warehouse on-hand quantities multiplied by weighted average cost (WAC).',
      period: 'Real-time',
    },
    {
      id: 'stock_movement_ledger',
      title: 'Audited Stock Movement History',
      category: 'inventory',
      description: 'Complete audit log of GRNs, dispatch delivery notes, and warehouse transfers.',
      period: 'Custom Date Range',
    },
    {
      id: 'trial_balance',
      title: 'Fiscal Trial Balance',
      category: 'financial',
      description: 'Sum of all debit and credit balances verifying fundamental double-entry equality.',
      period: 'Fiscal Year / Quarter',
    },
    {
      id: 'profit_and_loss',
      title: 'Profit & Loss (P&L) Statement',
      category: 'financial',
      description: 'Operating wholesale revenues minus COGS and SG&A expenses yields net income.',
      period: 'Monthly / Annual',
    },
    {
      id: 'van_reconciliation',
      title: 'Van Sales EOD Settlement',
      category: 'logistics',
      description: 'Daily driver reconciliation: loaded stock vs customer sales vs cash remitted.',
      period: 'Daily Settlement',
    },
    {
      id: 'audit_trail',
      title: 'System Activity & Compliance Audit',
      category: 'compliance',
      description: 'Immutable record of user logins, role switches, and database transaction posts.',
      period: 'Permanent Archive',
    },
  ];

  const filteredReports =
    selectedCategory === 'all'
      ? reportDefinitions
      : reportDefinitions.filter((r) => r.category === selectedCategory);

  const handleGenerateReport = (title: string, format: 'csv' | 'pdf') => {
    showToast(
      'Report Generation Queued',
      `Generating ${format.toUpperCase()} export for "${title}" based on audited database ledger.`,
      'info'
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-neutral-400 uppercase">
            ANALYTICS & FISCAL AUDIT
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-neutral-100 mt-1">
            Enterprise Financial & Operational Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
            Database-backed financial statements, aging schedules, inventory valuations, and compliance audits
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="text-xs bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-slate-700 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
          >
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">Active Month (October 2026)</option>
            <option value="last_quarter">Previous Quarter</option>
            <option value="ytd">Year to Date (YTD 2026)</option>
          </select>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200 dark:border-neutral-800 space-x-6 text-xs font-semibold overflow-x-auto pb-px">
        {[
          { id: 'all', label: 'All Reports Directory' },
          { id: 'sales', label: 'Sales & Receivables' },
          { id: 'inventory', label: 'Inventory & Stock' },
          { id: 'financial', label: 'Financial Statements' },
          { id: 'logistics', label: 'Van & Delivery Fleet' },
          { id: 'compliance', label: 'Audit & Compliance' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedCategory(tab.id)}
            className={`pb-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              selectedCategory === tab.id
                ? 'border-[#167a53] text-[#167a53] dark:text-[#34d399]'
                : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReports.map((report) => (
          <div
            key={report.id}
            className="p-5 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-neutral-700 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                  {report.category}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {report.period}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                {report.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1.5 leading-relaxed">
                {report.description}
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-neutral-800/80 flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGenerateReport(report.title, 'csv')}
                leftIcon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
              >
                CSV
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleGenerateReport(report.title, 'pdf')}
                leftIcon={<FileText className="w-3.5 h-3.5 text-slate-600 dark:text-neutral-300" />}
              >
                PDF Statement
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
