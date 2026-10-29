import React, { useState } from 'react';
import { Plus, Search, ShieldCheck, UserCheck, Key, Lock, Check, X, Edit2, UserX } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Table, Column } from '../components/ui/Table';
import { useToast } from '../context/ToastContext';
import { useUser } from '../context/UserContext';
import { UserProfile } from '../types';
import { InviteUserModal } from '../components/modals/InviteUserModal';
import { EditUserModal } from '../components/modals/EditUserModal';

interface UsersPermissionsPageProps {
  currentUser?: UserProfile;
}

export const UsersPermissionsPage: React.FC<UsersPermissionsPageProps> = () => {
  const { showToast } = useToast();
  const { users, currentUser, isSuperAdmin } = useUser();
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'audit'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [selectedUserToEdit, setSelectedUserToEdit] = useState<UserProfile | null>(null);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns: Column<UserProfile>[] = [
    {
      key: 'name',
      header: 'NAME & CREDENTIALS',
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <img
            src={r.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
            alt={r.name}
            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-neutral-700 shrink-0"
          />
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-900 dark:text-neutral-100 truncate">{r.name}</span>
              {currentUser && r.id === currentUser.id && (
                <span className="text-[10px] bg-[#167a53]/15 text-[#167a53] dark:text-[#34d399] font-bold px-1.5 py-0.2 rounded">
                  YOU
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 truncate">{r.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'ERP ROLE',
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span>{r.role}</span>
        </span>
      ),
    },
    {
      key: 'assignedWarehouse',
      header: 'SCOPE / WAREHOUSE',
      render: (r) => (
        <span className="text-xs text-slate-600 dark:text-neutral-300">
          {r.assignedWarehouse || 'Colombo Central Distribution Hub'}
        </span>
      ),
    },
    {
      key: 'lastActive',
      header: 'LAST SESSION',
      render: (r) => (
        <span className="text-xs font-mono text-slate-500 dark:text-neutral-400">
          {r.lastActive || 'Active'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'STATUS',
      align: 'center',
      render: (r) => (
        <span
          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
            r.status === 'active'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
          }`}
        >
          {r.status.toUpperCase()}
        </span>
      ),
    },
    {
      key: 'id',
      header: 'ACTION',
      align: 'right',
      render: (r) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedUserToEdit(r)}
          disabled={!isSuperAdmin && (!currentUser || r.id !== currentUser.id)}
          leftIcon={<Edit2 className="w-3 h-3" />}
        >
          Manage
        </Button>
      ),
    },
  ];

  const roleMatrix = [
    { role: 'Owner / Administrator', desc: 'Unrestricted master access to all financial, inventory, settings, and user permissions.', permissions: ['Sales', 'Purchasing', 'Inventory', 'Finance', 'Settings', 'Users'] },
    { role: 'Manager', desc: 'Operational oversight of sales, procurement, and warehouse stock transfers.', permissions: ['Sales', 'Purchasing', 'Inventory', 'Finance (View)', 'Reports'] },
    { role: 'Salesperson', desc: 'Can generate quotations, post invoices within assigned customer credit terms.', permissions: ['Sales', 'Customers (Read/Write)', 'Inventory (View)'] },
    { role: 'Storekeeper', desc: 'Authorized to execute Goods Receipt Notes (GRN), warehouse bin transfers, and stock adjustments.', permissions: ['Inventory', 'Purchasing (Receiving only)'] },
    { role: 'Accountant', desc: 'General ledger postings, customer receipts, supplier voucher payments, trial balance, and tax reconciliation.', permissions: ['Finance', 'Expenses', 'Reports', 'Sales (Read)'] },
    { role: 'Delivery Driver', desc: 'Responsible for warehouse delivery fulfillment and proof-of-delivery documentation.', permissions: ['Delivery', 'Proof of Delivery'] },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-neutral-400 uppercase">
            ADMINISTRATION & ACCESS CONTROL
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-neutral-100 mt-1">
            Users, Roles & Security Permissions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
            Role-Based Access Control (RBAC), Row Level Security enforcement, and session audit logs
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsInviteOpen(true)}
          disabled={!isSuperAdmin}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Invite Team Member
        </Button>
      </div>

      <div className="flex border-b border-slate-200 dark:border-neutral-800 space-x-6 text-xs font-semibold overflow-x-auto pb-px">
        {[
          { id: 'users', label: `Company Members (${users.length})` },
          { id: 'roles', label: 'Role Permissions Matrix' },
          { id: 'audit', label: 'Session & Access Log' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-[#167a53] text-[#167a53] dark:text-[#34d399]'
                : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search staff by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-slate-700 dark:text-neutral-300 focus:outline-none"
              >
                <option value="all">All Account Statuses</option>
                <option value="active">Active Staff Only</option>
                <option value="inactive">Suspended Accounts</option>
              </select>
            </div>
          </div>

          <Table
            columns={columns}
            data={filteredUsers}
            keyExtractor={(row) => row.id}
            emptyState={
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 flex items-center justify-center mb-3">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                  No matching staff members found
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mt-1 leading-relaxed">
                  Try adjusting your search query or status filter to locate authorized users.
                </p>
              </div>
            }
          />
        </div>
      )}

      {/* Modals */}
      <InviteUserModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
      />

      <EditUserModal
        isOpen={Boolean(selectedUserToEdit)}
        onClose={() => setSelectedUserToEdit(null)}
        user={selectedUserToEdit}
      />

      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roleMatrix.map((r) => (
            <div
              key={r.role}
              className="p-5 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#167a53] dark:text-[#34d399]" />
                  <span>{r.role}</span>
                </h3>
                <span className="text-[10px] text-slate-400 uppercase font-mono">
                  {r.permissions.length} Modules Allowed
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                {r.desc}
              </p>
              <div className="pt-2 border-t border-slate-100 dark:border-neutral-800/80 flex flex-wrap gap-1.5">
                {r.permissions.map((p) => (
                  <span
                    key={p}
                    className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-[#202924] text-slate-700 dark:text-neutral-300"
                  >
                    ✓ {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="p-6 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
            Immutable Audit Trail Log
          </h3>
          <p className="text-xs text-slate-500 dark:text-neutral-400">
            All user operations, authentication handshakes, and ledger modifications are recorded with cryptographic timestamps.
          </p>
          <div className="space-y-2 pt-2">
            {[
              { id: '1', action: 'Session Initialized', user: 'Rashid Al-Zaid (Operations Admin)', ip: '10.0.4.12', time: 'Just now' },
              { id: '2', action: 'Company Configuration Verified', user: 'System Engine', ip: 'internal', time: '5m ago' },
              { id: '3', action: 'General Ledger Schema Loaded', user: 'PostgreSQL DB', ip: 'internal', time: '10m ago' },
            ].map((log) => (
              <div key={log.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-[#151b18] text-xs">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-neutral-200">{log.action}</span>
                  <span className="text-slate-400 ml-2">by {log.user}</span>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
