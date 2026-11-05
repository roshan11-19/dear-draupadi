/**
 * End-to-end Verification Script for Hamper Builder & Product Uploads logic
 */
const fs = require('fs');
const path = require('path');

console.log("🌸 [Dear Draupadi] Starting Unit & Integration Verification...");

// 1. Mock Browser Environment for store.js & app.js testing
const localStorageMock = (function() {
    let store = {};
    return {
        getItem: function(key) {
            return store[key] || null;
        },
        setItem: function(key, value) {
            store[key] = value.toString();
        },
        removeItem: function(key) {
            delete store[key];
        },
        clear: function() {
            store = {};
        }
    };
})();

class CustomEvent {
    constructor(event, params) {
        this.type = event;
        this.detail = params ? params.detail : null;
    }
}
global.CustomEvent = CustomEvent;

global.window = {
    addEventListener: () => {},
    dispatchEvent: () => true,
    localStorage: localStorageMock,
    location: { origin: 'http://localhost:3000' }
};
global.localStorage = localStorageMock;
global.document = {
    addEventListener: () => {},
    querySelectorAll: () => [],
    getElementById: () => null
};

// Load store.js
const storeCode = fs.readFileSync(path.join(__dirname, '../store.js'), 'utf8');
eval(storeCode);
const Store = window.Store;

console.log("✅ store.js loaded successfully.");

// 2. Verify Hamper Presets
const presets = Store.getHamperPresets();
console.log(`✅ Hamper Presets loaded: ${presets.length} presets found.`);
if (presets.length < 3) throw new Error("Expected at least 3 hamper presets");

const p499 = Store.getHamperPresetById("HAMPER-499");
if (!p499 || p499.price !== 499) throw new Error("HAMPER-499 preset invalid");
console.log("✅ HAMPER-499 verified:", p499.name);

// 3. Test Adding a Custom Hamper to Cart
Store.clearCart();
const customHamperItems = [
    { productId: "DD-PRD-001", name: "Handmade Blossom Bloom", quantity: 2, price: 149 },
    { productId: "DD-PRD-005", name: "Crochet Daisy Bookmark", quantity: 1, price: 99 }
];

const totalValue = (2 * 149) + (1 * 99); // 397
Store.addToCart("Priya's Birthday Surprise", 1, totalValue, {
    isHamper: true,
    hamperItems: customHamperItems,
    customMessage: "Happy Birthday with all our love!"
});

const cart = Store.getCart();
if (cart.length !== 1) throw new Error("Cart should have exactly 1 hamper item");
const hamperCartItem = cart[0];
if (!hamperCartItem.isHamper) throw new Error("Item should have isHamper = true");
if (hamperCartItem.price !== totalValue) throw new Error("Hamper price should be " + totalValue);
if (hamperCartItem.hamperItems.length !== 2) throw new Error("Hamper should have 2 component items");
console.log("✅ Custom Hamper added to cart successfully:", hamperCartItem.name, `(₹${hamperCartItem.price})`);

// 4. Test Stock Deduction on Order Creation
const initialProducts = Store.getProducts();
const prod1Before = initialProducts.find(p => p.id === "DD-PRD-001").stock;
const prod5Before = initialProducts.find(p => p.id === "DD-PRD-005").stock;

const orderResult = Store.createOrder({
    customer: { name: "Aarav Gupta", email: "aarav@example.com", phone: "9876543210" },
    shipping: { address: "123 Boutique Lane", city: "Bengaluru", state: "Karnataka", pincode: "560001" },
    items: cart,
    pricing: { subtotal: totalValue, discount: 0, total: totalValue },
    paymentMethod: "UPI / Netbanking",
    notes: "Gift packaging requested"
});

if (!orderResult) throw new Error("Order creation failed");
console.log("✅ Order created:", orderResult.id);

// Check that component product stocks were correctly deducted
const updatedProducts = Store.getProducts();
const prod1After = updatedProducts.find(p => p.id === "DD-PRD-001").stock;
const prod5After = updatedProducts.find(p => p.id === "DD-PRD-005").stock;

if (prod1After !== prod1Before - 2) throw new Error(`Product 1 stock deduction mismatch: before ${prod1Before}, after ${prod1After}`);
if (prod5After !== prod5Before - 1) throw new Error(`Product 5 stock deduction mismatch: before ${prod5Before}, after ${prod5After}`);
console.log(`✅ Inventory Deduction Verified: DD-PRD-001 reduced by 2 (${prod1Before} → ${prod1After}), DD-PRD-005 reduced by 1 (${prod5Before} → ${prod5After})`);

// Check that order preserved hamper components
const orderItem = orderResult.items[0];
if (!orderItem.isHamper || !orderItem.hamperItems || orderItem.hamperItems.length !== 2) {
    throw new Error("Order item did not preserve hamper component breakdown!");
}
console.log("✅ Order preserved hamper breakdown:", orderItem.hamperItems.map(i => `${i.name} x${i.quantity}`).join(', '));

console.log("\n🌸 ALL LOGIC TESTS PASSED SUCCESSFULLY! ❀\n");
