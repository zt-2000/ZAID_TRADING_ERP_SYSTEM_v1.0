import React from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { useUser } from '../../context/UserContext';
import { useToast } from '../../context/ToastContext';
import { LogOut, AlertTriangle } from 'lucide-react';

interface SignOutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SignOutConfirmModal: React.FC<SignOutConfirmModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, signOut } = useUser();
  const { showToast } = useToast();

  const handleConfirmSignOut = () => {
    signOut();
    showToast('Session Concluded', 'You have been securely signed out of Zaid Trading ERP.', 'info');
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Sign Out"
      description="Terminate active session tokens for this workstation"
      maxWidth="sm"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleConfirmSignOut}
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Sign Out
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 dark:text-amber-300">
            <p className="font-semibold">Sign out active operator?</p>
            <p className="mt-1 text-[11px] leading-relaxed text-amber-800 dark:text-amber-400">
              You are signed in as <strong>{currentUser.name}</strong> ({currentUser.email}). Make sure all unsaved invoice vouchers or draft purchase orders have been posted before signing out.
            </p>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
