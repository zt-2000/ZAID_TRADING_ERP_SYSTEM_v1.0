import React, { useState, useEffect } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useUser } from '../../context/UserContext';
import { useToast } from '../../context/ToastContext';
import { UserProfile } from '../../types';
import { ShieldCheck, AlertCircle, Trash2, UserX, UserCheck } from 'lucide-react';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, user }) => {
  const { updateUser, toggleUserStatus, deleteUser, currentUser } = useUser();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [role, setRole] = useState<UserProfile['role']>('Salesperson');
  const [assignedWarehouse, setAssignedWarehouse] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setName(user.name);
      setDisplayName(user.displayName || user.name);
      setEmail(user.email);
      setPhone(user.phone || '');
      setJobTitle(user.jobTitle || '');
      setRole(user.role);
      setAssignedWarehouse(user.assignedWarehouse || 'Colombo Central Distribution Hub');
      setStatus(user.status);
      setError(null);
      setConfirmDelete(false);
    }
  }, [user, isOpen]);

  if (!user) return null;

  const isSelf = Boolean(currentUser && user.id === currentUser.id);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Staff member full name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('A valid email address is required.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const res = await updateUser(user.id, {
        name: name.trim(),
        displayName: displayName.trim() || name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        jobTitle: jobTitle.trim(),
        role,
        assignedWarehouse,
        status,
      });

      setIsSaving(false);
      if (res.success) {
        showToast('Staff Record Updated', res.message, 'success');
        onClose();
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setIsSaving(false);
      setError(err?.message || 'Failed to update user.');
    }
  };

  const handleToggleStatus = async () => {
    try {
      const res = await toggleUserStatus(user.id);
      if (res.success) {
        showToast('Status Updated', res.message, 'success');
        setStatus((prev) => (prev === 'active' ? 'inactive' : 'active'));
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to toggle status.');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    try {
      const res = await deleteUser(user.id);
      if (res.success) {
        showToast('Account Removed', res.message, 'info');
        onClose();
      } else {
        setError(res.message);
        setConfirmDelete(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to delete user.');
      setConfirmDelete(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Manage Staff Account — ${user.name}`}
      description="Update role privileges, assigned branch scope, and access status"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-between w-full">
          {!isSelf ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              {confirmDelete ? 'Confirm Permanent Delete?' : 'Delete Account'}
            </Button>
          ) : (
            <span className="text-[11px] text-slate-400">Current active account</span>
          )}

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} isLoading={isSaving}>
              Save Changes
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSave} className="space-y-4">
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
          />
          <Input
            label="Display / Short Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Phone Number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Enterprise RBAC Role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserProfile['role'])}
            options={[
              { value: 'Owner / Administrator', label: 'Owner / Administrator' },
              { value: 'Manager', label: 'Manager' },
              { value: 'Salesperson', label: 'Salesperson' },
              { value: 'Storekeeper', label: 'Storekeeper' },
              { value: 'Accountant', label: 'Accountant' },
              { value: 'Delivery Driver', label: 'Delivery Driver' },
            ]}
          />
          <Input
            label="Job Title"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
          />
        </div>

        <Select
          label="Assigned Warehouse Scope"
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

        {/* Account Status Control */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-neutral-100">
              Account Access Status
            </p>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400">
              {status === 'active'
                ? 'User has authorization to log in and perform actions.'
                : 'Account is suspended. All active sessions are revoked.'}
            </p>
          </div>

          <Button
            type="button"
            variant={status === 'active' ? 'outline' : 'primary'}
            size="sm"
            onClick={handleToggleStatus}
            leftIcon={status === 'active' ? <UserX className="w-3.5 h-3.5 text-rose-500" /> : <UserCheck className="w-3.5 h-3.5" />}
          >
            {status === 'active' ? 'Suspend Access' : 'Activate User'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
