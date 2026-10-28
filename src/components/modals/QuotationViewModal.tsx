import React from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { QuotationRecord, CompanySettings } from '../../types';
import { useTransactions } from '../../context/TransactionContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDateOnly } from '../../utils/formatters';
import { Printer, ArrowRight, Ban, CheckCircle2 } from 'lucide-react';

interface QuotationViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: QuotationRecord | null;
  settings?: CompanySettings;
  currencySymbol?: string;
}

export const QuotationViewModal: React.FC<QuotationViewModalProps> = ({
  isOpen,
  onClose,
  quotation,
  settings,
  currencySymbol = 'Rs.',
}) => {
  const { convertQuotationToSalesOrder, updateQuotation } = useTransactions();
  const { showToast } = useToast();

  if (!quotation) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleConvert = () => {
    if (quotation.status === 'converted') {
      showToast('Already Converted', `Quotation ${quotation.quotationNumber} has already been converted.`, 'info');
      return;
    }

    const result = convertQuotationToSalesOrder(quotation.id);
    if (!result.success) {
      showToast('Conversion Error', result.error, 'error');
      return;
    }

    showToast(
      'Converted to Sales Order',
      `Quotation ${quotation.quotationNumber} converted to ${result.salesOrder?.orderNumber}. Ready in Sales Orders tab.`,
      'success'
    );
    onClose();
  };

  const handleCancel = () => {
    updateQuotation(quotation.id, { status: 'rejected' });
    showToast('Quotation Cancelled', `Quotation ${quotation.quotationNumber} has been marked rejected/cancelled.`, 'info');
    onClose();
  };

  const statusVariant =
    quotation.status === 'converted'
      ? 'success'
      : quotation.status === 'accepted'
      ? 'success'
      : quotation.status === 'sent'
      ? 'info'
      : quotation.status === 'rejected'
      ? 'danger'
      : 'warning';

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Quotation Proforma — ${quotation.quotationNumber}`}
      description="Formal pricing document and customer sales quotation"
      maxWidth="3xl"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2">
            {quotation.status !== 'converted' && quotation.status !== 'rejected' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                leftIcon={<Ban className="w-3.5 h-3.5 text-rose-500" />}
              >
                Mark Rejected
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-4 h-4" />}
            >
              Print / PDF
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
            {quotation.status !== 'converted' ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleConvert}
                leftIcon={<ArrowRight className="w-4 h-4" />}
              >
                Convert to Sales Order
              </Button>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-4 h-4" />
                Converted to {quotation.convertedSalesOrderNumber}
              </span>
            )}
          </div>
        </div>
      }
    >
      <div className="bg-white text-slate-900 p-6 rounded-xl border border-slate-200 space-y-6 print:p-0 print:border-none">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-1">
            <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#167a53]/10 text-[#167a53] text-[11px] font-bold uppercase tracking-wider">
              WHOLESALE PRICE QUOTATION
            </span>
            <h2 className="text-xl font-mono font-bold text-slate-900 mt-1">
              {quotation.quotationNumber}
            </h2>
            <p className="text-xs text-slate-500">
              Issuing Facility: <span className="font-semibold text-slate-700">{quotation.warehouse}</span>
            </p>
          </div>

          <div className="sm:text-right space-y-1 text-xs">
            <div>
              <span className="text-slate-500">Quotation Date: </span>
              <span className="font-semibold text-slate-800">{formatDateOnly(quotation.date)}</span>
            </div>
            <div>
              <span className="text-slate-500">Valid Until: </span>
              <span className="font-semibold text-slate-800">{formatDateOnly(quotation.expiryDate)}</span>
            </div>
            {quotation.referenceNumber && (
              <div>
                <span className="text-slate-500">Client Ref: </span>
                <span className="font-mono font-medium text-slate-700">{quotation.referenceNumber}</span>
              </div>
            )}
            <div className="pt-1">
              <Badge variant={statusVariant} dot>
                {quotation.status.toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
          <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
            PREPARED FOR:
          </p>
          <p className="text-sm font-bold text-slate-900">{quotation.customerName}</p>
          {quotation.customerCode && (
            <p className="text-slate-500 font-mono text-[11px] mt-0.5">
              Customer Code: {quotation.customerCode}
            </p>
          )}
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Item Description</th>
                <th className="py-2.5 px-3 text-right">Qty</th>
                <th className="py-2.5 px-3 text-right">Unit Price</th>
                <th className="py-2.5 px-3 text-right">Discount</th>
                <th className="py-2.5 px-3 text-right">Tax (VAT)</th>
                <th className="py-2.5 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {quotation.items.map((item, index) => (
                <tr key={index}>
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-900">
                    {item.itemDescription}
                  </td>
                  <td className="py-2.5 px-3 text-right">{item.quantity}</td>
                  <td className="py-2.5 px-3 text-right">{formatCurrency(item.unitPrice, currencySymbol)}</td>
                  <td className="py-2.5 px-3 text-right text-slate-500">
                    {item.discount > 0 ? `${item.discount}%` : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-500">{item.taxRate}%</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                    {formatCurrency(item.total, currencySymbol)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pt-2">
          <div className="text-xs text-slate-600 max-w-sm">
            {quotation.notes && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold block text-slate-700 mb-0.5">Notes & Terms:</span>
                <p className="leading-relaxed">{quotation.notes}</p>
              </div>
            )}
          </div>

          <div className="w-full sm:w-64 space-y-1.5 text-xs self-end">
            <div className="flex justify-between text-slate-600">
              <span>Gross Subtotal:</span>
              <span className="font-mono">{formatCurrency(quotation.subtotal, currencySymbol)}</span>
            </div>
            {quotation.discountTotal > 0 && (
              <div className="flex justify-between text-amber-600">
                <span>Discount Total:</span>
                <span className="font-mono">-{formatCurrency(quotation.discountTotal, currencySymbol)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>VAT / Tax Total:</span>
              <span className="font-mono">{formatCurrency(quotation.taxTotal, currencySymbol)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-slate-900 border-t border-slate-200 pt-1.5">
              <span>Total Quotation:</span>
              <span className="font-mono text-[#167a53]">
                {formatCurrency(quotation.total, currencySymbol)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
