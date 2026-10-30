import React from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { UserProfile } from '../../types';
import { ShieldCheck, Mail, Key, LogOut } from 'lucide-react';

interface UserMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpdateRole?: (role: UserProfile['role']) => void;
}

export const UserMenuModal: React.FC<UserMenuModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="User Account & Role Profile"
      description="Active operator credentials and module authorization scope"
      maxWidth="md"
      footer={
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Profile Card */}
        <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-800">
          <img
            src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
            alt={currentUser.name}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-[#167a53]/30"
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
              {currentUser.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5" />
              <span>{currentUser.email}</span>
            </p>
            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{currentUser.role}</span>
            </div>
          </div>
        </div>

        {/* Single Operator Profile Info */}
        <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-xs space-y-1">
          <p className="font-semibold text-emerald-900 dark:text-emerald-300">
            Single-User Business Operation
          </p>
          <p className="text-[11px] text-emerald-800/80 dark:text-emerald-400 leading-relaxed">
            Authorized Account: Owner / Administrator with full executive access across all ERP wholesale modules.
          </p>
        </div>

        {/* Security & Access Info */}
        <div className="p-3 rounded-lg border border-slate-200 dark:border-neutral-800 text-xs space-y-1.5 text-slate-600 dark:text-neutral-400">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <Key className="w-3.5 h-3.5 text-slate-400" />
              <span>Company Scope:</span>
            </span>
            <span className="font-semibold text-slate-900 dark:text-neutral-200">Zaid Trading W.L.L.</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Session Audit ID:</span>
            <span className="font-mono text-[11px]">#ZD-98214-OPS</span>
          </div>
          <div className="flex items-center justify-between">
            <span>RLS Context:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Enforced & Isolated</span>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            leftIcon={<LogOut className="w-4 h-4 text-rose-500" />}
            className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          >
            Sign Out Session
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
