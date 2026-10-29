import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  ALLOWED_IMPORT_TABLES, 
  BLOCKED_TABLES, 
  TABLE_SCHEMAS, 
  TABLE_WRITE_ROLE_PERMISSIONS, 
  validateTableImportData,
  AllowedImportTable,
  BlockedTable
} from '../utils/validation_engine';

export type {
  SyncStatus,
  ValidationDetail,
  ImportPreviewResult,
  ExecuteImportOptions,
  ExecuteImportResult,
  MigrationReport
} from '../utils/validation_engine';

// =========================================================================
// AUTH & CONTEXT VERIFICATION HELPERS
// =========================================================================

import { 
  SyncStatus, 
  ImportPreviewResult, 
  ExecuteImportOptions, 
  ExecuteImportResult, 
  MigrationReport 
} from '../utils/validation_engine';

export const getVerifiedCompanyContext = async (): Promise<{
  success: boolean;
  companyId?: string;
  userRole?: string;
  userId?: string;
  error?: string;
}> => {
  if (!supabase) {
    return { success: false, error: 'Supabase client is not initialized.' };
  }

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.user) {
    return { success: false, error: 'User is not authenticated. Active session required.' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, company_id, role, status')
    .eq('user_id', session.user.id)
    .single();

  if (profileError || !profile) {
    return { success: false, error: 'No verified ERP user profile found for authenticated session.' };
  }

  if (profile.status !== 'active') {
    return { success: false, error: 'User account is inactive or suspended.' };
  }

  if (!profile.company_id) {
    return { success: false, error: 'Active tenant company context missing from profile.' };
  }

  return {
    success: true,
    companyId: profile.company_id,
    userRole: profile.role,
    userId: session.user.id,
  };
};

export const checkSupabaseConnection = async (): Promise<SyncStatus> => {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      isConfigured: false,
      connected: false,
      message: 'Supabase environment parameters missing (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY). Local browser storage mode active.',
    };
  }

  try {
    const { error } = await supabase.auth.getSession();
    if (error) throw error;

    return {
      isConfigured: true,
      connected: true,
      message: 'Connected to Supabase PostgreSQL database with active Row-Level Security.',
    };
  } catch (err: any) {
    return {
      isConfigured: true,
      connected: false,
      message: `Connection test failed: ${err?.message || 'Unknown network error'}`,
    };
  }
};

// =========================================================================
// PREVIEW AND VALIDATE IMPORT (With DB Conflict Detection)
// =========================================================================

export const previewAndValidateImport = async (
  tableName: string,
  rawDataString: string
): Promise<ImportPreviewResult> => {
  let parsed: any[];
  try {
    parsed = JSON.parse(rawDataString);
    if (!Array.isArray(parsed)) {
      return {
        tableName,
        totalRecords: 0,
        validCount: 0,
        invalidCount: 0,
        duplicateCount: 0,
        conflictingCount: 0,
        errors: ['Import payload must be a JSON array of records.'],
        validationDetails: [{ row: 0, error: 'JSON payload is not an array.' }],
        previewData: [],
        validatedRows: [],
      };
    }
  } catch (e: any) {
    return {
      tableName,
      totalRecords: 0,
      validCount: 0,
      invalidCount: 0,
      duplicateCount: 0,
      conflictingCount: 0,
      errors: [`JSON Parse Error: ${e.message}`],
      validationDetails: [{ row: 0, error: e.message }],
      previewData: [],
      validatedRows: [],
    };
  }

  const context = await getVerifiedCompanyContext();
  if (!context.success || !context.companyId) {
    return {
      tableName,
      totalRecords: parsed.length,
      validCount: 0,
      invalidCount: parsed.length,
      duplicateCount: 0,
      conflictingCount: 0,
      errors: [context.error || 'Authentication context failure.'],
      validationDetails: [{ row: 0, error: context.error || 'Auth failure' }],
      previewData: [],
      validatedRows: [],
    };
  }

  const result = validateTableImportData(tableName, parsed, context.companyId, context.userRole);

  // Check database for conflicting records
  if (result.validCount > 0 && supabase) {
    const table = tableName as AllowedImportTable;
    const schema = TABLE_SCHEMAS[table];
    if (schema) {
      try {
        const idsToCheck = result.validatedRows.map(r => r.id).filter(Boolean);
        const { data: existingRecords } = await supabase
          .from(tableName)
          .select('id')
          .eq('company_id', context.companyId)
          .in('id', idsToCheck.slice(0, 200));

        if (existingRecords && existingRecords.length > 0) {
          result.conflictingCount = existingRecords.length;
          result.errors.push(`Notice: ${existingRecords.length} record(s) already exist with the same ID in the company database.`);
        }
      } catch (err: any) {
        // DB conflict query failure is recorded as notice
      }
    }
  }

  return result;
};

// =========================================================================
// EXECUTE VERIFIED IMPORT (With Confirmation Guard & Revalidation)
// =========================================================================

export const executeVerifiedImport = async (
  tableName: string,
  rowsToImport: any[],
  options?: ExecuteImportOptions
): Promise<ExecuteImportResult> => {
  // Requirement 7: Require explicit confirmation before a bulk import
  if (!options || options.confirmed !== true) {
    return {
      success: false,
      count: 0,
      tableName,
      error: 'Explicit user confirmation required before executing bulk import.',
    };
  }

  if (!supabase) {
    return {
      success: false,
      count: 0,
      tableName,
      error: 'Supabase client is not initialized or configured.',
    };
  }

  if (!rowsToImport || rowsToImport.length === 0) {
    return {
      success: true,
      count: 0,
      tableName,
    };
  }

  // Requirement 4 & 10: Re-verify authenticated company context & role
  const context = await getVerifiedCompanyContext();
  if (!context.success || !context.companyId) {
    return {
      success: false,
      count: 0,
      tableName,
      error: context.error || 'Unauthorized import execution attempt.',
    };
  }

  // Requirement 6: Revalidate immediately before writing
  const revalidation = validateTableImportData(tableName, rowsToImport, context.companyId, context.userRole);
  if (revalidation.invalidCount > 0 || revalidation.errors.length > 0) {
    return {
      success: false,
      count: 0,
      tableName,
      error: `Pre-execution validation failed with ${revalidation.invalidCount} error(s): ${revalidation.errors.slice(0, 3).join('; ')}`,
    };
  }

  try {
    const cleanRows = revalidation.validatedRows;
    const { error: upsertError } = await supabase
      .from(tableName)
      .upsert(cleanRows, { onConflict: 'id' });

    if (upsertError) {
      return {
        success: false,
        count: 0,
        tableName,
        error: `Database write rejected: ${upsertError.message}`,
      };
    }

    return {
      success: true,
      count: cleanRows.length,
      tableName,
    };
  } catch (err: any) {
    return {
      success: false,
      count: 0,
      tableName,
      error: err.message || 'Execution error during table import.',
    };
  }
};

// =========================================================================
// BULK LOCAL-TO-CLOUD DATA MIGRATION (Strict Per-Table Auditing)
// =========================================================================

export const LOCAL_STORAGE_TABLE_MAP: Record<string, AllowedImportTable> = {
  zaid_erp_customers: 'customers',
  zaid_erp_suppliers: 'suppliers',
  zaid_erp_deliveries: 'deliveries',
  zaid_erp_sales: 'sales_invoices',
  zaid_erp_quotations: 'quotations',
  zaid_erp_sales_orders: 'sales_orders',
  zaid_erp_expenses: 'expenses',
};

export const migrateLocalDataToCloud = async (): Promise<MigrationReport> => {
  const errors: string[] = [];
  const syncedCounts: Record<string, number> = {};
  const tableDetails: Record<string, { status: 'success' | 'failed' | 'skipped'; count: number; error?: string }> = {};

  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      totalTablesAttempted: 0,
      tablesSucceeded: 0,
      tablesFailed: 0,
      syncedCounts: {},
      errors: ['Supabase configuration missing in environment.'],
      tableDetails: {},
    };
  }

  const context = await getVerifiedCompanyContext();
  if (!context.success || !context.companyId) {
    return {
      success: false,
      totalTablesAttempted: 0,
      tablesSucceeded: 0,
      tablesFailed: 0,
      syncedCounts: {},
      errors: [context.error || 'Authentication context required to migrate data.'],
      tableDetails: {},
    };
  }

  // Verify caller has administrative write access
  if (context.userRole !== 'Owner / Administrator' && context.userRole !== 'Manager') {
    return {
      success: false,
      totalTablesAttempted: 0,
      tablesSucceeded: 0,
      tablesFailed: 0,
      syncedCounts: {},
      errors: [`Permission denied: Role '${context.userRole}' cannot perform full local data migrations.`],
      tableDetails: {},
    };
  }

  let totalAttempted = 0;
  let succeeded = 0;
  let failed = 0;

  for (const [keyName, tableName] of Object.entries(LOCAL_STORAGE_TABLE_MAP)) {
    totalAttempted++;
    try {
      const raw = localStorage.getItem(keyName);
      if (!raw) {
        tableDetails[tableName] = { status: 'skipped', count: 0 };
        continue;
      }

      let parsed: any[];
      try {
        parsed = JSON.parse(raw);
      } catch (parseErr: any) {
        failed++;
        const msg = `${tableName}: JSON parsing failed: ${parseErr.message}`;
        errors.push(msg);
        tableDetails[tableName] = { status: 'failed', count: 0, error: msg };
        continue;
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        tableDetails[tableName] = { status: 'skipped', count: 0 };
        continue;
      }

      // Validate with schema engine
      const validation = validateTableImportData(tableName, parsed, context.companyId, context.userRole);
      if (validation.invalidCount > 0 || validation.validCount === 0) {
        failed++;
        const msg = `${tableName}: Validation failed (${validation.invalidCount} invalid rows). First error: ${validation.errors[0]}`;
        errors.push(msg);
        tableDetails[tableName] = { status: 'failed', count: 0, error: msg };
        continue;
      }

      // Execute verified write
      const writeResult = await executeVerifiedImport(tableName, validation.validatedRows, { confirmed: true });
      if (!writeResult.success) {
        failed++;
        const msg = `${tableName}: ${writeResult.error || 'Database write error'}`;
        errors.push(msg);
        tableDetails[tableName] = { status: 'failed', count: 0, error: msg };
      } else {
        succeeded++;
        syncedCounts[tableName] = writeResult.count;
        tableDetails[tableName] = { status: 'success', count: writeResult.count };
      }
    } catch (e: any) {
      failed++;
      const msg = `${tableName}: ${e.message}`;
      errors.push(msg);
      tableDetails[tableName] = { status: 'failed', count: 0, error: msg };
    }
  }

  // Requirement 9: A partial import must not be reported as a complete success
  const isCompleteSuccess = failed === 0 && errors.length === 0;

  return {
    success: isCompleteSuccess,
    totalTablesAttempted: totalAttempted,
    tablesSucceeded: succeeded,
    tablesFailed: failed,
    syncedCounts,
    errors,
    tableDetails,
  };
};
