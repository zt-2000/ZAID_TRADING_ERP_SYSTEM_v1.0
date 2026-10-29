// Extracted from src/services/supabaseSync.ts
// Contains pure validation logic and shared interfaces, no DB/Auth dependencies.

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface TableColumnSchema {
  allowedColumns: string[];
  requiredFields: string[];
  uniqueBusinessKey: string;
  uuidFields?: string[];
  numericFields?: { field: string; min?: number; integer?: boolean; optional?: boolean }[];
  dateFields?: string[];
  jsonFields?: string[];
  statusEnums?: string[];
}

export const ALLOWED_IMPORT_TABLES = [
  'product_categories',
  'expense_categories',
  'products',
  'customers',
  'suppliers',
  'warehouses',
  'warehouse_bins',
  'quotations',
  'sales_orders',
  'sales_invoices',
  'deliveries',
  'purchases',
  'grns',
  'expenses',
] as const;

export type AllowedImportTable = typeof ALLOWED_IMPORT_TABLES[number];

export const BLOCKED_TABLES = [
  'general_ledger',
  'companies',
  'user_profiles',
  'user_invitations',
] as const;

export type BlockedTable = typeof BLOCKED_TABLES[number];

export const TABLE_WRITE_ROLE_PERMISSIONS: Record<AllowedImportTable, string[]> = {
  product_categories: ['Owner / Administrator', 'Manager', 'Storekeeper'],
  expense_categories: ['Owner / Administrator', 'Manager', 'Accountant'],
  products: ['Owner / Administrator', 'Manager', 'Storekeeper'],
  customers: ['Owner / Administrator', 'Manager', 'Salesperson'],
  suppliers: ['Owner / Administrator', 'Manager'],
  warehouses: ['Owner / Administrator', 'Manager'],
  warehouse_bins: ['Owner / Administrator', 'Manager', 'Storekeeper'],
  quotations: ['Owner / Administrator', 'Manager', 'Salesperson'],
  sales_orders: ['Owner / Administrator', 'Manager', 'Salesperson'],
  sales_invoices: ['Owner / Administrator', 'Manager', 'Salesperson'],
  deliveries: ['Owner / Administrator', 'Manager'],
  purchases: ['Owner / Administrator', 'Manager'],
  grns: ['Owner / Administrator', 'Manager', 'Storekeeper'],
  expenses: ['Owner / Administrator', 'Manager', 'Accountant'],
};

export const TABLE_SCHEMAS: Record<AllowedImportTable, TableColumnSchema> = {
    product_categories: {
      allowedColumns: ['id', 'code', 'name', 'description'],
      requiredFields: ['code', 'name'],
      uniqueBusinessKey: 'code',
      uuidFields: ['id'],
    },
    expense_categories: {
      allowedColumns: ['id', 'name', 'description', 'monthly_budget', 'usage_count'],
      requiredFields: ['name'],
      uniqueBusinessKey: 'name',
      uuidFields: ['id'],
      numericFields: [
        { field: 'monthly_budget', min: 0 },
        { field: 'usage_count', min: 0, integer: true },
      ],
    },
    products: {
      allowedColumns: [
        'id', 'sku', 'name', 'category_id', 'unit', 'purchase_price', 
        'selling_price', 'min_stock_level', 'current_stock', 'status'
      ],
      requiredFields: ['sku', 'name'],
      uniqueBusinessKey: 'sku',
      uuidFields: ['id', 'category_id'],
      numericFields: [
        { field: 'purchase_price', min: 0 },
        { field: 'selling_price', min: 0 },
        { field: 'min_stock_level', min: 0 },
        { field: 'current_stock', min: 0 },
      ],
      statusEnums: ['active', 'inactive', 'archived'],
    },
    customers: {
      allowedColumns: [
        'id', 'code', 'name', 'phone', 'email', 'address', 
        'tax_number', 'credit_limit', 'credit_days', 'balance', 'status'
      ],
      requiredFields: ['code', 'name'],
      uniqueBusinessKey: 'code',
      uuidFields: ['id'],
      numericFields: [
        { field: 'credit_limit', min: 0, optional: true },
        { field: 'credit_days', min: 0, integer: true, optional: true },
        { field: 'balance' },
      ],
      statusEnums: ['active', 'archived'],
    },
    suppliers: {
      allowedColumns: [
        'id', 'code', 'name', 'phone', 'email', 'address', 
        'tax_number', 'payment_terms', 'balance', 'status'
      ],
      requiredFields: ['code', 'name'],
      uniqueBusinessKey: 'code',
      uuidFields: ['id'],
      numericFields: [
        { field: 'balance' },
      ],
      statusEnums: ['active', 'archived'],
    },
    warehouses: {
      allowedColumns: ['id', 'code', 'name', 'type', 'address', 'city', 'is_default', 'status', 'manager_name'],
      requiredFields: ['code', 'name'],
      uniqueBusinessKey: 'code',
      uuidFields: ['id'],
      statusEnums: ['active', 'inactive'],
    },
    warehouse_bins: {
      allowedColumns: ['id', 'warehouse_id', 'code', 'name', 'aisle', 'rack', 'shelf', 'type', 'max_weight_kg', 'status'],
      requiredFields: ['warehouse_id', 'code', 'name'],
      uniqueBusinessKey: 'code',
      uuidFields: ['id', 'warehouse_id'],
      numericFields: [
        { field: 'max_weight_kg', min: 0 },
      ],
      statusEnums: ['active', 'inactive'],
    },
    quotations: {
      allowedColumns: [
        'id', 'quotation_number', 'date', 'expiry_date', 'customer_id', 
        'customer_name', 'warehouse_name', 'items', 'subtotal', 'discount_total', 
        'apply_vat', 'vat_rate', 'tax_total', 'total', 'status', 'notes'
      ],
      requiredFields: ['quotation_number', 'date', 'expiry_date', 'customer_name'],
      uniqueBusinessKey: 'quotation_number',
      uuidFields: ['id', 'customer_id'],
      dateFields: ['date', 'expiry_date'],
      jsonFields: ['items'],
      numericFields: [
        { field: 'subtotal', min: 0 },
        { field: 'discount_total', min: 0 },
        { field: 'vat_rate', min: 0 },
        { field: 'tax_total', min: 0 },
        { field: 'total', min: 0 },
      ],
    },
    sales_orders: {
      allowedColumns: [
        'id', 'order_number', 'source_quotation_id', 'date', 'delivery_date', 
        'customer_id', 'customer_name', 'warehouse_name', 'items', 'subtotal', 
        'discount_total', 'apply_vat', 'vat_rate', 'tax_total', 'total', 
        'status', 'tracking_number', 'notes'
      ],
      requiredFields: ['order_number', 'date', 'customer_name'],
      uniqueBusinessKey: 'order_number',
      uuidFields: ['id', 'source_quotation_id', 'customer_id'],
      dateFields: ['date', 'delivery_date'],
      jsonFields: ['items'],
      numericFields: [
        { field: 'subtotal', min: 0 },
        { field: 'discount_total', min: 0 },
        { field: 'vat_rate', min: 0 },
        { field: 'tax_total', min: 0 },
        { field: 'total', min: 0 },
      ],
    },
    sales_invoices: {
      allowedColumns: [
        'id', 'invoice_number', 'date', 'due_date', 'customer_id', 
        'customer_name', 'payment_terms', 'warehouse_name', 'subtotal', 
        'apply_vat', 'vat_rate', 'tax_total', 'total', 'paid', 'balance', 
        'status', 'items_count', 'notes'
      ],
      requiredFields: ['invoice_number', 'date', 'due_date', 'customer_name'],
      uniqueBusinessKey: 'invoice_number',
      uuidFields: ['id', 'customer_id'],
      dateFields: ['date', 'due_date'],
      numericFields: [
        { field: 'subtotal', min: 0 },
        { field: 'vat_rate', min: 0 },
        { field: 'tax_total', min: 0 },
        { field: 'total', min: 0 },
        { field: 'paid', min: 0 },
        { field: 'items_count', min: 1, integer: true },
      ],
    },
    deliveries: {
      allowedColumns: [
        'id', 'delivery_number', 'sales_order_id', 'sales_order_number', 
        'customer_id', 'customer_name', 'customer_phone', 'delivery_address', 
        'scheduled_date', 'actual_delivery_date', 'assigned_staff', 
        'vehicle_details', 'status', 'items', 'recipient_name', 
        'proof_of_delivery_ref', 'notes', 'history'
      ],
      requiredFields: ['delivery_number', 'sales_order_number', 'customer_name'],
      uniqueBusinessKey: 'delivery_number',
      uuidFields: ['id', 'sales_order_id', 'customer_id'],
      jsonFields: ['items', 'history'],
      statusEnums: ['Pending', 'Scheduled', 'Preparing', 'Dispatched', 'In Transit', 'Delivered', 'Failed', 'Cancelled'],
    },
    purchases: {
      allowedColumns: [
        'id', 'po_number', 'date', 'supplier_id', 'supplier_name', 
        'warehouse_name', 'payment_terms', 'total_cost', 'status'
      ],
      requiredFields: ['po_number', 'date', 'supplier_name'],
      uniqueBusinessKey: 'po_number',
      uuidFields: ['id', 'supplier_id'],
      dateFields: ['date'],
      numericFields: [
        { field: 'total_cost', min: 0 },
      ],
    },
    grns: {
      allowedColumns: [
        'id', 'grn_number', 'purchase_order_id', 'po_number', 'supplier_name', 
        'date', 'warehouse_name', 'items', 'status', 'received_by', 'notes'
      ],
      requiredFields: ['grn_number', 'po_number', 'supplier_name', 'date', 'received_by'],
      uniqueBusinessKey: 'grn_number',
      uuidFields: ['id', 'purchase_order_id'],
      dateFields: ['date'],
      jsonFields: ['items'],
    },
    expenses: {
      allowedColumns: [
        'id', 'voucher_no', 'date', 'description', 'category_id', 
        'category_name', 'payment_account', 'account_name', 'payee', 
        'reference', 'amount', 'status'
      ],
      requiredFields: ['voucher_no', 'date', 'description', 'category_name', 'payment_account', 'account_name', 'payee', 'amount'],
      uniqueBusinessKey: 'voucher_no',
      uuidFields: ['id', 'category_id'],
      dateFields: ['date'],
      numericFields: [
        { field: 'amount', min: 0 },
      ],
    },
};

export interface SyncStatus {
  isConfigured: boolean;
  connected: boolean;
  message: string;
}

export interface ValidationDetail {
  row: number;
  field?: string;
  error: string;
}

export interface ImportPreviewResult {
  tableName: string;
  totalRecords: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  conflictingCount: number;
  errors: string[];
  validationDetails: ValidationDetail[];
  previewData: any[];
  validatedRows: any[];
}

export interface ExecuteImportOptions {
  confirmed: boolean;
  allowOverwriteConflicts?: boolean;
}

export interface ExecuteImportResult {
  success: boolean;
  count: number;
  tableName: string;
  error?: string;
  duplicateCount?: number;
  conflictingCount?: number;
}

export interface MigrationReport {
  success: boolean;
  totalTablesAttempted: number;
  tablesSucceeded: number;
  tablesFailed: number;
  syncedCounts: Record<string, number>;
  errors: string[];
  tableDetails: Record<string, { status: 'success' | 'failed' | 'skipped'; count: number; error?: string }>;
}

export const validateTableImportData = (
  tableName: string,
  parsedData: any[],
  verifiedCompanyId: string,
  userRole?: string
): ImportPreviewResult => {
  const errors: string[] = [];
  const validationDetails: ValidationDetail[] = [];

  // 1. Guard against blocked / privileged tables
  if (BLOCKED_TABLES.includes(tableName as BlockedTable)) {
    if (tableName === 'general_ledger') {
      errors.push("Table 'general_ledger' is a protected append-only accounting ledger. General ledger entries cannot be imported through generic client upserts and MUST be posted via the authorized 'post_journal_voucher' RPC.");
    } else if (tableName === 'companies') {
      errors.push("Table 'companies' is a root tenant entity and cannot be imported through generic client upserts. Onboarding must use 'register_new_company' RPC.");
    } else {
      errors.push(`Table '${tableName}' is a protected identity table and cannot be imported through generic sync.`);
    }
    return {
      tableName,
      totalRecords: parsedData?.length || 0,
      validCount: 0,
      invalidCount: parsedData?.length || 0,
      duplicateCount: 0,
      conflictingCount: 0,
      errors,
      validationDetails: [{ row: 0, error: errors[0] }],
      previewData: [],
      validatedRows: [],
    };
  }

  // 2. Guard against unknown tables
  if (!ALLOWED_IMPORT_TABLES.includes(tableName as AllowedImportTable)) {
    const err = `Unknown or disallowed table '${tableName}'. Import is strictly restricted to permitted business master and transaction tables.`;
    return {
      tableName,
      totalRecords: parsedData?.length || 0,
      validCount: 0,
      invalidCount: parsedData?.length || 0,
      duplicateCount: 0,
      conflictingCount: 0,
      errors: [err],
      validationDetails: [{ row: 0, error: err }],
      previewData: [],
      validatedRows: [],
    };
  }

  const table = tableName as AllowedImportTable;
  const schema = TABLE_SCHEMAS[table];

  // 3. Role authorization check
  if (userRole) {
    const allowedRoles = TABLE_WRITE_ROLE_PERMISSIONS[table] || [];
    if (!allowedRoles.includes(userRole)) {
      const authErr = `Unauthorized: User role '${userRole}' does not have permission to import records into '${tableName}'. Permitted roles: ${allowedRoles.join(', ')}.`;
      return {
        tableName,
        totalRecords: parsedData?.length || 0,
        validCount: 0,
        invalidCount: parsedData?.length || 0,
        duplicateCount: 0,
        conflictingCount: 0,
        errors: [authErr],
        validationDetails: [{ row: 0, error: authErr }],
        previewData: [],
        validatedRows: [],
      };
    }
  }

  // 4. Validate payload array
  if (!Array.isArray(parsedData) || parsedData.length === 0) {
    return {
      tableName,
      totalRecords: 0,
      validCount: 0,
      invalidCount: 0,
      duplicateCount: 0,
      conflictingCount: 0,
      errors: ['Import dataset is empty or not a valid JSON array.'],
      validationDetails: [],
      previewData: [],
      validatedRows: [],
    };
  }

  const seenIds = new Set<string>();
  const seenBusinessKeys = new Set<string>();
  const validatedRows: any[] = [];
  let invalidCount = 0;
  let duplicateCount = 0;

  parsedData.forEach((row: any, idx: number) => {
    const rowNum = idx + 1;

    // Check row is an object
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      invalidCount++;
      const msg = `Row ${rowNum}: Record must be a valid JSON object.`;
      errors.push(msg);
      validationDetails.push({ row: rowNum, error: msg });
      return;
    }

    let hasRowError = false;

    // Check unknown columns (strict schema enforcement)
    const rowKeys = Object.keys(row);
    for (const key of rowKeys) {
      if (key !== 'company_id' && !schema.allowedColumns.includes(key)) {
        hasRowError = true;
        const msg = `Row ${rowNum}: Unknown or unauthorized column '${key}' is not allowed for table '${tableName}'.`;
        errors.push(msg);
        validationDetails.push({ row: rowNum, field: key, error: msg });
      }
    }

    // Check required fields
    for (const reqField of schema.requiredFields) {
      const val = row[reqField];
      if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
        hasRowError = true;
        const msg = `Row ${rowNum}: Missing required field '${reqField}'.`;
        errors.push(msg);
        validationDetails.push({ row: rowNum, field: reqField, error: msg });
      }
    }

    // Check UUID fields
    if (schema.uuidFields) {
      for (const uuidField of schema.uuidFields) {
        const val = row[uuidField];
        if (val !== undefined && val !== null && val !== '') {
          if (typeof val !== 'string' || !UUID_REGEX.test(val)) {
            hasRowError = true;
            const msg = `Row ${rowNum}: Invalid UUID format for '${uuidField}' ('${val}').`;
            errors.push(msg);
            validationDetails.push({ row: rowNum, field: uuidField, error: msg });
          }
        }
      }
    }

    // Check numeric fields
    if (schema.numericFields) {
      for (const numRule of schema.numericFields) {
        const val = row[numRule.field];
        if (val !== undefined && val !== null && val !== '') {
          const parsedNum = Number(val);
          if (isNaN(parsedNum) || !isFinite(parsedNum)) {
            hasRowError = true;
            const msg = `Row ${rowNum}: Field '${numRule.field}' must be a valid number (received '${val}').`;
            errors.push(msg);
            validationDetails.push({ row: rowNum, field: numRule.field, error: msg });
          } else {
            if (numRule.min !== undefined && parsedNum < numRule.min) {
              hasRowError = true;
              const msg = `Row ${rowNum}: Field '${numRule.field}' value (${parsedNum}) cannot be less than ${numRule.min}.`;
              errors.push(msg);
              validationDetails.push({ row: rowNum, field: numRule.field, error: msg });
            }
            if (numRule.integer && !Number.isInteger(parsedNum)) {
              hasRowError = true;
              const msg = `Row ${rowNum}: Field '${numRule.field}' must be an integer.`;
              errors.push(msg);
              validationDetails.push({ row: rowNum, field: numRule.field, error: msg });
            }
          }
        } else if (!numRule.optional && schema.requiredFields.includes(numRule.field)) {
          hasRowError = true;
          const msg = `Row ${rowNum}: Numeric field '${numRule.field}' is required.`;
          errors.push(msg);
          validationDetails.push({ row: rowNum, field: numRule.field, error: msg });
        }
      }
    }

    // Check date fields
    if (schema.dateFields) {
      for (const dateField of schema.dateFields) {
        const val = row[dateField];
        if (val !== undefined && val !== null && val !== '') {
          if (typeof val !== 'string' || isNaN(Date.parse(val))) {
            hasRowError = true;
            const msg = `Row ${rowNum}: Field '${dateField}' must be a valid date string (e.g. YYYY-MM-DD).`;
            errors.push(msg);
            validationDetails.push({ row: rowNum, field: dateField, error: msg });
          }
        }
      }
    }

    // Check JSON fields
    if (schema.jsonFields) {
      for (const jsonField of schema.jsonFields) {
        const val = row[jsonField];
        if (val !== undefined && val !== null) {
          if (typeof val !== 'object') {
            hasRowError = true;
            const msg = `Row ${rowNum}: Field '${jsonField}' must be a valid JSON structure (array or object).`;
            errors.push(msg);
            validationDetails.push({ row: rowNum, field: jsonField, error: msg });
          }
        }
      }
    }

    // Check status enums
    if (schema.statusEnums && row.status) {
      if (!schema.statusEnums.includes(row.status)) {
        hasRowError = true;
        const msg = `Row ${rowNum}: Invalid status '${row.status}'. Allowed: ${schema.statusEnums.join(', ')}.`;
        errors.push(msg);
        validationDetails.push({ row: rowNum, field: 'status', error: msg });
      }
    }

    // In-payload duplicate checks
    const rowId = row.id ? String(row.id).toLowerCase() : null;
    if (rowId) {
      if (seenIds.has(rowId)) {
        duplicateCount++;
        hasRowError = true;
        const msg = `Row ${rowNum}: Duplicate record ID '${row.id}' found within import payload.`;
        errors.push(msg);
        validationDetails.push({ row: rowNum, field: 'id', error: msg });
      } else {
        seenIds.add(rowId);
      }
    }

    const businessVal = row[schema.uniqueBusinessKey];
    if (businessVal !== undefined && businessVal !== null) {
      const bKey = String(businessVal).trim().toLowerCase();
      if (seenBusinessKeys.has(bKey)) {
        duplicateCount++;
        hasRowError = true;
        const msg = `Row ${rowNum}: Duplicate ${schema.uniqueBusinessKey} '${businessVal}' found within import payload.`;
        errors.push(msg);
        validationDetails.push({ row: rowNum, field: schema.uniqueBusinessKey, error: msg });
      } else {
        seenBusinessKeys.add(bKey);
      }
    }

    if (hasRowError) {
      invalidCount++;
      return;
    }

    // Create pristine sanitized record:
    // 1. NEVER trust client-supplied company_id: overwrite with verified company context
    // 2. NEVER spread arbitrary row properties (...row): assign only allowed columns
    const sanitizedRecord: Record<string, any> = {
      id: row.id || crypto.randomUUID(),
      company_id: verifiedCompanyId,
    };

    for (const col of schema.allowedColumns) {
      if (col !== 'id' && row[col] !== undefined) {
        sanitizedRecord[col] = row[col];
      }
    }

    validatedRows.push(sanitizedRecord);
  });

  return {
    tableName,
    totalRecords: parsedData.length,
    validCount: validatedRows.length,
    invalidCount,
    duplicateCount,
    conflictingCount: 0, // Checked against DB in preview
    errors,
    validationDetails,
    previewData: validatedRows.slice(0, 10),
    validatedRows,
  };
};
