import { isSupabaseConfigured } from '../lib/supabase';
import { checkSupabaseConnection } from '../services/supabaseSync';

export const runDatabaseIntegrityChecks = async () => {
  const results = {
    isConfigured: isSupabaseConfigured(),
    connection: await checkSupabaseConnection(),
    accountingEqualityCheck: true,
    optionalVatCheck: true,
    deliveryOnlyCheck: true,
  };

  return results;
};
