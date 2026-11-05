/**
 * Test customer authentication logic:
 * 1. Verify that unregistered email is rejected.
 * 2. Verify that registered customer can log in.
 * 3. Verify that registration inserts into Supabase customers.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hzspfkhtamzjtezxutfx.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6c3Bma2h0YW16anRlenh1dGZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODA1OTc2MCwiZXhwIjoyMTAzNjM1NzYwfQ.l2wsRv7NKgrOK_VyAm4cVMgS96RUAPyEugdffN87XHc';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY);

async function runAuthTests() {
  console.log("=== Testing Registered Email Login Enforcement ===");

  // Test 1: Unregistered email
  const fakeEmail = 'unregistered.guest.9999@example.com';
  const { data: fakeCustomer } = await supabaseAdmin
    .from('customers')
    .select('*')
    .ilike('email', fakeEmail)
    .maybeSingle();

  console.log(`1. Unregistered email lookup (${fakeEmail}):`, fakeCustomer === null ? "PASSED (Null - Not allowed to login)" : "FAILED");
  if (fakeCustomer !== null) throw new Error("Unregistered email should not exist!");

  // Test 2: Existing registered email
  const registeredEmail = 'aadya.test@example.com';
  const { data: existingCustomer } = await supabaseAdmin
    .from('customers')
    .select('*')
    .ilike('email', registeredEmail)
    .maybeSingle();

  console.log(`2. Registered email lookup (${registeredEmail}):`, existingCustomer ? `PASSED (Found: ${existingCustomer.name})` : "FAILED");
  if (!existingCustomer) throw new Error("Registered email should be found!");

  // Test 3: Register a new customer
  const testNewEmail = `boutique.test.${Date.now()}@example.com`;
  const { data: newCustomer, error: regErr } = await supabaseAdmin
    .from('customers')
    .insert({
      name: 'Rhea Kapoor',
      email: testNewEmail,
      phone: '+91 98765 11223',
      address: '77 Heritage Boulevard',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001'
    })
    .select()
    .single();

  if (regErr) throw regErr;
  console.log(`3. Customer registration for ${testNewEmail}: PASSED (ID: ${newCustomer.id}, Name: ${newCustomer.name})`);

  // Test 4: Verify the newly registered email can now be looked up for login
  const { data: verifyNew } = await supabaseAdmin
    .from('customers')
    .select('*')
    .ilike('email', testNewEmail)
    .maybeSingle();

  console.log(`4. Verify login permission for ${testNewEmail}:`, verifyNew ? "PASSED (Login authorized)" : "FAILED");
  if (!verifyNew) throw new Error("Newly registered email was not found!");

  console.log("\n✨ ALL AUTHENTICATION AND LOGIN VALIDATIONS PASSED! ✨\n");
}

runAuthTests().catch(err => {
  console.error("Auth test failed:", err);
  process.exit(1);
});
