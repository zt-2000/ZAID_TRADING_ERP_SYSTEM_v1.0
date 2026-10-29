import { validateTableImportData, BLOCKED_TABLES } from '../utils/validation_engine';

async function runSecurityTests() {
  console.log('Running Security Tests...');

  // Test 1: Verify blocked tables rejection
  for (const table of BLOCKED_TABLES) {
    const result = validateTableImportData(table, [{ id: '1' }], 'test-company-id', 'Owner / Administrator');
    if (result.errors.length > 0) {
      console.log(`PASS: Table ${table} is correctly blocked.`);
    } else {
      console.error(`FAIL: Table ${table} was not blocked!`);
    }
  }

  // Test 2: Verify unauthorized role rejection
  const result = validateTableImportData('customers', [{ id: '1', code: 'C001', name: 'Test' }], 'test-company-id', 'Guest');
  if (result.errors.length > 0 && result.errors[0].includes('Unauthorized')) {
    console.log('PASS: Unauthorized role correctly rejected.');
  } else {
    console.error('FAIL: Unauthorized role was allowed!');
  }

  console.log('Security Tests Completed.');
}

runSecurityTests().catch(console.error);
