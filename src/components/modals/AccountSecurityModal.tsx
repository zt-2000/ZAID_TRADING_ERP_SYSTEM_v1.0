import React from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { useUser } from '../../context/UserContext';
import { useToast } from '../../context/ToastContext';
import {
  ShieldCheck,
  KeyRound,
  Laptop,
  Smartphone,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  History,
  Lock,
} from 'lucide-react';

interface AccountSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChangePassword: () => void;
}

export const AccountSecurityModal: React.FC<AccountSecurityModalProps> = ({
  isOpen,
  onClose,
  onOpenChangePassword,
}) => {
  const { sessions, revokeSession, revokeAllOtherSessions } = useUser();
  const { showToast } = useToast();

  const handleRevokeAll = () => {
    revokeAllOtherSessions();
    showToast('Sessions Revoked', 'All other active device sessions have been terminated.', 'success');
  };

  const handleRevokeOne = (id: string, device: string) => {
    revokeSession(id);
    showToast('Session Revoked', `Access from "${device}" has been revoked.`, 'info');
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Account & Security"
      description="Manage credential authorization, active sessions, and access integrity"
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onClose();
              onOpenChangePassword();
            }}
            leftIcon={<KeyRound className="w-4 h-4" />}
          >
            Change Password
          </Button>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Security Overview Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                Authentication Health
              </h3>
            </div>
            <p className="text-xs font-medium text-slate-700 dark:text-neutral-300 mt-2">
              Supabase Auth Session Active
            </p>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
              Encrypted JWT bearer with automated refresh rotation.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161c19] border border-slate-200 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#167a53] dark:text-[#34d399]" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-neutral-100">
                  Password Credential
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                SECURE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-2">
              Last password update: 14 days ago. Regular 90-day rotation recommended.
            </p>
          </div>
        </div>

        {/* Active Sessions List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-neutral-100 uppercase tracking-wider">
                Authorized Active Sessions ({sessions.length})
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                Devices currently authenticated with your user credentials
              </p>
            </div>

            {sessions.filter((s) => !s.isCurrent).length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRevokeAll}
                className="text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Revoke All Others
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {sessions.map((sess) => {
              const isMobile = sess.device.toLowerCase().includes('phone') || sess.device.toLowerCase().includes('android');
              const Icon = isMobile ? Smartphone : Laptop;

              return (
                <div
                  key={sess.id}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    sess.isCurrent
                      ? 'bg-[#167a53]/5 dark:bg-[#167a53]/15 border-[#167a53]/30'
                      : 'bg-white dark:bg-[#181f1b] border-slate-200 dark:border-neutral-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-neutral-100">
                          {sess.device}
                        </span>
                        {sess.isCurrent && (
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                            Current Session
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                        {sess.browser} • IP: <span className="font-mono">{sess.ipAddress}</span>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {sess.location} • <span className="font-medium text-slate-600 dark:text-neutral-300">{sess.lastActive}</span>
                      </p>
                    </div>
                  </div>

                  {!sess.isCurrent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeOne(sess.id, sess.device)}
                      className="text-xs text-rose-600 dark:text-rose-400 self-end sm:self-center"
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Security Audit Guidance */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-800 text-xs text-slate-600 dark:text-neutral-400 space-y-1">
          <p className="font-semibold text-slate-900 dark:text-neutral-200 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>Immutable Audit Trail</span>
          </p>
          <p className="text-[11px] leading-relaxed">
            All session authentications and credential rotations are logged in compliance with enterprise wholesale data regulations. If you suspect unauthorized access, click &quot;Revoke All Others&quot; and update your password immediately.
          </p>
        </div>
      </div>
    </Dialog>
  );
};
