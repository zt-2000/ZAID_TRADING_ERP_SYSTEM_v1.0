import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface SyncStatus {
  isConfigured: boolean;
  connected: boolean;
  message: string;
}

export const checkSupabaseConnection = async (): Promise<SyncStatus> => {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      isConfigured: false,
      connected: false,
      message: 'Supabase URL or Anon Key not configured in environment (VITE_SUPABASE_URL). Operating in local storage mode.',
    };
  }

  try {
    const { error } = await supabase.from('companies').select('id').limit(1);
    if (error) {
      return {
        isConfigured: true,
        connected: false,
        message: `Supabase key set but query returned: ${error.message}`,
      };
    }
    return {
      isConfigured: true,
      connected: true,
      message: 'Connected to Supabase PostgreSQL database with active RLS policy.',
    };
  } catch (err: any) {
    return {
      isConfigured: true,
      connected: false,
      message: `Connection test failed: ${err?.message || 'Unknown network error'}`,
    };
  }
};

export const migrateLocalDataToCloud = async (): Promise<{
  success: boolean;
  syncedCounts: Record<string, number>;
  errors: string[];
}> => {
  const errors: string[] = [];
  const syncedCounts: Record<string, number> = {};

  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      syncedCounts: {},
      errors: ['Supabase environment variables are missing.'],
    };
  }

  // Idempotent migration helper
  const syncLocalKey = async (keyName: string, tableName: string) => {
    try {
      const raw = localStorage.getItem(keyName);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return;

      if (!supabase) return;
      const { data, error } = await supabase.from(tableName).upsert(parsed, { onConflict: 'id' });
      if (error) {
        errors.push(`${tableName}: ${error.message}`);
      } else {
        syncedCounts[tableName] = parsed.length;
      }
    } catch (e: any) {
      errors.push(`${tableName}: ${e.message}`);
    }
  };

  await syncLocalKey('zaid_erp_customers', 'customers');
  await syncLocalKey('zaid_erp_suppliers', 'suppliers');
  await syncLocalKey('zaid_erp_deliveries', 'deliveries');
  await syncLocalKey('zaid_erp_sales', 'sales_invoices');
  await syncLocalKey('zaid_erp_quotations', 'quotations');
  await syncLocalKey('zaid_erp_sales_orders', 'sales_orders');
  await syncLocalKey('zaid_erp_expenses', 'expenses');
  await syncLocalKey('zaid_erp_gl_transactions', 'general_ledger');

  return {
    success: errors.length === 0,
    syncedCounts,
    errors,
  };
};
