import React from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { DeliveryRecord, CompanySettings } from '../../types';
import { formatDateOnly } from '../../utils/formatters';
import { Printer, CheckCircle2, Truck } from 'lucide-react';

interface PrintableDeliveryNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: DeliveryRecord | null;
  settings: CompanySettings;
}

export const PrintableDeliveryNoteModal: React.FC<PrintableDeliveryNoteModalProps> = ({
  isOpen,
  onClose,
  delivery,
  settings,
}) => {
  if (!delivery) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Delivery Note — ${delivery.deliveryNumber}`}
      description="Official cargo dispatch advice and recipient sign-off document"
      maxWidth="3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] text-slate-500">
            Zaid Trading Commercial Logistics & Dispatch Advice
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
              Print Delivery Note (A4)
            </Button>
          </div>
        </div>
      }
    >
      <div className="bg-white text-slate-900 p-8 rounded-xl border border-slate-200 shadow-sm print:p-0 print:border-none print:shadow-none space-y-6 text-xs font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-slate-200 pb-6">
          <div className="space-y-2.5 max-w-sm">
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
            </div>
          </div>

          <div className="sm:text-right space-y-1.5 self-start">
            <span className="inline-block px-2.5 py-0.5 rounded bg-[#167a53]/10 text-[#167a53] text-[10px] font-bold uppercase tracking-wider">
              DELIVERY NOTE / DISPATCH ADVICE
            </span>
            <p className="text-xl font-mono font-bold text-slate-900">
              {delivery.deliveryNumber}
            </p>
            <div className="space-y-0.5 text-[11px] text-slate-600">
              <p>
                Sales Order Ref: <span className="font-mono font-semibold text-slate-800">{delivery.salesOrderNumber}</span>
              </p>
              <p>
                Scheduled Date: <span className="font-semibold text-slate-800">{formatDateOnly(delivery.scheduledDate)}</span>
              </p>
              {delivery.actualDeliveryDate && (
                <p>
                  Delivered Date: <span className="font-semibold text-emerald-700">{formatDateOnly(delivery.actualDeliveryDate)}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Dispatch Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200/80">
          <div>
            <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
              RECIPIENT & DELIVER TO:
            </p>
            <p className="text-sm font-bold text-slate-900">{delivery.customerName}</p>
            {delivery.customerPhone && (
              <p className="text-slate-600 text-[11px] mt-0.5">
                Contact: {delivery.customerPhone}
              </p>
            )}
            <p className="text-slate-700 text-[11px] mt-1 font-medium">
              Address: {delivery.deliveryAddress}
            </p>
          </div>

          <div className="sm:text-right text-[11px] text-slate-600 space-y-1">
            <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
              CARRIER & LOGISTICS:
            </p>
            <p>
              Assigned Staff / Driver:{' '}
              <span className="font-semibold text-slate-800">{delivery.assignedStaff}</span>
            </p>
            {delivery.vehicleDetails && (
              <p>
                Vehicle: <span className="font-mono text-slate-800">{delivery.vehicleDetails}</span>
              </p>
            )}
            {delivery.proofOfDeliveryRef && (
              <p>
                POD Token: <span className="font-mono font-bold text-[#167a53]">{delivery.proofOfDeliveryRef}</span>
              </p>
            )}
            <div>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                {delivery.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden border-collapse">
            <thead className="bg-slate-100/90 text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
              <tr className="border-b border-slate-200">
                <th className="py-2.5 px-3">Item Description</th>
                <th className="py-2.5 px-3 text-right w-24">Ordered Qty</th>
                <th className="py-2.5 px-3 text-right w-24">Prev. Delivered</th>
                <th className="py-2.5 px-3 text-right w-28">Current Shipment</th>
                <th className="py-2.5 px-3 text-right w-24">Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {delivery.items.map((item, index) => (
                <tr key={index} className="break-inside-avoid">
                  <td className="py-3 px-3 font-sans font-medium text-slate-900">
                    {item.itemDescription}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-600">{item.orderedQty}</td>
                  <td className="py-3 px-3 text-right text-slate-400">{item.previouslyDeliveredQty}</td>
                  <td className="py-3 px-3 text-right font-bold text-[#167a53]">{item.deliveredQty}</td>
                  <td className="py-3 px-3 text-right text-slate-700">{item.outstandingQty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {delivery.notes && (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-700">
            <span className="font-bold text-slate-900 block mb-0.5">Special Dispatch Remarks:</span>
            <p>{delivery.notes}</p>
          </div>
        )}

        {/* Signatures & Proof of Delivery */}
        <div className="pt-10 border-t border-slate-200 grid grid-cols-2 gap-8 text-[11px] text-slate-500">
          <div>
            <div className="border-b border-slate-300 w-52 mb-1.5" />
            <p className="font-semibold text-slate-800">
              Recipient Name: {delivery.recipientName || '________________________'}
            </p>
            <p className="mt-0.5">Received goods in good condition & complete count</p>
            <p className="text-[10px] text-slate-400 mt-1">Date & Time: ________________________</p>
          </div>
          <div className="text-right">
            <div className="border-b border-slate-300 w-52 ml-auto mb-1.5" />
            <p className="font-semibold text-slate-800">Carrier / Driver Signature</p>
            <p className="mt-0.5">Dispatched by {settings.companyName}</p>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
