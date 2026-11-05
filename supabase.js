/**
 * Dear Draupadi - Supabase Client Configuration
 * Initializes the official @supabase/supabase-js browser client using project URL and publishable (anon) key.
 */

// Configure your Supabase project credentials here
const SUPABASE_CONFIG = {
    url: window.DEAR_DRAUPADI_SUPABASE_URL || 'https://hzspfkhtamzjtezxutfx.supabase.co',
    anonKey: window.DEAR_DRAUPADI_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6c3Bma2h0YW16anRlenh1dGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwNTk3NjAsImV4cCI6MjEwMzYzNTc2MH0.pqUnZVLjSGalXRQRviCous8CufuRref0rx4zXr1AVZc',
    serviceRoleKey: window.DEAR_DRAUPADI_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6c3Bma2h0YW16anRlenh1dGZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODA1OTc2MCwiZXhwIjoyMTAzNjM1NzYwfQ.l2wsRv7NKgrOK_VyAm4cVMgS96RUAPyEugdffN87XHc'
};

// Initialize Supabase Client if library is available
let supabaseClient = null;
let supabaseAdminClient = null;

if (typeof supabase !== 'undefined' && supabase.createClient) {
    if (SUPABASE_CONFIG.url && SUPABASE_CONFIG.url !== 'https://your-project-id.supabase.co') {
        try {
            supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
            console.log("🌸 [Dear Draupadi] Supabase client initialized successfully.");
        } catch (err) {
            console.warn("⚠️ [Dear Draupadi] Supabase client initialization error:", err.message);
        }

        try {
            supabaseAdminClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey || SUPABASE_CONFIG.anonKey);
            console.log("🌸 [Dear Draupadi] Supabase admin client initialized successfully.");
        } catch (adminErr) {
            console.warn("⚠️ [Dear Draupadi] Supabase admin client initialization error:", adminErr.message);
        }
    } else {
        console.info("🌸 [Dear Draupadi] Supabase placeholder credentials active. Replace with your actual project URL and anon key in supabase.js.");
    }
} else {
    console.warn("⚠️ [Dear Draupadi] @supabase/supabase-js library not loaded yet.");
}

// Export globally
window.supabaseClient = supabaseClient;
window.supabaseAdminClient = supabaseAdminClient;
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
