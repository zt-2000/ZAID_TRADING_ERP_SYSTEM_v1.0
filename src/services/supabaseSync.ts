import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface SyncStatus {
  isConfigured: boolean;
  connected: boolean;
  message: string;
}

export interface ImportPreviewResult {
  validCount: number;
  invalidCount: number;
  errors: string[];
  previewData: any[];
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

  // Get current user's company_id
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return {
      success: false,
      syncedCounts: {},
      errors: ['User must be authenticated to migrate data.'],
    };
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('company_id')
    .eq('user_id', session.user.id)
    .single();

  if (!profile?.company_id) {
    return {
      success: false,
      syncedCounts: {},
      errors: ['User company context not found.'],
    };
  }

  const companyId = profile.company_id;

  const syncLocalKey = async (keyName: string, tableName: string) => {
    try {
      const raw = localStorage.getItem(keyName);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return;

      const sanitizedRows = parsed.map((row: any) => ({
        ...row,
        company_id: companyId,
        id: row.id || crypto.randomUUID(),
      }));

      const { error } = await supabase!.from(tableName).upsert(sanitizedRows, { onConflict: 'id' });
      if (error) {
        errors.push(`${tableName}: ${error.message}`);
      } else {
        syncedCounts[tableName] = sanitizedRows.length;
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

export const previewAndValidateImport = async (tableName: string, rawDataString: string): Promise<ImportPreviewResult> => {
  const errors: string[] = [];
  let parsed: any[];
  try {
    parsed = JSON.parse(rawDataString);
    if (!Array.isArray(parsed)) {
      return { validCount: 0, invalidCount: 0, errors: ['Import data must be a JSON array.'], previewData: [] };
    }
  } catch (e: any) {
    return { validCount: 0, invalidCount: 0, errors: [`JSON Parse Error: ${e.message}`], previewData: [] };
  }

  if (parsed.length === 0) {
    return { validCount: 0, invalidCount: 0, errors: ['Import array is empty.'], previewData: [] };
  }

  if (!supabase) {
    return { validCount: 0, invalidCount: parsed.length, errors: ['Supabase client not initialized.'], previewData: [] };
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return { validCount: 0, invalidCount: parsed.length, errors: ['User must be authenticated to import data.'], previewData: [] };
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('company_id')
    .eq('user_id', session.user.id)
    .single();

  if (!profile?.company_id) {
    return { validCount: 0, invalidCount: parsed.length, errors: ['User does not have an active company context.'], previewData: [] };
  }

  const validData: any[] = [];
  let invalidCount = 0;

  parsed.forEach((row, idx) => {
    if (!row || typeof row !== 'object') {
      errors.push(`Row ${idx + 1}: Invalid object record.`);
      invalidCount++;
      return;
    }

    const sanitizedRow = { ...row };
    sanitizedRow.company_id = profile.company_id;
    if (!sanitizedRow.id) {
      sanitizedRow.id = crypto.randomUUID();
    }

    validData.push(sanitizedRow);
  });

  return {
    validCount: validData.length,
    invalidCount,
    errors,
    previewData: validData.slice(0, 10),
  };
};

export const executeVerifiedImport = async (tableName: string, validatedRows: any[]): Promise<{ success: boolean; count: number; error?: string }> => {
  if (!supabase) return { success: false, count: 0, error: 'Supabase not configured.' };
  if (!validatedRows || validatedRows.length === 0) return { success: true, count: 0 };

  const { error } = await supabase.from(tableName).upsert(validatedRows, { onConflict: 'id' });
  if (error) {
    return { success: false, count: 0, error: error.message };
  }

  return { success: true, count: validatedRows.length };
};
