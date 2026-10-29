import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useUser } from '../../context/UserContext';
import { useToast } from '../../context/ToastContext';
import { UserProfile } from '../../types';
import { UserPlus, Mail, ShieldCheck, AlertCircle } from 'lucide-react';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteUserModal: React.FC<InviteUserModalProps> = ({ isOpen, onClose }) => {
  const { inviteUser } = useUser();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [role, setRole] = useState<UserProfile['role']>('Salesperson');
  const [assignedWarehouse, setAssignedWarehouse] = useState('Colombo Central Distribution Hub');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Staff member full name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('A valid company or staff email address is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await inviteUser({
        name: name.trim(),
        displayName: displayName.trim() || name.trim().split(' ')[0],
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        jobTitle: jobTitle.trim(),
        role,
        assignedWarehouse,
        status: 'active',
        preferredLanguage: 'English',
      });

      setIsSubmitting(false);

      if (res.success) {
        showToast('Staff Invited', res.message, 'success');
        setName('');
        setDisplayName('');
        setEmail('');
        setPhone('');
        setJobTitle('');
        onClose();
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || 'Failed to send invitation.');
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Invite New Team Member"
      description="Send authorization invitation and grant module access permissions"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Send Invitation
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Aslam Rizvi"
          />
          <Input
            label="Display / Short Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Aslam"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Corporate Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="aslam.r@zaidtrading.com"
          />
          <Input
            label="Phone Number (Optional)"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+94 77 000 0000"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Enterprise RBAC Role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserProfile['role'])}
            options={[
              { value: 'Owner / Administrator', label: 'Owner / Administrator (Full Master Access)' },
              { value: 'Manager', label: 'Manager (Operations & Approvals)' },
              { value: 'Salesperson', label: 'Salesperson (Invoicing & Customer CRM)' },
              { value: 'Storekeeper', label: 'Storekeeper (GRN & Warehouse Bins)' },
              { value: 'Accountant', label: 'Accountant (Ledger & Expenses)' },
              { value: 'Delivery Driver', label: 'Delivery Driver' },
            ]}
          />

          <Input
            label="Job Title / Position"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g. Senior Wholesale Representative"
          />
        </div>

        <Select
          label="Assigned Location / Warehouse Scope"
          value={assignedWarehouse}
          onChange={(e) => setAssignedWarehouse(e.target.value)}
          options={[
            { value: 'Colombo Central Distribution Hub', label: 'Colombo Central Distribution Hub' },
            { value: 'Kandy Regional Depot', label: 'Kandy Regional Depot' },
            { value: 'Galle Coastal Warehouse', label: 'Galle Coastal Warehouse' },
            { value: 'Van Fleet Unit 01 (Western Province)', label: 'Van Fleet Unit 01 (Western Province)' },
            { value: 'Corporate Head Office', label: 'Corporate Head Office' },
            { value: 'All Locations (Full Access)', label: 'All Locations (Full Access)' },
          ]}
        />

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-800 text-[11px] text-slate-500 dark:text-neutral-400">
          Invited users receive an authentication verification link via email. Their role permissions will take effect upon their first successful session handshake.
        </div>
      </form>
    </Dialog>
  );
};
