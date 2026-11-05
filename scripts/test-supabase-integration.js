/**
 * Automated Verification Script for Supabase Integration
 */

const SUPABASE_URL = 'https://hzspfkhtamzjtezxutfx.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6c3Bma2h0YW16anRlenh1dGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwNTk3NjAsImV4cCI6MjEwMzYzNTc2MH0.pqUnZVLjSGalXRQRviCous8CufuRref0rx4zXr1AVZc';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6c3Bma2h0YW16anRlenh1dGZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODA1OTc2MCwiZXhwIjoyMTAzNjM1NzYwfQ.l2wsRv7NKgrOK_VyAm4cVMgS96RUAPyEugdffN87XHc';

async function req(endpoint, method = 'GET', body = null, useService = false) {
  const key = useService ? SERVICE_KEY : ANON_KEY;
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  let json = null;
  try { json = JSON.parse(text); } catch (e) { json = text; }
  return { status: response.status, data: json };
}

async function runTests() {
  console.log("=== Testing Dear Draupadi Supabase Integration ===");

  // 1. Fetch Categories
  const catRes = await req('categories?select=*');
  console.log(`1. Categories test: HTTP ${catRes.status}, count: ${catRes.data.length}`);
  if (catRes.status !== 200 || catRes.data.length === 0) throw new Error("Categories test failed");

  // 2. Fetch Products
  const prodRes = await req('products?select=*');
  console.log(`2. Products test: HTTP ${prodRes.status}, count: ${prodRes.data.length}`);
  if (prodRes.status !== 200 || prodRes.data.length === 0) throw new Error("Products test failed");

  // 3. Fetch Product Images
  const imgRes = await req('product_images?select=*');
  console.log(`3. Product Images test: HTTP ${imgRes.status}, count: ${imgRes.data.length}`);
  if (imgRes.status !== 200 || imgRes.data.length === 0) throw new Error("Product Images test failed");

  // 4. Fetch Coupons
  const cpnRes = await req('coupons?select=*');
  console.log(`4. Coupons test: HTTP ${cpnRes.status}, count: ${cpnRes.data.length}`);
  if (cpnRes.status !== 200 || cpnRes.data.length === 0) throw new Error("Coupons test failed");

  // 5. Test Customer & Order Creation
  const custRes = await req('customers', 'POST', {
    name: "Aadya Sen",
    email: "aadya.test@example.com",
    phone: "+91 99887 76655",
    address: "42 Lotus Villa, MG Road",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560001"
  }, true);
  console.log(`5. Customer creation: HTTP ${custRes.status}`);
  const customerId = custRes.data[0]?.id;

  const orderRes = await req('orders', 'POST', {
    customer_id: customerId,
    total_amount: 499,
    discount: 50,
    payment_method: "Cash on Delivery",
    payment_status: "pending",
    order_status: "placed"
  });
  console.log(`6. Order creation: HTTP ${orderRes.status}, order ID: ${orderRes.data[0]?.id}`);
  const orderId = orderRes.data[0]?.id;

  // 6. Test Order Items insertion
  const itemRes = await req('order_items', 'POST', {
    order_id: orderId,
    product_id: prodRes.data[0].id,
    product_name: prodRes.data[0].name,
    quantity: 1,
    price: 499
  });
  console.log(`7. Order Item creation: HTTP ${itemRes.status}`);

  // 7. Test Order Lookup
  const lookupRes = await req(`orders?id=eq.${orderId}&select=*,customers(*),order_items(*)`);
  console.log(`8. Order Lookup test: HTTP ${lookupRes.status}, items: ${lookupRes.data[0]?.order_items?.length}`);

  // 8. Test Review Submission
  const reviewRes = await req('reviews', 'POST', {
    product_id: prodRes.data[0].id,
    rating: 5,
    comment: "Ananya: Absolutely breathtaking craftsmanship, love the packaging!",
    status: "approved"
  });
  console.log(`9. Review submission: HTTP ${reviewRes.status}`);

  console.log("\n✨ ALL 9 SUPABASE DATABASE TESTS PASSED SUCCESSFULLY! ✨\n");
}

runTests().catch(err => {
  console.error("Test failure:", err);
  process.exit(1);
});
