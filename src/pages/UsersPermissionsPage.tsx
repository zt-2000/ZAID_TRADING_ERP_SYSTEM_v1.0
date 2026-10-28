import React, { useState } from 'react';
import { Plus, Search, ShieldCheck, UserCheck, Key, Lock, Check, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Table, Column } from '../components/ui/Table';
import { useToast } from '../context/ToastContext';
import { UserProfile } from '../types';

interface UsersPermissionsPageProps {
  currentUser: UserProfile;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'suspended';
  lastActive: string;
  assignedWarehouse: string;
}

export const UsersPermissionsPage: React.FC<UsersPermissionsPageProps> = ({
  currentUser,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'audit'>('users');
  const [searchQuery, setSearchQuery] = useState('');

  // Initial authorized staff for Zaid Trading
  const usersList: TeamMember[] = [
    {
      id: '1',
      name: 'Rashid Al-Zaid',
      email: 'zaidtrading.info@gmail.com',
      role: 'Owner / Administrator',
      status: 'active',
      lastActive: 'Active Now',
      assignedWarehouse: 'All Locations (Full Access)',
    },
    {
      id: '2',
      name: 'Tariq Mansoor',
      email: 'tariq.m@zaidtrading.com',
      role: 'Storekeeper',
      status: 'active',
      lastActive: '2h ago',
      assignedWarehouse: 'Central Riyadh Hub',
    },
    {
      id: '3',
      name: 'Fahad Al-Harbi',
      email: 'fahad.h@zaidtrading.com',
      role: 'Delivery Driver',
      status: 'active',
      lastActive: '34m ago',
      assignedWarehouse: 'Van Fleet Unit 01',
    },
    {
      id: '4',
      name: 'Sarah Nabil',
      email: 'sarah.n@zaidtrading.com',
      role: 'Accountant',
      status: 'active',
      lastActive: '1d ago',
      assignedWarehouse: 'Corporate Head Office',
    },
  ];

  const columns: Column<TeamMember>[] = [
    {
      key: 'name',
      header: 'NAME & CREDENTIALS',
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900 dark:text-neutral-100">{r.name}</span>
          <span className="text-[11px] text-slate-400">{r.email}</span>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'ERP ROLE',
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{r.role}</span>
        </span>
      ),
    },
    { key: 'assignedWarehouse', header: 'SCOPE / WAREHOUSE' },
    { key: 'lastActive', header: 'LAST SESSION' },
    {
      key: 'status',
      header: 'STATUS',
      align: 'center',
      render: (r) => (
        <span
          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
            r.status === 'active'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'bg-rose-50 text-rose-700'
          }`}
        >
          {r.status.toUpperCase()}
        </span>
      ),
    },
  ];

  const roleMatrix = [
    { role: 'Owner / Administrator', desc: 'Unrestricted master access to all financial, inventory, settings, and user permissions.', permissions: ['Sales', 'Purchasing', 'Inventory', 'Finance', 'Settings', 'Users'] },
    { role: 'Manager', desc: 'Operational oversight of sales, procurement, and warehouse stock transfers.', permissions: ['Sales', 'Purchasing', 'Inventory', 'Finance (View)', 'Reports'] },
    { role: 'Salesperson', desc: 'Can generate quotations, post invoices within assigned customer credit terms.', permissions: ['Sales', 'Customers (Read/Write)', 'Inventory (View)'] },
    { role: 'Storekeeper', desc: 'Authorized to execute Goods Receipt Notes (GRN), warehouse bin transfers, and stock adjustments.', permissions: ['Inventory', 'Purchasing (Receiving only)'] },
    { role: 'Accountant', desc: 'General ledger postings, customer receipts, supplier voucher payments, trial balance, and tax reconciliation.', permissions: ['Finance', 'Expenses', 'Reports', 'Sales (Read)'] },
    { role: 'Delivery Driver', desc: 'Mobile van inventory sales, customer proof-of-delivery receipts, and daily cash collection remittance.', permissions: ['Delivery & Van Sales', 'Customer Receipts'] },
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
          onClick={() => showToast('Invite User', 'Team member invitation flow initialized', 'info')}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Invite Team Member
        </Button>
      </div>

      <div className="flex border-b border-slate-200 dark:border-neutral-800 space-x-6 text-xs font-semibold overflow-x-auto pb-px">
        {[
          { id: 'users', label: 'Company Members (4)' },
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
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search staff by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#167a53]"
              />
            </div>
          </div>

          <Table
            columns={columns}
            data={usersList}
            keyExtractor={(row) => row.id}
          />
        </div>
      )}

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
