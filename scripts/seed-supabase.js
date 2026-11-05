/**
 * Dear Draupadi - Supabase Catalog & Database Seeder
 * Populates categories, products, product images, and coupons directly into live Supabase.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hzspfkhtamzjtezxutfx.supabase.co';
// Use service_role key to bypass RLS for administrative seeding
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6c3Bma2h0YW16anRlenh1dGZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODA1OTc2MCwiZXhwIjoyMTAzNjM1NzYwfQ.l2wsRv7NKgrOK_VyAm4cVMgS96RUAPyEugdffN87XHc';

async function req(endpoint, method = 'GET', body = null) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const headers = {
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
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

async function seed() {
  console.log("🌸 [Dear Draupadi] Starting automated Supabase database seeding...");

  // 1. Categories
  const categoriesToSeed = [
    { name: "Jewellery", slug: "jewellery" },
    { name: "Flowers", slug: "flowers" },
    { name: "Bracelets", slug: "bracelets" },
    { name: "Crochet", slug: "crochet" },
    { name: "Hampers", slug: "hampers" },
    { name: "Accessories", slug: "accessories" }
  ];

  const categoryMap = {}; // slug -> id

  for (const cat of categoriesToSeed) {
    // Check if exists
    const check = await req(`categories?slug=eq.${cat.slug}&select=*`);
    if (check.data && check.data.length > 0) {
      categoryMap[cat.slug] = check.data[0].id;
      console.log(`✓ Category "${cat.name}" already exists (ID: ${check.data[0].id})`);
    } else {
      const created = await req('categories', 'POST', cat);
      if (created.data && created.data.length > 0) {
        categoryMap[cat.slug] = created.data[0].id;
        console.log(`+ Created Category "${cat.name}" (ID: ${created.data[0].id})`);
      } else {
        console.error(`Failed to create category ${cat.name}:`, created);
      }
    }
  }

  // 2. Products
  const productsToSeed = [
    {
      name: "Handmade Blossom Bloom",
      slug: "handmade-blossom-bloom",
      categorySlug: "flowers",
      price: 129,
      original_price: 179,
      stock: 18,
      description: "A delicate, handcrafted blossom created with premium crepe and soft velvet paper. Perfect for gifting, room decor, or adding a timeless floral charm that never fades.",
      materials: "Hand-painted crepe paper, floral wire stem, velvet ribbon accent",
      size: "Approx. 22cm total stem length, 8cm flower diameter",
      care_instructions: "Keep away from moisture and direct prolonged sunlight. Gently dust with a soft brush.",
      featured: true,
      new_arrival: true,
      bestseller: false,
      images: [
        "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80"
      ]
    },
    {
      name: "Moonlit Freshwater Pearl Necklace",
      slug: "moonlit-freshwater-pearl-necklace",
      categorySlug: "jewellery",
      price: 285,
      original_price: 350,
      stock: 12,
      description: "A graceful necklace strung with genuine baroque freshwater pearls, accented with 18k gold-plated hypoallergenic clasp and extension chain.",
      materials: "Baroque natural pearls, 18k gold-plated brass findings, nylon cord",
      size: "16-inch base length + 2-inch extension chain",
      care_instructions: "Wipe with a soft dry cloth after wearing. Store in a pouch away from perfumes and sprays.",
      featured: true,
      new_arrival: false,
      bestseller: true,
      images: [
        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1611591475152-478311382490?w=800&auto=format&fit=crop&q=80"
      ]
    },
    {
      name: "Vintage Rosette Charm Bracelet",
      slug: "vintage-rosette-charm-bracelet",
      categorySlug: "bracelets",
      price: 99,
      original_price: 140,
      stock: 22,
      description: "A charming adjustable wristlet strung with pastel ceramic beads, tiny brass charms, and an antique gold finished rosette clasp.",
      materials: "Glazed ceramic beads, antique gold alloy charms, durable stretch thread",
      size: "Standard 6.5-inch stretch fit (fits wrists 6-7.5 inches)",
      care_instructions: "Avoid direct contact with water and harsh soaps.",
      featured: true,
      new_arrival: false,
      bestseller: false,
      images: [
        "https://images.unsplash.com/photo-1611591475152-478311382490?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80"
      ]
    },
    {
      name: "The Draupadi Celebration Hamper",
      slug: "the-draupadi-celebration-hamper",
      categorySlug: "hampers",
      price: 499,
      original_price: 650,
      stock: 8,
      description: "An artisanal curation packed in our signature beige keepsake box: includes 1 handmade bloom flower, 1 pearl bracelet, 1 scented beeswax tealight, and a handwritten calligraphy gift card.",
      materials: "Handmade items, rigid craft box with satin bow, shredded paper nest",
      size: "Gift box dimensions: 20cm x 15cm x 8cm",
      care_instructions: "Comes ready to gift with customizable message card.",
      featured: true,
      new_arrival: true,
      bestseller: true,
      images: [
        "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80"
      ]
    },
    {
      name: "Hand-Knitted Crochet Daisy Bookmark",
      slug: "hand-knitted-crochet-daisy-bookmark",
      categorySlug: "crochet",
      price: 79,
      original_price: 110,
      stock: 30,
      description: "Slow-made with soft combed cotton yarn, this darling daisy bookmark stays snug between your favourite pages, bringing calm to every reading session.",
      materials: "100% organic combed cotton yarn, wooden bead tail",
      size: "Length: 28cm (stem cord + daisy head)",
      care_instructions: "Gentle hand wash in cold water. Lay flat to air dry.",
      featured: false,
      new_arrival: true,
      bestseller: false,
      images: [
        "https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=800&auto=format&fit=crop&q=80"
      ]
    },
    {
      name: "Rose Quartz & Brass Solitaire Ring",
      slug: "rose-quartz-brass-solitaire-ring",
      categorySlug: "jewellery",
      price: 165,
      original_price: 220,
      stock: 14,
      description: "A soft natural raw rose quartz cabochon wrapped in hammered brass bezel. Adjustable band fits gently on any finger.",
      materials: "Natural Rose Quartz gemstone, hammered raw brass band",
      size: "Adjustable (US Size 5 to 9)",
      care_instructions: "Store in an airtight pouch. Clean brass gently with polishing cloth.",
      featured: false,
      new_arrival: false,
      bestseller: true,
      images: [
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1598560917505-59a3ad559071?w=800&auto=format&fit=crop&q=80"
      ]
    },
    {
      name: "Velvet Satin Scrunchie Trio",
      slug: "velvet-satin-scrunchie-trio",
      categorySlug: "accessories",
      price: 119,
      original_price: 150,
      stock: 25,
      description: "Set of three luxurious oversized scrunchies in terracotta, sage green, and warm cream. Glides smoothly over hair without creasing or tugging.",
      materials: "Silk-blend velvet and matte satin with durable inner elastic",
      size: "Outer diameter: 12cm",
      care_instructions: "Hand wash with mild detergent. Air dry in shade.",
      featured: false,
      new_arrival: false,
      bestseller: false,
      images: [
        "https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80"
      ]
    },
    {
      name: "Sun-Baked Terracotta Floral Drops",
      slug: "sun-baked-terracotta-floral-drops",
      categorySlug: "jewellery",
      price: 145,
      original_price: 195,
      stock: 9,
      description: "Lightweight terracotta clay earrings hand-stamped with delicate marigold petals and kiln fired with a warm matte finish. Fitted with stainless steel studs.",
      materials: "Natural clay, non-toxic pigment, surgical steel posts",
      size: "Length: 4.5cm, Weight: 4g per earring (ultra lightweight)",
      care_instructions: "Do not bend. Store safely in the provided Dear Draupadi cloth pouch.",
      featured: true,
      new_arrival: true,
      bestseller: false,
      images: [
        "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&auto=format&fit=crop&q=80"
      ]
    }
  ];

  for (const p of productsToSeed) {
    const categoryId = categoryMap[p.categorySlug] || null;
    const check = await req(`products?slug=eq.${p.slug}&select=*`);
    let productId = null;

    const productPayload = {
      name: p.name,
      slug: p.slug,
      category_id: categoryId,
      description: p.description,
      price: p.price,
      original_price: p.original_price,
      stock: p.stock,
      materials: p.materials,
      size: p.size,
      care_instructions: p.care_instructions,
      featured: p.featured,
      new_arrival: p.new_arrival,
      bestseller: p.bestseller
    };

    if (check.data && check.data.length > 0) {
      productId = check.data[0].id;
      await req(`products?id=eq.${productId}`, 'PATCH', productPayload);
      console.log(`✓ Updated product "${p.name}" (ID: ${productId})`);
    } else {
      const created = await req('products', 'POST', productPayload);
      if (created.data && created.data.length > 0) {
        productId = created.data[0].id;
        console.log(`+ Created product "${p.name}" (ID: ${productId})`);
      } else {
        console.error(`Failed to create product ${p.name}:`, created);
      }
    }

    // Product Images
    if (productId && p.images && p.images.length > 0) {
      // Clear existing images for this product
      await req(`product_images?product_id=eq.${productId}`, 'DELETE');
      for (let i = 0; i < p.images.length; i++) {
        await req('product_images', 'POST', {
          product_id: productId,
          image_url: p.images[i],
          sort_order: i
        });
      }
      console.log(`  └ Added ${p.images.length} images for "${p.name}"`);
    }
  }

  // 3. Coupons
  const couponsToSeed = [
    {
      code: "DRAUPADI10",
      discount_type: "percentage",
      discount_value: 10,
      minimum_spend: 199,
      description: "10% off on boutique orders above ₹199",
      active: true
    },
    {
      code: "FIRSTLOVE",
      discount_type: "fixed",
      discount_value: 50,
      minimum_spend: 250,
      description: "Flat ₹50 off on orders above ₹250",
      active: true
    },
    {
      code: "JOY20",
      discount_type: "percentage",
      discount_value: 20,
      minimum_spend: 499,
      description: "Special 20% off luxury hampers above ₹499",
      active: true
    }
  ];

  for (const c of couponsToSeed) {
    const check = await req(`coupons?code=eq.${c.code}&select=*`);
    if (check.data && check.data.length > 0) {
      console.log(`✓ Coupon "${c.code}" already exists`);
    } else {
      await req('coupons', 'POST', c);
      console.log(`+ Created Coupon "${c.code}" (${c.discount_value}${c.discount_type === 'percentage' ? '%' : '₹'} off)`);
    }
  }

  console.log("🌸 [Dear Draupadi] Supabase seeding complete!");
}

seed().catch(err => {
  console.error("Seeding error:", err);
  process.exit(1);
});
