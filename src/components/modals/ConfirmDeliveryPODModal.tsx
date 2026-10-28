import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useTransactions } from '../../context/TransactionContext';
import { useToast } from '../../context/ToastContext';
import { DeliveryRecord } from '../../types';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

interface ConfirmDeliveryPODModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: DeliveryRecord | null;
}

export const ConfirmDeliveryPODModal: React.FC<ConfirmDeliveryPODModalProps> = ({
  isOpen,
  onClose,
  delivery,
}) => {
  const { confirmDeliveryPOD } = useTransactions();
  const { showToast } = useToast();

  const todayIso = new Date().toISOString().slice(0, 16);

  const [recipientName, setRecipientName] = useState(delivery?.customerName || '');
  const [proofRef, setProofRef] = useState(`POD-${Date.now().toString().slice(-6)}`);
  const [deliveryDateTime, setDeliveryDateTime] = useState(todayIso);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (delivery) {
      setRecipientName(delivery.recipientName || delivery.customerName || '');
      setProofRef(delivery.proofOfDeliveryRef || `POD-${Date.now().toString().slice(-6)}`);
      setDeliveryDateTime(todayIso);
    }
  }, [delivery, isOpen]);

  if (!delivery) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim()) {
      showToast('Validation Error', 'Recipient name is required for Proof of Delivery', 'error');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const res = confirmDeliveryPOD(
        delivery.id,
        recipientName.trim(),
        proofRef.trim() || undefined,
        deliveryDateTime,
        note.trim() || undefined
      );

      setIsSubmitting(false);
      if (res.success) {
        showToast(
          'Delivery Confirmed',
          `Delivery ${delivery.deliveryNumber} confirmed for ${recipientName}. POD Ref: ${proofRef}.`,
          'success'
        );
        onClose();
      } else {
        showToast('Error', res.error || 'Failed to confirm delivery', 'error');
      }
    }, 200);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Confirm Delivery & Proof of Delivery (POD) — ${delivery.deliveryNumber}`}
      description="Record recipient confirmation, delivery timestamp, and proof of delivery reference"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] text-slate-500">
            Updates delivery status to Delivered
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
              Confirm Delivery
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        <div className="p-3 bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-800 rounded-lg space-y-1">
          <p className="font-semibold text-slate-800 dark:text-neutral-200">
            Sales Order #: <span className="font-mono">{delivery.salesOrderNumber}</span>
          </p>
          <p className="text-slate-600 dark:text-neutral-400">
            Customer: <span className="font-medium text-slate-900 dark:text-neutral-100">{delivery.customerName}</span>
          </p>
          <p className="text-slate-500">
            Address: {delivery.deliveryAddress}
          </p>
        </div>

        <Input
          label="Recipient Full Name / Receiving Agent"
          placeholder="e.g. K. Wickramasinghe (Store Manager)"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
          required
          autoFocus
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Actual Delivery Date & Time"
            type="datetime-local"
            value={deliveryDateTime}
            onChange={(e) => setDeliveryDateTime(e.target.value)}
            required
          />
          <Input
            label="Proof of Delivery Ref / Signature #"
            placeholder="e.g. POD-98012"
            value={proofRef}
            onChange={(e) => setProofRef(e.target.value)}
            optional
            helperText="Receipt / physical signature token"
          />
        </div>

        <Input
          label="Delivery Officer / Inspector Notes"
          placeholder="e.g. Goods offloaded at rear dock. 0 defects reported by recipient."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          optional
        />
      </form>
    </Dialog>
  );
};
