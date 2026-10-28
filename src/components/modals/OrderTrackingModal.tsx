import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { OrderTrackingRecord, SalesOrderRecord } from '../../types';
import { useTransactions } from '../../context/TransactionContext';
import { useToast } from '../../context/ToastContext';
import { formatDateOnly } from '../../utils/formatters';
import { Package, Truck, Clock, CheckCircle2, AlertTriangle, ArrowRight, User } from 'lucide-react';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackingRecord: OrderTrackingRecord | null;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  trackingRecord,
}) => {
  const { updateSalesOrderStatus, salesOrders } = useTransactions();
  const { showToast } = useToast();

  const [newStatus, setNewStatus] = useState<SalesOrderRecord['status']>('processing');
  const [updateNote, setUpdateNote] = useState('');
  const [staffName, setStaffName] = useState('Rashid Al-Zaid (Operations)');
  const [isUpdating, setIsUpdating] = useState(false);

  if (!trackingRecord) return null;

  const matchingOrder = salesOrders.find(
    (o) => o.orderNumber === trackingRecord.orderNumber || o.id === trackingRecord.sourceOrderId
  );

  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchingOrder) {
      showToast('Error', 'Matching sales order not found.', 'error');
      return;
    }

    setIsUpdating(true);
    setTimeout(() => {
      const res = updateSalesOrderStatus(matchingOrder.id, newStatus, updateNote.trim() || undefined, staffName);
      setIsUpdating(false);
      if (res.success) {
        showToast(
          'Tracking Status Updated',
          `Order ${trackingRecord.orderNumber} transitioned to ${newStatus.replace('_', ' ').toUpperCase()}.`,
          'success'
        );
        setUpdateNote('');
        onClose();
      }
    }, 200);
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'completed':
        return <Badge variant="success">COMPLETED</Badge>;
      case 'dispatched':
        return <Badge variant="info">DISPATCHED</Badge>;
      case 'ready':
      case 'awaiting_dispatch':
        return <Badge variant="info">READY FOR DISPATCH</Badge>;
      case 'processing':
        return <Badge variant="warning">PROCESSING</Badge>;
      case 'confirmed':
        return <Badge variant="neutral">CONFIRMED</Badge>;
      case 'on_hold':
      case 'cancelled':
        return <Badge variant="danger">{st.toUpperCase()}</Badge>;
      default:
        return <Badge variant="neutral">{st.toUpperCase()}</Badge>;
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Live Order Tracking — ${trackingRecord.trackingNumber}`}
      description={`Audit timeline and lifecycle management for Sales Order ${trackingRecord.orderNumber}`}
      maxWidth="2xl"
      footer={
        <Button variant="secondary" size="sm" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Header overview card */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-800 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-neutral-700/60 pb-3">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                TRACKING NUMBER
              </span>
              <p className="font-mono text-base font-bold text-slate-900 dark:text-neutral-100">
                {trackingRecord.trackingNumber}
              </p>
            </div>
            <div>{getStatusBadge(trackingRecord.status)}</div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
            <div>
              <span className="text-slate-500 text-[11px] block">Customer:</span>
              <span className="font-semibold text-slate-800 dark:text-neutral-200">
                {trackingRecord.customerName}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Sales Order #:</span>
              <span className="font-mono font-medium text-slate-800 dark:text-neutral-200">
                {trackingRecord.orderNumber}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Current Facility:</span>
              <span className="font-medium text-slate-800 dark:text-neutral-200">
                {trackingRecord.currentLocation}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Est. Delivery:</span>
              <span className="font-medium text-slate-800 dark:text-neutral-200">
                {trackingRecord.estimatedDelivery ? formatDateOnly(trackingRecord.estimatedDelivery) : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* Status transition form */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#181f1b] space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-neutral-200 flex items-center gap-1.5">
            <ArrowRight className="w-3.5 h-3.5 text-[#167a53]" />
            Advance Order Pipeline Status
          </h4>

          <form onSubmit={handleUpdateStatus} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="New Pipeline Status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
                options={[
                  { value: 'new', label: 'New / Draft' },
                  { value: 'confirmed', label: 'Confirmed (Payment/Credit Cleared)' },
                  { value: 'processing', label: 'Processing (Warehouse Picking)' },
                  { value: 'ready', label: 'Ready for Collection / Van Staging' },
                  { value: 'awaiting_dispatch', label: 'Awaiting Driver Dispatch' },
                  { value: 'dispatched', label: 'Dispatched (Out with Van Driver)' },
                  { value: 'completed', label: 'Completed (Customer Signed & Delivered)' },
                  { value: 'on_hold', label: 'On Hold (Credit Review / Stock Out)' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
              />
              <Input
                label="Authorized Staff Name"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                required
              />
            </div>

            <Input
              label="Transition Audit Log Memo"
              placeholder="e.g. Picking verified from Bay A-01-01. Staged at loading dock 2."
              value={updateNote}
              onChange={(e) => setUpdateNote(e.target.value)}
              optional
            />

            <div className="flex justify-end">
              <Button
                variant="primary"
                size="sm"
                type="submit"
                isLoading={isUpdating}
              >
                Log Status Transition
              </Button>
            </div>
          </form>
        </div>

        {/* Audit timeline */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-neutral-200 mb-3 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Audit History & Milestones
          </h4>

          <div className="relative border-l-2 border-slate-200 dark:border-neutral-800 ml-3.5 space-y-4 text-xs">
            {trackingRecord.events.map((evt) => (
              <div key={evt.id} className="relative pl-5">
                {/* Node icon */}
                <div className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-white dark:bg-[#151b18] border-2 border-[#167a53] flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#167a53]" />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-neutral-100">
                      {evt.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      • {evt.updatedBy}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(evt.timestamp).toLocaleString()}
                  </span>
                </div>

                <p className="text-slate-600 dark:text-neutral-400 mt-0.5 text-xs">
                  {evt.note}
                </p>
                {evt.location && (
                  <span className="inline-block mt-1 text-[10px] bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 px-2 py-0.5 rounded font-mono">
                    Facility: {evt.location}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Dialog>
  );
};
