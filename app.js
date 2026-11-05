/**
 * Dear Draupadi - Customer Portal Main Script (app.js)
 * Connects UI with Store data layer, manages interactions, drawers, modals, checkout, and tracking.
 */

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

const App = {
    currentCategory: 'all',
    currentSort: 'featured',
    selectedModalProduct: null,
    modalQuantity: 1,
    appliedCoupon: null,
    pendingPurchaseAction: null,
    hamperBudget: 700,
    hamperItems: [],
    hamperCategory: 'all',
    wishlistCategory: 'all',
    currentCheckoutStep: 'address',
    productsPerPage: 12,
    currentProductPage: 1,

    init() {
        this.bindEvents();
        this.renderCategoryFilters();
        this.renderEditorialCollections();
        this.renderProducts();
        this.updateCartUI();
        this.updateWishlistCount();
        this.checkAppliedCoupon();
        this.updateAccountNavUI();

        // Listen for store events
        window.addEventListener('products:updated', () => this.renderProducts());
        window.addEventListener('categories:updated', () => {
            this.renderCategoryFilters();
            this.renderEditorialCollections();
        });
        window.addEventListener('hampers:updated', () => this.renderProducts());
        window.addEventListener('cart:updated', () => this.updateCartUI());
        window.addEventListener('cart:warning', (e) => this.showToast(e.detail || 'Maximum stock reached ♡'));
        window.addEventListener('wishlist:updated', () => {
            this.updateWishlistCount();
            this.renderProducts();
            this.renderWishlistDrawer();
        });
        window.addEventListener('coupons:updated', () => {
            this.renderCartOffersList();
            this.renderCheckoutOffersList();
            this.renderOffersModalList();
        });
        window.addEventListener('customer:auth', () => {
            this.updateAccountNavUI();
            this.renderCustomerAccount();
            this.updateWishlistCount();
            this.renderWishlistDrawer();
            this.renderProducts();
            this.updateCartUI();
        });
        window.addEventListener('customer:logout', () => {
            this.updateAccountNavUI();
            this.closeCustomerAccount();
            this.updateWishlistCount();
            this.renderWishlistDrawer();
            this.renderProducts();
            this.updateCartUI();
        });
        window.addEventListener('addresses:updated', () => {
            this.renderCustomerAddresses();
        });
        window.addEventListener('orders:updated', () => {
            this.renderCustomerAccount();
            // If tracking modal is open, refresh tracking
            const lastId = localStorage.getItem('dd_last_order_id');
            if (lastId) this.refreshTrackingIfOpen(lastId);
        });

        // Cross-tab synchronization via storage event
        window.addEventListener('storage', (e) => {
            if (e.key === 'dd_products_v2') {
                this.renderProducts();
            }
            if (e.key === 'dd_cart_v2' || (e.key && e.key.startsWith('dd_cart_'))) {
                this.updateCartUI();
            }
            if (e.key === 'dd_wishlist_v2' || (e.key && e.key.startsWith('dd_wishlist_'))) {
                this.updateWishlistCount();
                this.renderWishlistDrawer();
                this.renderProducts();
            }
            if (e.key === 'dd_categories_v2' || e.key === 'dd_deleted_categories' || e.key === 'dd_category_colors') {
                this.renderCategoryFilters();
                this.renderEditorialCollections();
            }
        });
    },

    bindEvents() {
        // Search
        const searchInput = document.getElementById('product-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        // Sort select
        const sortSelect = document.getElementById('product-sort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.currentProductPage = 1;
                this.renderProducts();
            });
        }

        // Close search & modals on ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSearch();
                this.closeProductModal();
                this.closeCart();
                this.closeWishlist();
                this.closeCheckout();
                this.closeOffersModal();
                this.closeMyOrders();
                this.closeTracking();
                this.closeAuthModal();
                this.closeCustomerAccount();
                this.closeHamperBuilder();
                this.closeHamperChoiceModal();
            }
        });
    },

    // ==================== TOAST NOTIFICATIONS ====================
    showToast(message, icon = "♡") {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'dd-toast';
        toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 20);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3200);
    },

    // ==================== CATEGORY FILTERS ====================
    renderCategoryFilters() {
        const filtersContainer = document.querySelector('.product-filters');
        if (!filtersContainer) return;

        let categories = Store.getCategories();
        if (!categories.some(c => c.toLowerCase() === 'hampers')) {
            categories = [...categories, 'Hampers'];
        }

        filtersContainer.innerHTML = `
            <button class="filter-button ${this.currentCategory === 'all' ? 'active' : ''}" onclick="App.filterCategory('all', this)">ALL</button>
            ${categories.map(cat => `
                <button class="filter-button ${this.currentCategory === cat.toLowerCase() ? 'active' : ''}" onclick="App.filterCategory('${cat.toLowerCase()}', this)">${cat.toUpperCase()}</button>
            `).join('')}
        `;
    },

    renderEditorialCollections() {
        const grid = document.getElementById('editorial-collections-grid');
        if (!grid) return;

        const categories = Store.getCategories();
        if (!categories || categories.length === 0) return;

        const symbolMap = {
            'flowers': '❀',
            'jewellery': '✦',
            'jewelry': '✦',
            'crochet': '♡',
            'hampers': '✿',
            'accessories': '🎀',
            'bracelets': '✨',
            'rings': '💍',
            'earrings': '🏺',
            'new arrivals': '✧'
        };

        const sublineMap = {
            'flowers': 'Handmade blooms that never fade.',
            'jewellery': 'Little pieces to treasure.',
            'jewelry': 'Little pieces to treasure.',
            'crochet': 'Made slowly, made with love.',
            'hampers': 'Gifts made for someone special.',
            'accessories': 'Delicate accents for everyday grace.',
            'bracelets': 'Artisanal wrists adorned in beauty.',
            'rings': 'Handcrafted brass and solitaire gems.',
            'new arrivals': 'Something new has arrived.'
        };

        const defaultSymbols = ['❀', '✦', '♡', '✿', '✧', '🎀', '✨', '💍'];

        grid.innerHTML = categories.map((cat, idx) => {
            const lower = cat.toLowerCase();
            const symbol = symbolMap[lower] || defaultSymbols[idx % defaultSymbols.length];
            const subline = sublineMap[lower] || 'Curated handmade treasures made with love.';
            const numStr = String(idx + 1).padStart(2, '0');
            const cardBg = Store.getCategoryColor ? Store.getCategoryColor(cat, idx) : 'var(--teal)';

            return `
                <div class="editorial-card" style="background-color: ${cardBg};" onclick="App.filterCategory('${lower}')">
                    <div class="collection-symbol">${symbol}</div>
                    <div class="editorial-content">
                        <div class="collection-number">${numStr} / COLLECTION</div>
                        <h3>${cat}</h3>
                        <p>${subline}</p>
                        <span class="collection-link">EXPLORE →</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    // ==================== DATA-DRIVEN CARD RENDERERS ====================
    renderProductCard(product) {
        const inWishlist = Store.isInWishlist(product.id);
        const imageSrc = product.images && product.images.length ? product.images[0] : "";
        const isOutOfStock = (typeof product.stock === 'number' ? product.stock : 10) <= 0;

        return `
            <article class="product-card" data-id="${product.id}" data-category="${(product.category || '').toLowerCase()}">
                <div class="product-image-wrap" onclick="App.openProductModal('${product.id}')">
                    ${isOutOfStock 
                        ? `<span class="product-tag tag-sold-out">Sold Out</span>` 
                        : (product.badge ? `<span class="product-tag ${product.badge.toLowerCase().includes('best') ? 'tag-bestseller' : ''}">${product.badge}</span>` : '')
                    }
                    
                    <button class="wishlist-heart-btn ${inWishlist ? 'active' : ''}" 
                            type="button" 
                            aria-label="Wishlist" 
                            onclick="event.stopPropagation(); App.toggleWishlist('${product.id}')">
                        ${inWishlist ? '♥' : '♡'}
                    </button>

                    ${imageSrc 
                        ? `<img src="${imageSrc}" alt="${product.name}" class="product-image-photo" loading="lazy" onerror="this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='block';">
                           <div class="product-placeholder-visual" style="display:none;">${product.symbol || '🌸'}</div>` 
                        : `<div class="product-placeholder-visual">${product.symbol || '🌸'}</div>`
                    }
                </div>

                <div class="product-info">
                    <div class="product-meta">
                        <span class="product-category">${product.category}</span>
                        <span class="product-rating">★ ${product.rating || '5.0'}</span>
                    </div>

                    <h3 onclick="App.openProductModal('${product.id}')">${product.name}</h3>

                    <div class="product-bottom">
                        <div class="product-price-wrap">
                            <span class="price">₹${product.price}</span>
                            ${product.originalPrice ? `<span class="price-original">₹${product.originalPrice}</span>` : ''}
                        </div>

                        <button class="add-cart-btn" 
                                type="button" 
                                ${isOutOfStock ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}
                                onclick="event.stopPropagation(); ${isOutOfStock ? '' : `App.quickAddToCart('${product.id}')`}">
                            ${isOutOfStock ? 'SOLD OUT' : 'ADD +'}
                        </button>
                    </div>
                </div>
            </article>
        `;
    },

    renderHamperPresetCard(preset) {
        return `
            <article class="product-card hamper-preset-card" data-id="${preset.id}">
                <div class="product-image-wrap" onclick="App.chooseHamperPreset('${preset.id}')" style="cursor: pointer;">
                    <span class="product-tag tag-bestseller">${preset.badge || 'CURATED HAMPER'}</span>
                    ${preset.image 
                        ? `<img src="${preset.image}" alt="${preset.name}" class="product-image-photo" loading="lazy">` 
                        : `<div class="product-placeholder-visual">${preset.symbol || '🎀'}</div>`
                    }
                </div>

                <div class="product-info">
                    <div class="product-meta">
                        <span class="product-category">GIFT HAMPER</span>
                        <span class="product-rating">★ 5.0</span>
                    </div>

                    <h3 onclick="App.chooseHamperPreset('${preset.id}')">${preset.name}</h3>
                    <p class="hamper-card-desc" style="font-size: 12px; color: var(--soft-brown); line-height: 1.4; margin: 4px 0 10px;">${preset.description || 'Artisan curation packed with love.'}</p>

                    <div class="product-bottom" style="flex-direction: column; gap: 8px; align-items: stretch;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div class="product-price-wrap">
                                <span class="price">₹${preset.price}</span>
                                ${preset.originalPrice ? `<span class="price-original">₹${preset.originalPrice}</span>` : ''}
                            </div>
                            <button class="add-cart-btn" 
                                    type="button" 
                                    onclick="event.stopPropagation(); App.quickAddHamperPreset('${preset.id}')">
                                ADD +
                            </button>
                        </div>
                        <button type="button" class="btn-customize-hamper" onclick="App.chooseHamperPreset('${preset.id}')" style="background: none; border: 1px dashed var(--terracotta); color: var(--terracotta); padding: 7px 12px; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; border-radius: 4px; cursor: pointer; text-align: center; transition: all 0.2s ease;">
                            CUSTOMIZE THIS HAMPER 🎀
                        </button>
                    </div>
                </div>
            </article>
        `;
    },

    // ==================== PRODUCTS RENDERING (PACK OF 12) ====================
    renderProducts() {
        const grid = document.getElementById('product-grid');
        const paginationWrap = document.getElementById('product-pagination-wrap');
        const paginationInfo = document.getElementById('product-pagination-info');
        const paginationControls = document.getElementById('product-pagination-controls');
        if (!grid) return;

        // If 'hampers' category is selected, render custom hamper banner & suggested hamper presets
        if (this.currentCategory === 'hampers') {
            if (paginationWrap) paginationWrap.style.display = 'none';
            const presets = Store.getHamperPresets ? Store.getHamperPresets() : [];
            const activePresets = presets.filter(p => p.active !== false);

            grid.innerHTML = `
                <div class="hamper-promo-poster" style="grid-column: 1 / -1; margin-bottom: 24px; cursor: pointer;" onclick="App.openHamperBuilder(700)">
                    <div class="hamper-promo-content">
                        <span class="hamper-promo-tag">BESPOKE GIFTING</span>
                        <h2 class="hamper-promo-title">Build Your Own Hamper</h2>
                        <p class="hamper-promo-subtitle">Pick your favourites. We'll turn them into a hamper made for you.</p>
                        <button type="button" class="hamper-promo-cta-btn" onclick="event.stopPropagation(); App.openHamperBuilder(700)">
                            Customize Now →
                        </button>
                    </div>
                    <div class="hamper-promo-art">
                        <span class="hamper-promo-emblem">🎀</span>
                    </div>
                </div>

                ${activePresets.map(preset => this.renderHamperPresetCard(preset)).join('')}
            `;
            return;
        }

        let products = Store.getProducts();

        // Filter
        if (this.currentCategory !== 'all') {
            if (this.currentCategory === 'new arrivals') {
                products = products.filter(p => p.newArrival);
            } else {
                products = products.filter(p => (p.category || '').toLowerCase() === this.currentCategory.toLowerCase());
            }
        }

        // Sort
        if (this.currentSort === 'price-low') {
            products.sort((a, b) => a.price - b.price);
        } else if (this.currentSort === 'price-high') {
            products.sort((a, b) => b.price - a.price);
        } else if (this.currentSort === 'rating') {
            products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        } else if (this.currentSort === 'newest') {
            products.sort((a, b) => (b.newArrival ? 1 : 0) - (a.newArrival ? 1 : 0));
        }

        const totalProducts = products.length;
        if (totalProducts === 0) {
            if (paginationWrap) paginationWrap.style.display = 'none';
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--soft-brown);">
                    <p style="font-size: 32px; color: var(--terracotta); margin-bottom: 12px;">❀</p>
                    <h3 style="font-size: 24px; color: var(--teal); font-weight: normal; margin-bottom: 8px;">No treasures found</h3>
                    <p style="font-family: Arial, sans-serif; font-size: 13px;">No items in this collection right now. Check back soon!</p>
                </div>
            `;
            return;
        }

        // Items displayed in pack of 12
        const totalPages = Math.ceil(totalProducts / this.productsPerPage) || 1;
        if (this.currentProductPage > totalPages) this.currentProductPage = 1;
        const startIndex = (this.currentProductPage - 1) * this.productsPerPage;
        const endIndex = startIndex + this.productsPerPage;
        const pagedProducts = products.slice(startIndex, endIndex);

        grid.innerHTML = pagedProducts.map(product => this.renderProductCard(product)).join('');

        // Render Pagination Controls
        if (paginationWrap) {
            if (totalProducts > this.productsPerPage) {
                paginationWrap.style.display = 'block';
                if (paginationInfo) {
                    paginationInfo.innerHTML = `Showing <strong>${startIndex + 1}–${Math.min(endIndex, totalProducts)}</strong> of <strong>${totalProducts}</strong> treasures`;
                }
                if (paginationControls) {
                    let controlsHtml = '';
                    if (this.currentProductPage > 1) {
                        controlsHtml += `<button type="button" class="pagination-btn" onclick="App.setProductPage(${this.currentProductPage - 1})">← Prev</button>`;
                    }
                    for (let p = 1; p <= totalPages; p++) {
                        controlsHtml += `<button type="button" class="pagination-btn ${p === this.currentProductPage ? 'active' : ''}" onclick="App.setProductPage(${p})">${p}</button>`;
                    }
                    if (this.currentProductPage < totalPages) {
                        controlsHtml += `<button type="button" class="pagination-btn" onclick="App.setProductPage(${this.currentProductPage + 1})">Next →</button>`;
                    }
                    paginationControls.innerHTML = controlsHtml;
                }
            } else {
                paginationWrap.style.display = 'none';
            }
        }
    },

    setProductPage(page) {
        this.currentProductPage = page;
        this.renderProducts();
        const productsSec = document.getElementById('products');
        if (productsSec) {
            productsSec.scrollIntoView({ behavior: 'smooth' });
        }
    },

    // ==================== HAMPER CHOICE MODAL ====================
    chosenHamperPresetId: null,

    openHampersCollection() {
        this.filterCategory('hampers');
    },

    chooseHamperPreset(presetId) {
        const preset = Store.getHamperPresetById(presetId);
        if (!preset) return;
        this.chosenHamperPresetId = presetId;

        const titleEl = document.getElementById('hamper-choice-title');
        const descEl = document.getElementById('hamper-choice-desc');
        const priceEl = document.getElementById('hamper-choice-price');
        const origPriceEl = document.getElementById('hamper-choice-orig-price');
        const buyBtn = document.getElementById('hamper-choice-btn-asis');
        const modal = document.getElementById('hamper-choice-modal');

        if (titleEl) titleEl.textContent = preset.name;
        if (descEl) descEl.textContent = preset.description || 'Artisanal boutique curation packed with love.';
        if (priceEl) priceEl.textContent = `₹${preset.price}`;
        if (origPriceEl) {
            origPriceEl.textContent = preset.originalPrice ? `₹${preset.originalPrice}` : '';
        }
        if (buyBtn) {
            buyBtn.textContent = `BUY AS IT IS (₹${preset.price}) →`;
        }

        if (modal) modal.classList.add('active');
    },

    closeHamperChoiceModal(e) {
        if (e && e.target && e.target.id !== 'hamper-choice-modal' && !e.target.classList.contains('hamper-choice-close-btn')) {
            return;
        }
        const modal = document.getElementById('hamper-choice-modal');
        if (modal) modal.classList.remove('active');
        this.chosenHamperPresetId = null;
    },

    buyChosenHamperAsIs() {
        const presetId = this.chosenHamperPresetId;
        this.closeHamperChoiceModal();
        if (presetId) {
            this.quickAddHamperPreset(presetId);
            this.openCart();
        }
    },

    customizeChosenHamper() {
        const presetId = this.chosenHamperPresetId;
        this.closeHamperChoiceModal();
        if (presetId) {
            this.openHamperBuilderWithPreset(presetId);
        } else {
            this.openHamperBuilder(700);
        }
    },

    filterCategory(category, btnElement) {
        this.currentCategory = category.toLowerCase();
        this.currentProductPage = 1;
        
        document.querySelectorAll('.filter-button').forEach(btn => {
            btn.classList.toggle('active', btn.textContent.trim().toLowerCase() === this.currentCategory);
        });
        if (btnElement) {
            btnElement.classList.add('active');
        }

        this.renderProducts();

        // Smooth scroll to products section
        const productsSec = document.getElementById('products');
        if (productsSec) {
            productsSec.scrollIntoView({ behavior: 'smooth' });
        }
    },

    // ==================== PRODUCT DETAILS MODAL ====================
    openProductModal(productId) {
        const product = Store.getProductById(productId);
        if (!product) return;

        this.selectedModalProduct = product;
        this.modalQuantity = 1;

        // Populate fields
        document.getElementById('modal-product-name').textContent = product.name;
        document.getElementById('modal-product-category').textContent = product.category.toUpperCase();
        document.getElementById('modal-product-price').textContent = `₹${product.price}`;
        
        const origPriceEl = document.getElementById('modal-product-original-price');
        if (origPriceEl) {
            origPriceEl.textContent = product.originalPrice ? `₹${product.originalPrice}` : '';
            origPriceEl.style.display = product.originalPrice ? 'inline' : 'none';
        }

        const isOutOfStock = (typeof product.stock === 'number' ? product.stock : 10) <= 0;
        const addBtn = document.querySelector('.modal-add-button');
        const buyBtn = document.querySelector('.modal-buy-now-button');

        const stockBadge = document.getElementById('modal-stock-badge');
        if (stockBadge) {
            if (isOutOfStock) {
                stockBadge.textContent = "● Sold Out";
                stockBadge.style.color = "#c53030";
            } else if (product.stock > 10) {
                stockBadge.textContent = "● In Stock — Ships in 24h";
                stockBadge.style.color = "var(--teal)";
            } else {
                stockBadge.textContent = `● Low Stock — Only ${product.stock} left`;
                stockBadge.style.color = "var(--terracotta)";
            }
        }

        if (isOutOfStock) {
            this.modalQuantity = 0;
            if (addBtn) {
                addBtn.disabled = true;
                addBtn.textContent = "SOLD OUT";
                addBtn.style.opacity = "0.5";
                addBtn.style.cursor = "not-allowed";
            }
            if (buyBtn) {
                buyBtn.disabled = true;
                buyBtn.textContent = "SOLD OUT";
                buyBtn.style.opacity = "0.5";
                buyBtn.style.cursor = "not-allowed";
            }
        } else {
            this.modalQuantity = 1;
            if (addBtn) {
                addBtn.disabled = false;
                addBtn.textContent = "ADD TO CART →";
                addBtn.style.opacity = "1";
                addBtn.style.cursor = "pointer";
            }
            if (buyBtn) {
                buyBtn.disabled = false;
                buyBtn.textContent = "BUY NOW ♡";
                buyBtn.style.opacity = "1";
                buyBtn.style.cursor = "pointer";
            }
        }

        document.getElementById('modal-product-description').textContent = product.description;
        document.getElementById('modal-materials-text').textContent = product.materials || "Handmade with artisan care";
        document.getElementById('modal-size-text').textContent = product.size || "Standard boutique size";
        document.getElementById('modal-care-text').textContent = product.care || "Handle with gentle love and care ♡";

        document.getElementById('modal-rating-score').textContent = `★ ${product.rating || '5.0'} (${product.reviewCount || 1} reviews)`;
        document.getElementById('modal-quantity').textContent = this.modalQuantity;

        // Image Gallery
        const mainImageContainer = document.getElementById('modal-main-image-wrap');
        const thumbnailsContainer = document.getElementById('modal-thumbnails');
        
        const images = product.images && product.images.length ? product.images : [];

        if (images.length > 0) {
            mainImageContainer.innerHTML = `<img id="modal-active-img" src="${images[0]}" alt="${product.name}" onerror="this.parentElement.innerHTML='<span style=\\'font-size:100px;\\'>${product.symbol || '🌸'}</span>'">`;
            
            thumbnailsContainer.innerHTML = images.map((imgUrl, index) => `
                <div class="modal-thumb ${index === 0 ? 'active' : ''}" onclick="App.switchModalImage('${imgUrl}', this)">
                    <img src="${imgUrl}" alt="${product.name} view ${index + 1}">
                </div>
            `).join('');
        } else {
            mainImageContainer.innerHTML = `<span style="font-size: 100px;">${product.symbol || '🌸'}</span>`;
            thumbnailsContainer.innerHTML = '';
        }

        // Wishlist button state
        const inWishlist = Store.isInWishlist(product.name);
        const wishlistBtn = document.getElementById('modal-wishlist-btn');
        if (wishlistBtn) {
            wishlistBtn.innerHTML = inWishlist ? "♥ REMOVE FROM WISHLIST" : "♡ ADD TO WISHLIST";
        }

        // Render Reviews
        this.renderModalReviews(product.id);

        // Open modal overlay
        document.getElementById('product-modal-overlay').classList.add('active');
    },

    switchModalImage(imageUrl, thumbEl) {
        const activeImg = document.getElementById('modal-active-img');
        if (activeImg) {
            activeImg.src = imageUrl;
        }
        document.querySelectorAll('.modal-thumb').forEach(t => t.classList.remove('active'));
        if (thumbEl) thumbEl.classList.add('active');
    },

    closeProductModal() {
        const overlay = document.getElementById('product-modal-overlay');
        if (overlay) overlay.classList.remove('active');
        this.selectedModalProduct = null;
    },

    changeModalQuantity(delta) {
        if (!this.selectedModalProduct) return;
        const availableStock = typeof this.selectedModalProduct.stock === 'number' ? this.selectedModalProduct.stock : 10;
        if (availableStock <= 0) {
            this.modalQuantity = 0;
            document.getElementById('modal-quantity').textContent = '0';
            return;
        }

        if (delta > 0 && this.modalQuantity >= availableStock) {
            this.showToast(`Maximum available stock reached (${availableStock} units) ♡`);
            return;
        }

        this.modalQuantity = Math.max(1, Math.min(availableStock, this.modalQuantity + delta));
        document.getElementById('modal-quantity').textContent = this.modalQuantity;
    },

    addModalProductToCart() {
        if (!this.selectedModalProduct) return;
        const availableStock = typeof this.selectedModalProduct.stock === 'number' ? this.selectedModalProduct.stock : 10;
        if (availableStock <= 0) {
            this.showToast(`"${this.selectedModalProduct.name}" is Sold Out ♡`);
            return;
        }
        const res = Store.addToCart(this.selectedModalProduct.id, this.modalQuantity);
        if (res && res.success === false) {
            this.showToast(res.message || 'Cannot add item to cart');
            return;
        }
        const addedQty = (res && res.added !== undefined) ? res.added : this.modalQuantity;
        this.showToast(`Added ${addedQty}x ${this.selectedModalProduct.name} to cart ♡`);
        this.closeProductModal();
        this.openCart();
    },

    buyNowModalProduct() {
        if (!this.selectedModalProduct) return;
        const availableStock = typeof this.selectedModalProduct.stock === 'number' ? this.selectedModalProduct.stock : 10;
        if (availableStock <= 0) {
            this.showToast(`"${this.selectedModalProduct.name}" is Sold Out ♡`);
            return;
        }
        const session = Store.getCustomerSession();
        if (!session || !session.isLoggedIn) {
            this.pendingPurchaseAction = {
                type: 'buyNow',
                product: this.selectedModalProduct,
                quantity: this.modalQuantity
            };
            this.openAuthModal('login', "Please sign in or create an account to proceed with your purchase ♡");
            return;
        }
        const res = Store.addToCart(this.selectedModalProduct.id, this.modalQuantity);
        if (res && res.success === false) {
            this.showToast(res.message || 'Cannot add item to cart');
            return;
        }
        this.closeProductModal();
        this.openCheckout();
    },

    toggleModalWishlist() {
        if (!this.selectedModalProduct) return;
        const added = Store.toggleWishlist(this.selectedModalProduct.id);
        const wishlistBtn = document.getElementById('modal-wishlist-btn');
        if (wishlistBtn) {
            wishlistBtn.innerHTML = added ? "♥ REMOVE FROM WISHLIST" : "♡ ADD TO WISHLIST";
        }
        this.showToast(added ? "Saved to your Wishlist ♡" : "Removed from Wishlist");
    },

    shareProduct() {
        if (!this.selectedModalProduct) return;
        if (navigator.share) {
            navigator.share({
                title: `Dear Draupadi - ${this.selectedModalProduct.name}`,
                text: `Discover ${this.selectedModalProduct.name} on Dear Draupadi boutique!`,
                url: window.location.href
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(window.location.href);
            this.showToast("Product link copied to clipboard! ♡");
        }
    },

    // Reviews inside Modal
    renderModalReviews(productId) {
        const reviewsContainer = document.getElementById('modal-reviews-list');
        if (!reviewsContainer) return;

        const reviews = Store.getProductReviews(productId);
        if (reviews.length === 0) {
            reviewsContainer.innerHTML = `<p style="color: var(--soft-brown); font-size: 12px; font-style: italic;">No reviews yet. Be the first to share your thoughts!</p>`;
            return;
        }

        reviewsContainer.innerHTML = reviews.map(r => `
            <div class="review-item-card">
                <div class="review-author-row">
                    <strong>${r.author}</strong>
                    <span class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
                </div>
                <p style="color: var(--soft-brown); margin-bottom: 4px;">"${r.comment}"</p>
                <small style="color: var(--soft-brown); opacity: 0.7;">${r.date}</small>
            </div>
        `).join('');
    },

    toggleReviewForm() {
        const form = document.getElementById('modal-review-form');
        if (form) {
            form.classList.toggle('active');
        }
    },

    submitProductReview(e) {
        if (e) e.preventDefault();
        if (!this.selectedModalProduct) return;

        const nameInput = document.getElementById('review-author-input');
        const ratingInput = document.getElementById('review-rating-input');
        const commentInput = document.getElementById('review-comment-input');

        if (!nameInput.value.trim() || !commentInput.value.trim()) {
            alert("Please share your name and review comment ♡");
            return;
        }

        Store.addReview({
            productId: this.selectedModalProduct.id,
            productName: this.selectedModalProduct.name,
            author: nameInput.value.trim(),
            rating: parseInt(ratingInput.value),
            comment: commentInput.value.trim()
        });

        nameInput.value = '';
        commentInput.value = '';
        this.toggleReviewForm();
        this.renderModalReviews(this.selectedModalProduct.id);
        this.showToast("Thank you for your lovely review! ♡");
    },

    // ==================== SEARCH ====================
    openSearch() {
        const overlay = document.getElementById('search-overlay');
        if (overlay) {
            overlay.classList.add('active');
            const input = document.getElementById('product-search');
            if (input) {
                input.value = '';
                setTimeout(() => input.focus(), 200);
            }
            this.handleSearch('');
        }
    },

    closeSearch() {
        const overlay = document.getElementById('search-overlay');
        if (overlay) overlay.classList.remove('active');
    },

    handleSearch(query) {
        const resultsContainer = document.getElementById('search-results');
        if (!resultsContainer) return;

        const cleanQuery = query.toLowerCase().trim();

        if (!cleanQuery) {
            resultsContainer.innerHTML = `<p class="search-hint">Start typing to find something lovely...</p>`;
            return;
        }

        const products = Store.getProducts();
        const matches = products.filter(p => {
            const nameMatch = p.name.toLowerCase().includes(cleanQuery);
            const categoryMatch = p.category.toLowerCase().includes(cleanQuery);
            const descMatch = (p.description || '').toLowerCase().includes(cleanQuery);
            const tagsMatch = (p.tags || []).some(tag => tag.toLowerCase().includes(cleanQuery));
            return nameMatch || categoryMatch || descMatch || tagsMatch;
        });

        if (matches.length === 0) {
            resultsContainer.innerHTML = `
                <p class="no-results">
                    We couldn’t find that little treasure. ♡
                </p>
            `;
            return;
        }

        resultsContainer.innerHTML = matches.map(p => {
            const imageSrc = p.images && p.images.length ? p.images[0] : "";
            return `
                <div class="search-result" onclick="App.closeSearch(); App.openProductModal('${p.id}')">
                    <div class="search-result-image">
                        ${imageSrc 
                            ? `<img src="${imageSrc}" alt="${p.name}">` 
                            : `<span>${p.symbol || '🌸'}</span>`
                        }
                    </div>
                    <div class="search-result-info">
                        <div class="search-result-category">${p.category}</div>
                        <div class="search-result-name">${p.name}</div>
                        <div class="search-result-price">₹${p.price}</div>
                    </div>
                </div>
            `;
        }).join('');
    },

    // ==================== WISHLIST ====================
    toggleWishlist(productId) {
        const added = Store.toggleWishlist(productId);
        this.showToast(added ? "Added to your Wishlist ♡" : "Removed from Wishlist");
    },

    updateWishlistCount() {
        const count = Store.getWishlist().length;
        const countBadges = document.querySelectorAll('.wishlist-count-badge');
        countBadges.forEach(el => el.textContent = count);
    },

    openWishlist() {
        this.renderWishlistDrawer();
        document.getElementById('wishlist-drawer').classList.add('active');
        document.getElementById('cart-overlay').classList.add('active');
    },

    closeWishlist() {
        document.getElementById('wishlist-drawer').classList.remove('active');
        document.getElementById('cart-overlay').classList.remove('active');
    },

    filterWishlistCategory(category) {
        this.wishlistCategory = category || 'all';
        this.renderWishlistDrawer();
    },

    renderWishlistDrawer() {
        const listContainer = document.getElementById('wishlist-items');
        const emptyState = document.getElementById('empty-wishlist');
        const filterBar = document.getElementById('wishlist-category-filters');
        if (!listContainer) return;

        const wishlistNames = Store.getWishlist();

        if (wishlistNames.length === 0) {
            listContainer.innerHTML = '';
            if (emptyState) emptyState.classList.add('visible');
            if (filterBar) filterBar.style.display = 'none';
            return;
        }

        if (emptyState) emptyState.classList.remove('visible');

        // Fetch products
        const products = wishlistNames.map(name => Store.getProductById(name)).filter(Boolean);

        // Collect categories
        const categories = Array.from(new Set(products.map(p => p.category || 'General').filter(Boolean)));

        // Render category filters
        if (filterBar) {
            if (categories.length > 0) {
                filterBar.style.display = 'flex';
                filterBar.innerHTML = `
                    <button type="button" class="wishlist-filter-chip ${this.wishlistCategory === 'all' ? 'active' : ''}" onclick="App.filterWishlistCategory('all')">
                        ALL (${products.length})
                    </button>
                    ${categories.map(cat => {
                        const count = products.filter(p => (p.category || 'General').toLowerCase() === cat.toLowerCase()).length;
                        const isActive = this.wishlistCategory.toLowerCase() === cat.toLowerCase();
                        return `
                            <button type="button" class="wishlist-filter-chip ${isActive ? 'active' : ''}" onclick="App.filterWishlistCategory('${cat}')">
                                ${cat.toUpperCase()} (${count})
                            </button>
                        `;
                    }).join('')}
                `;
            } else {
                filterBar.style.display = 'none';
            }
        }

        // Filter products
        let visibleProducts = products;
        if (this.wishlistCategory !== 'all') {
            visibleProducts = products.filter(p => (p.category || 'General').toLowerCase() === this.wishlistCategory.toLowerCase());
            if (visibleProducts.length === 0) {
                this.wishlistCategory = 'all';
                visibleProducts = products;
            }
        }

        listContainer.innerHTML = visibleProducts.map(product => {
            const imageSrc = product.images && product.images.length ? product.images[0] : "";

            return `
                <div class="wishlist-item-row">
                    <div class="cart-item-image">
                        ${imageSrc ? `<img src="${imageSrc}" alt="${product.name}">` : `<span>${product.symbol || '🌸'}</span>`}
                    </div>
                    <div class="cart-item-info">
                        <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--terracotta); font-weight: 700;">${product.category || 'Treasure'}</span>
                        <h3 style="margin-top: 2px;">${product.name}</h3>
                        <div class="cart-item-price">₹${product.price}</div>
                        <button class="remove-item-btn" onclick="Store.toggleWishlist('${product.name}')">REMOVE</button>
                    </div>
                    ${product.stock <= 0 
                        ? `<button class="add-cart-btn" disabled style="opacity:0.5; cursor:not-allowed;">SOLD OUT</button>`
                        : `<button class="add-cart-btn" onclick="Store.addToCart('${product.id}'); Store.toggleWishlist('${product.name}'); App.showToast('Moved to cart ♡');">MOVE TO CART</button>`
                    }
                </div>
            `;
        }).join('');
    },

    // ==================== CART ====================
    quickAddToCart(productId) {
        const product = Store.getProductById(productId);
        if (product && typeof product.stock === 'number' && product.stock <= 0) {
            this.showToast(`"${product.name}" is Sold Out ♡`);
            return;
        }

        const res = Store.addToCart(productId, 1);
        if (res && res.success === false) {
            this.showToast(res.message || 'Cannot add item to cart');
            return;
        }

        this.showToast(`Added ${product ? product.name : 'item'} to cart ♡`);
        this.openCart();
    },

    openCart() {
        this.closeWishlist();
        this.updateCartUI();
        document.getElementById('cart-drawer').classList.add('active');
        document.getElementById('cart-overlay').classList.add('active');
    },

    closeCart() {
        document.getElementById('cart-drawer').classList.remove('active');
        document.getElementById('cart-overlay').classList.remove('active');
    },

    updateCartUI() {
        const cart = Store.getCart();
        const itemsContainer = document.getElementById('cart-items');
        const countBadges = document.querySelectorAll('.cart-count-badge');
        const emptyCart = document.getElementById('empty-cart');
        const cartFooter = document.getElementById('cart-footer');

        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        countBadges.forEach(el => el.textContent = totalItems);

        if (!itemsContainer) return;

        if (cart.length === 0) {
            itemsContainer.innerHTML = '';
            if (emptyCart) emptyCart.classList.add('visible');
            if (cartFooter) cartFooter.style.display = 'none';
            return;
        }

        if (emptyCart) emptyCart.classList.remove('visible');
        if (cartFooter) cartFooter.style.display = 'block';

        let subtotal = 0;

        itemsContainer.innerHTML = cart.map((item, index) => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;

            const isHamper = item.isHamper;
            const hamperBadge = isHamper ? `<span class="cart-hamper-badge">🎀 CURATED HAMPER</span>` : '';
            const hamperContents = isHamper && item.hamperItems && item.hamperItems.length ? `
                <div class="cart-hamper-contents">
                    <span class="hamper-breakdown-title">Includes:</span>
                    <div class="cart-hamper-tags">
                        ${item.hamperItems.map(h => `<span class="cart-hamper-tag">${h.name} × ${h.quantity}</span>`).join('')}
                    </div>
                    ${item.customMessage ? `<div class="cart-hamper-note">“${item.customMessage}”</div>` : ''}
                </div>
            ` : '';

            const itemProd = !item.isHamper ? Store.getProductById(item.id) : null;
            const itemMaxStock = itemProd && typeof itemProd.stock === 'number' ? itemProd.stock : 999;
            const isAtMaxStock = item.quantity >= itemMaxStock;

            return `
                <div class="cart-item ${isHamper ? 'cart-item-hamper' : ''}">
                    <div class="cart-item-image">
                        ${item.image 
                            ? `<img src="${item.image}" alt="${item.name}">` 
                            : `<span>${item.symbol || '🌸'}</span>`
                        }
                    </div>

                    <div class="cart-item-info">
                        ${hamperBadge}
                        <h3>${item.name}</h3>
                        <div class="cart-item-price">₹${item.price}</div>
                        ${hamperContents}

                        <div class="quantity-controls">
                            <button onclick="Store.updateCartQuantity(${index}, -1)">−</button>
                            <span class="quantity-number">${item.quantity}</span>
                            <button ${isAtMaxStock ? 'disabled style="opacity:0.4; cursor:not-allowed;" title="Maximum available stock reached"' : ''} onclick="Store.updateCartQuantity(${index}, 1)">+</button>
                        </div>

                        <button class="remove-item-btn" onclick="Store.removeFromCart(${index})">REMOVE</button>
                    </div>

                    <div style="font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; color: var(--teal);">
                        ₹${itemTotal}
                    </div>
                </div>
            `;
        }).join('');

        // Subtotals and Coupon Calculation
        let discount = 0;
        let calc = null;
        if (this.appliedCoupon) {
            const couponResult = Store.applyCoupon(this.appliedCoupon.code, subtotal);
            if (couponResult.valid) {
                discount = couponResult.discount;
                calc = this.getCouponCalculation(this.appliedCoupon, subtotal);
            } else {
                this.appliedCoupon = null;
                localStorage.removeItem(STORAGE_KEYS.APPLIED_COUPON);
            }
        }

        const deliveryFee = 0; // Free delivery
        const finalTotal = Math.max(0, subtotal - discount + deliveryFee);

        document.getElementById('cart-subtotal').textContent = `₹${subtotal}`;
        document.getElementById('cart-total').textContent = `₹${finalTotal}`;

        // Coupon container render & calculation breakdown
        const couponWrap = document.getElementById('applied-coupon-wrap');
        const toggleLabel = document.getElementById('cart-coupon-toggle-label');
        if (couponWrap) {
            if (this.appliedCoupon && discount > 0 && calc) {
                couponWrap.innerHTML = `
                    <div class="applied-coupon-calc-box">
                        <div class="applied-coupon-calc-header">
                            <div>
                                <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--terracotta); font-weight: 700; display: block;">APPLIED COUPON</span>
                                <strong style="font-size: 13.5px; color: var(--teal); font-family: 'Playfair Display', serif;">🎟️ ${this.appliedCoupon.code}</strong>
                            </div>
                            <button type="button" class="remove-coupon-btn" onclick="App.removeCoupon()" style="background: none; border: 1px solid var(--terracotta); color: var(--terracotta); border-radius: 4px; padding: 2px 8px; font-size: 10.5px; font-weight: 600; cursor: pointer;">REMOVE ✕</button>
                        </div>
                        <div class="applied-coupon-calc-details">
                            <div class="calc-row">
                                <span>Cart Subtotal:</span>
                                <span>₹${subtotal}</span>
                            </div>
                            <div class="calc-row" style="color: var(--teal); font-weight: 600;">
                                <span>Discount Calculation:</span>
                                <span>${calc.formula}</span>
                            </div>
                            <div class="calc-row" style="border-top: 1px dashed #cce8df; padding-top: 4px; margin-top: 2px;">
                                <span style="font-weight: 600; color: var(--brown);">Payable After Discount:</span>
                                <strong style="color: var(--terracotta); font-size: 12.5px;">₹${calc.payable}</strong>
                            </div>
                            <div class="calc-row" style="font-size: 11px; color: var(--teal); font-weight: 600;">
                                <span>🌸 You Save:</span>
                                <span>₹${calc.savings}</span>
                            </div>
                        </div>
                    </div>
                `;
                if (toggleLabel) toggleLabel.textContent = `Applied: ${this.appliedCoupon.code} (-₹${discount})`;
            } else {
                couponWrap.innerHTML = '';
                if (toggleLabel) toggleLabel.textContent = 'Apply Coupon / Offers';
            }
        }

        const dropdown = document.getElementById('cart-coupon-dropdown');
        if (dropdown && dropdown.style.display !== 'none') {
            this.renderCartOffersList();
        }
    },

    getCouponCalculation(coupon, subtotal) {
        if (!coupon) return null;
        const minSpend = coupon.minSpend || 0;
        let discount = 0;
        let formula = '';

        if (coupon.type === 'percentage') {
            discount = Math.round((subtotal * coupon.value) / 100);
            formula = `${coupon.value}% of ₹${subtotal} = ₹${discount} discount`;
        } else {
            discount = coupon.value;
            formula = `Flat ₹${discount} discount on ₹${subtotal}`;
        }

        discount = Math.min(discount, subtotal);
        const payable = Math.max(0, subtotal - discount);
        const savings = discount;

        return {
            coupon,
            subtotal,
            discount,
            payable,
            savings,
            formula,
            minSpend,
            isEligible: subtotal >= minSpend
        };
    },

    toggleCartCouponDropdown() {
        const dropdown = document.getElementById('cart-coupon-dropdown');
        const btn = document.getElementById('cart-coupon-toggle-btn');
        if (!dropdown || !btn) return;
        const isHidden = dropdown.style.display === 'none';
        dropdown.style.display = isHidden ? 'block' : 'none';
        btn.classList.toggle('open', isHidden);
        if (isHidden) {
            this.renderCartOffersList();
        }
    },

    renderCartOffersList() {
        const list = document.getElementById('cart-offers-list');
        const toggleLabel = document.getElementById('cart-coupon-toggle-label');
        if (!list) return;

        const cart = Store.getCart();
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        if (this.appliedCoupon) {
            if (toggleLabel) toggleLabel.textContent = `Applied: ${this.appliedCoupon.code}`;
        } else {
            if (toggleLabel) toggleLabel.textContent = 'Apply Coupon / Offers';
        }

        const coupons = Store.getCoupons().filter(c => c.active !== false);
        if (coupons.length === 0) {
            list.innerHTML = `<p style="font-size:11.5px; color:var(--soft-brown); text-align:center; padding:8px;">No offers available right now ♡</p>`;
            return;
        }

        list.innerHTML = coupons.map(c => {
            const minSpend = c.minSpend || 0;
            const isEligible = subtotal >= minSpend;
            const isApplied = this.appliedCoupon && this.appliedCoupon.code.toUpperCase() === c.code.toUpperCase();
            const discountLabel = c.type === 'percentage' ? `${c.value}% OFF` : `₹${c.value} OFF`;
            const calc = this.getCouponCalculation(c, subtotal);

            return `
                <div class="coupon-offer-item ${isApplied ? 'applied' : (isEligible ? 'eligible' : 'ineligible')}">
                    <div style="flex: 1;">
                        <div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;">
                            <span class="offer-code-badge" style="font-size:11px; padding:2px 6px;">${c.code}</span>
                            <span class="offer-discount-tag" style="font-size:9.5px; padding:1px 5px;">${discountLabel}</span>
                        </div>
                        <p style="font-size:10.5px; color:var(--soft-brown); margin:0; line-height:1.3;">${c.description || `On orders above ₹${minSpend}`}</p>
                        ${isEligible ? `
                            <div class="coupon-calc-preview" style="color: var(--teal);">
                                🧮 <strong>Calculation:</strong> ${calc.formula} → <strong>₹${calc.payable}</strong> payable (Save ₹${calc.savings})
                            </div>
                        ` : `
                            <div class="coupon-calc-preview" style="color: var(--soft-brown);">
                                🔒 <strong>Requirement:</strong> Min spend ₹${minSpend} (Add <strong>₹${minSpend - subtotal}</strong> more to unlock ${discountLabel})
                            </div>
                        `}
                    </div>
                    <div style="align-self: flex-start; margin-left: 8px;">
                        ${isApplied 
                            ? `<button type="button" class="btn-coupon-remove" onclick="App.removeCoupon()">REMOVE</button>` 
                            : (isEligible 
                                ? `<button type="button" class="btn-coupon-apply" onclick="App.applyDirectCoupon('${c.code}', 'cart')">APPLY</button>` 
                                : `<button type="button" class="btn-coupon-apply disabled" disabled title="Min spend of ₹${minSpend} required">LOCKED 🔒</button>`
                            )
                        }
                    </div>
                </div>
            `;
        }).join('');
    },

    applyDirectCoupon(code, context = 'cart') {
        const cart = Store.getCart();
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const result = Store.applyCoupon(code, subtotal);
        if (result.valid) {
            this.appliedCoupon = result.coupon;
            localStorage.setItem(STORAGE_KEYS.APPLIED_COUPON, JSON.stringify(this.appliedCoupon));
            const calc = this.getCouponCalculation(result.coupon, subtotal);
            this.showToast(`Coupon applied! ${calc.formula} (Saved ₹${calc.savings}) ♡`);
            this.updateCartUI();
            this.renderCartOffersList();
            this.renderCheckoutSummary();
            this.renderCheckoutOffersList();
        } else {
            alert(result.message);
        }
    },

    applyCouponCode() {
        const input = document.getElementById('coupon-code-input');
        if (!input || !input.value.trim()) return;

        const cart = Store.getCart();
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const result = Store.applyCoupon(input.value.trim(), subtotal);
        if (result.valid) {
            this.appliedCoupon = result.coupon;
            localStorage.setItem(STORAGE_KEYS.APPLIED_COUPON, JSON.stringify(this.appliedCoupon));
            const calc = this.getCouponCalculation(result.coupon, subtotal);
            this.showToast(`Coupon applied! ${calc.formula} (Saved ₹${calc.savings}) ♡`);
            input.value = '';
            this.updateCartUI();
            this.renderCartOffersList();
            this.renderCheckoutSummary();
            this.renderCheckoutOffersList();
        } else {
            alert(result.message);
        }
    },

    removeCoupon() {
        this.appliedCoupon = null;
        localStorage.removeItem(STORAGE_KEYS.APPLIED_COUPON);
        this.showToast("Coupon removed");
        this.updateCartUI();
        this.renderCartOffersList();
        this.renderCheckoutSummary();
        this.renderCheckoutOffersList();
    },

    checkAppliedCoupon() {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.APPLIED_COUPON);
            if (saved) this.appliedCoupon = JSON.parse(saved);
        } catch (e) {
            this.appliedCoupon = null;
        }
    },

    // ==================== BOUTIQUE OFFERS MODAL ====================
    openOffersModal() {
        this.closeMobileNav();
        const modal = document.getElementById('offers-modal');
        if (!modal) return;

        this.renderOffersModalList();
        modal.classList.add('active');
    },

    closeOffersModal() {
        const modal = document.getElementById('offers-modal');
        if (modal) modal.classList.remove('active');
    },

    navigateToShop() {
        this.closeOffersModal();
        this.closeMobileNav();
        this.filterCategory('all');
        const shopSec = document.getElementById('products');
        if (shopSec) {
            shopSec.scrollIntoView({ behavior: 'smooth' });
        }
    },

    renderOffersModalList() {
        const list = document.getElementById('offers-modal-list');
        if (!list) return;

        const coupons = Store.getCoupons().filter(c => c.active !== false);
        if (coupons.length === 0) {
            list.innerHTML = `
                <div style="text-align: center; padding: 30px; color: var(--soft-brown);">
                    <p style="font-size: 26px; color: var(--coral);">♡</p>
                    <p style="font-size: 13.5px; margin-top: 8px;">No active offers at this moment.</p>
                    <p style="font-size: 12px; opacity: 0.8; margin-bottom: 16px;">New handmade treats and seasonal privileges arrive frequently!</p>
                    <button type="button" class="btn-primary" onclick="App.navigateToShop()" style="padding: 10px 20px; font-size: 11px;">
                        START SHOPPING →
                    </button>
                </div>
            `;
            return;
        }

        const cart = Store.getCart();
        const hasCartItems = cart.length > 0;
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        list.innerHTML = coupons.map(c => {
            const minSpend = c.minSpend || 0;
            const discountLabel = c.type === 'percentage' ? `${c.value}% OFF` : `FLAT ₹${c.value} OFF`;
            const isEligible = subtotal >= minSpend;
            const calc = this.getCouponCalculation(c, subtotal);

            return `
                <div class="offer-card-item">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap;">
                            <span class="offer-code-badge">${c.code}</span>
                            <span class="offer-discount-tag">${discountLabel}</span>
                        </div>
                        <h4 style="font-size: 13.5px; color: var(--brown); margin: 0 0 4px; font-weight: 600;">
                            ${c.description || `Special discount on orders above ₹${minSpend}`}
                        </h4>
                        <div style="font-size: 11.5px; color: var(--soft-brown); display: flex; gap: 14px; flex-wrap: wrap;">
                            <span>● Min Spend: <strong>₹${minSpend}</strong></span>
                            ${c.expiry ? `<span>● Valid Till: <strong>${c.expiry}</strong></span>` : ''}
                        </div>
                        ${hasCartItems ? (isEligible ? `
                            <div class="coupon-calc-preview" style="color: var(--teal); margin-top: 6px;">
                                🧮 <strong>Calculation:</strong> ${calc.formula} → <strong>₹${calc.payable}</strong> payable (Save ₹${calc.savings})
                            </div>
                        ` : `
                            <div class="coupon-calc-preview" style="color: var(--soft-brown); margin-top: 6px;">
                                🔒 <strong>Min Spend:</strong> ₹${minSpend} (Cart: ₹${subtotal} • Add <strong>₹${minSpend - subtotal}</strong> more to unlock)
                            </div>
                        `) : ''}
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 6px; align-items: flex-end;">
                        <button type="button" class="offer-copy-btn" onclick="App.copyCouponCode('${c.code}')">
                            📋 COPY CODE
                        </button>
                        <button type="button" class="offer-shop-btn" onclick="App.navigateToShop()">
                            START SHOPPING →
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    copyCouponCode(code) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(code).then(() => {
                this.showToast(`Coupon "${code}" copied to clipboard! ♡`);
            }).catch(() => {
                this.fallbackCopyText(code);
            });
        } else {
            this.fallbackCopyText(code);
        }
    },

    fallbackCopyText(text) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            this.showToast(`Coupon "${text}" copied to clipboard! ♡`);
        } catch (err) {
            this.showToast(`Coupon: ${text}`);
        }
        document.body.removeChild(textArea);
    },

    // ==================== CHECKOUT FLOW (ADDRESS -> PAYMENT -> CONFIRM) ====================
    openCheckout() {
        // Re-validate stock when opening checkout (Requirement 7)
        const stockCheck = Store.validateCartAgainstStock();
        if (!stockCheck.valid && stockCheck.messages.length > 0) {
            alert(stockCheck.messages.join('\n'));
            this.updateCartUI();
        }

        const cart = Store.getCart();
        if (cart.length === 0) {
            this.showToast("Your cart is empty ♡");
            return;
        }

        const session = Store.getCustomerSession();
        if (!session || !session.isLoggedIn) {
            this.pendingPurchaseAction = { type: 'checkout' };
            this.openAuthModal('login', "Please sign in or create an account to proceed to checkout ♡");
            return;
        }

        this.closeCart();
        this.goToCheckoutAddress(); // Starts at Step 1: Address!
        this.renderCheckoutSummary();
        this.renderCheckoutAddresses(session.user);
        this.renderCheckoutOffersList();
        document.getElementById('checkout-page').classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    closeCheckout() {
        const checkoutPage = document.getElementById('checkout-page');
        if (checkoutPage) checkoutPage.classList.remove('active');
        this.currentCheckoutStep = 'address';
    },

    goToCheckoutAddress() {
        this.currentCheckoutStep = 'address';
        const stepAddr = document.getElementById('checkout-step-address');
        const stepPay = document.getElementById('checkout-step-payment');
        const tabAddr = document.getElementById('checkout-step-tab-address');
        const tabPay = document.getElementById('checkout-step-tab-payment');

        if (stepAddr) stepAddr.style.display = 'block';
        if (stepPay) stepPay.style.display = 'none';

        if (tabAddr) {
            tabAddr.classList.add('active');
            tabAddr.classList.remove('completed');
            const num = document.getElementById('step-num-address');
            if (num) num.textContent = '1';
        }
        if (tabPay) {
            tabPay.classList.remove('active');
            tabPay.classList.remove('completed');
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    goToCheckoutPayment() {
        const name = document.getElementById('customer-name')?.value.trim();
        const email = document.getElementById('customer-email')?.value.trim();
        const phone = document.getElementById('customer-phone')?.value.trim();
        const address = document.getElementById('customer-address')?.value.trim();
        const city = document.getElementById('customer-city')?.value.trim();
        const state = document.getElementById('customer-state')?.value.trim();
        const pincode = document.getElementById('customer-pincode')?.value.trim();

        if (!name) {
            alert("Please enter your full name ♡");
            document.getElementById('customer-name')?.focus();
            return;
        }
        if (!email) {
            alert("Please enter your email address ♡");
            document.getElementById('customer-email')?.focus();
            return;
        }
        if (!phone) {
            alert("Please enter your phone number ♡");
            document.getElementById('customer-phone')?.focus();
            return;
        }
        if (!address || !city || !state || !pincode) {
            alert("Please provide your complete delivery address details ♡");
            document.getElementById('customer-address')?.focus();
            return;
        }

        this.currentCheckoutStep = 'payment';
        const stepAddr = document.getElementById('checkout-step-address');
        const stepPay = document.getElementById('checkout-step-payment');
        const tabAddr = document.getElementById('checkout-step-tab-address');
        const tabPay = document.getElementById('checkout-step-tab-payment');

        if (stepAddr) stepAddr.style.display = 'none';
        if (stepPay) stepPay.style.display = 'block';

        if (tabAddr) {
            tabAddr.classList.remove('active');
            tabAddr.classList.add('completed');
            const num = document.getElementById('step-num-address');
            if (num) num.textContent = '✓';
        }
        if (tabPay) {
            tabPay.classList.add('active');
        }

        // Update Delivery Preview Card
        const previewName = document.getElementById('preview-cust-name');
        const previewAddr = document.getElementById('preview-cust-address');
        if (previewName) previewName.textContent = `${name} • ${phone}`;
        if (previewAddr) previewAddr.textContent = `${address}, ${city}, ${state} - ${pincode}`;

        // Re-render checkout summary & offers list (preserving any coupon already applied in cart!)
        this.renderCheckoutSummary();
        this.renderCheckoutOffersList();

        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    toggleCheckoutCouponDropdown() {
        const dropdown = document.getElementById('checkout-coupon-dropdown');
        const btn = document.getElementById('checkout-coupon-toggle-btn');
        if (!dropdown || !btn) return;
        const isHidden = dropdown.style.display === 'none';
        dropdown.style.display = isHidden ? 'block' : 'none';
        btn.classList.toggle('open', isHidden);
        if (isHidden) {
            this.renderCheckoutOffersList();
        }
    },

    renderCheckoutOffersList() {
        const list = document.getElementById('checkout-offers-list');
        const couponWrap = document.getElementById('checkout-applied-coupon-wrap');
        const toggleLabel = document.getElementById('checkout-coupon-toggle-label');
        if (!list) return;

        const cart = Store.getCart();
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        let discount = 0;
        let calc = null;
        if (this.appliedCoupon) {
            const couponResult = Store.applyCoupon(this.appliedCoupon.code, subtotal);
            if (couponResult.valid) {
                discount = couponResult.discount;
                calc = this.getCouponCalculation(this.appliedCoupon, subtotal);
            } else {
                this.appliedCoupon = null;
                localStorage.removeItem(STORAGE_KEYS.APPLIED_COUPON);
            }
        }

        if (couponWrap) {
            if (this.appliedCoupon && discount > 0 && calc) {
                couponWrap.innerHTML = `
                    <div class="applied-coupon-calc-box">
                        <div class="applied-coupon-calc-header">
                            <div>
                                <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--terracotta); font-weight: 700; display: block;">APPLIED COUPON</span>
                                <strong style="font-size: 13.5px; color: var(--teal); font-family: 'Playfair Display', serif;">🎟️ ${this.appliedCoupon.code}</strong>
                            </div>
                            <button type="button" class="btn-coupon-remove" onclick="App.removeCheckoutCoupon()">REMOVE ✕</button>
                        </div>
                        <div class="applied-coupon-calc-details">
                            <div class="calc-row">
                                <span>Cart Subtotal:</span>
                                <span>₹${subtotal}</span>
                            </div>
                            <div class="calc-row" style="color: var(--teal); font-weight: 600;">
                                <span>Discount Calculation:</span>
                                <span>${calc.formula}</span>
                            </div>
                            <div class="calc-row" style="border-top: 1px dashed #cce8df; padding-top: 4px; margin-top: 2px;">
                                <span style="font-weight: 600; color: var(--brown);">Payable After Discount:</span>
                                <strong style="color: var(--terracotta); font-size: 12.5px;">₹${calc.payable}</strong>
                            </div>
                            <div class="calc-row" style="font-size: 11px; color: var(--teal); font-weight: 600;">
                                <span>🌸 You Save:</span>
                                <span>₹${calc.savings}</span>
                            </div>
                        </div>
                    </div>
                `;
                if (toggleLabel) toggleLabel.textContent = `Applied: ${this.appliedCoupon.code} (-₹${discount})`;
            } else {
                couponWrap.innerHTML = '';
                if (toggleLabel) toggleLabel.textContent = 'Apply Coupon / Offers';
            }
        }

        const coupons = Store.getCoupons().filter(c => c.active !== false);
        if (coupons.length === 0) {
            list.innerHTML = `<p style="font-size:12px; color:var(--soft-brown); text-align:center; padding:10px;">No offers available right now ♡</p>`;
            return;
        }

        list.innerHTML = coupons.map(c => {
            const minSpend = c.minSpend || 0;
            const isEligible = subtotal >= minSpend;
            const isApplied = this.appliedCoupon && this.appliedCoupon.code.toUpperCase() === c.code.toUpperCase();
            const discountLabel = c.type === 'percentage' ? `${c.value}% OFF` : `₹${c.value} OFF`;
            const cCalc = this.getCouponCalculation(c, subtotal);

            return `
                <div class="coupon-offer-item ${isApplied ? 'applied' : (isEligible ? 'eligible' : 'ineligible')}">
                    <div style="flex: 1;">
                        <div style="display:flex; align-items:center; gap:6px; margin-bottom:3px;">
                            <span class="offer-code-badge" style="font-size:11.5px; padding:2px 8px;">${c.code}</span>
                            <span class="offer-discount-tag" style="font-size:9.5px; padding:2px 6px;">${discountLabel}</span>
                        </div>
                        <p style="font-size:11px; color:var(--soft-brown); margin:0; line-height:1.35;">${c.description || `Applicable on orders above ₹${minSpend}`}</p>
                        ${isEligible ? `
                            <div class="coupon-calc-preview" style="color: var(--teal);">
                                🧮 <strong>Calculation:</strong> ${cCalc.formula} → <strong>₹${cCalc.payable}</strong> payable (Save ₹${cCalc.savings})
                            </div>
                        ` : `
                            <div class="coupon-calc-preview" style="color: var(--soft-brown);">
                                🔒 <strong>Requirement:</strong> Min spend ₹${minSpend} (Add <strong>₹${minSpend - subtotal}</strong> more to unlock ${discountLabel})
                            </div>
                        `}
                    </div>
                    <div style="align-self: flex-start; margin-left: 8px;">
                        ${isApplied 
                            ? `<button type="button" class="btn-coupon-remove" onclick="App.removeCheckoutCoupon()">REMOVE</button>` 
                            : (isEligible 
                                ? `<button type="button" class="btn-coupon-apply" onclick="App.applyDirectCoupon('${c.code}', 'checkout')">APPLY</button>` 
                                : `<button type="button" class="btn-coupon-apply disabled" disabled title="Min spend of ₹${minSpend} required">LOCKED 🔒</button>`
                            )
                        }
                    </div>
                </div>
            `;
        }).join('');
    },

    applyCheckoutCouponCode() {
        const input = document.getElementById('checkout-coupon-code-input');
        if (!input || !input.value.trim()) return;

        const cart = Store.getCart();
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const result = Store.applyCoupon(input.value.trim(), subtotal);
        if (result.valid) {
            this.appliedCoupon = result.coupon;
            localStorage.setItem(STORAGE_KEYS.APPLIED_COUPON, JSON.stringify(this.appliedCoupon));
            const calc = this.getCouponCalculation(result.coupon, subtotal);
            this.showToast(`Coupon applied! ${calc.formula} (Saved ₹${calc.savings}) ♡`);
            input.value = '';
            this.renderCheckoutSummary();
            this.renderCheckoutOffersList();
            this.updateCartUI();
        } else {
            alert(result.message);
        }
    },

    removeCheckoutCoupon() {
        this.appliedCoupon = null;
        localStorage.removeItem(STORAGE_KEYS.APPLIED_COUPON);
        this.showToast("Coupon removed");
        this.renderCheckoutSummary();
        this.renderCheckoutOffersList();
        this.updateCartUI();
    },

    renderCheckoutAddresses(user) {
        const wrap = document.getElementById('checkout-saved-addresses-wrap');
        const list = document.getElementById('checkout-saved-addresses-list');
        const toggleAddBtn = document.getElementById('btn-toggle-add-address');
        const manualFields = document.getElementById('checkout-manual-address-fields');
        const cancelAddBtn = document.getElementById('btn-cancel-add-address');
        if (!wrap || !list) return;

        const nameInput = document.getElementById('customer-name');
        const emailInput = document.getElementById('customer-email');
        const phoneInput = document.getElementById('customer-phone');
        if (nameInput && !nameInput.value && user.name) nameInput.value = user.name;
        if (emailInput && !emailInput.value && user.email) emailInput.value = user.email;
        if (phoneInput && !phoneInput.value && user.phone) phoneInput.value = user.phone;

        const addresses = Store.getCustomerAddresses(user.email);
        if (addresses.length > 0) {
            wrap.style.display = 'block';
            if (toggleAddBtn) toggleAddBtn.style.display = 'inline-block';
            if (manualFields) manualFields.style.display = 'none';
            if (cancelAddBtn) cancelAddBtn.style.display = 'none';

            const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];

            list.innerHTML = `
                ${addresses.map(addr => `
                    <label class="checkout-addr-option ${addr.id === defaultAddr.id ? 'selected' : ''}" onclick="App.selectCheckoutAddress('${addr.id}')">
                        <input type="radio" name="checkout_selected_address" value="${addr.id}" ${addr.id === defaultAddr.id ? 'checked' : ''}>
                        <div>
                            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
                                <span class="addr-chip-label">${addr.label || 'Home'}</span>
                                ${addr.isDefault ? '<span class="addr-chip-default">DEFAULT</span>' : ''}
                                <strong style="font-size: 13px; color: var(--brown);">${addr.name || user.name || 'Valued Customer'}</strong>
                                ${addr.phone ? `<span style="font-size: 11.5px; color: var(--soft-brown);">(${addr.phone})</span>` : ''}
                            </div>
                            <p style="font-size: 12px; color: var(--soft-brown); margin: 0; line-height: 1.4;">
                                ${addr.address}, ${addr.city}, ${addr.state} - <strong>${addr.pincode}</strong>
                            </p>
                        </div>
                    </label>
                `).join('')}

                <div class="checkout-add-address-card" onclick="App.showCheckoutAddAddressForm()">
                    <span>➕</span>
                    <span>+ ADD NEW DELIVERY ADDRESS</span>
                </div>
            `;

            this.selectCheckoutAddress(defaultAddr.id, false);
        } else {
            wrap.style.display = 'none';
            if (toggleAddBtn) toggleAddBtn.style.display = 'none';
            if (manualFields) manualFields.style.display = 'block';
            if (cancelAddBtn) cancelAddBtn.style.display = 'none';
            this.prefillCheckoutDetails(user);
        }
    },

    showCheckoutAddAddressForm() {
        const manualFields = document.getElementById('checkout-manual-address-fields');
        const cancelAddBtn = document.getElementById('btn-cancel-add-address');
        const addressInput = document.getElementById('customer-address');
        const cityInput = document.getElementById('customer-city');
        const stateInput = document.getElementById('customer-state');
        const pincodeInput = document.getElementById('customer-pincode');
        const saveCheck = document.getElementById('checkout-save-address-check');

        if (manualFields) manualFields.style.display = 'block';
        if (cancelAddBtn) cancelAddBtn.style.display = 'inline-block';

        // Deselect saved addresses radio highlight
        document.querySelectorAll('#checkout-saved-addresses-list .checkout-addr-option').forEach(el => {
            el.classList.remove('selected');
            const radio = el.querySelector('input[type="radio"]');
            if (radio) radio.checked = false;
        });

        if (addressInput) {
            addressInput.value = '';
            addressInput.focus();
        }
        if (cityInput) cityInput.value = '';
        if (stateInput) stateInput.value = '';
        if (pincodeInput) pincodeInput.value = '';
        if (saveCheck) saveCheck.checked = true;

        manualFields?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },

    hideCheckoutAddAddressForm() {
        const session = Store.getCustomerSession();
        if (!session || !session.user) return;
        const addresses = Store.getCustomerAddresses(session.user.email);
        if (addresses.length === 0) return;

        const manualFields = document.getElementById('checkout-manual-address-fields');
        const cancelAddBtn = document.getElementById('btn-cancel-add-address');
        if (manualFields) manualFields.style.display = 'none';
        if (cancelAddBtn) cancelAddBtn.style.display = 'none';

        const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
        this.selectCheckoutAddress(defaultAddr.id, false);
    },

    selectCheckoutAddress(addrId, shouldFocus = false) {
        const session = Store.getCustomerSession();
        if (!session || !session.user) return;

        if (addrId === 'new') {
            this.showCheckoutAddAddressForm();
            return;
        }

        const manualFields = document.getElementById('checkout-manual-address-fields');
        const cancelAddBtn = document.getElementById('btn-cancel-add-address');
        if (manualFields) manualFields.style.display = 'none';
        if (cancelAddBtn) cancelAddBtn.style.display = 'none';

        document.querySelectorAll('#checkout-saved-addresses-list .checkout-addr-option').forEach(el => {
            const radio = el.querySelector('input[type="radio"]');
            if (radio) {
                const match = radio.value === addrId;
                radio.checked = match;
                el.classList.toggle('selected', match);
            }
        });

        const addresses = Store.getCustomerAddresses(session.user.email);
        const addr = addresses.find(a => a.id === addrId);
        if (addr) {
            const addressInput = document.getElementById('customer-address');
            const cityInput = document.getElementById('customer-city');
            const stateInput = document.getElementById('customer-state');
            const pincodeInput = document.getElementById('customer-pincode');
            const nameInput = document.getElementById('customer-name');
            const phoneInput = document.getElementById('customer-phone');

            if (addressInput) addressInput.value = addr.address || '';
            if (cityInput) cityInput.value = addr.city || '';
            if (stateInput) stateInput.value = addr.state || '';
            if (pincodeInput) pincodeInput.value = addr.pincode || '';
            if (nameInput && addr.name) nameInput.value = addr.name;
            if (phoneInput && addr.phone) phoneInput.value = addr.phone;
        }
    },

    renderCheckoutSummary() {
        const itemsContainer = document.getElementById('checkout-items');
        const subtotalEl = document.getElementById('checkout-subtotal');
        const discountRow = document.getElementById('checkout-discount-row');
        const discountEl = document.getElementById('checkout-discount');
        const calcNoteEl = document.getElementById('checkout-discount-calc-note');
        const totalEl = document.getElementById('checkout-total');

        const cart = Store.getCart();
        let subtotal = 0;

        itemsContainer.innerHTML = cart.map(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            return `
                <div class="checkout-summary-item ${item.isHamper ? 'checkout-hamper-item' : ''}">
                    <div>
                        <span style="font-weight: 600;">${item.name} × ${item.quantity}</span>
                        ${item.isHamper && item.hamperItems && item.hamperItems.length ? `
                            <div style="font-size: 11px; color: var(--soft-brown); margin-top: 4px; line-height: 1.4;">
                                <strong>Includes:</strong> ${item.hamperItems.map(h => `${h.name} (×${h.quantity})`).join(', ')}
                            </div>
                            ${item.customMessage ? `<div style="font-size: 11px; color: var(--teal); font-style: italic; margin-top: 2px;">Note: "${item.customMessage}"</div>` : ''}
                        ` : ''}
                    </div>
                    <strong>₹${itemTotal}</strong>
                </div>
            `;
        }).join('');

        let discount = 0;
        let calc = null;
        if (this.appliedCoupon) {
            const couponResult = Store.applyCoupon(this.appliedCoupon.code, subtotal);
            if (couponResult.valid) {
                discount = couponResult.discount;
                calc = this.getCouponCalculation(this.appliedCoupon, subtotal);
            } else {
                this.appliedCoupon = null;
                localStorage.removeItem(STORAGE_KEYS.APPLIED_COUPON);
            }
        }

        const total = Math.max(0, subtotal - discount);

        subtotalEl.textContent = `₹${subtotal}`;
        if (discount > 0 && calc) {
            discountRow.style.display = 'flex';
            discountEl.textContent = `-₹${discount}`;
            if (calcNoteEl) {
                calcNoteEl.style.display = 'block';
                calcNoteEl.innerHTML = `<span style="color: var(--teal); font-weight: 600;">Formula: ${calc.formula} (Saved ₹${calc.savings})</span>`;
            }
        } else {
            discountRow.style.display = 'none';
            if (calcNoteEl) calcNoteEl.style.display = 'none';
        }
        totalEl.textContent = `₹${total}`;
    },

    async placeOrder() {
        const session = Store.getCustomerSession();
        if (!session || !session.isLoggedIn) {
            this.pendingPurchaseAction = { type: 'placeOrder' };
            this.openAuthModal('login', "Please sign in or create an account to place your order ♡");
            return;
        }

        // Validate stock again at final checkout submission (Requirement 7)
        const stockCheck = Store.validateCartAgainstStock();
        if (!stockCheck.valid && stockCheck.messages.length > 0) {
            alert("Stock has changed since your treasures were added:\n" + stockCheck.messages.join('\n'));
            this.updateCartUI();
            this.renderCheckoutSummary();
            const remainingCart = Store.getCart();
            if (remainingCart.length === 0) {
                this.closeCheckout();
                return;
            }
        }

        const name = document.getElementById('customer-name').value.trim();
        const email = document.getElementById('customer-email').value.trim();
        const phone = document.getElementById('customer-phone').value.trim();
        const address = document.getElementById('customer-address').value.trim();
        const city = document.getElementById('customer-city').value.trim();
        const state = document.getElementById('customer-state').value.trim();
        const pincode = document.getElementById('customer-pincode').value.trim();

        if (!name || !email || !phone || !address || !city || !state || !pincode) {
            alert("Please fill in all your contact & delivery details ♡");
            this.goToCheckoutAddress();
            return;
        }

        const cart = Store.getCart();
        if (cart.length === 0) {
            alert("Your cart is empty!");
            return;
        }

        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        let discount = 0;
        let couponCode = null;

        if (this.appliedCoupon) {
            const couponResult = Store.applyCoupon(this.appliedCoupon.code, subtotal);
            if (couponResult.valid) {
                discount = couponResult.discount;
                couponCode = this.appliedCoupon.code;
            }
        }

        const total = Math.max(0, subtotal - discount);
        const paymentRadio = document.querySelector('input[name="payment"]:checked');
        const paymentMethod = paymentRadio ? paymentRadio.value : "Cash on Delivery";

        const paymentNames = {
            "cod": "Cash on Delivery",
            "upi": "UPI",
            "card": "Credit/Debit Card (Demo)"
        };

        const orderBtn = document.querySelector('.place-order-button');
        const origBtnText = orderBtn ? orderBtn.textContent : "CONFIRM ORDER NOW ♡";

        const saveAddressCheck = document.getElementById('checkout-save-address-check');
        const saveAddressToProfile = saveAddressCheck ? saveAddressCheck.checked : true;

        try {
            if (orderBtn) {
                orderBtn.disabled = true;
                orderBtn.textContent = "CONFIRMING ORDER...";
            }

            const newOrder = await Store.placeOrder({
                customer: { name, email, phone },
                shipping: { address, city, state, pincode },
                items: cart,
                pricing: {
                    subtotal: subtotal,
                    delivery: 0,
                    discount: discount,
                    couponCode: couponCode,
                    total: total
                },
                paymentMethod: paymentNames[paymentMethod] || "Cash on Delivery",
                saveAddressToProfile: saveAddressToProfile,
                addressLabel: 'Home'
            });

            // Remember order ID for instant tracking
            if (newOrder && newOrder.id) {
                localStorage.setItem('dd_last_order_id', newOrder.id);
            }

            // Clear cart & applied coupon only after confirmed success
            Store.clearCart();
            this.appliedCoupon = null;
            localStorage.removeItem(STORAGE_KEYS.APPLIED_COUPON);

            // Re-render products to reflect immediate stock deduction & out of stock tags
            this.renderProducts();
            this.updateCartUI();

            // Close checkout and show success
            this.closeCheckout();

            document.getElementById('order-number-tag').textContent = `ORDER #${newOrder.id}`;
            document.getElementById('order-success').classList.add('active');
        } catch (orderErr) {
            console.error("❌ Order confirmation error:", orderErr);
            alert("Order could not be confirmed: " + (orderErr.message || "Please check stock and try again."));
            if (Store.fetchProductsFromSupabase) {
                Store.fetchProductsFromSupabase();
            }
            this.renderProducts();
            this.updateCartUI();
            this.renderCheckoutSummary();
        } finally {
            if (orderBtn) {
                orderBtn.disabled = false;
                orderBtn.textContent = origBtnText;
            }
        }
    },

    closeSuccess() {
        document.getElementById('order-success').classList.remove('active');
    },

    // ==================== MY ORDERS & ORDER TRACKING ====================
    openMyOrders(orderId = null) {
        this.closeSuccess();
        this.closeCustomerAccount();
        this.closeMobileNav();
        const trackingModal = document.getElementById('order-tracking-modal');
        if (!trackingModal) return;

        const session = Store.getCustomerSession();
        const input = document.getElementById('tracking-search-input');
        const modalTitle = document.getElementById('my-orders-modal-title');
        if (modalTitle) modalTitle.textContent = "My Orders & Tracking";

        if (orderId) {
            if (input) input.value = orderId;
            this.lookupOrder(orderId);
        } else if (session && session.isLoggedIn && session.user && session.user.email) {
            if (input) input.value = '';
            this.renderCustomerOrdersList(session.user.email);
        } else {
            const lastId = localStorage.getItem('dd_last_order_id');
            if (lastId) {
                if (input) input.value = lastId;
                this.lookupOrder(lastId);
            } else {
                if (input) input.value = '';
                this.renderEmptyOrdersView();
            }
        }

        trackingModal.classList.add('active');
    },

    closeMyOrders() {
        const trackingModal = document.getElementById('order-tracking-modal');
        if (trackingModal) trackingModal.classList.remove('active');
    },

    openTracking(orderId = null) {
        this.openMyOrders(orderId);
    },

    closeTracking() {
        this.closeMyOrders();
    },

    renderCustomerOrdersList(email) {
        const detailsContainer = document.getElementById('tracking-order-details');
        if (!detailsContainer) return;

        const orders = Store.getCustomerOrders(email);
        if (orders.length === 0) {
            detailsContainer.innerHTML = `
                <div style="text-align: center; padding: 35px 20px; color: var(--soft-brown);">
                    <div style="font-size: 32px; color: var(--coral); margin-bottom: 8px;">♡</div>
                    <h3 style="font-family: Georgia, serif; font-size: 17px; color: var(--teal); margin: 0 0 6px;">No Orders Yet</h3>
                    <p style="font-size: 13px; margin: 0 0 16px;">You haven't placed any boutique orders under <strong>${email}</strong> yet.</p>
                    <a href="#products" onclick="App.closeMyOrders();" class="btn-primary" style="display: inline-block; padding: 10px 24px; font-size: 11px;">
                        EXPLORE OUR TREASURES →
                    </a>
                </div>
            `;
            return;
        }

        detailsContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 16px;">
                ${orders.map(order => this.renderMyOrderCard(order)).join('')}
            </div>
        `;
    },

    renderMyOrderCard(order) {
        const orderDate = new Date(order.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        const allStages = ["Order Placed", "Confirmed", "Packed", "Shipped", "Out for Delivery", "Delivered"];
        const currentIndex = allStages.indexOf(order.status);
        const total = order.pricing ? order.pricing.total : (order.total_amount || 0);

        return `
            <div class="account-order-card" style="background: #ffffff; border: 1px solid var(--border-light); border-radius: var(--radius-sm); padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--border-light); padding-bottom: 10px; margin-bottom: 12px; flex-wrap: wrap; gap: 6px;">
                    <div>
                        <span style="font-family: Georgia, serif; font-size: 15px; font-weight: bold; color: var(--teal);">Order #${order.id}</span>
                        <span style="font-size: 11.5px; color: var(--soft-brown); margin-left: 8px;">• ${orderDate}</span>
                    </div>
                    <span class="status-badge status-${(order.status || 'placed').toLowerCase().replace(/\s+/g, '')}">${order.status}</span>
                </div>

                <!-- Items Breakdown with Hamper Details -->
                <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px;">
                    ${(order.items || []).map(item => {
                        const isHamper = !!item.isHamper || (item.hamperItems && item.hamperItems.length > 0) || (item.name && item.name.toLowerCase().includes('hamper'));
                        const customNote = item.customMessage || '';
                        const hamperContents = item.hamperItems || [];

                        return `
                            <div style="padding: 8px 10px; background: var(--cream); border-radius: 6px;">
                                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                                    <strong style="font-size: 13px; color: var(--brown);">${item.name} × ${item.quantity}</strong>
                                    <span style="font-size: 12.5px; font-weight: 600; color: var(--teal);">₹${item.price * item.quantity}</span>
                                </div>
                                ${isHamper ? `
                                    <div style="margin-top: 6px; padding: 6px 8px; background: rgba(255,255,255,0.7); border-radius: 4px; border-left: 3px solid var(--terracotta);">
                                        <span class="hamper-tag-badge" style="font-size: 9.5px; padding: 2px 6px;">🎀 CUSTOMIZED HAMPER</span>
                                        ${customNote ? `<div style="font-size: 11px; font-style: italic; color: var(--terracotta); margin-top: 4px;">💌 Note: "${customNote}"</div>` : ''}
                                        ${hamperContents.length > 0 ? `
                                            <div style="font-size: 11px; color: var(--soft-brown); margin-top: 3px;">
                                                <strong>Includes:</strong> ${hamperContents.map(h => `${h.name} (×${h.quantity || 1})`).join(', ')}
                                            </div>
                                        ` : ''}
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--border-light); padding-top: 10px; flex-wrap: wrap; gap: 8px;">
                    <div style="font-size: 12px; color: var(--soft-brown);">
                        Total: <strong style="font-size: 14px; color: var(--teal);">₹${total}</strong> • ${order.paymentMethod || 'Cash on Delivery'}
                    </div>
                    <button class="btn-primary" onclick="App.toggleOrderTimeline('${order.id}')" style="padding: 6px 14px; font-size: 10.5px; background: var(--teal);">
                        🚚 Track Delivery Status ▾
                    </button>
                </div>

                <!-- Collapsible 6-Stage Tracking Timeline -->
                <div id="order-timeline-${order.id}" class="order-inline-timeline" style="display: none; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--border-light);">
                    <div class="tracking-timeline" style="margin-top: 8px;">
                        ${allStages.map((stage, idx) => {
                            const isCompleted = idx < currentIndex;
                            const isCurrent = idx === currentIndex;
                            const stageHistory = (order.statusHistory || []).find(h => h.status === stage);
                            const note = stageHistory ? stageHistory.note : (isCompleted ? "Completed" : "Pending");
                            const time = stageHistory ? stageHistory.time : "";

                            return `
                                <div class="timeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}">
                                    <div class="timeline-node">${isCompleted ? '✓' : idx + 1}</div>
                                    <div class="timeline-step-info">
                                        <h4>${stage}</h4>
                                        <p>${note} ${time ? `• <span style="opacity:0.7;">${time}</span>` : ''}</p>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <div style="text-align: left; background: var(--cream); padding: 10px 12px; border-radius: 4px; margin-top: 12px; font-size: 11px; color: var(--soft-brown);">
                        <strong>Delivery Address:</strong> ${order.customer?.name || 'Valued Customer'} | ${order.customer?.phone || '—'} | ${order.shipping?.address || ''}, ${order.shipping?.city || ''} ${order.shipping?.pincode ? `- ${order.shipping.pincode}` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    toggleOrderTimeline(orderId) {
        const el = document.getElementById(`order-timeline-${orderId}`);
        if (el) {
            el.style.display = el.style.display === 'none' ? 'block' : 'none';
        }
    },

    lookupOrder(orderIdOrPhone) {
        const cleanTerm = (orderIdOrPhone || '').trim();
        const detailsContainer = document.getElementById('tracking-order-details');
        if (!detailsContainer) return;

        if (!cleanTerm) {
            const session = Store.getCustomerSession();
            if (session && session.isLoggedIn && session.user && session.user.email) {
                this.renderCustomerOrdersList(session.user.email);
            } else {
                this.renderEmptyOrdersView();
            }
            return;
        }

        let order = Store.getOrderById(cleanTerm);
        if (!order) {
            const matches = Store.getOrdersByCustomer(cleanTerm);
            if (matches.length > 0) order = matches[0];
        }

        if (!order) {
            detailsContainer.innerHTML = `
                <div style="text-align: center; padding: 30px 16px; color: var(--soft-brown);">
                    <p style="font-size: 26px; color: var(--coral);">♡</p>
                    <p style="font-family: Arial, sans-serif; font-size: 13px; margin-top: 8px;">No order found matching "<strong>${cleanTerm}</strong>".</p>
                    <p style="font-size: 11.5px; opacity: 0.8;">Please double-check your Order ID or phone number.</p>
                </div>
            `;
            return;
        }

        const session = Store.getCustomerSession();
        const showBackBtn = session && session.isLoggedIn && session.user;

        detailsContainer.innerHTML = `
            ${showBackBtn ? `
                <button type="button" onclick="App.openMyOrders()" style="background: none; border: none; color: var(--teal); font-size: 12px; font-weight: 600; cursor: pointer; margin-bottom: 12px; padding: 0;">
                    ← Back to all my orders
                </button>
            ` : ''}
            ${this.renderMyOrderCard(order)}
        `;
        const timeline = document.getElementById(`order-timeline-${order.id}`);
        if (timeline) timeline.style.display = 'block';
    },

    renderEmptyOrdersView() {
        const detailsContainer = document.getElementById('tracking-order-details');
        if (!detailsContainer) return;

        detailsContainer.innerHTML = `
            <div style="text-align: center; padding: 30px 16px; color: var(--soft-brown);">
                <div style="font-size: 30px; color: var(--teal); margin-bottom: 10px;">📦</div>
                <h3 style="font-family: Georgia, serif; font-size: 16px; color: var(--brown); margin-bottom: 6px;">Track Your Boutique Parcels</h3>
                <p style="font-size: 12px; line-height: 1.5; margin-bottom: 16px;">
                    Enter your Order ID (e.g. <em>DD-ORD-15</em>) or Phone number in the search bar above to view live progress.
                </p>
                <button type="button" class="btn-primary" onclick="App.closeMyOrders(); App.openAuthOrAccount();" style="padding: 8px 18px; font-size: 11px;">
                    SIGN IN TO VIEW MY ORDERS ♡
                </button>
            </div>
        `;
    },

    refreshTrackingIfOpen(orderId) {
        const trackingModal = document.getElementById('order-tracking-modal');
        if (trackingModal && trackingModal.classList.contains('active')) {
            const input = document.getElementById('tracking-search-input');
            if (input && input.value) {
                this.lookupOrder(input.value);
            } else {
                this.openMyOrders();
            }
        }
    },

    // ==================== MOBILE DRAWER ====================
    toggleMobileNav() {
        const drawer = document.getElementById('mobile-nav-drawer');
        const overlay = document.getElementById('mobile-drawer-overlay');
        if (drawer && overlay) {
            drawer.classList.toggle('active');
            overlay.classList.toggle('active');
        }
    },

    closeMobileNav() {
        const drawer = document.getElementById('mobile-nav-drawer');
        const overlay = document.getElementById('mobile-drawer-overlay');
        if (drawer && overlay) {
            drawer.classList.remove('active');
            overlay.classList.remove('active');
        }
    },

    // ==================== CUSTOMER AUTH & ACCOUNT ====================
    openAuthOrAccount() {
        const session = Store.getCustomerSession();
        if (session && session.isLoggedIn) {
            this.openCustomerAccount();
        } else {
            this.pendingPurchaseAction = null;
            this.openAuthModal('login', null);
        }
    },

    openAuthModal(initialTab = 'login', purchasePrompt = null) {
        const modal = document.getElementById('customer-auth-modal');
        if (!modal) return;
        this.switchAuthTab(initialTab);
        this.clearAuthFeedback();

        const noticeEl = document.getElementById('auth-purchase-notice');
        const noticeText = document.getElementById('auth-purchase-notice-text');
        if (noticeEl) {
            if (purchasePrompt) {
                if (noticeText) noticeText.textContent = purchasePrompt;
                noticeEl.style.display = 'flex';
            } else {
                noticeEl.style.display = 'none';
            }
        }

        modal.classList.add('active');
    },

    closeAuthModal() {
        const modal = document.getElementById('customer-auth-modal');
        if (modal) modal.classList.remove('active');
        this.clearAuthFeedback();
        const noticeEl = document.getElementById('auth-purchase-notice');
        if (noticeEl) noticeEl.style.display = 'none';
    },

    prefillCheckoutDetails(user) {
        if (!user) return;
        const nameInput = document.getElementById('customer-name');
        const emailInput = document.getElementById('customer-email');
        if (nameInput && !nameInput.value && user.name) nameInput.value = user.name;
        if (emailInput && !emailInput.value && user.email) emailInput.value = user.email;

        const savedAddr = localStorage.getItem(`dd_addr_${user.email}`);
        if (savedAddr) {
            try {
                const parsed = JSON.parse(savedAddr);
                const street = document.getElementById('customer-address');
                const city = document.getElementById('customer-city');
                const state = document.getElementById('customer-state');
                const pincode = document.getElementById('customer-pincode');
                if (street && !street.value && parsed.address) street.value = parsed.address;
                if (city && !city.value && parsed.city) city.value = parsed.city;
                if (state && !state.value && parsed.state) state.value = parsed.state;
                if (pincode && !pincode.value && parsed.pincode) pincode.value = parsed.pincode;
            } catch (e) {}
        }
    },

    switchAuthTab(tab) {
        const loginBtn = document.getElementById('tab-btn-login');
        const regBtn = document.getElementById('tab-btn-register');
        const loginForm = document.getElementById('customer-login-form');
        const regForm = document.getElementById('customer-register-form');
        const title = document.getElementById('auth-title');

        this.clearAuthFeedback();

        if (tab === 'login') {
            if (loginBtn) loginBtn.classList.add('active');
            if (regBtn) regBtn.classList.remove('active');
            if (loginForm) loginForm.style.display = 'flex';
            if (regForm) regForm.style.display = 'none';
            if (title) title.textContent = 'Dear Draupadi';
        } else {
            if (regBtn) regBtn.classList.add('active');
            if (loginBtn) loginBtn.classList.remove('active');
            if (regForm) regForm.style.display = 'flex';
            if (loginForm) loginForm.style.display = 'none';
            if (title) title.textContent = 'Create Account';
        }
    },

    showAuthFeedback(message, type = 'error') {
        const fb = document.getElementById('auth-feedback');
        if (fb) {
            fb.textContent = message;
            fb.className = `auth-feedback ${type}`;
            fb.style.display = 'block';
        }
    },

    clearAuthFeedback() {
        const fb = document.getElementById('auth-feedback');
        if (fb) {
            fb.textContent = '';
            fb.style.display = 'none';
        }
    },

    togglePasswordVisibility(inputId, btn) {
        const input = document.getElementById(inputId);
        if (!input) return;
        if (input.type === 'password') {
            input.type = 'text';
            btn.textContent = '🙈';
        } else {
            input.type = 'password';
            btn.textContent = '👁';
        }
    },

    async handleCustomerLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const submitBtn = document.getElementById('login-submit-btn');

        if (submitBtn) submitBtn.disabled = true;
        this.clearAuthFeedback();

        const res = await Store.customerLogin(email, password);
        if (submitBtn) submitBtn.disabled = false;

        if (res.success) {
            this.closeAuthModal();
            this.showToast(`Welcome back, ${res.user.name} ♡`);
            this.updateAccountNavUI();
            this.prefillCheckoutDetails(res.user);

            // Amazon/Flipkart purchase action resumption
            if (this.pendingPurchaseAction) {
                const action = this.pendingPurchaseAction;
                this.pendingPurchaseAction = null;
                if (action.type === 'buyNow' && action.product) {
                    Store.addToCart(action.product.id, action.quantity || 1);
                    this.closeProductModal();
                    this.openCheckout();
                } else if (action.type === 'checkout') {
                    this.openCheckout();
                } else if (action.type === 'placeOrder') {
                    this.placeOrder();
                }
            }
        } else {
            this.showAuthFeedback(res.message || "Invalid credentials. Please try again.", 'error');
        }
    },

    async handleCustomerRegister(e) {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const submitBtn = document.getElementById('register-submit-btn');

        if (password !== confirmPassword) {
            this.showAuthFeedback("Passwords do not match. Please verify and try again.", 'error');
            return;
        }

        if (submitBtn) submitBtn.disabled = true;
        this.clearAuthFeedback();

        const res = await Store.customerRegister(name, email, password);
        if (submitBtn) submitBtn.disabled = false;

        if (res.success) {
            this.closeAuthModal();
            this.showToast(`Welcome to Dear Draupadi, ${res.user.name} ♡`);
            this.updateAccountNavUI();
            this.prefillCheckoutDetails(res.user);

            // Amazon/Flipkart purchase action resumption
            if (this.pendingPurchaseAction) {
                const action = this.pendingPurchaseAction;
                this.pendingPurchaseAction = null;
                if (action.type === 'buyNow' && action.product) {
                    Store.addToCart(action.product.id, action.quantity || 1);
                    this.closeProductModal();
                    this.openCheckout();
                } else if (action.type === 'checkout') {
                    this.openCheckout();
                } else if (action.type === 'placeOrder') {
                    this.placeOrder();
                }
            }
        } else {
            this.showAuthFeedback(res.message || "Could not complete registration.", 'error');
        }
    },

    handleForgotPassword() {
        const email = document.getElementById('login-email')?.value || '';
        if (!email) {
            this.showAuthFeedback("Please enter your email address above to receive a password reset link.", 'error');
            return;
        }
        if (window.supabaseClient && window.supabaseClient.auth &&
            window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url && !window.SUPABASE_CONFIG.url.includes('placeholder')) {
            window.supabaseClient.auth.resetPasswordForEmail(email);
            this.showAuthFeedback("Password reset link sent to your email. Please check your inbox.", 'success');
        } else {
            this.showAuthFeedback(`Password reset requested for ${email}. Backend connection ready for Supabase Auth.`, 'success');
        }
    },

    handleCustomerLogout() {
        if (confirm("Are you sure you want to sign out of your boutique account?")) {
            Store.customerLogout();
            this.closeCustomerAccount();
            this.updateAccountNavUI();
            this.showToast("Signed out successfully ♡");
        }
    },

    openCustomerAccount() {
        const session = Store.getCustomerSession();
        if (!session || !session.isLoggedIn) {
            this.openAuthModal('login');
            return;
        }
        this.renderCustomerAccount();
        const modal = document.getElementById('customer-account-modal');
        if (modal) modal.classList.add('active');
    },

    closeCustomerAccount() {
        const modal = document.getElementById('customer-account-modal');
        if (modal) modal.classList.remove('active');
    },

    switchAccountTab(tabName) {
        document.querySelectorAll('.account-nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        document.querySelectorAll('.account-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === `account-pane-${tabName}`);
        });

        if (tabName === 'address') {
            this.renderCustomerAddresses();
        } else if (tabName === 'orders') {
            this.renderCustomerAccount();
        }
    },

    renderCustomerAccount() {
        const session = Store.getCustomerSession();
        if (!session || !session.isLoggedIn) return;

        const user = session.user;
        const nameEl = document.getElementById('account-display-name');
        const emailEl = document.getElementById('account-display-email');
        const avatarEl = document.getElementById('account-avatar-char');
        const profName = document.getElementById('profile-name-val');
        const profEmail = document.getElementById('profile-email-val');
        const profSince = document.getElementById('profile-since-val');

        if (nameEl) nameEl.textContent = `${user.name} ♡`;
        if (emailEl) emailEl.textContent = user.email;
        if (avatarEl) avatarEl.textContent = (user.name ? user.name.charAt(0) : 'D').toUpperCase();

        if (profName) profName.textContent = user.name;
        if (profEmail) profEmail.textContent = user.email;
        if (profSince) {
            const date = user.createdAt ? new Date(user.createdAt) : new Date();
            profSince.textContent = date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
        }

        // Render customer orders from real stored orders
        const ordersContainer = document.getElementById('account-orders-list');
        if (ordersContainer) {
            const orders = Store.getCustomerOrders(user.email);
            if (orders.length === 0) {
                ordersContainer.innerHTML = `
                    <div class="account-empty-state">
                        <span class="empty-icon">♡</span>
                        <p>No orders placed yet.</p>
                        <p style="font-size: 13px; margin-top: 6px;">Your lovely treasures will appear here once ordered ♡</p>
                        <a href="#products" onclick="App.closeCustomerAccount();" class="btn-primary" style="display: inline-block; margin-top: 18px; padding: 10px 22px; font-size: 11px;">
                            EXPLORE TREASURES →
                        </a>
                    </div>
                `;
            } else {
                ordersContainer.innerHTML = orders.map(o => {
                    const orderDate = new Date(o.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                    const itemsSummary = (o.items || []).map(i => `${i.name} (×${i.quantity})`).join(', ');
                    const total = o.pricing ? o.pricing.total : (o.total_amount || 0);

                    return `
                        <div class="account-order-card">
                            <div class="account-order-header">
                                <div>
                                    <span class="account-order-id">#${o.id}</span>
                                    <span class="account-order-date">• Placed on ${orderDate}</span>
                                </div>
                                <span class="status-badge status-${(o.status || 'placed').toLowerCase().replace(/\s+/g, '')}">${o.status}</span>
                            </div>
                            <div class="account-order-items">
                                ${itemsSummary}
                            </div>
                            <div class="account-order-footer">
                                <div>Total: <strong>₹${total}</strong> • ${o.paymentMethod || 'Cash on Delivery'}</div>
                                <button class="btn-icon" onclick="App.closeCustomerAccount(); App.openMyOrders('${o.id}');" style="color: var(--teal); text-decoration: underline; background: none; border: none; font-size: 11px; cursor: pointer;">
                                    Track Journey →
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }

        // Render saved multiple addresses
        this.renderCustomerAddresses();
    },

    // ==================== MULTIPLE ADDRESSES MANAGEMENT ====================
    renderCustomerAddresses() {
        const session = Store.getCustomerSession();
        const listEl = document.getElementById('account-addresses-list');
        if (!listEl) return;

        if (!session || !session.isLoggedIn || !session.user) {
            listEl.innerHTML = `
                <p style="font-size: 12px; color: var(--soft-brown); text-align: center; padding: 20px;">
                    Please sign in to view and manage your saved addresses ♡
                </p>
            `;
            return;
        }

        const addresses = Store.getCustomerAddresses(session.user.email);
        if (addresses.length === 0) {
            listEl.innerHTML = `
                <div style="text-align: center; padding: 24px 16px; background: var(--cream); border-radius: var(--radius-sm); border: 1px dashed var(--border-light);">
                    <div style="font-size: 24px; color: var(--teal); margin-bottom: 6px;">📍</div>
                    <p style="font-size: 12.5px; color: var(--brown); margin: 0 0 4px; font-weight: 600;">No Saved Addresses Yet</p>
                    <p style="font-size: 11.5px; color: var(--soft-brown); margin: 0 0 12px;">Add your home, office, or gift delivery address for fast 1-click checkout ♡</p>
                    <button type="button" class="btn-primary" onclick="App.openAddAddressForm()" style="padding: 6px 14px; font-size: 10px;">
                        + ADD FIRST ADDRESS
                    </button>
                </div>
            `;
            return;
        }

        listEl.innerHTML = addresses.map(addr => `
            <div class="saved-address-card ${addr.isDefault ? 'is-default' : ''}">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; flex-wrap: wrap; gap: 6px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="addr-chip-label">${addr.label || 'Home'}</span>
                        ${addr.isDefault ? '<span class="addr-chip-default">DEFAULT</span>' : ''}
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        ${!addr.isDefault ? `
                            <button type="button" onclick="App.handleSetDefaultAddress('${addr.id}')" style="font-size: 11px; color: var(--teal); background:none; border:none; cursor:pointer; text-decoration: underline;">
                                Set Default
                            </button>
                        ` : ''}
                        <button type="button" onclick="App.openEditAddressForm('${addr.id}')" style="font-size: 11px; color: var(--brown); background:none; border:none; cursor:pointer;">
                            ✏️ Edit
                        </button>
                        <button type="button" onclick="App.handleDeleteAddress('${addr.id}')" style="font-size: 11px; color: var(--terracotta); background:none; border:none; cursor:pointer;">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
                <div style="font-size: 13px; font-weight: 600; color: var(--brown); margin-bottom: 3px;">
                    ${addr.name || session.user.name || 'Valued Customer'} ${addr.phone ? `• <span style="font-weight: 400; color: var(--soft-brown);">${addr.phone}</span>` : ''}
                </div>
                <div style="font-size: 12px; color: var(--soft-brown); line-height: 1.45;">
                    ${addr.address}<br>
                    ${addr.city}, ${addr.state} - <strong>${addr.pincode}</strong>
                </div>
            </div>
        `).join('');
    },

    openAddAddressForm(addr = null) {
        const formBox = document.getElementById('account-address-form-box');
        if (!formBox) return;

        const session = Store.getCustomerSession();
        const user = session ? session.user : {};

        const titleEl = document.getElementById('address-form-title');
        const idInput = document.getElementById('account-address-id');
        const labelSelect = document.getElementById('account-address-label');
        const nameInput = document.getElementById('account-address-name');
        const addrInput = document.getElementById('account-address-input');
        const cityInput = document.getElementById('account-city-input');
        const stateInput = document.getElementById('account-state-input');
        const pinInput = document.getElementById('account-pincode-input');
        const defCheck = document.getElementById('account-address-default');

        if (titleEl) titleEl.textContent = addr ? "Edit Delivery Address" : "Add New Delivery Address";
        if (idInput) idInput.value = addr ? addr.id : '';
        if (labelSelect) labelSelect.value = addr ? (addr.label || 'Home') : 'Home';
        if (nameInput) nameInput.value = addr ? (addr.name || '') : (user.name || '');
        if (addrInput) addrInput.value = addr ? (addr.address || '') : '';
        if (cityInput) cityInput.value = addr ? (addr.city || '') : '';
        if (stateInput) stateInput.value = addr ? (addr.state || '') : '';
        if (pinInput) pinInput.value = addr ? (addr.pincode || '') : '';
        if (defCheck) defCheck.checked = addr ? !!addr.isDefault : false;

        formBox.style.display = 'block';
        formBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },

    openEditAddressForm(addrId) {
        const session = Store.getCustomerSession();
        if (!session || !session.user) return;
        const addresses = Store.getCustomerAddresses(session.user.email);
        const addr = addresses.find(a => a.id === addrId);
        if (addr) {
            this.openAddAddressForm(addr);
        }
    },

    closeAddressForm() {
        const formBox = document.getElementById('account-address-form-box');
        if (formBox) {
            formBox.style.display = 'none';
            const form = document.getElementById('saved-address-form');
            if (form) form.reset();
        }
    },

    async handleSaveAddress(e) {
        if (e && e.preventDefault) e.preventDefault();
        const session = Store.getCustomerSession();
        if (!session || !session.user) {
            this.showToast("Please sign in first ♡");
            return;
        }

        const id = document.getElementById('account-address-id')?.value || null;
        const label = document.getElementById('account-address-label')?.value || 'Home';
        const name = document.getElementById('account-address-name')?.value || session.user.name;
        const address = document.getElementById('account-address-input')?.value || '';
        const city = document.getElementById('account-city-input')?.value || '';
        const state = document.getElementById('account-state-input')?.value || '';
        const pincode = document.getElementById('account-pincode-input')?.value || '';
        const isDefault = document.getElementById('account-address-default')?.checked === true;

        if (!address || !city || !state || !pincode) {
            alert("Please fill in all address details ♡");
            return;
        }

        await Store.saveCustomerAddress(session.user.email, {
            id,
            label,
            name,
            phone: session.user.phone || '',
            address,
            city,
            state,
            pincode,
            isDefault
        });

        this.closeAddressForm();
        this.renderCustomerAddresses();
        this.showToast("Address saved with love ♡");
    },

    async handleDeleteAddress(addrId) {
        const session = Store.getCustomerSession();
        if (!session || !session.user) return;

        if (confirm("Are you sure you want to remove this delivery address?")) {
            await Store.deleteCustomerAddress(session.user.email, addrId);
            this.renderCustomerAddresses();
            this.showToast("Address removed ♡");
        }
    },

    async handleSetDefaultAddress(addrId) {
        const session = Store.getCustomerSession();
        if (!session || !session.user) return;

        await Store.setDefaultCustomerAddress(session.user.email, addrId);
        this.renderCustomerAddresses();
        this.showToast("Default address updated ♡");
    },

    updateAccountNavUI() {
        const session = Store.getCustomerSession();
        const navAccountBtn = document.getElementById('nav-account-btn');
        const announcementLink = document.getElementById('announcement-account-link');
        const mobileBadge = document.getElementById('mobile-account-badge');

        if (session && session.isLoggedIn && session.user) {
            const firstName = (session.user.name || 'Account').split(' ')[0];
            if (navAccountBtn) {
                navAccountBtn.innerHTML = `<span class="account-nav-icon">♡</span> <span class="account-nav-label">${firstName.toUpperCase()}</span>`;
                navAccountBtn.title = `${session.user.name} — My Account`;
            }
            if (announcementLink) {
                announcementLink.textContent = `HELLO, ${firstName.toUpperCase()} ♡`;
            }
            if (mobileBadge) {
                mobileBadge.textContent = firstName;
            }
        } else {
            if (navAccountBtn) {
                navAccountBtn.innerHTML = `<span class="account-nav-icon">👤</span> <span class="account-nav-label">ACCOUNT</span>`;
                navAccountBtn.title = "My Account / Sign In";
            }
            if (announcementLink) {
                announcementLink.textContent = "ACCOUNT / SIGN IN";
            }
            if (mobileBadge) {
                mobileBadge.textContent = "👤";
            }
        }
    },

    // ==================== CUSTOM HAMPER BUILDER ====================
    openHamperBuilder(budget = 700) {
        this.hamperBudget = Number(budget) || 700;
        this.hamperCategory = 'all';

        const modal = document.getElementById('hamper-builder-modal');
        if (!modal) return;

        // Set budget input value
        const budgetInput = document.getElementById('hamper-budget-input');
        if (budgetInput) budgetInput.value = this.hamperBudget;

        // Update active budget chips
        document.querySelectorAll('.budget-chip').forEach(chip => {
            const b = Number(chip.getAttribute('data-budget'));
            chip.classList.toggle('active', b === this.hamperBudget);
        });

        this.renderHamperCategoryFilters();
        this.renderHamperGrid();
        this.renderHamperSummary();

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    closeHamperBuilder() {
        const modal = document.getElementById('hamper-builder-modal');
        if (modal) modal.classList.remove('active');
        document.body.style.overflow = '';
    },

    setHamperBudget(amount) {
        this.hamperBudget = Number(amount) || 700;
        const budgetInput = document.getElementById('hamper-budget-input');
        if (budgetInput) budgetInput.value = this.hamperBudget;

        document.querySelectorAll('.budget-chip').forEach(chip => {
            const b = Number(chip.getAttribute('data-budget'));
            chip.classList.toggle('active', b === this.hamperBudget);
        });

        this.renderHamperSummary();
        this.renderHamperGrid();
    },

    onCustomBudgetInput(e) {
        const val = Number(e.target.value) || 0;
        this.hamperBudget = val;

        document.querySelectorAll('.budget-chip').forEach(chip => {
            const b = Number(chip.getAttribute('data-budget'));
            chip.classList.toggle('active', b === val);
        });

        this.renderHamperSummary();
        this.renderHamperGrid();
    },

    filterHamperCategory(category, btnEl) {
        this.hamperCategory = (category || 'all').toLowerCase();
        document.querySelectorAll('.hamper-cat-chip').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-category') === this.hamperCategory);
        });
        this.renderHamperGrid();
    },

    renderHamperCategoryFilters() {
        const container = document.getElementById('hamper-category-filters');
        if (!container) return;

        const categories = Store.getCategories().filter(c => c.toLowerCase() !== 'hampers');
        container.innerHTML = `
            <button type="button" class="hamper-cat-chip ${this.hamperCategory === 'all' ? 'active' : ''}" data-category="all" onclick="App.filterHamperCategory('all', this)">
                ALL TREASURES
            </button>
            ${categories.map(c => `
                <button type="button" class="hamper-cat-chip ${this.hamperCategory === c.toLowerCase() ? 'active' : ''}" data-category="${c.toLowerCase()}" onclick="App.filterHamperCategory('${c.toLowerCase()}', this)">
                    ${c.toUpperCase()}
                </button>
            `).join('')}
        `;
    },

    renderHamperGrid() {
        const grid = document.getElementById('hamper-products-grid');
        if (!grid) return;

        let products = Store.getProducts().filter(p => p.category.toLowerCase() !== 'hampers');

        if (this.hamperCategory !== 'all') {
            products = products.filter(p => p.category.toLowerCase() === this.hamperCategory);
        }

        const currentTotal = this.hamperItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const remainingBudget = this.hamperBudget - currentTotal;

        if (products.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px 10px; color: var(--soft-brown);">
                    <p style="font-size: 24px; color: var(--terracotta); margin-bottom: 8px;">❀</p>
                    <p style="font-size: 13px;">No items found in this category.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = products.map(product => {
            const inHamperItem = this.hamperItems.find(i => String(i.productId) === String(product.id));
            const inHamperQty = inHamperItem ? inHamperItem.quantity : 0;
            const availableStock = Math.max(0, (product.stock || 0) - inHamperQty);
            const isOutOfStock = (product.stock || 0) <= 0;
            const maxStockReached = availableStock <= 0;

            const diffWithItem = product.price - remainingBudget;
            let budgetHintHtml = '';
            if (remainingBudget >= product.price) {
                budgetHintHtml = `<span class="hamper-budget-hint fits">✓ Fits budget</span>`;
            } else {
                budgetHintHtml = `<span class="hamper-budget-hint over">+₹${diffWithItem > 0 ? diffWithItem : product.price} over</span>`;
            }

            const imageSrc = product.images && product.images.length ? product.images[0] : "";

            return `
                <div class="hamper-prod-card ${inHamperQty > 0 ? 'selected' : ''}">
                    <div class="hamper-prod-thumb">
                        ${imageSrc 
                            ? `<img src="${imageSrc}" alt="${product.name}" loading="lazy">` 
                            : `<span>${product.symbol || '🌸'}</span>`
                        }
                        ${inHamperQty > 0 ? `<span class="in-hamper-pill">${inHamperQty} in box</span>` : ''}
                    </div>
                    <div class="hamper-prod-details">
                        <div class="hamper-prod-meta">
                            <span class="hamper-prod-cat">${product.category}</span>
                            ${budgetHintHtml}
                        </div>
                        <h4 class="hamper-prod-title">${product.name}</h4>
                        <div class="hamper-prod-price-row">
                            <span class="hamper-prod-price">₹${product.price}</span>
                            <span class="hamper-prod-stock ${product.stock < 5 ? 'low' : ''}">
                                ${isOutOfStock ? 'Sold Out' : (product.stock < 5 ? `Only ${availableStock} left` : 'In Stock')}
                            </span>
                        </div>
                        <button type="button" 
                                class="btn-hamper-add ${inHamperQty > 0 ? 'added' : ''}" 
                                ${isOutOfStock || maxStockReached ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}
                                onclick="App.addHamperProduct('${product.id}')">
                            ${isOutOfStock ? 'SOLD OUT' : (maxStockReached ? 'MAX STOCK REACHED' : (inHamperQty > 0 ? '+ ADD ANOTHER' : '+ ADD TO HAMPER'))}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    addHamperProduct(productId) {
        const product = Store.getProductById(productId);
        if (!product) return;

        if ((product.stock || 0) <= 0) {
            this.showToast("Sorry, this treasure is out of stock ♡");
            return;
        }

        const existing = this.hamperItems.find(i => String(i.productId) === String(productId));
        if (existing) {
            if (existing.quantity >= (product.stock || 0)) {
                this.showToast(`Maximum available stock (${product.stock}) reached for this item`);
                return;
            }
            existing.quantity += 1;
        } else {
            this.hamperItems.push({
                productId: String(product.id),
                name: product.name,
                price: product.price,
                image: (product.images && product.images[0]) || '',
                symbol: product.symbol || '🌸',
                quantity: 1,
                maxStock: product.stock
            });
        }

        this.renderHamperSummary();
        this.renderHamperGrid();
        this.showToast(`Added ${product.name} to hamper 🎀`);
    },

    updateHamperItemQty(productId, delta) {
        const item = this.hamperItems.find(i => String(i.productId) === String(productId));
        if (!item) return;

        if (delta > 0) {
            const product = Store.getProductById(productId);
            const stock = product ? product.stock : item.maxStock;
            if (item.quantity >= stock) {
                this.showToast(`Maximum available stock (${stock}) reached`);
                return;
            }
            item.quantity += 1;
        } else if (delta < 0) {
            item.quantity -= 1;
            if (item.quantity <= 0) {
                this.hamperItems = this.hamperItems.filter(i => String(i.productId) !== String(productId));
            }
        }

        this.renderHamperSummary();
        this.renderHamperGrid();
    },

    removeHamperProduct(productId) {
        this.hamperItems = this.hamperItems.filter(i => String(i.productId) !== String(productId));
        this.renderHamperSummary();
        this.renderHamperGrid();
    },

    renderHamperSummary() {
        const totalCount = this.hamperItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalVal = this.hamperItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const diff = this.hamperBudget - totalVal;

        // Update Stats Bar
        const statBudget = document.getElementById('hamper-stat-budget');
        const statTotal = document.getElementById('hamper-stat-total');
        const statRemaining = document.getElementById('hamper-stat-remaining');
        const statRemainingLabel = document.getElementById('hamper-remaining-label');
        const statCount = document.getElementById('hamper-stat-count');
        const summaryCount = document.getElementById('hamper-summary-count');
        const finalTotalEl = document.getElementById('hamper-final-total-price');

        if (statBudget) statBudget.textContent = `₹${this.hamperBudget}`;
        if (statTotal) statTotal.textContent = `₹${totalVal}`;
        if (statCount) statCount.textContent = totalCount;
        if (summaryCount) summaryCount.textContent = totalCount;
        if (finalTotalEl) finalTotalEl.textContent = `₹${totalVal}`;

        // Progress bar
        const progressFill = document.getElementById('hamper-progress-fill');
        const overBudgetAlert = document.getElementById('hamper-overbudget-alert');
        const overBudgetAmount = document.getElementById('hamper-overbudget-amount');

        const pct = this.hamperBudget > 0 ? Math.min(100, Math.round((totalVal / this.hamperBudget) * 100)) : 0;
        if (progressFill) {
            progressFill.style.width = `${pct}%`;
            if (diff < 0) {
                progressFill.style.background = 'linear-gradient(90deg, var(--teal), #d97706, #c0392b)';
            } else {
                progressFill.style.background = 'linear-gradient(90deg, var(--dusty-rose), var(--teal))';
            }
        }

        if (diff >= 0) {
            if (statRemainingLabel) statRemainingLabel.textContent = "Remaining";
            if (statRemaining) {
                statRemaining.textContent = `₹${diff}`;
                statRemaining.style.color = "var(--terracotta)";
            }
            if (overBudgetAlert) overBudgetAlert.style.display = "none";
        } else {
            if (statRemainingLabel) statRemainingLabel.textContent = "Over Budget";
            if (statRemaining) {
                statRemaining.textContent = `+₹${Math.abs(diff)}`;
                statRemaining.style.color = "#c0392b";
            }
            if (overBudgetAlert) {
                overBudgetAlert.style.display = "flex";
                if (overBudgetAmount) overBudgetAmount.textContent = `₹${Math.abs(diff)}`;
            }
        }

        // Action buttons
        const addCartBtn = document.getElementById('btn-hamper-add-cart');
        const buyNowBtn = document.getElementById('btn-hamper-buy-now');
        const hasItems = totalCount > 0;
        if (addCartBtn) addCartBtn.disabled = !hasItems;
        if (buyNowBtn) buyNowBtn.disabled = !hasItems;

        // Render Selected Items List
        const listContainer = document.getElementById('hamper-selected-list');
        if (!listContainer) return;

        if (this.hamperItems.length === 0) {
            listContainer.innerHTML = `
                <div class="hamper-empty-notice">
                    <span style="font-size: 36px; display: block; margin-bottom: 8px;">🎀</span>
                    <strong>Your hamper is currently empty</strong>
                    <p style="font-size: 12px; color: var(--soft-brown); margin-top: 4px;">Choose from our handcrafted jewellery, blooms, and accessories on the left to build your bespoke box ♡</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = this.hamperItems.map(item => {
            const lineTotal = item.price * item.quantity;
            return `
                <div class="hamper-selected-item">
                    <div class="hamper-sel-thumb">
                        ${item.image ? `<img src="${item.image}" alt="${item.name}">` : `<span>${item.symbol || '🌸'}</span>`}
                    </div>
                    <div class="hamper-sel-info">
                        <h5>${item.name}</h5>
                        <div class="hamper-sel-price">₹${item.price} each</div>
                        <div class="hamper-sel-stepper">
                            <button type="button" onclick="App.updateHamperItemQty('${item.productId}', -1)">−</button>
                            <span class="hamper-sel-qty">${item.quantity}</span>
                            <button type="button" onclick="App.updateHamperItemQty('${item.productId}', 1)">+</button>
                            <button type="button" class="hamper-sel-remove" onclick="App.removeHamperProduct('${item.productId}')" title="Remove ${item.name} from hamper">✕ Remove</button>
                        </div>
                    </div>
                    <div class="hamper-sel-total">
                        ₹${lineTotal}
                    </div>
                </div>
            `;
        }).join('');
    },

    addCustomHamperToCart() {
        if (this.hamperItems.length === 0) {
            this.showToast("Please add at least one treasure to your hamper ♡");
            return;
        }

        const nameInput = document.getElementById('custom-hamper-name');
        const noteInput = document.getElementById('custom-hamper-note');

        const customName = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : "Bespoke Keepsake Hamper";
        const customNote = (noteInput && noteInput.value.trim()) ? noteInput.value.trim() : "";
        const totalPrice = this.hamperItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        Store.addToCart(customName, 1, totalPrice, {
            isHamper: true,
            hamperItems: this.hamperItems.map(i => ({
                productId: i.productId,
                name: i.name,
                quantity: i.quantity,
                price: i.price,
                image: i.image,
                symbol: i.symbol
            })),
            customMessage: customNote
        });

        this.showToast("Bespoke Hamper added to cart! 🎀");
        this.closeHamperBuilder();
        this.openCart();
    },

    buyCustomHamperNow() {
        if (this.hamperItems.length === 0) {
            this.showToast("Please add at least one treasure to your hamper ♡");
            return;
        }

        this.addCustomHamperToCart();
        this.closeCart();
        this.openCheckout();
    },

    quickAddHamperPreset(presetId) {
        const preset = Store.getHamperPresetById(presetId);
        if (!preset) return;

        const componentItems = (preset.items || []).map(item => {
            const prod = Store.getProductById(item.productId);
            return {
                productId: item.productId,
                name: item.name || (prod ? prod.name : 'Artisan Piece'),
                quantity: item.quantity || 1,
                price: prod ? prod.price : Math.round(preset.price / (preset.items.length || 1)),
                image: (prod && prod.images && prod.images[0]) || preset.image,
                symbol: prod ? prod.symbol : '🎀'
            };
        });

        Store.addToCart(preset.name, 1, preset.price, {
            isHamper: true,
            hamperItems: componentItems,
            customMessage: "Curated Boutique Preset Box"
        });

        this.showToast(`Added ${preset.name} to cart 🎀`);
        this.openCart();
    },

    openHamperBuilderWithPreset(presetId) {
        const preset = Store.getHamperPresetById(presetId);
        if (!preset) {
            this.openHamperBuilder(700);
            return;
        }

        const targetBudget = preset.target_budget || preset.price || 700;
        this.hamperBudget = targetBudget;
        this.hamperItems = [];

        (preset.items || []).forEach(item => {
            const prod = Store.getProductById(item.productId);
            if (prod) {
                this.hamperItems.push({
                    productId: String(prod.id),
                    name: prod.name,
                    price: prod.price,
                    image: (prod.images && prod.images[0]) || '',
                    symbol: prod.symbol || '🌸',
                    quantity: item.quantity || 1,
                    maxStock: prod.stock
                });
            }
        });

        this.openHamperBuilder(targetBudget);

        const nameInput = document.getElementById('custom-hamper-name');
        if (nameInput) nameInput.value = preset.name;
    }
};

window.App = App;
