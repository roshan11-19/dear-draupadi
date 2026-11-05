/**
 * Dear Draupadi - Centralized Data Store & State Management
 * Handles Supabase database sync, LocalStorage persistence, and reactive state sync.
 */

const STORAGE_KEYS = {
    PRODUCTS: 'dd_products_v2',
    ORDERS: 'dd_orders_v2',
    REVIEWS: 'dd_reviews_v2',
    COUPONS: 'dd_coupons_v2',
    CATEGORIES: 'dd_categories_v2',
    CART: 'dd_cart_v2',
    WISHLIST: 'dd_wishlist_v2',
    ADMIN_SESSION: 'dd_admin_session_v2',
    CUSTOMER_SESSION: 'dd_customer_session_v2',
    CUSTOMER_REGISTRATIONS: 'dd_customer_registrations_v2',
    APPLIED_COUPON: 'dd_applied_coupon_v2',
    HAMPER_PRESETS: 'dd_hamper_presets_v2'
};

// Default Curated Hamper Presets
const DEFAULT_HAMPER_PRESETS = [
    {
        id: "HAMPER-499",
        name: "The Draupadi Celebration Hamper",
        price: 499,
        originalPrice: 650,
        description: "An artisanal curation packed in our signature beige keepsake box: includes 1 handmade bloom flower, 1 pearl bracelet, 1 crochet daisy bookmark, and a handwritten calligraphy gift card.",
        image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80",
        symbol: "🎀",
        active: true,
        featured: true,
        items: [
            { productId: "1", name: "Handmade Blossom Bloom", quantity: 1 },
            { productId: "3", name: "Vintage Rosette Charm Bracelet", quantity: 1 },
            { productId: "5", name: "Hand-Knitted Crochet Daisy Bookmark", quantity: 1 }
        ]
    },
    {
        id: "HAMPER-799",
        name: "Boutique Elegance Hamper",
        price: 799,
        originalPrice: 999,
        description: "A deluxe keepsake gift box featuring our freshwater pearl necklace, handcrafted blossom, and velvet satin scrunchie trio.",
        image: "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=800&auto=format&fit=crop&q=80",
        symbol: "✨",
        active: true,
        featured: true,
        items: [
            { productId: "2", name: "Moonlit Freshwater Pearl Necklace", quantity: 1 },
            { productId: "1", name: "Handmade Blossom Bloom", quantity: 1 },
            { productId: "7", name: "Velvet Satin Scrunchie Trio", quantity: 1 }
        ]
    },
    {
        id: "HAMPER-999",
        name: "Royal Pastel Keepsake Hamper",
        price: 999,
        originalPrice: 1299,
        description: "Our grandest celebration box filled with heirloom jewellery and slow-made treasures: pearl necklace, solitaire ring, bloom, and daisy bookmark.",
        image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80",
        symbol: "🌸",
        active: true,
        featured: true,
        items: [
            { productId: "2", name: "Moonlit Freshwater Pearl Necklace", quantity: 1 },
            { productId: "6", name: "Rose Quartz & Brass Solitaire Ring", quantity: 1 },
            { productId: "1", name: "Handmade Blossom Bloom", quantity: 1 },
            { productId: "5", name: "Hand-Knitted Crochet Daisy Bookmark", quantity: 1 }
        ]
    },
    {
        id: "HAMPER-1499",
        name: "Grand Artisan Luxe Hamper",
        price: 1499,
        originalPrice: 1899,
        description: "The ultimate Dear Draupadi gift box containing our entire artisan signature suite: necklace, terracotta earrings, ring, 2 blooms, and scrunchies.",
        image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80",
        symbol: "👑",
        active: true,
        featured: false,
        items: [
            { productId: "2", name: "Moonlit Freshwater Pearl Necklace", quantity: 1 },
            { productId: "8", name: "Sun-Baked Terracotta Floral Drops", quantity: 1 },
            { productId: "6", name: "Rose Quartz & Brass Solitaire Ring", quantity: 1 },
            { productId: "1", name: "Handmade Blossom Bloom", quantity: 2 },
            { productId: "7", name: "Velvet Satin Scrunchie Trio", quantity: 1 }
        ]
    }
];

// Initial Seed Products (Used as fallback if Supabase is offline or not configured yet)
const DEFAULT_PRODUCTS = [
    {
        id: "DD-PRD-001",
        name: "Handmade Blossom Bloom",
        category: "Flowers",
        price: 129,
        originalPrice: 179,
        stock: 18,
        images: [
            "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80"
        ],
        symbol: "🌸",
        description: "A delicate, handcrafted blossom created with premium crepe and soft velvet paper. Perfect for gifting, room decor, or adding a timeless floral charm that never fades.",
        materials: "Hand-painted crepe paper, floral wire stem, velvet ribbon accent",
        size: "Approx. 22cm total stem length, 8cm flower diameter",
        care: "Keep away from moisture and direct prolonged sunlight. Gently dust with a soft brush.",
        rating: 4.9,
        reviewCount: 24,
        featured: true,
        newArrival: true,
        bestseller: false,
        tags: ["flower", "handmade", "decor", "gift", "pink", "bloom"],
        badge: "NEW"
    },
    {
        id: "DD-PRD-002",
        name: "Moonlit Freshwater Pearl Necklace",
        category: "Jewellery",
        price: 285,
        originalPrice: 350,
        stock: 12,
        images: [
            "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1611591475152-478311382490?w=800&auto=format&fit=crop&q=80"
        ],
        symbol: "✨",
        description: "A graceful necklace strung with genuine baroque freshwater pearls, accented with 18k gold-plated hypoallergenic clasp and extension chain.",
        materials: "Baroque natural pearls, 18k gold-plated brass findings, nylon cord",
        size: "16-inch base length + 2-inch extension chain",
        care: "Wipe with a soft dry cloth after wearing. Store in a pouch away from perfumes and sprays.",
        rating: 4.8,
        reviewCount: 38,
        featured: true,
        newArrival: false,
        bestseller: true,
        tags: ["necklace", "pearl", "jewellery", "gold", "handmade", "elegant"],
        badge: "BESTSELLER"
    },
    {
        id: "DD-PRD-003",
        name: "Vintage Rosette Charm Bracelet",
        category: "Bracelets",
        price: 99,
        originalPrice: 140,
        stock: 22,
        images: [
            "https://images.unsplash.com/photo-1611591475152-478311382490?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80"
        ],
        symbol: "♡",
        description: "A charming adjustable wristlet strung with pastel ceramic beads, tiny brass charms, and an antique gold finished rosette clasp.",
        materials: "Glazed ceramic beads, antique gold alloy charms, durable stretch thread",
        size: "Standard 6.5-inch stretch fit (fits wrists 6-7.5 inches)",
        care: "Avoid direct contact with water and harsh soaps.",
        rating: 4.7,
        reviewCount: 19,
        featured: true,
        newArrival: false,
        bestseller: false,
        tags: ["bracelet", "charm", "beads", "wristlet", "handmade"],
        badge: "POPULAR"
    },
    {
        id: "DD-PRD-004",
        name: "The Draupadi Celebration Hamper",
        category: "Hampers",
        price: 499,
        originalPrice: 650,
        stock: 8,
        images: [
            "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80"
        ],
        symbol: "🎀",
        description: "An artisanal curation packed in our signature beige keepsake box: includes 1 handmade bloom flower, 1 pearl bracelet, 1 scented beeswax tealight, and a handwritten calligraphy gift card.",
        materials: "Handmade items, rigid craft box with satin bow, shredded paper nest",
        size: "Gift box dimensions: 20cm x 15cm x 8cm",
        care: "Comes ready to gift with customizable message card.",
        rating: 5.0,
        reviewCount: 42,
        featured: true,
        newArrival: true,
        bestseller: true,
        tags: ["hamper", "gift set", "flowers", "bracelet", "birthday", "celebration"],
        badge: "EDITOR'S PICK"
    },
    {
        id: "DD-PRD-005",
        name: "Hand-Knitted Crochet Daisy Bookmark",
        category: "Crochet",
        price: 79,
        originalPrice: 110,
        stock: 30,
        images: [
            "https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=800&auto=format&fit=crop&q=80"
        ],
        symbol: "🌼",
        description: "Slow-made with soft combed cotton yarn, this darling daisy bookmark stays snug between your favourite pages, bringing calm to every reading session.",
        materials: "100% organic combed cotton yarn, wooden bead tail",
        size: "Length: 28cm (stem cord + daisy head)",
        care: "Gentle hand wash in cold water. Lay flat to air dry.",
        rating: 4.9,
        reviewCount: 16,
        featured: false,
        newArrival: true,
        bestseller: false,
        tags: ["crochet", "bookmark", "daisy", "book lover", "cotton", "handmade"],
        badge: "HANDMADE"
    },
    {
        id: "DD-PRD-006",
        name: "Rose Quartz & Brass Solitaire Ring",
        category: "Jewellery",
        price: 165,
        originalPrice: 220,
        stock: 14,
        images: [
            "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1598560917505-59a3ad559071?w=800&auto=format&fit=crop&q=80"
        ],
        symbol: "💍",
        description: "A soft natural raw rose quartz cabochon wrapped in hammered brass bezel. Adjustable band fits gently on any finger.",
        materials: "Natural Rose Quartz gemstone, hammered raw brass band",
        size: "Adjustable (US Size 5 to 9)",
        care: "Store in an airtight pouch. Clean brass gently with lemon juice or polishing cloth if natural patina develops.",
        rating: 4.8,
        reviewCount: 29,
        featured: false,
        newArrival: false,
        bestseller: true,
        tags: ["ring", "rose quartz", "gemstone", "jewellery", "brass", "handmade"],
        badge: "FAVOURITE"
    },
    {
        id: "DD-PRD-007",
        name: "Velvet Satin Scrunchie Trio",
        category: "Accessories",
        price: 119,
        originalPrice: 150,
        stock: 25,
        images: [
            "https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80"
        ],
        symbol: "🪶",
        description: "Set of three luxurious oversized scrunchies in terracotta, sage green, and warm cream. Glides smoothly over hair without creasing or tugging.",
        materials: "Silk-blend velvet and matte satin with durable inner elastic",
        size: "Outer diameter: 12cm",
        care: "Hand wash with mild detergent. Air dry in shade.",
        rating: 4.7,
        reviewCount: 14,
        featured: false,
        newArrival: false,
        bestseller: false,
        tags: ["scrunchie", "hair accessory", "velvet", "satin", "terracotta"],
        badge: "SET OF 3"
    },
    {
        id: "DD-PRD-008",
        name: "Sun-Baked Terracotta Floral Drops",
        category: "Jewellery",
        price: 145,
        originalPrice: 195,
        stock: 9,
        images: [
            "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&auto=format&fit=crop&q=80"
        ],
        symbol: "🏺",
        description: "Lightweight terracotta clay earrings hand-stamped with delicate marigold petals and kiln fired with a warm matte finish. Fitted with stainless steel studs.",
        materials: "Natural natural clay, non-toxic pigment, surgical steel posts",
        size: "Length: 4.5cm, Weight: 4g per earring (ultra lightweight)",
        care: "Do not bend. Store safely in the provided Dear Draupadi cloth pouch.",
        rating: 4.9,
        reviewCount: 31,
        featured: true,
        newArrival: true,
        bestseller: false,
        tags: ["earrings", "terracotta", "clay", "handmade", "floral", "jewellery"],
        badge: "HANDCRAFTED"
    }
];

// Default Categories
const DEFAULT_CATEGORIES = [
    "Jewellery",
    "Flowers",
    "Bracelets",
    "Crochet",
    "Hampers",
    "Accessories"
];

// Default Coupons
const DEFAULT_COUPONS = [
    {
        id: "CPN-01",
        code: "DRAUPADI10",
        type: "percentage",
        value: 10,
        minSpend: 199,
        description: "10% off on orders above ₹199",
        active: true,
        expiry: "2026-12-31"
    },
    {
        id: "CPN-02",
        code: "FIRSTLOVE",
        type: "fixed",
        value: 50,
        minSpend: 250,
        description: "Flat ₹50 off on orders above ₹250",
        active: true,
        expiry: "2026-12-31"
    },
    {
        id: "CPN-03",
        code: "HANDMADE20",
        type: "percentage",
        value: 20,
        minSpend: 499,
        description: "20% off on boutique orders above ₹499",
        active: true,
        expiry: "2026-12-31"
    }
];

// Default Sample Orders
const DEFAULT_ORDERS = [
    {
        id: "DD-984210",
        date: "2026-08-24T14:32:00Z",
        customer: {
            name: "Ananya Sharma",
            email: "ananya.sharma@example.com",
            phone: "+91 98765 43210"
        },
        shipping: {
            address: "Flat 402, Lotus Heritage, 12th Main Road",
            city: "Bengaluru",
            state: "Karnataka",
            pincode: "560038"
        },
        items: [
            {
                id: "DD-PRD-004",
                name: "The Draupadi Celebration Hamper",
                price: 499,
                quantity: 1,
                symbol: "🎀",
                image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80"
            }
        ],
        pricing: {
            subtotal: 499,
            delivery: 0,
            discount: 50,
            couponCode: "FIRSTLOVE",
            total: 449
        },
        paymentMethod: "Cash on Delivery",
        paymentStatus: "Pending",
        status: "Shipped",
        statusHistory: [
            { status: "Order Placed", time: "24 Aug 2026, 02:32 PM", note: "Order received with love" },
            { status: "Confirmed", time: "24 Aug 2026, 03:15 PM", note: "Treasures confirmed in stock" },
            { status: "Packed", time: "24 Aug 2026, 06:40 PM", note: "Artfully boxed with satin ribbon" },
            { status: "Shipped", time: "25 Aug 2026, 10:20 AM", note: "Handed to courier partner" }
        ],
        expectedDelivery: "27 Aug 2026"
    },
    {
        id: "DD-872145",
        date: "2026-08-25T11:10:00Z",
        customer: {
            name: "Pooja Hegde",
            email: "pooja.h@example.com",
            phone: "+91 91234 56789"
        },
        shipping: {
            address: "House 18, Gulmohar Avenue, Bandra West",
            city: "Mumbai",
            state: "Maharashtra",
            pincode: "400050"
        },
        items: [
            {
                id: "DD-PRD-002",
                name: "Moonlit Freshwater Pearl Necklace",
                price: 285,
                quantity: 1,
                symbol: "✨",
                image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80"
            },
            {
                id: "DD-PRD-001",
                name: "Handmade Blossom Bloom",
                price: 129,
                quantity: 1,
                symbol: "🌸",
                image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80"
            }
        ],
        pricing: {
            subtotal: 414,
            delivery: 0,
            discount: 0,
            couponCode: null,
            total: 414
        },
        paymentMethod: "UPI",
        paymentStatus: "Paid (Demo)",
        status: "Confirmed",
        statusHistory: [
            { status: "Order Placed", time: "25 Aug 2026, 11:10 AM", note: "Order placed successfully" },
            { status: "Confirmed", time: "25 Aug 2026, 11:45 AM", note: "Payment verified via UPI" }
        ],
        expectedDelivery: "28 Aug 2026"
    }
];

// Initial Reviews
const DEFAULT_REVIEWS = [
    {
        id: "REV-01",
        productId: "DD-PRD-001",
        productName: "Handmade Blossom Bloom",
        author: "Meera K.",
        rating: 5,
        date: "2026-08-20",
        comment: "The craftsmanship is breathtaking! It looks even more graceful in person on my study desk. 🌸",
        status: "approved"
    },
    {
        id: "REV-02",
        productId: "DD-PRD-002",
        productName: "Moonlit Freshwater Pearl Necklace",
        author: "Rhea Sen",
        rating: 5,
        date: "2026-08-22",
        comment: "Such dainty pearls and the finish is premium. Packaged with so much warmth and care!",
        status: "approved"
    },
    {
        id: "REV-03",
        productId: "DD-PRD-004",
        productName: "The Draupadi Celebration Hamper",
        author: "Sneha Roy",
        rating: 5,
        date: "2026-08-23",
        comment: "Ordered this for my sister's birthday and she literally teared up. The handwritten card was so thoughtful.",
        status: "approved"
    }
];

/**
 * Main Store Object
 */
const Store = {
    isLoadingProducts: false,

    // Initialization
    async init() {
        if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
            localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
        }
        if (!localStorage.getItem(STORAGE_KEYS.COUPONS)) {
            localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(DEFAULT_COUPONS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
            localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(DEFAULT_ORDERS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.REVIEWS)) {
            localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(DEFAULT_REVIEWS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.CART)) {
            localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORAGE_KEYS.WISHLIST)) {
            localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORAGE_KEYS.HAMPER_PRESETS)) {
            localStorage.setItem(STORAGE_KEYS.HAMPER_PRESETS, JSON.stringify(DEFAULT_HAMPER_PRESETS));
        }

        // Fetch product catalogue and categories from Supabase
        await this.fetchProductsFromSupabase();
        await this.fetchOrdersFromSupabase();
    },

    // ==================== SUPABASE PRODUCT CATALOGUE INTEGRATION ====================
    async fetchProductsFromSupabase() {
        const client = window.supabaseAdminClient || window.supabaseClient;
        if (!client) {
            console.log("🌸 [Dear Draupadi] Supabase client not initialized; running with cached local catalog.");
            return;
        }

        try {
            this.isLoadingProducts = true;
            this.emit('products:loading', true);

            // 1. Fetch categories from Supabase
            let supabaseCategories = [];
            let categoryMap = {}; // id -> name
            try {
                const { data: catData, error: catErr } = await client.from('categories').select('*');
                if (!catErr && catData && catData.length > 0) {
                    supabaseCategories = catData.map(c => c.name || c.title || c.slug).filter(Boolean);
                    catData.forEach(c => {
                        categoryMap[c.id] = c.name || c.title || c.slug;
                    });
                }
            } catch (catEx) {
                console.warn("⚠️ [Dear Draupadi] Categories fetch notice:", catEx.message);
            }

            // Merge with local categories and respect deleted categories
            try {
                const deletedCats = JSON.parse(localStorage.getItem('dd_deleted_categories') || '[]');
                supabaseCategories = supabaseCategories.filter(c => !deletedCats.some(d => d.toLowerCase() === c.toLowerCase()));

                const localCats = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES) || '[]');
                localCats.forEach(lc => {
                    if (!supabaseCategories.some(sc => sc.toLowerCase() === lc.toLowerCase()) && !deletedCats.some(d => d.toLowerCase() === lc.toLowerCase())) {
                        supabaseCategories.push(lc);
                    }
                });

                if (supabaseCategories.length > 0) {
                    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(supabaseCategories));
                    this.emit('categories:updated', supabaseCategories);
                }
            } catch (mergeEx) {}

            // 2. Fetch product images if stored in product_images table
            let productImagesMap = {}; // product_id -> [urls]
            try {
                const { data: imgData, error: imgErr } = await client.from('product_images').select('*').order('sort_order', { ascending: true });
                if (!imgErr && imgData && imgData.length > 0) {
                    imgData.forEach(img => {
                        const pid = String(img.product_id !== undefined ? img.product_id : (img.productId || ''));
                        const url = img.image_url || img.url || img.src;
                        if (pid && url) {
                            if (!productImagesMap[pid]) productImagesMap[pid] = [];
                            productImagesMap[pid].push(url);
                        }
                    });
                }
            } catch (imgEx) {
                console.warn("⚠️ [Dear Draupadi] Product images table notice:", imgEx.message);
            }

            // 3. Fetch products from Supabase
            const { data: prodData, error: prodErr } = await client.from('products').select('*');
            if (prodErr) {
                console.error("❌ [Dear Draupadi] Error fetching products from Supabase:", prodErr.message);
                return;
            }

            if (prodData && prodData.length > 0) {
                const localProducts = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
                const normalizedProducts = prodData.map((p, index) => {
                    const id = p.id ? String(p.id) : `DD-PRD-${index + 1}`;
                    const name = p.name || p.title || "Handmade Piece";
                    
                    // Resolve category name
                    let category = "Jewellery";
                    if (p.category_id && categoryMap[p.category_id]) {
                        category = categoryMap[p.category_id];
                    } else if (p.category) {
                        category = p.category;
                    }

                    // Resolve images array
                    let images = [];
                    const strId = String(p.id);
                    if (Array.isArray(p.images) && p.images.length > 0) {
                        images = p.images;
                    } else if (productImagesMap[strId] && productImagesMap[strId].length > 0) {
                        images = productImagesMap[strId];
                    } else if (p.image_url || p.imageUrl || p.image) {
                        images = [p.image_url || p.imageUrl || p.image];
                    } else if (typeof p.images === 'string' && p.images.startsWith('http')) {
                        images = [p.images];
                    }

                    // Fallback image if none present
                    if (!images || images.length === 0) {
                        const lower = name.toLowerCase();
                        if (lower.includes("necklace") || lower.includes("pearl") || category.toLowerCase() === "jewellery") {
                            images = [
                                "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80",
                                "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80"
                            ];
                        } else if (lower.includes("bouquet") || lower.includes("rose") || lower.includes("flower") || category.toLowerCase() === "flowers") {
                            images = [
                                "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80",
                                "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=800&auto=format&fit=crop&q=80"
                            ];
                        } else if (lower.includes("crochet") || lower.includes("charm") || lower.includes("daisy") || category.toLowerCase() === "crochet") {
                            images = [
                                "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800&auto=format&fit=crop&q=80",
                                "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80"
                            ];
                        } else if (lower.includes("box") || lower.includes("gift") || lower.includes("hamper") || category.toLowerCase() === "hampers") {
                            images = [
                                "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80",
                                "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=800&auto=format&fit=crop&q=80"
                            ];
                        } else if (lower.includes("scrunchie") || lower.includes("bow") || lower.includes("velvet") || category.toLowerCase() === "accessories") {
                            images = [
                                "https://images.unsplash.com/photo-1583209814683-c023dd293cc6?w=800&auto=format&fit=crop&q=80",
                                "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80"
                            ];
                        } else {
                            images = ["https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80"];
                        }
                    }

                    const price = parseFloat(p.price) || 99;
                    const originalPrice = parseFloat(p.original_price || p.originalPrice) || null;
                    let stock = (p.stock !== undefined && p.stock !== null && !isNaN(parseInt(p.stock, 10))) ? parseInt(p.stock, 10) : 10;

                    // Preserve locally decremented stock from recent orders against cloud latency
                    const recent = this._recentStockDeductions ? (this._recentStockDeductions[String(id)] || (name ? this._recentStockDeductions[name.trim().toLowerCase()] : null)) : null;
                    if (recent && (Date.now() - recent.time < 45000)) {
                        stock = Math.min(stock, recent.stock);
                    } else {
                        const localMatch = localProducts.find(lp => String(lp.id) === String(id) || (lp.name && name && lp.name.trim().toLowerCase() === name.trim().toLowerCase()));
                        if (localMatch && typeof localMatch.stock === 'number' && localMatch.stock < stock) {
                            stock = localMatch.stock;
                        }
                    }
                    const rating = parseFloat(p.rating) || 5.0;
                    const reviewCount = parseInt(p.review_count || p.reviewCount) || 1;
                    const featured = Boolean(p.featured);
                    const newArrival = Boolean(p.new_arrival !== undefined ? p.new_arrival : p.newArrival);
                    const bestseller = Boolean(p.bestseller);

                    // Tags parsing
                    let tags = [];
                    if (Array.isArray(p.tags)) {
                        tags = p.tags;
                    } else if (typeof p.tags === 'string') {
                        tags = p.tags.split(',').map(t => t.trim()).filter(Boolean);
                    }

                    // Symbol / Emoji fallback
                    let symbol = p.symbol || "🌸";
                    if (!p.symbol) {
                        const lower = name.toLowerCase();
                        if (lower.includes("flower") || lower.includes("bloom") || lower.includes("rose")) symbol = "🌸";
                        else if (lower.includes("pearl") || lower.includes("necklace")) symbol = "✨";
                        else if (lower.includes("bracelet") || lower.includes("charm")) symbol = "♡";
                        else if (lower.includes("hamper") || lower.includes("gift")) symbol = "🎀";
                        else if (lower.includes("crochet") || lower.includes("daisy")) symbol = "🌼";
                        else if (lower.includes("ring")) symbol = "💍";
                        else if (lower.includes("earring")) symbol = "🏺";
                    }

                    let badge = p.badge || "";
                    if (!badge) {
                        if (newArrival) badge = "NEW";
                        else if (bestseller) badge = "BESTSELLER";
                        else if (featured) badge = "FEATURED";
                    }

                    return {
                        id: id,
                        name: name,
                        category: category,
                        price: price,
                        originalPrice: originalPrice,
                        stock: stock,
                        images: images,
                        symbol: symbol,
                        description: p.description || "A lovely handmade creation crafted with artistic care for life's sweetest moments.",
                        materials: p.materials || "Handmade with artisan care",
                        size: p.size || "Standard boutique size",
                        care: p.care || p.care_instructions || "Handle with gentle love and care ♡",
                        rating: rating,
                        reviewCount: reviewCount,
                        featured: featured,
                        newArrival: newArrival,
                        bestseller: bestseller,
                        tags: tags,
                        badge: badge
                    };
                });

                localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(normalizedProducts));
                console.log(`🌸 [Dear Draupadi] Successfully loaded ${normalizedProducts.length} products from Supabase!`);
                this.emit('products:updated', normalizedProducts);
            }
        } catch (ex) {
            console.error("❌ [Dear Draupadi] Error connecting to Supabase product catalog:", ex);
        } finally {
            this.isLoadingProducts = false;
            this.emit('products:loading', false);
        }
    },

    // ==================== SUPABASE ORDERS INTEGRATION ====================
    async fetchOrdersFromSupabase() {
        const client = window.supabaseAdminClient || window.supabaseClient;
        if (!client) {
            console.log("🌸 [Dear Draupadi] Supabase client not initialized; running with cached orders.");
            return this.getOrders();
        }

        try {
            const { data: sbOrders, error: ordErr } = await client
                .from('orders')
                .select('*, customers(*), order_items(*)')
                .order('id', { ascending: false });

            if (ordErr || !Array.isArray(sbOrders)) {
                console.warn("⚠️ [Dear Draupadi] Orders fetch notice:", ordErr?.message);
                return this.getOrders();
            }

            const mappedOrders = sbOrders.map(so => {
                let cust = so.customers || {};
                let ship = {};
                let payMethod = so.payment_method || 'Cash on Delivery';

                // Check for dual-redundant embedded customer snapshot
                if (payMethod.includes('||CUST||')) {
                    try {
                        const parts = payMethod.split('||CUST||');
                        payMethod = parts[0].trim();
                        const snap = JSON.parse(parts[1]);
                        if (snap) {
                            cust = {
                                name: (cust.name && cust.name !== 'Valued Customer') ? cust.name : (snap.name || cust.name || 'Valued Customer'),
                                email: cust.email || snap.email || '',
                                phone: cust.phone || snap.phone || ''
                            };
                            ship = {
                                address: snap.address || cust.address || 'Standard Delivery',
                                city: snap.city || cust.city || '',
                                state: snap.state || cust.state || '',
                                pincode: snap.pincode || cust.pincode || ''
                            };
                        }
                    } catch (e) {
                        console.warn("Notice unpacking ||CUST||:", e);
                    }
                }

                if (!ship.address) {
                    ship = {
                        address: cust.address || 'Standard Delivery',
                        city: cust.city || '',
                        state: cust.state || '',
                        pincode: cust.pincode || ''
                    };
                }

                const orderId = `DD-ORD-${so.id}`;
                
                // Parse order_items and unpack customized hamper details if present
                const items = (so.order_items || []).map(oi => {
                    let name = oi.product_name || 'Artisan Creation';
                    let isHamper = false;
                    let hamperItems = null;
                    let customMessage = null;

                    if (name.includes('||HAMPER_DATA||')) {
                        try {
                            const parts = name.split('||HAMPER_DATA||');
                            name = parts[0].trim();
                            const parsed = JSON.parse(parts[1]);
                            isHamper = true;
                            hamperItems = parsed.hamperItems || null;
                            customMessage = parsed.customMessage || null;
                        } catch (e) {
                            console.warn("Error parsing hamper data from order item:", e);
                        }
                    } else if (name.toLowerCase().includes('hamper')) {
                        isHamper = true;
                    }

                    return {
                        id: oi.product_id || oi.id,
                        name: name,
                        price: Number(oi.price) || 0,
                        quantity: Number(oi.quantity) || 1,
                        isHamper: isHamper,
                        hamperItems: hamperItems,
                        customMessage: customMessage
                    };
                });

                const statusHistory = [
                    {
                        status: so.order_status || 'Order Placed',
                        time: new Date(so.created_at || Date.now()).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                        note: 'Order recorded in boutique cloud database ♡'
                    }
                ];

                const deliveryDate = new Date(so.created_at || Date.now());
                deliveryDate.setDate(deliveryDate.getDate() + 3);
                const expectedDelivery = deliveryDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

                return {
                    id: orderId,
                    supabaseId: so.id,
                    date: so.created_at || new Date().toISOString(),
                    customer: {
                        name: cust.name || 'Valued Customer',
                        email: cust.email || '',
                        phone: cust.phone || ''
                    },
                    shipping: ship,
                    items: items,
                    pricing: {
                        total: Number(so.total_amount) || 0,
                        discount: Number(so.discount) || 0
                    },
                    paymentMethod: payMethod,
                    paymentStatus: so.payment_status || (payMethod === 'Cash on Delivery' ? 'Pending' : 'Paid'),
                    status: so.order_status || 'Order Placed',
                    statusHistory: statusHistory,
                    expectedDelivery: expectedDelivery
                };
            });

            // Merge with local orders, preserving local orders if they are not yet in Supabase
            let localOrders = [];
            try {
                localOrders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS)) || [];
            } catch (e) {
                localOrders = [];
            }

            const merged = [...mappedOrders];
            localOrders.forEach(lo => {
                const exists = merged.some(m => 
                    m.id === lo.id || 
                    (lo.supabaseId && m.supabaseId === lo.supabaseId) ||
                    (lo.id && lo.id.replace('DD-ORD-', '') === String(m.supabaseId))
                );
                if (!exists) {
                    merged.push(lo);
                }
            });

            // Sort newest first
            merged.sort((a, b) => new Date(b.date) - new Date(a.date));

            localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(merged));
            console.log(`🌸 [Dear Draupadi] Successfully loaded ${mappedOrders.length} orders from Supabase (Total merged: ${merged.length})`);
            this.emit('orders:updated', merged);

            // Background sync any unsynced local orders to cloud
            setTimeout(() => this.syncLocalOrdersToSupabase(), 100);

            return merged;
        } catch (ex) {
            console.warn("⚠️ [Dear Draupadi] Error connecting to Supabase orders:", ex);
            return this.getOrders();
        }
    },

    // Background sync any local-only orders up to Supabase cloud
    async syncLocalOrdersToSupabase() {
        const client = window.supabaseAdminClient || window.supabaseClient;
        if (!client) return;

        let localOrders = [];
        try {
            localOrders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS)) || [];
        } catch (e) {
            return;
        }

        const unsynced = localOrders.filter(o => !o.supabaseId && o.id);
        if (unsynced.length === 0) return;

        for (const order of unsynced) {
            try {
                const cust = order.customer || {};
                const ship = order.shipping || {};
                const cleanEmail = (cust.email || '').trim().toLowerCase();

                let customerId = null;
                if (cleanEmail) {
                    const { data: existingCust } = await client
                        .from('customers')
                        .select('id')
                        .eq('email', cleanEmail)
                        .maybeSingle();

                    if (existingCust && existingCust.id) {
                        customerId = existingCust.id;
                    } else {
                        const { data: newCust } = await client
                            .from('customers')
                            .insert([{
                                name: cust.name || 'Valued Customer',
                                email: cleanEmail || null,
                                phone: cust.phone || null,
                                address: ship.address || null,
                                city: ship.city || null,
                                state: ship.state || null,
                                pincode: ship.pincode || null
                            }])
                            .select();
                        if (newCust && newCust.length > 0) customerId = newCust[0].id;
                    }
                }

                const paymentSnapshot = {
                    name: cust.name || '',
                    email: cleanEmail || '',
                    phone: cust.phone || '',
                    address: ship.address || '',
                    city: ship.city || '',
                    state: ship.state || '',
                    pincode: ship.pincode || ''
                };
                const rawMethod = order.paymentMethod || 'Cash on Delivery';
                const dbMethod = `${rawMethod} ||CUST||${JSON.stringify(paymentSnapshot)}`;

                const { data: ordRes, error: ordErr } = await client
                    .from('orders')
                    .insert([{
                        customer_id: customerId,
                        total_amount: order.pricing ? Number(order.pricing.total) : 0,
                        discount: order.pricing ? Number(order.pricing.discount) : 0,
                        payment_method: dbMethod,
                        payment_status: order.paymentStatus === 'Pending' ? 'pending' : 'paid',
                        order_status: (order.status || 'placed').toLowerCase() === 'order placed' ? 'placed' : order.status
                    }])
                    .select();

                if (!ordErr && ordRes && ordRes.length > 0) {
                    order.supabaseId = ordRes[0].id;
                    for (const item of (order.items || [])) {
                        let pName = item.name || 'Artisan Creation';
                        if (item.isHamper || (item.hamperItems && item.hamperItems.length > 0) || item.customMessage) {
                            pName = `${item.name} ||HAMPER_DATA||${JSON.stringify({ isHamper: true, customMessage: item.customMessage || '', hamperItems: item.hamperItems || [] })}`;
                        }
                        await client.from('order_items').insert([{
                            order_id: ordRes[0].id,
                            product_id: null,
                            product_name: pName,
                            quantity: Number(item.quantity) || 1,
                            price: Number(item.price) || 0
                        }]);
                    }
                    console.log(`🌸 [Dear Draupadi] Migrated local order #${order.id} -> Cloud #${ordRes[0].id}`);
                }
            } catch (syncErr) {
                console.warn("⚠️ Sync local order notice:", syncErr.message);
            }
        }
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(localOrders));
    },

    // Reset store back to defaults
    resetToDefaults() {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
        localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(DEFAULT_COUPONS));
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(DEFAULT_ORDERS));
        localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(DEFAULT_REVIEWS));
        this.emit('store:reset');
    },

    // Event bus
    emit(eventName, data) {
        window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
    },

    // ==================== PRODUCTS ====================
    getProducts() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS)) || DEFAULT_PRODUCTS;
        } catch (e) {
            return DEFAULT_PRODUCTS;
        }
    },

    getProductById(id) {
        const products = this.getProducts();
        return products.find(p => String(p.id) === String(id) || p.name.toLowerCase() === String(id).toLowerCase()) || null;
    },

    saveProduct(productData) {
        const products = this.getProducts();
        const existingIndex = products.findIndex(p => String(p.id) === String(productData.id));

        // Always sanitize images to prevent blob URLs or invalid data
        if (Array.isArray(productData.images)) {
            productData.images = productData.images.filter(u => typeof u === 'string' && !u.startsWith('blob:') && u.trim().length > 0);
        }

        if (existingIndex >= 0) {
            // If updating and no new images provided/saved, preserve existing images
            if (!productData.images || productData.images.length === 0) {
                productData.images = products[existingIndex].images || [];
            }
            products[existingIndex] = { ...products[existingIndex], ...productData };
        } else {
            if (!productData.id) {
                productData.id = "DD-PRD-" + String(Date.now()).slice(-4);
            }
            if (!productData.images || !productData.images.length) {
                productData.images = ["https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80"];
            }
            if (!productData.rating) productData.rating = 5.0;
            if (!productData.reviewCount) productData.reviewCount = 1;
            products.unshift(productData);
        }

        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
        this.emit('products:updated', products);
        return productData;
    },

    deleteProduct(id) {
        let products = this.getProducts();
        products = products.filter(p => String(p.id) !== String(id));
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
        this.emit('products:updated', products);
        return true;
    },

    updateStock(id, newStock) {
        const products = this.getProducts();
        const p = products.find(prod => String(prod.id) === String(id));
        const val = Math.max(0, parseInt(newStock) || 0);
        if (p) {
            p.stock = val;
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
            this.emit('products:updated', products);
        }
        this.syncStockToSupabase(id, val);
    },

    async syncStockToSupabase(productId, newStock, productName = '') {
        const client = window.supabaseAdminClient || window.supabaseClient;
        if (!client) return;
        const val = Math.max(0, parseInt(newStock, 10) || 0);
        const numericId = parseInt(productId, 10);

        try {
            if (!isNaN(numericId)) {
                // 1. Try atomic admin stock update RPC
                try {
                    const { data: rpcData, error: rpcErr } = await client.rpc('update_product_stock_admin', {
                        p_product_id: numericId,
                        p_new_stock: val
                    });
                    if (!rpcErr && rpcData && rpcData.success) {
                        console.log(`🌸 [Dear Draupadi] Supabase stock synchronized via RPC for Product #${numericId}: ${val}`);
                        return;
                    }
                } catch (e) {
                    // Fall through to direct table update
                }

                // 2. Direct Supabase update by ID
                const { error: updateErr } = await client
                    .from('products')
                    .update({ stock: val, updated_at: new Date().toISOString() })
                    .eq('id', numericId);

                if (!updateErr) {
                    console.log(`🌸 [Dear Draupadi] Supabase stock updated directly for Product #${numericId}: ${val}`);
                    return;
                } else {
                    console.warn(`⚠️ [Dear Draupadi] Notice syncing stock to Supabase by ID:`, updateErr.message);
                }
            }

            // Fallback: If numericId failed or productId was non-numeric, try updating by product name
            if (productName) {
                const { error: nameErr } = await client
                    .from('products')
                    .update({ stock: val, updated_at: new Date().toISOString() })
                    .ilike('name', productName.trim());
                if (!nameErr) {
                    console.log(`🌸 [Dear Draupadi] Supabase stock updated by name for "${productName}": ${val}`);
                }
            }
        } catch (e) {
            console.warn(`⚠️ [Dear Draupadi] Stock sync notice:`, e.message);
        }
    },

    // ==================== CATEGORIES ====================
    getCategories() {
        try {
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES));
            const deletedCats = JSON.parse(localStorage.getItem('dd_deleted_categories') || '[]');
            if (Array.isArray(stored) && stored.length > 0) {
                return stored.filter(c => !deletedCats.some(d => d.toLowerCase() === c.toLowerCase()));
            }
            return DEFAULT_CATEGORIES.filter(c => !deletedCats.some(d => d.toLowerCase() === c.toLowerCase()));
        } catch (e) {
            return DEFAULT_CATEGORIES;
        }
    },

    async addCategory(categoryName) {
        const trimmed = (categoryName || '').trim();
        if (!trimmed) return false;
        let categories = this.getCategories();
        if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
            return false;
        }

        // Add to local list
        categories.push(trimmed);
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));

        // If it was in the deleted list, remove it
        try {
            let deleted = JSON.parse(localStorage.getItem('dd_deleted_categories') || '[]');
            deleted = deleted.filter(d => d.toLowerCase() !== trimmed.toLowerCase());
            localStorage.setItem('dd_deleted_categories', JSON.stringify(deleted));
        } catch (e) {}

        this.emit('categories:updated', categories);

        // Sync with Supabase categories table
        const client = window.supabaseAdminClient || window.supabaseClient;
        if (client) {
            try {
                const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                await client.from('categories').insert([{
                    name: trimmed,
                    slug: slug
                }]);
                console.log(`🌸 [Dear Draupadi] Category "${trimmed}" persisted to Supabase!`);
            } catch (err) {
                console.warn("⚠️ Category Supabase insert notice:", err.message);
            }
        }
        return true;
    },

    async deleteCategory(categoryName) {
        const trimmed = (categoryName || '').trim();
        if (!trimmed) return false;
        let categories = this.getCategories();
        categories = categories.filter(c => c.toLowerCase() !== trimmed.toLowerCase());
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));

        // Track in deleted categories list
        try {
            let deleted = JSON.parse(localStorage.getItem('dd_deleted_categories') || '[]');
            if (!deleted.some(d => d.toLowerCase() === trimmed.toLowerCase())) {
                deleted.push(trimmed);
                localStorage.setItem('dd_deleted_categories', JSON.stringify(deleted));
            }
        } catch (e) {}

        this.emit('categories:updated', categories);

        // Delete from Supabase
        const client = window.supabaseAdminClient || window.supabaseClient;
        if (client) {
            try {
                await client.from('categories').delete().ilike('name', trimmed);
                console.log(`🌸 [Dear Draupadi] Category "${trimmed}" deleted from Supabase!`);
            } catch (err) {
                console.warn("⚠️ Category Supabase delete notice:", err.message);
            }
        }
        return true;
    },

    // ==================== HAMPER PRESETS ====================
    getHamperPresets() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.HAMPER_PRESETS)) || DEFAULT_HAMPER_PRESETS;
        } catch (e) {
            return DEFAULT_HAMPER_PRESETS;
        }
    },

    getHamperPresetById(id) {
        const presets = this.getHamperPresets();
        return presets.find(h => String(h.id) === String(id)) || null;
    },

    saveHamperPreset(presetData) {
        const presets = this.getHamperPresets();
        if (!presetData.id) {
            presetData.id = "HAMPER-" + Date.now().toString().slice(-4);
        }
        const existingIdx = presets.findIndex(h => String(h.id) === String(presetData.id));
        if (existingIdx >= 0) {
            presets[existingIdx] = { ...presets[existingIdx], ...presetData };
        } else {
            presets.push(presetData);
        }
        localStorage.setItem(STORAGE_KEYS.HAMPER_PRESETS, JSON.stringify(presets));
        this.emit('hampers:updated', presets);

        // Optional Supabase persistence if table exists
        const client = window.supabaseClient;
        if (client) {
            client.from('hamper_presets').upsert({
                id: presetData.id,
                name: presetData.name,
                description: presetData.description,
                price: presetData.price,
                original_price: presetData.originalPrice,
                image: presetData.image,
                active: presetData.active
            }).catch(() => {});
        }
        return presetData;
    },

    deleteHamperPreset(id) {
        let presets = this.getHamperPresets();
        presets = presets.filter(h => String(h.id) !== String(id));
        localStorage.setItem(STORAGE_KEYS.HAMPER_PRESETS, JSON.stringify(presets));
        this.emit('hampers:updated', presets);

        const client = window.supabaseClient;
        if (client) {
            client.from('hamper_presets').delete().eq('id', id).catch(() => {});
        }
        return true;
    },

    toggleHamperPresetActive(id) {
        const presets = this.getHamperPresets();
        const p = presets.find(h => String(h.id) === String(id));
        if (p) {
            p.active = !p.active;
            localStorage.setItem(STORAGE_KEYS.HAMPER_PRESETS, JSON.stringify(presets));
            this.emit('hampers:updated', presets);
        }
    },

    // ==================== ORDERS ====================
    getOrders() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS)) || DEFAULT_ORDERS;
        } catch (e) {
            return DEFAULT_ORDERS;
        }
    },

    getOrderById(id) {
        if (!id) return null;
        const orders = this.getOrders();
        const cleanId = String(id).toUpperCase().trim();
        return orders.find(o => {
            const oid = String(o.id || '').toUpperCase().trim();
            if (oid === cleanId) return true;
            if (cleanId.startsWith('#') && oid === cleanId.slice(1)) return true;
            if (o.supabaseId && (String(o.supabaseId) === cleanId || String(o.supabaseId) === cleanId.replace('DD-ORD-', ''))) return true;
            if (oid.replace('DD-ORD-', '') === cleanId.replace('DD-ORD-', '')) return true;
            return false;
        }) || null;
    },

    getOrdersByCustomer(phoneOrEmail) {
        if (!phoneOrEmail) return [];
        const term = phoneOrEmail.toLowerCase().trim();
        const orders = this.getOrders();
        return orders.filter(o => 
            (o.customer.email && o.customer.email.toLowerCase() === term) ||
            (o.customer.phone && o.customer.phone.replace(/\D/g, '') === term.replace(/\D/g, ''))
        );
    },

    createOrder(orderData, options = {}) {
        const orders = this.getOrders();
        const orderNumber = options.orderId ? String(options.orderId) : ("DD-" + Math.floor(100000 + Math.random() * 900000));
        
        const now = new Date();
        const timeString = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ", " +
                           now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const deliveryDate = new Date();
        deliveryDate.setDate(now.getDate() + 3);
        const expectedDelivery = deliveryDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

        // Enrich items with catalog category and materials for rich analytics
        const products = this.getProducts();

        // 1. Validate stock availability strictly before any mutation
        for (const item of (orderData.items || [])) {
            if (item.isHamper && Array.isArray(item.hamperItems)) {
                for (const hi of item.hamperItems) {
                    const prod = products.find(p => String(p.id) === String(hi.productId) || String(p.id) === String(hi.id) || p.name === hi.name);
                    const needed = (hi.quantity || 1) * (item.quantity || 1);
                    if (prod && typeof prod.stock === 'number' && prod.stock < needed) {
                        throw new Error(`Insufficient stock for hamper treasure "${prod.name}". Available: ${prod.stock}, Needed: ${needed}`);
                    }
                }
            } else {
                const prod = products.find(p => String(p.id) === String(item.id) || p.name === item.name);
                if (prod && typeof prod.stock === 'number' && prod.stock < item.quantity) {
                    throw new Error(`Insufficient stock for "${prod.name}". Available: ${prod.stock}, Needed: ${item.quantity}`);
                }
            }
        }

        const enrichedItems = (orderData.items || []).map(item => {
            const prod = products.find(p => String(p.id) === String(item.id) || p.name === item.name);
            return {
                id: item.id,
                name: item.name,
                category: item.category || (prod ? prod.category : (item.isHamper ? "Hampers" : "Treasures")),
                materials: item.materials || (prod ? prod.materials : ""),
                price: item.price,
                quantity: item.quantity,
                image: item.image || (prod && prod.images ? prod.images[0] : ""),
                isHamper: !!item.isHamper,
                hamperItems: item.hamperItems || null,
                customMessage: item.customMessage || null
            };
        });

        const newOrder = {
            id: orderNumber,
            supabaseId: options.supabaseId || null,
            date: now.toISOString(),
            customer: orderData.customer || { name: 'Valued Customer', email: '', phone: '' },
            shipping: orderData.shipping || { address: '', city: '', state: '', pincode: '' },
            items: enrichedItems,
            pricing: orderData.pricing || { total: 0, discount: 0 },
            paymentMethod: orderData.paymentMethod || "Cash on Delivery",
            paymentStatus: orderData.paymentMethod === "Cash on Delivery" ? "Pending" : "Paid (Demo)",
            status: "Order Placed",
            statusHistory: [
                {
                    status: "Order Placed",
                    time: timeString,
                    note: "Your little treasures are being prepared with love ♡"
                }
            ],
            expectedDelivery: expectedDelivery
        };

        orders.unshift(newOrder);
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

        // 2. Deduct inventory (including individual component products of custom hampers)
        this._recentStockDeductions = this._recentStockDeductions || {};
        newOrder.items.forEach(item => {
            if (item.isHamper && Array.isArray(item.hamperItems)) {
                item.hamperItems.forEach(hi => {
                    const prod = products.find(p => String(p.id) === String(hi.productId) || String(p.id) === String(hi.id) || (p.name && hi.name && p.name.trim().toLowerCase() === hi.name.trim().toLowerCase()));
                    if (prod) {
                        const curStock = (typeof prod.stock === 'number' && !isNaN(prod.stock)) ? prod.stock : 10;
                        const qtyToDeduct = (Number(hi.quantity) || 1) * (Number(item.quantity) || 1);
                        prod.stock = Math.max(0, curStock - qtyToDeduct);
                        this._recentStockDeductions[String(prod.id)] = { stock: prod.stock, time: Date.now() };
                        if (prod.name) this._recentStockDeductions[prod.name.trim().toLowerCase()] = { stock: prod.stock, time: Date.now() };
                        if (!options.skipSupabaseSync) {
                            this.syncStockToSupabase(prod.id, prod.stock, prod.name);
                        }
                    }
                });
            } else {
                const prod = products.find(p => String(p.id) === String(item.id) || (p.name && item.name && p.name.trim().toLowerCase() === item.name.trim().toLowerCase()));
                if (prod) {
                    const curStock = (typeof prod.stock === 'number' && !isNaN(prod.stock)) ? prod.stock : 10;
                    const qtyToDeduct = Number(item.quantity) || 1;
                    prod.stock = Math.max(0, curStock - qtyToDeduct);
                    this._recentStockDeductions[String(prod.id)] = { stock: prod.stock, time: Date.now() };
                    if (prod.name) this._recentStockDeductions[prod.name.trim().toLowerCase()] = { stock: prod.stock, time: Date.now() };
                    if (!options.skipSupabaseSync) {
                        this.syncStockToSupabase(prod.id, prod.stock, prod.name);
                    }
                }
            }
        });
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

        // Save last created customer order for quick tracking
        localStorage.setItem('dd_last_order_id', orderNumber);
        if (orderData.customer?.email) {
            localStorage.setItem(`dd_last_order_id_${orderData.customer.email.trim().toLowerCase()}`, orderNumber);
        }

        // Dispatch WhatsApp order notification architecture
        if (typeof WhatsAppNotificationService !== 'undefined') {
            WhatsAppNotificationService.dispatchOrderNotification(newOrder);
        }

        this.emit('orders:updated', orders);
        this.emit('products:updated', products);
        return newOrder;
    },

    async placeOrder(orderData) {
        const client = window.supabaseAdminClient || window.supabaseClient;
        let newOrderId = null;
        let customerId = null;

        const cust = orderData.customer || {};
        const ship = orderData.shipping || {};
        const cleanEmail = (cust.email || '').trim().toLowerCase();

        if (client) {
            try {
                // 1. Create or link customer in Supabase (with repeat email handling)
                if (cleanEmail) {
                    try {
                        const { data: existingCust, error: findErr } = await client
                            .from('customers')
                            .select('id, address')
                            .eq('email', cleanEmail)
                            .maybeSingle();

                        if (existingCust && existingCust.id) {
                            customerId = existingCust.id;
                            // Update customer with latest contact details
                            await client.from('customers').update({
                                name: cust.name || 'Valued Customer',
                                phone: cust.phone || null,
                                address: ship.address || existingCust.address || null,
                                city: ship.city || null,
                                state: ship.state || null,
                                pincode: ship.pincode || null
                            }).eq('id', customerId);
                        } else {
                            const { data: newCust, error: insErr } = await client
                                .from('customers')
                                .insert([{
                                    name: cust.name || 'Valued Customer',
                                    email: cleanEmail,
                                    phone: cust.phone || null,
                                    address: ship.address || null,
                                    city: ship.city || null,
                                    state: ship.state || null,
                                    pincode: ship.pincode || null
                                }])
                                .select();

                            if (!insErr && newCust && newCust.length > 0) {
                                customerId = newCust[0].id;
                            }
                        }
                    } catch (cEx) {
                        console.warn("⚠️ [Dear Draupadi] Customer sync notice:", cEx.message);
                    }
                } else {
                    // Anonymous customer without email
                    try {
                        const { data: anonCust } = await client
                            .from('customers')
                            .insert([{
                                name: cust.name || 'Valued Customer',
                                phone: cust.phone || null,
                                address: ship.address || null,
                                city: ship.city || null,
                                state: ship.state || null,
                                pincode: ship.pincode || null
                            }])
                            .select();
                        if (anonCust && anonCust.length > 0) customerId = anonCust[0].id;
                    } catch (aEx) {}
                }

                // 2. Dual-redundant Customer Snapshot embedded in payment_method
                const paymentSnapshot = {
                    name: cust.name || '',
                    email: cleanEmail || '',
                    phone: cust.phone || '',
                    address: ship.address || '',
                    city: ship.city || '',
                    state: ship.state || '',
                    pincode: ship.pincode || ''
                };
                const rawPaymentMethod = orderData.paymentMethod || 'Cash on Delivery';
                const dbPaymentMethod = `${rawPaymentMethod} ||CUST||${JSON.stringify(paymentSnapshot)}`;

                // 3. Insert into orders table
                const total = orderData.pricing ? Number(orderData.pricing.total) : 0;
                const discount = orderData.pricing ? Number(orderData.pricing.discount) : 0;
                const paymentStatus = rawPaymentMethod === 'Cash on Delivery' ? 'pending' : 'paid';

                const { data: orderRes, error: orderErr } = await client
                    .from('orders')
                    .insert([{
                        customer_id: customerId,
                        total_amount: total,
                        discount: discount,
                        payment_method: dbPaymentMethod,
                        payment_status: paymentStatus,
                        order_status: 'placed'
                    }])
                    .select();

                if (!orderErr && orderRes && orderRes.length > 0) {
                    newOrderId = orderRes[0].id;

                    // 4. Insert items into order_items table with packed hamper customization details
                    for (const item of (orderData.items || [])) {
                        let productName = item.name || 'Artisan Creation';

                        // If item is a customized hamper or has custom components/message, pack hamper data
                        if (item.isHamper || (item.hamperItems && item.hamperItems.length > 0) || item.customMessage) {
                            const hamperData = {
                                isHamper: true,
                                customMessage: item.customMessage || '',
                                hamperItems: item.hamperItems || []
                            };
                            productName = `${item.name} ||HAMPER_DATA||${JSON.stringify(hamperData)}`;
                        }

                        let prodId = null;
                        if (item.id && !String(item.id).startsWith('DD-') && !isNaN(Number(item.id))) {
                            prodId = Number(item.id);
                        }
                        if (!prodId && item.name) {
                            try {
                                const { data: pByName } = await client
                                    .from('products')
                                    .select('id, stock')
                                    .ilike('name', item.name.trim())
                                    .maybeSingle();
                                if (pByName && pByName.id) {
                                    prodId = pByName.id;
                                }
                            } catch (e) {}
                        }

                        await client.from('order_items').insert([{
                            order_id: newOrderId,
                            product_id: prodId,
                            product_name: productName,
                            quantity: Number(item.quantity) || 1,
                            price: Number(item.price) || 0
                        }]);

                        // Direct Supabase inventory deduction for regular item
                        if (prodId) {
                            try {
                                const { data: currP } = await client
                                    .from('products')
                                    .select('stock')
                                    .eq('id', prodId)
                                    .maybeSingle();
                                if (currP && currP.stock !== null && currP.stock !== undefined) {
                                    const deductQty = Number(item.quantity) || 1;
                                    const newStk = Math.max(0, (Number(currP.stock) || 0) - deductQty);
                                    await client
                                        .from('products')
                                        .update({ stock: newStk, updated_at: new Date().toISOString() })
                                        .eq('id', prodId);
                                    console.log(`🌸 [Dear Draupadi] Deducted Supabase inventory for product #${prodId}: ${currP.stock} -> ${newStk}`);
                                }
                            } catch (stkErr) {
                                console.warn("⚠️ [Dear Draupadi] Supabase inventory deduction notice:", stkErr.message);
                            }
                        }

                        // Also deduct individual component items if item is a custom hamper
                        if (item.isHamper && Array.isArray(item.hamperItems)) {
                            for (const hi of item.hamperItems) {
                                let hiProdId = null;
                                if (hi.productId && !String(hi.productId).startsWith('DD-') && !isNaN(Number(hi.productId))) {
                                    hiProdId = Number(hi.productId);
                                } else if (hi.id && !String(hi.id).startsWith('DD-') && !isNaN(Number(hi.id))) {
                                    hiProdId = Number(hi.id);
                                }
                                if (!hiProdId && hi.name) {
                                    try {
                                        const { data: hiByName } = await client
                                            .from('products')
                                            .select('id, stock')
                                            .ilike('name', hi.name.trim())
                                            .maybeSingle();
                                        if (hiByName && hiByName.id) hiProdId = hiByName.id;
                                    } catch (e) {}
                                }
                                if (hiProdId) {
                                    try {
                                        const { data: currHiP } = await client
                                            .from('products')
                                            .select('stock')
                                            .eq('id', hiProdId)
                                            .maybeSingle();
                                        if (currHiP && currHiP.stock !== null && currHiP.stock !== undefined) {
                                            const deductUnits = (Number(hi.quantity) || 1) * (Number(item.quantity) || 1);
                                            const newHiStk = Math.max(0, (Number(currHiP.stock) || 0) - deductUnits);
                                            await client
                                                .from('products')
                                                .update({ stock: newHiStk, updated_at: new Date().toISOString() })
                                                .eq('id', hiProdId);
                                            console.log(`🌸 [Dear Draupadi] Deducted Supabase hamper component inventory for product #${hiProdId}: ${currHiP.stock} -> ${newHiStk}`);
                                        }
                                    } catch (hiStkErr) {
                                        console.warn("⚠️ [Dear Draupadi] Hamper component stock deduction notice:", hiStkErr.message);
                                    }
                                }
                            }
                        }
                    }
                    console.log(`🌸 [Dear Draupadi] Cloud order #${newOrderId} successfully recorded in Supabase!`);
                } else {
                    console.warn("⚠️ [Dear Draupadi] Order insert notice:", orderErr?.message);
                }
            } catch (cloudErr) {
                console.warn("⚠️ [Dear Draupadi] Supabase cloud order placement notice:", cloudErr.message);
            }
        }

        // 5. Automatically save address to customer's multiple addresses profile
        if (cleanEmail && ship.address && orderData.saveAddressToProfile !== false) {
            this.saveCustomerAddress(cleanEmail, {
                label: orderData.addressLabel || 'Home',
                name: cust.name || '',
                phone: cust.phone || '',
                address: ship.address,
                city: ship.city || '',
                state: ship.state || '',
                pincode: ship.pincode || '',
                isDefault: true
            });
        }

        // 6. Create local order record with the Supabase order ID (or DD- random ID)
        const created = this.createOrder(orderData, {
            orderId: newOrderId ? `DD-ORD-${newOrderId}` : null,
            supabaseId: newOrderId || null
        });

        // 7. Trigger cloud sync for orders and products to update admin and local storage seamlessly
        if (newOrderId) {
            setTimeout(() => {
                this.fetchOrdersFromSupabase();
                this.fetchProductsFromSupabase();
            }, 300);
        }

        return created;
    },

    // ==================== MULTI-ADDRESS MANAGEMENT ====================
    getCustomerAddresses(email) {
        if (!email) return [];
        const cleanEmail = email.trim().toLowerCase();
        const storageKey = `dd_addresses_${cleanEmail}`;

        let addresses = [];
        try {
            addresses = JSON.parse(localStorage.getItem(storageKey)) || [];
        } catch (e) {
            addresses = [];
        }

        // Check customer session for fallback if no saved addresses yet
        const session = this.getCustomerSession();
        if (addresses.length === 0 && session && session.user) {
            const u = session.user;
            if (u.address) {
                if (typeof u.address === 'string' && u.address.trim().startsWith('[')) {
                    try { addresses = JSON.parse(u.address); } catch (e) {}
                } else if (typeof u.address === 'string' && u.address.trim()) {
                    addresses = [{
                        id: 'addr_default',
                        label: 'Home',
                        name: u.name || 'Valued Customer',
                        phone: u.phone || '',
                        address: u.address,
                        city: u.city || '',
                        state: u.state || '',
                        pincode: u.pincode || '',
                        isDefault: true
                    }];
                }
            }
        }

        return addresses;
    },

    async saveCustomerAddress(email, addrObj) {
        if (!email || !addrObj || !addrObj.address) return [];
        const cleanEmail = email.trim().toLowerCase();
        const storageKey = `dd_addresses_${cleanEmail}`;

        let addresses = this.getCustomerAddresses(cleanEmail);
        const addressId = addrObj.id || `addr_${Date.now()}`;
        const isDefault = addrObj.isDefault === true || addresses.length === 0;

        if (isDefault) {
            addresses.forEach(a => a.isDefault = false);
        }

        const newAddr = {
            id: addressId,
            label: (addrObj.label || 'Home').trim(),
            name: (addrObj.name || '').trim(),
            phone: (addrObj.phone || '').trim(),
            address: (addrObj.address || '').trim(),
            city: (addrObj.city || '').trim(),
            state: (addrObj.state || '').trim(),
            pincode: (addrObj.pincode || '').trim(),
            isDefault: isDefault
        };

        const existingIndex = addresses.findIndex(a => a.id === addressId);
        if (existingIndex >= 0) {
            addresses[existingIndex] = newAddr;
        } else {
            addresses.push(newAddr);
        }

        localStorage.setItem(storageKey, JSON.stringify(addresses));

        // Sync to Supabase customers table
        const client = window.supabaseAdminClient || window.supabaseClient;
        if (client) {
            try {
                await client
                    .from('customers')
                    .update({
                        address: JSON.stringify(addresses),
                        city: newAddr.city,
                        state: newAddr.state,
                        pincode: newAddr.pincode
                    })
                    .eq('email', cleanEmail);
            } catch (e) {
                console.warn("⚠️ Address cloud sync notice:", e.message);
            }
        }

        this.emit('addresses:updated', addresses);
        return addresses;
    },

    async deleteCustomerAddress(email, addressId) {
        if (!email || !addressId) return [];
        const cleanEmail = email.trim().toLowerCase();
        const storageKey = `dd_addresses_${cleanEmail}`;

        let addresses = this.getCustomerAddresses(cleanEmail);
        const target = addresses.find(a => a.id === addressId);
        addresses = addresses.filter(a => a.id !== addressId);

        if (target && target.isDefault && addresses.length > 0) {
            addresses[0].isDefault = true;
        }

        localStorage.setItem(storageKey, JSON.stringify(addresses));

        const client = window.supabaseAdminClient || window.supabaseClient;
        if (client) {
            try {
                await client
                    .from('customers')
                    .update({ address: JSON.stringify(addresses) })
                    .eq('email', cleanEmail);
            } catch (e) {}
        }

        this.emit('addresses:updated', addresses);
        return addresses;
    },

    async setDefaultCustomerAddress(email, addressId) {
        if (!email || !addressId) return [];
        const cleanEmail = email.trim().toLowerCase();
        const storageKey = `dd_addresses_${cleanEmail}`;

        let addresses = this.getCustomerAddresses(cleanEmail);
        let chosen = null;
        addresses.forEach(a => {
            if (a.id === addressId) {
                a.isDefault = true;
                chosen = a;
            } else {
                a.isDefault = false;
            }
        });

        localStorage.setItem(storageKey, JSON.stringify(addresses));

        const client = window.supabaseAdminClient || window.supabaseClient;
        if (client && chosen) {
            try {
                await client
                    .from('customers')
                    .update({
                        address: JSON.stringify(addresses),
                        city: chosen.city,
                        state: chosen.state,
                        pincode: chosen.pincode
                    })
                    .eq('email', cleanEmail);
            } catch (e) {}
        }

        this.emit('addresses:updated', addresses);
        return addresses;
    },

    async updateOrderStatus(orderId, newStatus, note = "") {
        const orders = this.getOrders();
        const order = orders.find(o => 
            o.id === orderId || 
            (o.supabaseId && String(o.supabaseId) === String(orderId).replace('DD-ORD-', '')) ||
            String(o.id || '').replace('DD-ORD-', '') === String(orderId).replace('DD-ORD-', '')
        );
        if (order) {
            order.status = newStatus;
            
            const now = new Date();
            const timeString = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ", " +
                               now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            const statusNotes = {
                "Order Placed": "Order placed with love ♡",
                "Confirmed": "Order verified and confirmed by boutique",
                "Packed": "Carefully packed with handmade detailing",
                "Shipped": "Dispatched via boutique delivery partner",
                "Out for Delivery": "Our delivery partner is nearby with your treasures",
                "Delivered": "Delivered into loving hands. Enjoy your little treasures! ♡",
                "Cancelled": "Order has been cancelled"
            };

            order.statusHistory = order.statusHistory || [];
            order.statusHistory.push({
                status: newStatus,
                time: timeString,
                note: note || statusNotes[newStatus] || "Status updated"
            });

            localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
            this.emit('orders:updated', orders);
        }

        // Also update in Supabase
        const client = window.supabaseAdminClient || window.supabaseClient;
        if (client) {
            let sbId = order?.supabaseId;
            if (!sbId) {
                if (String(orderId).startsWith('DD-ORD-')) {
                    sbId = parseInt(orderId.replace('DD-ORD-', ''), 10);
                } else if (!isNaN(Number(orderId))) {
                    sbId = Number(orderId);
                }
            }
            if (sbId) {
                try {
                    await client.from('orders').update({ order_status: newStatus }).eq('id', sbId);
                    console.log(`🌸 [Dear Draupadi] Supabase order #${sbId} status updated to "${newStatus}"`);
                } catch (e) {
                    console.warn("⚠️ Cloud order status update notice:", e.message);
                }
            }
        }

        return order;
    },

    // ==================== CUSTOMERS ====================
    getCustomers() {
        const orders = this.getOrders();
        const customerMap = {};

        orders.forEach(order => {
            if (!order || !order.customer) return;
            const email = (order.customer.email || "").toLowerCase().trim();
            const phone = order.customer.phone || "";
            const key = email || phone || order.customer.name || "Customer";

            if (!customerMap[key]) {
                customerMap[key] = {
                    name: order.customer.name || "Valued Customer",
                    email: order.customer.email || "—",
                    phone: order.customer.phone || "—",
                    city: order.shipping ? order.shipping.city : "",
                    state: order.shipping ? order.shipping.state : "",
                    totalOrders: 0,
                    totalSpent: 0,
                    orders: [],
                    firstOrderDate: order.date || new Date().toISOString(),
                    lastOrderDate: order.date || new Date().toISOString()
                };
            }

            customerMap[key].totalOrders += 1;
            customerMap[key].totalSpent += (order.pricing ? order.pricing.total : 0);
            customerMap[key].orders.push(order);
            if (new Date(order.date) > new Date(customerMap[key].lastOrderDate)) {
                customerMap[key].lastOrderDate = order.date;
            }
        });

        return Object.values(customerMap);
    },

    // ==================== REVIEWS ====================
    getReviews() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.REVIEWS)) || DEFAULT_REVIEWS;
        } catch (e) {
            return DEFAULT_REVIEWS;
        }
    },

    getProductReviews(productId) {
        const reviews = this.getReviews();
        return reviews.filter(r => (String(r.productId) === String(productId) || r.productName === productId) && r.status === "approved");
    },

    addReview(reviewData) {
        const reviews = this.getReviews();
        const newReview = {
            id: "REV-" + Date.now(),
            productId: reviewData.productId,
            productName: reviewData.productName,
            author: reviewData.author || "Valued Customer",
            rating: parseInt(reviewData.rating) || 5,
            date: new Date().toISOString().split('T')[0],
            comment: reviewData.comment,
            status: "approved"
        };

        reviews.unshift(newReview);
        localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));

        // Update product rating and review count
        const products = this.getProducts();
        const prod = products.find(p => String(p.id) === String(reviewData.productId) || p.name === reviewData.productName);
        if (prod) {
            const productApprovedReviews = reviews.filter(r => (String(r.productId) === String(prod.id) || r.productName === prod.name) && r.status === "approved");
            const sumRatings = productApprovedReviews.reduce((acc, r) => acc + r.rating, 0);
            prod.reviewCount = productApprovedReviews.length;
            prod.rating = parseFloat((sumRatings / productApprovedReviews.length).toFixed(1));
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
            this.emit('products:updated', products);
        }

        this.emit('reviews:updated', reviews);
        return newReview;
    },

    updateReviewStatus(reviewId, newStatus) {
        const reviews = this.getReviews();
        const rev = reviews.find(r => r.id === reviewId);
        if (rev) {
            rev.status = newStatus;
            localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
            this.emit('reviews:updated', reviews);
        }
    },

    deleteReview(reviewId) {
        let reviews = this.getReviews();
        reviews = reviews.filter(r => r.id !== reviewId);
        localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
        this.emit('reviews:updated', reviews);
        return true;
    },

    // ==================== COUPONS ====================
    getCoupons() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.COUPONS)) || DEFAULT_COUPONS;
        } catch (e) {
            return DEFAULT_COUPONS;
        }
    },

    applyCoupon(code, subtotal) {
        if (!code) return { valid: false, message: "Please enter a coupon code ♡" };
        const coupons = this.getCoupons();
        const coupon = coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase() && c.active);

        if (!coupon) {
            return { valid: false, message: "Invalid or expired coupon code." };
        }

        if (subtotal < coupon.minSpend) {
            return { valid: false, message: `Minimum spend of ₹${coupon.minSpend} required for this code.` };
        }

        let discount = 0;
        if (coupon.type === "percentage") {
            discount = Math.round((subtotal * coupon.value) / 100);
        } else {
            discount = coupon.value;
        }

        discount = Math.min(discount, subtotal);
        return {
            valid: true,
            coupon: coupon,
            discount: discount,
            message: `Coupon "${coupon.code}" applied! You saved ₹${discount} ♡`
        };
    },

    saveCoupon(couponData) {
        const coupons = this.getCoupons();
        const idx = coupons.findIndex(c => c.id === couponData.id || c.code.toUpperCase() === couponData.code.toUpperCase());

        if (idx >= 0) {
            coupons[idx] = { ...coupons[idx], ...couponData };
        } else {
            if (!couponData.id) couponData.id = "CPN-" + Date.now().toString().slice(-4);
            coupons.push(couponData);
        }

        localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(coupons));
        this.emit('coupons:updated', coupons);
        return couponData;
    },

    deleteCoupon(id) {
        let coupons = this.getCoupons();
        coupons = coupons.filter(c => c.id !== id);
        localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(coupons));
        this.emit('coupons:updated', coupons);
        return true;
    },

    toggleCoupon(id) {
        const coupons = this.getCoupons();
        const c = coupons.find(item => item.id === id);
        if (c) {
            c.active = !c.active;
            localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(coupons));
            this.emit('coupons:updated', coupons);
        }
    },

    // ==================== CART ====================
    getCartStorageKey() {
        const session = this.getCustomerSession();
        if (session && session.isLoggedIn && session.user && session.user.email) {
            return `dd_cart_${session.user.email.trim().toLowerCase()}`;
        }
        return 'dd_cart_guest';
    },

    getCart() {
        const key = this.getCartStorageKey();
        try {
            const val = localStorage.getItem(key);
            if (val !== null) return JSON.parse(val);
            if (key === 'dd_cart_guest') {
                const legacy = localStorage.getItem(STORAGE_KEYS.CART);
                if (legacy) return JSON.parse(legacy);
            }
            return [];
        } catch (e) {
            return [];
        }
    },

    saveCart(cartItems) {
        const key = this.getCartStorageKey();
        localStorage.setItem(key, JSON.stringify(cartItems));
        if (key === 'dd_cart_guest') {
            localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cartItems));
        }
        this.emit('cart:updated', cartItems);
    },

    addToCart(productIdOrName, quantity = 1, customPrice = null, hamperOptions = null) {
        const cart = this.getCart();

        // 1. Direct custom hamper object
        if (typeof productIdOrName === 'object' && productIdOrName !== null && productIdOrName.isHamper) {
            const hamper = productIdOrName;
            cart.push({
                id: hamper.id || ("DD-HAMPER-" + Date.now()),
                name: hamper.name || "Custom Boutique Hamper",
                price: parseFloat(hamper.price) || 0,
                quantity: parseInt(hamper.quantity) || 1,
                image: hamper.image || "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80",
                symbol: "🎀",
                isHamper: true,
                hamperItems: hamper.hamperItems || [],
                customMessage: hamper.customMessage || ""
            });
            this.saveCart(cart);
            cart.success = true;
            return cart;
        }

        const product = this.getProductById(productIdOrName);
        const name = product ? product.name : productIdOrName;
        const price = customPrice !== null ? customPrice : (product ? product.price : 99);
        const image = product && product.images && product.images.length ? product.images[0] : "";
        const symbol = product ? product.symbol : "🌸";
        const id = product ? String(product.id) : "DD-CUSTOM";

        // 2. Item with hamperOptions
        if (hamperOptions && hamperOptions.isHamper) {
            cart.push({
                id: (id || "DD-HAMPER") + "-" + Date.now(),
                name: name,
                price: price,
                quantity: quantity,
                image: image || "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80",
                symbol: "🎀",
                isHamper: true,
                hamperItems: hamperOptions.hamperItems || [],
                customMessage: hamperOptions.customMessage || ""
            });
            this.saveCart(cart);
            cart.success = true;
            return cart;
        }

        // 3. Regular cart item: validate stock
        if (product && typeof product.stock === 'number') {
            if (product.stock <= 0) {
                cart.success = false;
                cart.reason = 'sold_out';
                cart.message = `"${product.name}" is currently Sold Out ♡`;
                return cart;
            }

            const existing = cart.find(item => !item.isHamper && (item.name === name || String(item.id) === String(id)));
            const currentQty = existing ? existing.quantity : 0;

            if (currentQty >= product.stock) {
                cart.success = false;
                cart.reason = 'max_stock';
                cart.message = `You already have all ${product.stock} available units of "${product.name}" in your cart ♡`;
                return cart;
            }

            const allowedAdd = Math.min(quantity, product.stock - currentQty);
            if (allowedAdd <= 0) {
                cart.success = false;
                cart.reason = 'max_stock';
                cart.message = `Cannot add more units. Available stock is ${product.stock}.`;
                return cart;
            }

            if (existing) {
                existing.quantity += allowedAdd;
            } else {
                cart.push({
                    id: id,
                    name: name,
                    price: price,
                    quantity: allowedAdd,
                    image: image,
                    symbol: symbol
                });
            }

            this.saveCart(cart);
            cart.success = true;
            cart.added = allowedAdd;
            cart.clamped = allowedAdd < quantity;
            return cart;
        } else {
            const existing = cart.find(item => !item.isHamper && (item.name === name || String(item.id) === String(id)));

            if (existing) {
                existing.quantity += quantity;
            } else {
                cart.push({
                    id: id,
                    name: name,
                    price: price,
                    quantity: quantity,
                    image: image,
                    symbol: symbol
                });
            }

            this.saveCart(cart);
            cart.success = true;
            return cart;
        }
    },

    updateCartQuantity(index, delta) {
        const cart = this.getCart();
        if (cart[index]) {
            const item = cart[index];
            if (delta > 0 && !item.isHamper) {
                const product = this.getProductById(item.id);
                if (product && typeof product.stock === 'number') {
                    if (item.quantity + delta > product.stock) {
                        this.emit('cart:warning', `Maximum available stock for "${item.name}" is ${product.stock} units.`);
                        return { success: false, reason: 'max_stock', message: `Only ${product.stock} available.` };
                    }
                }
            }

            cart[index].quantity += delta;
            if (cart[index].quantity <= 0) {
                cart.splice(index, 1);
            }
            this.saveCart(cart);
            return { success: true, cart: cart };
        }
        return { success: false };
    },

    validateCartAgainstStock() {
        const cart = this.getCart();
        const products = this.getProducts();
        let changed = false;
        const messages = [];

        for (let i = cart.length - 1; i >= 0; i--) {
            const item = cart[i];
            if (item.isHamper) continue;

            const prod = products.find(p => String(p.id) === String(item.id) || p.name === item.name);
            if (prod && typeof prod.stock === 'number') {
                if (prod.stock <= 0) {
                    messages.push(`"${item.name}" is now Sold Out and has been removed from your cart ♡`);
                    cart.splice(i, 1);
                    changed = true;
                } else if (item.quantity > prod.stock) {
                    messages.push(`Quantity for "${item.name}" was adjusted from ${item.quantity} to ${prod.stock} (available stock) ♡`);
                    item.quantity = prod.stock;
                    changed = true;
                }
            }
        }

        if (changed) {
            this.saveCart(cart);
        }

        return {
            valid: !changed,
            messages: messages,
            cart: cart
        };
    },

    removeFromCart(index) {
        const cart = this.getCart();
        cart.splice(index, 1);
        this.saveCart(cart);
    },

    clearCart() {
        this.saveCart([]);
    },

    // ==================== WISHLIST ====================
    getWishlistStorageKey() {
        const session = this.getCustomerSession();
        if (session && session.isLoggedIn && session.user && session.user.email) {
            return `dd_wishlist_${session.user.email.trim().toLowerCase()}`;
        }
        return 'dd_wishlist_guest';
    },

    getWishlist() {
        const key = this.getWishlistStorageKey();
        try {
            const val = localStorage.getItem(key);
            if (val !== null) return JSON.parse(val);
            if (key === 'dd_wishlist_guest') {
                const legacy = localStorage.getItem(STORAGE_KEYS.WISHLIST);
                if (legacy) return JSON.parse(legacy);
            }
            return [];
        } catch (e) {
            return [];
        }
    },

    saveWishlist(items) {
        const key = this.getWishlistStorageKey();
        localStorage.setItem(key, JSON.stringify(items));
        if (key === 'dd_wishlist_guest') {
            localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(items));
        }
        this.emit('wishlist:updated', items);
    },

    toggleWishlist(productIdentifier) {
        const wishlist = this.getWishlist();
        const product = this.getProductById(productIdentifier);
        const id = product ? String(product.id) : String(productIdentifier);
        const name = product ? product.name : null;

        const idx = wishlist.findIndex(item => item === id || (name && item === name));
        let added = false;
        if (idx === -1) {
            wishlist.push(id);
            added = true;
        } else {
            wishlist.splice(idx, 1);
            added = false;
        }

        this.saveWishlist(wishlist);
        return added;
    },

    isInWishlist(productIdentifier) {
        const wishlist = this.getWishlist();
        const product = this.getProductById(productIdentifier);
        const id = product ? String(product.id) : String(productIdentifier);
        const name = product ? product.name : null;
        return wishlist.some(item => item === id || (name && item === name));
    },

    // ==================== AUTH / ADMIN SESSION ====================
    isAdminAuthenticated() {
        const session = localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION);
        if (!session) return false;
        try {
            const parsed = JSON.parse(session);
            return parsed && parsed.isLoggedIn === true;
        } catch (e) {
            return false;
        }
    },

    adminLogin(email, password) {
        const cleanEmail = email.trim().toLowerCase();
        if ((cleanEmail === "admin@deardraupadi.com" || cleanEmail === "admin") && (password === "draupadi2026" || password === "admin123" || password === "admin")) {
            const session = {
                isLoggedIn: true,
                user: {
                    name: "Draupadi Admin",
                    email: "admin@deardraupadi.com",
                    role: "Admin"
                },
                loginTime: new Date().toISOString()
            };
            localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(session));
            this.emit('admin:login', session);
            return { success: true };
        }
        return { success: false, message: "Invalid credentials. Use admin@deardraupadi.com / draupadi2026." };
    },

    adminLogout() {
        localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
        this.emit('admin:logout');
    },

    // ==================== CUSTOMER AUTH & ACCOUNT LAYER ====================
    getCustomerSession() {
        const session = localStorage.getItem(STORAGE_KEYS.CUSTOMER_SESSION);
        if (!session) return null;
        try {
            return JSON.parse(session);
        } catch (e) {
            return null;
        }
    },

    getCustomerRegistrations() {
        const data = localStorage.getItem(STORAGE_KEYS.CUSTOMER_REGISTRATIONS);
        if (!data) return [];
        try {
            return JSON.parse(data);
        } catch (e) {
            return [];
        }
    },

    recordCustomerRegistration(email, name) {
        const registrations = this.getCustomerRegistrations();
        if (!registrations.some(r => r.email === email)) {
            const now = new Date();
            registrations.push({
                email,
                name,
                timestamp: now.toISOString(),
                hour: now.getHours(),
                date: now.toISOString().split('T')[0]
            });
            localStorage.setItem(STORAGE_KEYS.CUSTOMER_REGISTRATIONS, JSON.stringify(registrations));
            this.emit('registrations:updated', registrations);
        }
    },

    async customerRegister(name, email, password) {
        const cleanEmail = (email || '').trim().toLowerCase();
        const cleanName = (name || '').trim();

        if (!cleanName || !cleanEmail || !password) {
            return { success: false, message: "Please fill in all required fields." };
        }
        if (password.length < 6) {
            return { success: false, message: "Password should be at least 6 characters long." };
        }

        // Supabase Auth Integration Readiness
        if (window.supabaseClient && window.supabaseClient.auth &&
            window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url && !window.SUPABASE_CONFIG.url.includes('placeholder')) {
            try {
                const { data, error } = await window.supabaseClient.auth.signUp({
                    email: cleanEmail,
                    password: password,
                    options: { data: { name: cleanName } }
                });
                if (error) return { success: false, message: error.message };
                const session = {
                    isLoggedIn: true,
                    user: {
                        id: data.user ? data.user.id : `dd_cust_${Date.now()}`,
                        name: cleanName,
                        email: cleanEmail,
                        createdAt: new Date().toISOString()
                    }
                };
                localStorage.setItem(STORAGE_KEYS.CUSTOMER_SESSION, JSON.stringify(session));
                this.recordCustomerRegistration(cleanEmail, cleanName);
                this.emit('customer:auth', session);
                this.emit('wishlist:updated', this.getWishlist());
                this.emit('cart:updated', this.getCart());
                return { success: true, user: session.user };
            } catch (err) {
                return { success: false, message: err.message };
            }
        }

        // Frontend auth state preparation without insecure plaintext password storage
        const session = {
            isLoggedIn: true,
            user: {
                id: `dd_cust_${Date.now()}`,
                name: cleanName,
                email: cleanEmail,
                createdAt: new Date().toISOString()
            }
        };
        localStorage.setItem(STORAGE_KEYS.CUSTOMER_SESSION, JSON.stringify(session));
        this.recordCustomerRegistration(cleanEmail, cleanName);
        this.emit('customer:auth', session);
        this.emit('wishlist:updated', this.getWishlist());
        this.emit('cart:updated', this.getCart());
        return { success: true, user: session.user };
    },

    async customerLogin(email, password) {
        const cleanEmail = (email || '').trim().toLowerCase();
        if (!cleanEmail || !password) {
            return { success: false, message: "Please enter your email and password." };
        }

        // Supabase Auth Integration Readiness
        if (window.supabaseClient && window.supabaseClient.auth &&
            window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url && !window.SUPABASE_CONFIG.url.includes('placeholder')) {
            try {
                const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                    email: cleanEmail,
                    password: password
                });
                if (error) return { success: false, message: error.message };
                const userName = (data.user && data.user.user_metadata && data.user.user_metadata.name)
                    ? data.user.user_metadata.name
                    : cleanEmail.split('@')[0];
                const session = {
                    isLoggedIn: true,
                    user: {
                        id: data.user.id,
                        name: userName,
                        email: cleanEmail,
                        createdAt: data.user.created_at || new Date().toISOString()
                    }
                };
                localStorage.setItem(STORAGE_KEYS.CUSTOMER_SESSION, JSON.stringify(session));
                this.emit('customer:auth', session);
                this.emit('wishlist:updated', this.getWishlist());
                this.emit('cart:updated', this.getCart());
                return { success: true, user: session.user };
            } catch (err) {
                return { success: false, message: err.message };
            }
        }

        // Local structure when backend pending
        const registrations = this.getCustomerRegistrations();
        const existing = registrations.find(r => r.email === cleanEmail);
        const name = existing ? existing.name : cleanEmail.split('@')[0];

        const session = {
            isLoggedIn: true,
            user: {
                id: `dd_cust_${Date.now()}`,
                name: name,
                email: cleanEmail,
                createdAt: existing ? existing.timestamp : new Date().toISOString()
            }
        };
        localStorage.setItem(STORAGE_KEYS.CUSTOMER_SESSION, JSON.stringify(session));
        this.emit('customer:auth', session);
        this.emit('wishlist:updated', this.getWishlist());
        this.emit('cart:updated', this.getCart());
        return { success: true, user: session.user };
    },

    customerLogout() {
        localStorage.removeItem(STORAGE_KEYS.CUSTOMER_SESSION);
        localStorage.removeItem('dd_last_order_id');
        this.emit('customer:logout');
        this.emit('wishlist:updated', this.getWishlist());
        this.emit('cart:updated', this.getCart());
    },

    getCustomerOrders(emailOrPhone) {
        if (!emailOrPhone) return [];
        const clean = emailOrPhone.trim().toLowerCase();
        const cleanDigits = clean.replace(/\D/g, '');
        const orders = this.getOrders();
        return orders.filter(o => {
            const custEmail = (o.customer?.email || '').trim().toLowerCase();
            const custPhone = (o.customer?.phone || '').replace(/\D/g, '');
            if (custEmail && custEmail === clean) return true;
            if (cleanDigits && custPhone && custPhone === cleanDigits) return true;
            return false;
        });
    }
};

// =====================================================
// WHATSAPP ORDER NOTIFICATION ARCHITECTURE
// Decoupled, server-ready service. Zero credentials in frontend.
// =====================================================
const WhatsAppNotificationService = {
    formatOrderMessage(order) {
        const customerName = order.customer ? (order.customer.name || 'Valued Customer') : 'Valued Customer';
        const orderId = order.id || 'N/A';
        const itemsList = (order.items || []).map(i => `${i.name} × ${i.quantity}`).join('\n');
        const total = order.pricing ? order.pricing.total : (order.total_amount || 0);
        const paymentMethod = order.paymentMethod || 'Cash on Delivery';

        const city = order.shipping ? (order.shipping.city || '') : '';
        const state = order.shipping ? (order.shipping.state || '') : '';
        const deliveryLocation = [city, state].filter(Boolean).join(', ') || 'Boutique Delivery';

        const orderDate = order.date ? new Date(order.date) : new Date();
        const formattedTime = orderDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ", " +
                              orderDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const origin = window.location.origin && window.location.origin !== 'null' ? window.location.origin : 'https://deardraupadi.com';
        const adminOrderLink = `${origin}/admin.html#orders?id=${orderId}`;

        return `🛍️ New Dear Draupadi Order\n\nCustomer: ${customerName}\nOrder ID: ${orderId}\n\nItems:\n${itemsList}\n\nTotal: ₹${total}\n\nPayment: ${paymentMethod}\nDelivery: ${deliveryLocation}\n\nOrder time: ${formattedTime}\n\nView order in Admin → ${adminOrderLink}`;
    },

    async dispatchOrderNotification(order) {
        const payload = {
            orderId: order.id,
            formattedMessage: this.formatOrderMessage(order),
            orderData: {
                customer: order.customer,
                pricing: order.pricing,
                shipping: order.shipping,
                items: order.items,
                date: order.date
            },
            endpoint: window.DEAR_DRAUPADI_WHATSAPP_WEBHOOK_URL || null
        };

        console.info("🌸 [Dear Draupadi] WhatsApp Order Notification Prepared:", {
            orderId: order.id,
            status: "Architecture ready for secure server-side WhatsApp dispatch",
            preview: payload.formattedMessage
        });

        if (payload.endpoint) {
            try {
                await fetch(payload.endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } catch (err) {
                console.warn("⚠️ [Dear Draupadi] Backend WhatsApp notification dispatch error:", err.message);
            }
        }

        return payload;
    }
};

// Auto initialize on load
Store.init();

// Expose globally
window.Store = Store;
window.WhatsAppNotificationService = WhatsAppNotificationService;
