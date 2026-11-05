/**
 * Dear Draupadi - Environment Configuration Loader (env.js)
 * Automatically loads and parses credentials from .env when running on a web server,
 * and sets window.DEAR_DRAUPADI_SUPABASE_URL and window.DEAR_DRAUPADI_SUPABASE_ANON_KEY.
 */
(function () {
    window.ENV = window.ENV || {};

    // 1. If running on a web server (http/https), fetch and parse .env synchronously
    if (window.location && window.location.protocol && window.location.protocol.startsWith('http')) {
        try {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', '.env', false); // Synchronous request so variables are available before other scripts load
            xhr.send();
            if (xhr.status === 200 && xhr.responseText) {
                xhr.responseText.split('\n').forEach(line => {
                    const clean = line.trim();
                    if (!clean || clean.startsWith('#')) return;
                    const idx = clean.indexOf('=');
                    if (idx > 0) {
                        const key = clean.slice(0, idx).trim();
                        let val = clean.slice(idx + 1).trim();
                        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                            val = val.slice(1, -1);
                        }
                        window.ENV[key] = val;
                        if (key === 'SUPABASE_URL' || key === 'VITE_SUPABASE_URL' || key === 'NEXT_PUBLIC_SUPABASE_URL') {
                            window.DEAR_DRAUPADI_SUPABASE_URL = val;
                        }
                        if (key === 'SUPABASE_ANON_KEY' || key === 'VITE_SUPABASE_ANON_KEY' || key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
                            window.DEAR_DRAUPADI_SUPABASE_ANON_KEY = val;
                        }
                        if (key === 'SUPABASE_SERVICE_ROLE_KEY' || key === 'VITE_SUPABASE_SERVICE_ROLE_KEY' || key === 'SUPABASE_SERVICE_KEY') {
                            window.DEAR_DRAUPADI_SUPABASE_SERVICE_ROLE_KEY = val;
                        }
                    }
                });
                console.log("🌸 [Dear Draupadi] Successfully loaded environment variables from .env");
            }
        } catch (e) {
            // Web server restricted .env access or offline; fallback to defaults
        }
    }

    // 2. Direct fallback (also active if opened via file:/// where browser blocks local .env fetch)
    window.DEAR_DRAUPADI_SUPABASE_URL = window.DEAR_DRAUPADI_SUPABASE_URL || 'https://hzspfkhtamzjtezxutfx.supabase.co';
    window.DEAR_DRAUPADI_SUPABASE_ANON_KEY = window.DEAR_DRAUPADI_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6c3Bma2h0YW16anRlenh1dGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwNTk3NjAsImV4cCI6MjEwMzYzNTc2MH0.pqUnZVLjSGalXRQRviCous8CufuRref0rx4zXr1AVZc';
    window.DEAR_DRAUPADI_SUPABASE_SERVICE_ROLE_KEY = window.DEAR_DRAUPADI_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6c3Bma2h0YW16anRlenh1dGZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODA1OTc2MCwiZXhwIjoyMTAzNjM1NzYwfQ.l2wsRv7NKgrOK_VyAm4cVMgS96RUAPyEugdffN87XHc';
})();
