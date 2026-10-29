import { validateTableImportData, BLOCKED_TABLES } from '../utils/validation_engine';

async function runSecurityTests() {
  console.log('Running Security Tests...');
  let hasFailures = false;

  const assert = (condition: boolean, message: string) => {
    if (!condition) {
      console.error(`FAIL: ${message}`);
      hasFailures = true;
    } else {
      console.log(`PASS: ${message}`);
    }
  };

  // Test 1: Verify blocked tables rejection
  for (const table of BLOCKED_TABLES) {
    const result = validateTableImportData(table, [{ id: '1' }], 'test-company-id', 'Owner / Administrator');
    assert(result.errors.length > 0, `Table ${table} is correctly blocked.`);
  }

  // Test 2: Verify unauthorized role rejection
  const roleResult = validateTableImportData('customers', [{ id: '1', code: 'C001', name: 'Test' }], 'test-company-id', 'Guest');
  assert(roleResult.errors.length > 0 && roleResult.errors[0].includes('Unauthorized'), 'Unauthorized role correctly rejected.');

  // Test 3: Invalid UUID rejection
  const uuidResult = validateTableImportData('products', [{ id: 'not-a-uuid', sku: 'S001', name: 'Test' }], 'test-company-id', 'Owner / Administrator');
  assert(uuidResult.invalidCount > 0, 'Invalid UUID correctly rejected.');

  // Test 4: Duplicate business key rejection
  const dupResult = validateTableImportData('products', 
    [{ id: '1', sku: 'S001', name: 'Test' }, { id: '2', sku: 'S001', name: 'Test 2' }], 
    'test-company-id', 'Owner / Administrator'
  );
  assert(dupResult.duplicateCount > 0, 'Duplicate business key correctly rejected.');

  if (hasFailures) {
    console.error('Security Tests Failed.');
    process.exit(1);
  } else {
    console.log('Security Tests Completed Successfully.');
    process.exit(0);
  }
}

runSecurityTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
