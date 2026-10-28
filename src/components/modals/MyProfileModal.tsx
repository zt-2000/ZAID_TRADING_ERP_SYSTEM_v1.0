import React from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { useUser } from '../../context/UserContext';
import { formatDateOnly } from '../../utils/formatters';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Globe,
  Calendar,
  ShieldCheck,
  Building,
  Edit3,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';

interface MyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenEditProfile: () => void;
  onOpenAccountSecurity: () => void;
}

export const MyProfileModal: React.FC<MyProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenEditProfile,
  onOpenAccountSecurity,
}) => {
  const { currentUser } = useUser();

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="User Account Profile"
      description="Personal identity credentials, operational authorization and enterprise role scope"
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onClose();
              onOpenAccountSecurity();
            }}
            leftIcon={<KeyRound className="w-4 h-4" />}
          >
            Security & Sessions
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                onOpenEditProfile();
              }}
              leftIcon={<Edit3 className="w-4 h-4" />}
            >
              Edit Profile
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Profile Card Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-white dark:from-[#18211c] dark:to-[#141a16] border border-slate-200/80 dark:border-neutral-800 shadow-xs">
          <div className="relative">
            <img
              src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
              alt={currentUser.name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#167a53]/30 shadow-sm"
            />
            <span
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-[#141a16] ${
                currentUser.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
              title={currentUser.status === 'active' ? 'Active account' : 'Inactive account'}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-neutral-100">
                {currentUser.name}
              </h2>
              {currentUser.displayName && currentUser.displayName !== currentUser.name && (
                <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
                  ({currentUser.displayName})
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{currentUser.role}</span>
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentUser.jobTitle || 'Executive Staff'}</span>
            </p>

            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentUser.assignedWarehouse || 'Colombo Central Logistics Hub'}</span>
            </p>
          </div>
        </div>

        {/* Detailed Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-[#161c19] border border-slate-200/70 dark:border-neutral-800/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
              <Mail className="w-3.5 h-3.5" />
              <span>Email Address</span>
            </div>
            <p className="text-xs font-semibold text-slate-900 dark:text-neutral-100 break-all">
              {currentUser.email}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Verified Supabase / Auth identity</span>
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-[#161c19] border border-slate-200/70 dark:border-neutral-800/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
              <Phone className="w-3.5 h-3.5" />
              <span>Phone / Contact</span>
            </div>
            <p className="text-xs font-semibold text-slate-900 dark:text-neutral-100">
              {currentUser.phone || 'Not configured'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Direct operations mobile</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-[#161c19] border border-slate-200/70 dark:border-neutral-800/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
              <Globe className="w-3.5 h-3.5" />
              <span>Language & Locale</span>
            </div>
            <p className="text-xs font-semibold text-slate-900 dark:text-neutral-100">
              {currentUser.preferredLanguage || 'English (UK)'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Regional interface localization</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-[#161c19] border border-slate-200/70 dark:border-neutral-800/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Member Since</span>
            </div>
            <p className="text-xs font-semibold text-slate-900 dark:text-neutral-100">
              {currentUser.createdAt ? formatDateOnly(currentUser.createdAt) : 'January 15, 2024'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Immutable account creation date</p>
          </div>
        </div>

        {/* Role & Permissions Note */}
        <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-xs text-slate-700 dark:text-neutral-300">
          <p className="font-semibold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Role-Based Access Control Scope</span>
          </p>
          <p className="mt-1 text-slate-600 dark:text-neutral-400 leading-relaxed">
            Your role is assigned as <strong>{currentUser.role}</strong>. In accordance with enterprise governance, roles, permissions, and account status are strictly managed through the Users & Permissions module by designated administrators.
          </p>
        </div>
      </div>
    </Dialog>
  );
};
