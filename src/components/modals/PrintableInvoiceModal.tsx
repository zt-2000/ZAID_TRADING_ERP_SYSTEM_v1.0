import React from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { CompanySettings } from '../../types';
import { SaleRecord } from '../../context/TransactionContext';
import { formatCurrency, formatDateOnly } from '../../utils/formatters';
import { Printer, CheckCircle2 } from 'lucide-react';

interface PrintableInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: SaleRecord | null;
  settings: CompanySettings;
}

export const PrintableInvoiceModal: React.FC<PrintableInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  settings,
}) => {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const currencySymbol = settings.currencySymbol || 'Rs.';

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Sales Invoice — ${invoice.invoiceNumber}`}
      description="Tax-compliant wholesale sales invoice"
      maxWidth="3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] text-slate-500">
            Sri Lanka Inland Revenue Department (IRD) & Wholesale Trade Compliant
          </span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-4 h-4" />}
            >
              Print / Save PDF (A4)
            </Button>
          </div>
        </div>
      }
    >
      {/* Print-optimized paper container (A4 dimension friendly) */}
      <div className="bg-white text-slate-900 p-8 rounded-xl border border-slate-200 shadow-sm print:p-0 print:border-none print:shadow-none print:m-0 space-y-6 text-xs font-sans">
        {/* Header: Company & Invoice Metadata */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-slate-200 pb-6">
          <div className="space-y-2.5 max-w-sm">
            {/* Logo or Monogram */}
            <div className="flex items-center gap-3">
              {settings.logoUrl ? (
                <div className="h-12 max-w-[160px] flex items-center justify-start bg-transparent">
                  <img
                    src={settings.logoUrl}
                    alt={settings.companyName}
                    className="max-h-12 w-auto object-contain"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-[#167a53] flex items-center justify-center text-white font-bold text-lg">
                  Z
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-tight">
                  {settings.companyName}
                </h1>
                <p className="text-[11px] text-slate-500 font-medium">
                  {settings.legalName}
                </p>
              </div>
            </div>

            <div className="text-[11px] text-slate-600 space-y-0.5 leading-relaxed">
              <p>{settings.address}, {settings.city}, {settings.country}</p>
              <p>Hotline: {settings.phone} • Email: {settings.email}</p>
              <p>
                VAT / TIN Reg No: <span className="font-mono font-semibold text-slate-800">{settings.taxNumber}</span>
              </p>
            </div>
          </div>

          <div className="sm:text-right space-y-1.5 self-start">
            <span className="inline-block px-2.5 py-0.5 rounded bg-[#167a53]/10 text-[#167a53] text-[10px] font-bold uppercase tracking-wider">
              TAX INVOICE
            </span>
            <p className="text-xl font-mono font-bold text-slate-900">
              {invoice.invoiceNumber}
            </p>
            <div className="space-y-0.5 text-[11px] text-slate-600">
              <p>
                Date: <span className="font-semibold text-slate-800">{formatDateOnly(invoice.date)}</span>
              </p>
              <p>
                Payment Due: <span className="font-semibold text-slate-800">{formatDateOnly(invoice.dueDate)}</span>
              </p>
              <p>
                Facility: <span className="text-slate-800">{invoice.warehouse}</span>
              </p>
            </div>
            <div>
              <span
                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                  invoice.status === 'paid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {invoice.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Customer & Terms Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200/80">
          <div>
            <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
              BILLED TO CUSTOMER:
            </p>
            <p className="text-sm font-bold text-slate-900">{invoice.customerName}</p>
            {invoice.customerCode && (
              <p className="text-slate-500 font-mono text-[11px] mt-0.5">
                Account ID: {invoice.customerCode}
              </p>
            )}
            <p className="text-slate-600 text-[11px] mt-0.5">Commercial Wholesale Client</p>
          </div>

          <div className="sm:text-right text-[11px] text-slate-600 space-y-1">
            <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
              PAYMENT & DISPATCH:
            </p>
            <p>
              Payment Terms:{' '}
              <span className="font-semibold text-slate-800">
                {invoice.paymentTerms === 'immediate'
                  ? 'Cash / Immediate Settled'
                  : invoice.paymentTerms === '15_days'
                  ? 'Net 15 Days'
                  : invoice.paymentTerms === '60_days'
                  ? 'Net 60 Days'
                  : 'Net 30 Days'}
              </span>
            </p>
            <p>Currency: <span className="font-mono font-medium">LKR (Sri Lankan Rupee)</span></p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden border-collapse">
            <thead className="bg-slate-100/90 text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
              <tr className="border-b border-slate-200">
                <th className="py-2.5 px-3">Item / Description</th>
                <th className="py-2.5 px-3 text-right w-24">Qty / Unit</th>
                <th className="py-2.5 px-3 text-right w-32">Unit Price</th>
                <th className="py-2.5 px-3 text-right w-36">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="break-inside-avoid">
                <td className="py-3 px-3">
                  <p className="font-semibold text-slate-900">Wholesale Commercial Merchandise Lot</p>
                  <p className="text-[11px] text-slate-500">
                    Standard warehouse lot dispatch ({invoice.itemsCount} registered items)
                  </p>
                </td>
                <td className="py-3 px-3 text-right font-mono">{invoice.itemsCount} Lots</td>
                <td className="py-3 px-3 text-right font-mono">
                  {formatCurrency(invoice.subtotal / Math.max(1, invoice.itemsCount), currencySymbol)}
                </td>
                <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                  {formatCurrency(invoice.subtotal, currencySymbol)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totals & Settlement */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pt-2">
          {/* Bank Wire Settlement instructions */}
          <div className="text-[11px] text-slate-600 max-w-sm space-y-1 p-3 rounded-lg bg-slate-50 border border-slate-200">
            <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              BANK SETTLEMENT INSTRUCTIONS:
            </p>
            <p>Beneficiary: <span className="font-medium text-slate-800">{settings.legalName}</span></p>
            <p>Bank: <span className="font-medium text-slate-800">Commercial Bank of Ceylon PLC</span></p>
            <p>Account No: <span className="font-mono font-semibold text-slate-900">LK84 8000 0234 6080 1010</span></p>
            <p>Branch: Colombo Pettah Wholesale Branch</p>
            <p className="text-slate-500 text-[10px] pt-1">
              Please quote invoice number <span className="font-mono font-semibold">{invoice.invoiceNumber}</span> on remittance advice.
            </p>
          </div>

          <div className="w-full sm:w-72 space-y-1.5 text-xs self-end">
            <div className="flex justify-between text-slate-600">
              <span>Gross Subtotal:</span>
              <span className="font-mono">{formatCurrency(invoice.subtotal, currencySymbol)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Output VAT ({invoice.applyVat && invoice.taxTotal > 0 ? `${invoice.vatRate || 15}%` : '0% - Not Applied'}):</span>
              <span className="font-mono">{formatCurrency(invoice.taxTotal || 0, currencySymbol)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-slate-900 border-t border-slate-200 pt-1.5">
              <span>Total Invoice Amount:</span>
              <span className="font-mono text-[#167a53]">
                {formatCurrency(invoice.total, currencySymbol)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600 border-t border-dashed border-slate-200 pt-1">
              <span>Amount Paid:</span>
              <span className="font-mono text-emerald-700">
                {formatCurrency(invoice.paid, currencySymbol)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-slate-900">
              <span>Balance Outstanding:</span>
              <span className="font-mono">
                {formatCurrency(invoice.balance, currencySymbol)}
              </span>
            </div>
          </div>
        </div>

        {/* Signatures & Footer */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-[11px] text-slate-500">
          <div>
            <div className="border-b border-slate-300 w-48 mb-1.5" />
            <p className="font-semibold text-slate-700">Customer Receiver Signature & Stamp</p>
            <p>Received goods in satisfactory condition</p>
          </div>
          <div className="text-right">
            <div className="border-b border-slate-300 w-48 ml-auto mb-1.5" />
            <p className="font-semibold text-slate-700">For {settings.companyName}</p>
            <p>Authorized Commercial Signatory</p>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
