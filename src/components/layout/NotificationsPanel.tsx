import React from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { CheckCircle2, ShieldCheck, Bell } from 'lucide-react';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const notifications = [
    {
      id: '1',
      title: 'General Ledger Engine Synchronized',
      description: 'Zero unposted vouchers pending. System chart of accounts reconciled.',
      time: '12m ago',
      type: 'system',
      read: false,
    },
    {
      id: '2',
      title: 'Role Permissions Enforced',
      description: 'Connected with Operations Admin privileges for Zaid Trading.',
      time: '1h ago',
      type: 'security',
      read: true,
    },
    {
      id: '3',
      title: 'Fiscal Period Active',
      description: 'Current financial year 2026/2027 open for transactions.',
      time: '3h ago',
      type: 'fiscal',
      read: true,
    },
  ];

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="System Notifications"
      description="Operational ledger updates and activity notices"
      maxWidth="md"
      footer={
        <Button variant="outline" size="sm" onClick={onClose}>
          Mark All Read & Close
        </Button>
      }
    >
      <div className="space-y-2.5">
        {notifications.map((item) => (
          <div
            key={item.id}
            className={`p-3 rounded-xl border transition-colors ${
              !item.read
                ? 'bg-[#167a53]/5 dark:bg-[#167a53]/10 border-[#167a53]/30 dark:border-[#167a53]/40'
                : 'bg-white dark:bg-[#151b18] border-slate-200 dark:border-neutral-800'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/50 text-[#167a53] dark:text-[#34d399] shrink-0 mt-0.5">
                {item.type === 'security' ? (
                  <ShieldCheck className="w-4 h-4" />
                ) : item.type === 'system' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Bell className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-900 dark:text-neutral-100 truncate">
                    {item.title}
                  </p>
                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                    {item.time}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-neutral-400 mt-0.5 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Dialog>
  );
};
