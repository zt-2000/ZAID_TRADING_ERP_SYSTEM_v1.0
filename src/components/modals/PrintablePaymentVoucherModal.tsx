import React from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { CompanySettings, SupplierPaymentRecord, PurchaseBillRecord } from '../../types';
import { formatCurrency, formatDateOnly } from '../../utils/formatters';
import { Printer, CheckCircle2, Building2 } from 'lucide-react';

interface PrintablePaymentVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: SupplierPaymentRecord | null;
  bill?: PurchaseBillRecord | null;
  settings: CompanySettings;
}

export const PrintablePaymentVoucherModal: React.FC<PrintablePaymentVoucherModalProps> = ({
  isOpen,
  onClose,
  payment,
  bill,
  settings,
}) => {
  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const currencySymbol = settings.currencySymbol || 'Rs.';

  const methodLabels: Record<string, string> = {
    bank_transfer: 'Bank Wire / EFT',
    cash: 'Cash Vault Disbursement',
    cheque: 'Account Payee Cheque',
    online_transfer: 'Real-time Online Banking',
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Payment Voucher — ${payment.voucherNumber}`}
      description="Official Supplier Payment Voucher & Disbursement Acknowledgment"
      maxWidth="3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] text-slate-500">
            Accounts Payable Disbursement Audit Voucher • General Ledger Posted
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
      {/* Printable Paper Canvas */}
      <div className="bg-white text-slate-900 p-8 rounded-xl border border-slate-200 shadow-sm print:p-0 print:border-none print:shadow-none print:m-0 space-y-6 text-xs font-sans">
        {/* Header: Company Letterhead */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-slate-200 pb-6">
          <div className="space-y-2 max-w-sm">
            <div className="flex items-center gap-3">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.companyName}
                  className="max-h-12 w-auto object-contain"
                />
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
                Business Reg: <span className="font-mono font-semibold">{settings.registrationNumber}</span>
              </p>
            </div>
          </div>

          <div className="sm:text-right space-y-1.5 self-start">
            <span className="inline-block px-3 py-1 rounded bg-emerald-50 text-[#167a53] text-[11px] font-bold uppercase tracking-wider border border-emerald-200">
              PAYMENT VOUCHER
            </span>
            <div className="text-[11px] space-y-0.5 pt-1">
              <p className="text-slate-500">
                Voucher Ref:{' '}
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {payment.voucherNumber}
                </span>
              </p>
              <p className="text-slate-500">
                Payment Date:{' '}
                <span className="font-semibold text-slate-800">
                  {formatDateOnly(payment.paymentDate)}
                </span>
              </p>
              <p className="text-slate-500">
                Status:{' '}
                <span className="font-semibold text-emerald-700 uppercase">
                  {payment.status}
                </span>
              </p>
              <p className="text-slate-400 font-mono text-[10px]">
                Timezone: Asia/Colombo
              </p>
            </div>
          </div>
        </div>

        {/* Payee & Payment Source Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-lg bg-slate-50 border border-slate-200">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              PAID TO (SUPPLIER ENTITY)
            </span>
            <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-500" />
              {payment.supplierName}
            </p>
            {payment.supplierCode && (
              <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                Vendor Code: {payment.supplierCode}
              </p>
            )}
            <p className="text-[11px] text-slate-500 mt-1">
              Account Status: Approved Vendor • Trade Payables (2010)
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              PAYMENT METHOD & SOURCE
            </span>
            <div className="space-y-1 text-xs">
              <p>
                <span className="text-slate-500">Method:</span>{' '}
                <span className="font-semibold text-slate-800">
                  {methodLabels[payment.paymentMethod] || payment.paymentMethod}
                </span>
              </p>
              <p>
                <span className="text-slate-500">Account:</span>{' '}
                <span className="font-semibold text-slate-800">
                  {payment.accountCode} — {payment.accountName}
                </span>
              </p>
              <p>
                <span className="text-slate-500">Audit Ref / Cheque #:</span>{' '}
                <span className="font-mono font-bold text-[#167a53] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  {payment.referenceNumber}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Bill Allocation & Settlement Breakdown */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Bill Settlement Breakdown
          </h3>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                  <th className="p-2.5">BILL # / DESCRIPTION</th>
                  <th className="p-2.5">DATE</th>
                  <th className="p-2.5 text-right">ORIGINAL BILL AMOUNT</th>
                  <th className="p-2.5 text-right">SETTLED IN THIS VOUCHER</th>
                  <th className="p-2.5 text-right">REMAINING BALANCE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2.5 font-medium text-slate-900">
                    <span className="font-mono font-bold text-slate-800">
                      {payment.billNumber || bill?.billNumber || 'Direct On-Account Settlement'}
                    </span>
                    {payment.notes && (
                      <p className="text-[11px] text-slate-500 mt-0.5">{payment.notes}</p>
                    )}
                  </td>
                  <td className="p-2.5 text-slate-600">
                    {bill ? formatDateOnly(bill.date) : formatDateOnly(payment.paymentDate)}
                  </td>
                  <td className="p-2.5 text-right font-mono text-slate-700">
                    {bill ? formatCurrency(bill.originalAmount, currencySymbol) : formatCurrency(payment.amount, currencySymbol)}
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                    {formatCurrency(payment.amount, currencySymbol)}
                  </td>
                  <td className="p-2.5 text-right font-mono text-slate-600">
                    {bill ? formatCurrency(bill.remainingBalance, currencySymbol) : 'Rs. 0.00'}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold">
                  <td colSpan={3} className="p-3 text-right uppercase text-[11px] text-slate-600">
                    Total Amount Disbursed
                  </td>
                  <td className="p-3 text-right font-mono text-sm text-[#167a53]">
                    {formatCurrency(payment.amount, currencySymbol)}
                  </td>
                  <td className="p-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* General Ledger Accounting Posting Summary */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            AUDITED GENERAL LEDGER ACCOUNTING ENTRY
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center justify-between p-2 rounded bg-white border border-slate-200">
              <span className="text-slate-600">
                <strong>DR</strong> Account 2010 (Trade Accounts Payable):
              </span>
              <span className="font-mono font-bold text-slate-900">
                {formatCurrency(payment.amount, currencySymbol)}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-white border border-slate-200">
              <span className="text-slate-600">
                <strong>CR</strong> Account {payment.accountCode} ({payment.accountName}):
              </span>
              <span className="font-mono font-bold text-slate-900">
                {formatCurrency(payment.amount, currencySymbol)}
              </span>
            </div>
          </div>
        </div>

        {/* Formal Signatures & Acknowledgement */}
        <div className="pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6 text-[11px]">
          <div className="border-t border-slate-300 pt-2 text-center space-y-1">
            <p className="font-bold text-slate-800">Prepared By</p>
            <p className="text-slate-500">{payment.recordedBy || 'Operator'}</p>
            <p className="text-[10px] text-slate-400">Date: {formatDateOnly(payment.paymentDate)}</p>
          </div>

          <div className="border-t border-slate-300 pt-2 text-center space-y-1">
            <p className="font-bold text-slate-800">Authorized Officer</p>
            <p className="text-slate-500">Zaid Trading Wholesale</p>
            <p className="text-[10px] text-slate-400">Finance & Accounts</p>
          </div>

          <div className="border-t border-slate-300 pt-2 text-center space-y-1">
            <p className="font-bold text-slate-800">Vendor Acknowledgment</p>
            <p className="text-slate-500">Receiver Signature & Stamp</p>
            <p className="text-[10px] text-slate-400">Date: ____________________</p>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
