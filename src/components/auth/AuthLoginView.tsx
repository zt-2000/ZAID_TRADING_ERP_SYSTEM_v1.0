import React, { useState } from 'react';
import { useUser } from '../../context/UserContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Lock, Mail, ShieldCheck, ArrowRight, Building2, KeyRound } from 'lucide-react';
import { CompanySettings } from '../../types';

interface AuthLoginViewProps {
  companySettings: CompanySettings;
}

export const AuthLoginView: React.FC<AuthLoginViewProps> = ({ companySettings }) => {
  const { signIn, authError } = useUser();
  const { showToast } = useToast();

  const [email, setEmail] = useState('zaidtrading.info@gmail.com');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const res = await signIn(email.trim().toLowerCase(), password);
    setIsLoading(false);

    if (res.success) {
      showToast('Authentication Successful', 'Welcome to Zaid Trading ERP.', 'success');
    } else {
      setErrorMsg(res.message || 'Invalid authentication credentials.');
      showToast('Authentication Failed', res.message, 'error');
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-[#FAFBF9] dark:bg-[#0f1311] px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#167a53] flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-md shadow-[#167a53]/25">
            Z
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-neutral-100">
            {companySettings.companyName || 'Zaid Trading'}
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-widest">
            ENTERPRISE RESOURCE PLANNING • SINGLE-OPERATOR WORKSTATION
          </p>
        </div>

        {/* Login Card */}
        <div className="p-8 rounded-3xl bg-white dark:bg-[#181f1b] border border-slate-200 dark:border-neutral-800 shadow-xl space-y-6">
          <div className="border-b border-slate-100 dark:border-neutral-800 pb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#167a53]" />
              Authorized Operator Sign In
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
              Enter your verified credentials to access the wholesale ledger and inventory systems.
            </p>
          </div>

          {(errorMsg || authError) && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs">
              {errorMsg || authError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-neutral-300 block mb-1.5">
                Authorized Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@zaidtrading.lk"
                  className="w-full bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#167a53]"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-neutral-300 block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#167a53]"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isLoading}
                className="w-full justify-center"
                leftIcon={<KeyRound className="w-4 h-4" />}
              >
                {isLoading ? 'Verifying Session...' : 'Sign In to ERP System'}
              </Button>
            </div>
          </form>

          <div className="pt-4 border-t border-slate-100 dark:border-neutral-800 text-[11px] text-slate-400 text-center space-y-1">
            <p>
              Supabase Auth & Row Level Security Protected
            </p>
            <p className="font-mono text-[10px]">
              System Timezone: Asia/Colombo (UTC+05:30) • LKR (Rs.)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
