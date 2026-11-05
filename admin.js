/**
 * Dear Draupadi - Dedicated Admin Portal Script (admin.js)
 * Manages Admin Auth Guard, Dashboard Analytics, Product CRUD, Order Statuses, Customer Directory, Reviews, and Coupons.
 */

document.addEventListener('DOMContentLoaded', () => {
    AdminApp.init();
});

const AdminApp = {
    currentTab: 'overview',
    editingProductId: null,
    editingHamperId: null,
    modalImages: [],
    imagesPendingDelete: [],
    ordersPerPage: 20,
    currentOrderPage: 1,
    customersPerPage: 20,
    currentCustomerPage: 1,

    setOrderPage(page) {
        this.currentOrderPage = page;
        this.renderOrdersTab();
        document.getElementById('tab-orders')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    setCustomerPage(page) {
        this.currentCustomerPage = page;
        this.renderCustomersTab();
        document.getElementById('tab-customers')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    init() {
        this.checkAuth();
        this.bindEvents();

        // Initial cloud orders & products catalog sync
        if (typeof Store !== 'undefined') {
            if (Store.fetchOrdersFromSupabase) Store.fetchOrdersFromSupabase();
            if (Store.fetchProductsFromSupabase) Store.fetchProductsFromSupabase();
        }

        // Automatic periodic cloud synchronization (every 20 seconds)
        setInterval(() => {
            if (typeof Store !== 'undefined' && Store.isAdminAuthenticated()) {
                if (Store.fetchOrdersFromSupabase) Store.fetchOrdersFromSupabase();
                if (Store.fetchProductsFromSupabase) Store.fetchProductsFromSupabase();
            }
        }, 20000);

        // Cross-tab real-time synchronization
        window.addEventListener('storage', (e) => {
            if (e.key === 'dd_products_v2') {
                if (this.currentTab === 'products') this.renderProductsTab();
                if (this.currentTab === 'overview') this.renderOverviewTab();
            }
            if (e.key === 'dd_orders_v2') {
                if (this.currentTab === 'orders') this.renderOrdersTab();
                if (this.currentTab === 'overview') this.renderOverviewTab();
                if (this.currentTab === 'customers') this.renderCustomersTab();
                if (this.currentTab === 'analytics') this.renderAnalyticsTab();
            }
            if (e.key === 'dd_categories_v2' || e.key === 'dd_deleted_categories' || e.key === 'dd_category_colors') {
                if (this.currentTab === 'categories') this.renderCategoriesTab();
                this.updateCategoryFilterDropdown();
            }
        });

        // Listen for store events to keep admin reactive
        window.addEventListener('products:updated', () => {
            if (this.currentTab === 'products') this.renderProductsTab();
            if (this.currentTab === 'overview') this.renderOverviewTab();
        });
        window.addEventListener('orders:updated', () => {
            if (this.currentTab === 'orders') this.renderOrdersTab();
            if (this.currentTab === 'overview') this.renderOverviewTab();
            if (this.currentTab === 'customers') this.renderCustomersTab();
            if (this.currentTab === 'analytics') this.renderAnalyticsTab();
        });
        window.addEventListener('registrations:updated', () => {
            if (this.currentTab === 'analytics') this.renderAnalyticsTab();
        });
        window.addEventListener('reviews:updated', () => {
            if (this.currentTab === 'reviews') this.renderReviewsTab();
        });
        window.addEventListener('coupons:updated', () => {
            if (this.currentTab === 'coupons') this.renderCouponsTab();
        });
        window.addEventListener('categories:updated', () => {
            if (this.currentTab === 'categories') this.renderCategoriesTab();
            this.updateCategoryFilterDropdown();
        });
        window.addEventListener('hampers:updated', () => {
            if (this.currentTab === 'hampers') this.renderHampersTab();
        });
        window.addEventListener('store:reset', () => {
            this.renderCurrentTab();
            alert("Boutique store has been reset to default demo data ♡");
        });
    },

    bindEvents() {
        // Login form
        const loginForm = document.getElementById('admin-login-form');
        if (loginForm) {
            // Prevent browser native validation from blocking submission
            loginForm.noValidate = true;
            loginForm.setAttribute('novalidate', '');

            const loginBtn = loginForm.querySelector('button[type="submit"], .login-btn');
            if (loginBtn) {
                loginBtn.formNoValidate = true;
                loginBtn.setAttribute('formnovalidate', '');
            }

            const emailInput = document.getElementById('admin-email-input');
            const passwordInput = document.getElementById('admin-password-input');
            const clearLoginError = () => {
                const errorEl = document.getElementById('admin-login-error');
                if (errorEl) errorEl.style.display = 'none';
            };
            if (emailInput) emailInput.addEventListener('input', clearLoginError);
            if (passwordInput) passwordInput.addEventListener('input', clearLoginError);

            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Product search
        const productSearch = document.getElementById('admin-product-search');
        if (productSearch) {
            productSearch.addEventListener('input', () => this.renderProductsTab());
        }

        // Order search
        const orderSearch = document.getElementById('admin-order-search');
        if (orderSearch) {
            orderSearch.addEventListener('input', () => {
                this.currentOrderPage = 1;
                this.renderOrdersTab();
            });
        }

        // Order status filter
        const orderStatusFilter = document.getElementById('admin-order-status-filter');
        if (orderStatusFilter) {
            orderStatusFilter.addEventListener('change', () => {
                this.currentOrderPage = 1;
                this.renderOrdersTab();
            });
        }
    },

    // ==================== AUTH GUARD & SESSION ====================
    checkAuth() {
        const isAuth = Store.isAdminAuthenticated();
        const loginView = document.getElementById('admin-login-view');
        const appLayout = document.getElementById('admin-app-layout');

        if (isAuth) {
            if (loginView) loginView.style.display = 'none';
            if (appLayout) appLayout.classList.add('active');
            this.switchTab(this.currentTab);
        } else {
            if (loginView) loginView.style.display = 'flex';
            if (appLayout) appLayout.classList.remove('active');
        }
    },

    handleLogin() {
        const emailInput = document.getElementById('admin-email-input');
        const passwordInput = document.getElementById('admin-password-input');
        const errorEl = document.getElementById('admin-login-error');

        if (emailInput) emailInput.setCustomValidity('');
        if (passwordInput) passwordInput.setCustomValidity('');

        const email = emailInput ? emailInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';

        if (!email || !password) {
            if (errorEl) {
                errorEl.textContent = "Please fill out both email and password.";
                errorEl.style.display = 'block';
            }
            if (!email && emailInput) {
                emailInput.focus();
            } else if (!password && passwordInput) {
                passwordInput.focus();
            }
            return;
        }

        const result = Store.adminLogin(email, password);
        if (result.success) {
            if (errorEl) errorEl.style.display = 'none';
            this.checkAuth();
        } else {
            if (errorEl) {
                errorEl.textContent = result.message;
                errorEl.style.display = 'block';
            }
        }
    },

    fillDemoCredentials() {
        document.getElementById('admin-email-input').value = 'admin@deardraupadi.com';
        document.getElementById('admin-password-input').value = 'draupadi2026';
        this.handleLogin();
    },

    logout() {
        if (confirm("Are you sure you want to log out of Dear Draupadi Admin?")) {
            Store.adminLogout();
            this.checkAuth();
        }
    },

    // ==================== TAB NAVIGATION ====================
    switchTab(tabName) {
        this.currentTab = tabName;

        // Update nav links
        document.querySelectorAll('.nav-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update title
        const titles = {
            overview: "Boutique Dashboard Overview",
            analytics: "DWDM / OLAP Multi-Dimensional Analytics",
            products: "Product Catalog Management",
            orders: "Customer Orders & Fulfillment",
            customers: "Customer Directory",
            reviews: "Customer Reviews Moderation",
            categories: "Shop Collections & Categories",
            coupons: "Promotions & Coupon Codes",
            hampers: "Suggested & Preset Hampers",
            settings: "Store Settings & Preferences"
        };
        const titleEl = document.getElementById('admin-header-title-text');
        if (titleEl) titleEl.textContent = titles[tabName] || "Admin Portal";

        // Update pane
        document.querySelectorAll('.admin-tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });

        const activePane = document.getElementById(`tab-${tabName}`);
        if (activePane) {
            activePane.classList.add('active');
            if (['orders', 'overview', 'customers', 'analytics'].includes(tabName) && typeof Store !== 'undefined' && Store.fetchOrdersFromSupabase) {
                Store.fetchOrdersFromSupabase();
            }
            this.renderCurrentTab();
        }
    },

    renderCurrentTab() {
        switch (this.currentTab) {
            case 'overview': this.renderOverviewTab(); break;
            case 'analytics': this.renderAnalyticsTab(); break;
            case 'products': this.renderProductsTab(); break;
            case 'orders': this.renderOrdersTab(); break;
            case 'customers': this.renderCustomersTab(); break;
            case 'reviews': this.renderReviewsTab(); break;
            case 'categories': this.renderCategoriesTab(); break;
            case 'coupons': this.renderCouponsTab(); break;
            case 'hampers': this.renderHampersTab(); break;
        }
    },

    // ==================== 1. OVERVIEW TAB ====================
    renderOverviewTab() {
        const orders = Store.getOrders();
        const products = Store.getProducts();
        const customers = Store.getCustomers();

        const totalRevenue = orders.reduce((sum, o) => sum + (o.pricing ? o.pricing.total : 0), 0);
        const totalOrders = orders.length;
        const pendingOrders = orders.filter(o => o.status !== "Delivered" && o.status !== "Cancelled").length;
        const lowStockCount = products.filter(p => p.stock <= 5).length;

        const elRevenue = document.getElementById('kpi-total-revenue');
        if (elRevenue) elRevenue.textContent = `₹${totalRevenue.toLocaleString()}`;
        const elTotalOrders = document.getElementById('kpi-total-orders');
        if (elTotalOrders) elTotalOrders.textContent = totalOrders;
        const elPendingOrders = document.getElementById('kpi-pending-orders');
        if (elPendingOrders) elPendingOrders.textContent = pendingOrders;
        const elTotalProducts = document.getElementById('kpi-total-products');
        if (elTotalProducts) elTotalProducts.textContent = products.length;
        const elTotalCustomers = document.getElementById('kpi-total-customers');
        if (elTotalCustomers) elTotalCustomers.textContent = customers.length;
        const elLowStock = document.getElementById('kpi-low-stock');
        if (elLowStock) elLowStock.textContent = lowStockCount;

        // Render Recent Orders
        const recentOrdersContainer = document.getElementById('overview-recent-orders');
        if (recentOrdersContainer) {
            const recent = orders.slice(0, 5);
            recentOrdersContainer.innerHTML = recent.map(o => `
                <tr style="cursor: pointer;" onclick="AdminApp.viewOrderDetails('${o.id}')">
                    <td><strong>#${o.id}</strong></td>
                    <td>${o.customer?.name || 'Valued Customer'}</td>
                    <td>₹${o.pricing ? o.pricing.total : 0}</td>
                    <td><span class="status-badge status-${(o.status || '').toLowerCase().replace(/\s+/g, '')}">${o.status || 'Placed'}</span></td>
                    <td>${new Date(o.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td>
                </tr>
            `).join('');
        }

        // Render Bestsellers
        const bestsellersContainer = document.getElementById('overview-top-products');
        if (bestsellersContainer) {
            const top = products.slice(0, 4);
            bestsellersContainer.innerHTML = top.map(p => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--admin-border-light);">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 20px;">${p.symbol || '🌸'}</span>
                        <div>
                            <strong style="font-size: 13px; color: var(--admin-text); display: block;">${p.name}</strong>
                            <span style="font-size: 11px; color: var(--admin-muted);">${p.category} • ₹${p.price}</span>
                        </div>
                    </div>
                    <span class="status-badge status-${p.stock > 5 ? 'instock' : 'lowstock'}">${p.stock} in stock</span>
                </div>
            `).join('');
        }
    },

    // ==================== 2. PRODUCTS TAB ====================
    renderProductsTab() {
        const tableBody = document.getElementById('admin-products-table-body');
        if (!tableBody) return;

        const searchTerm = (document.getElementById('admin-product-search')?.value || '').toLowerCase().trim();
        const categoryFilter = document.getElementById('admin-product-category-filter')?.value || 'all';

        let products = Store.getProducts();

        if (searchTerm) {
            products = products.filter(p => p.name.toLowerCase().includes(searchTerm) || p.category.toLowerCase().includes(searchTerm));
        }

        if (categoryFilter !== 'all') {
            products = products.filter(p => p.category.toLowerCase() === categoryFilter.toLowerCase());
        }

        tableBody.innerHTML = products.map(product => {
            const imageSrc = product.images && product.images.length ? product.images[0] : "";
            const stockStatusClass = product.stock > 5 ? 'status-instock' : (product.stock > 0 ? 'status-lowstock' : 'status-outofstock');

            return `
                <tr>
                    <td>
                        <div class="product-row-item">
                            ${imageSrc 
                                ? `<img src="${imageSrc}" alt="${product.name}" class="product-thumb-sm">` 
                                : `<div class="product-thumb-sm">${product.symbol || '🌸'}</div>`
                            }
                            <div>
                                <strong style="color: var(--admin-text); font-size: 13px;">${product.name}</strong>
                                <span style="display: block; font-size: 11px; color: var(--admin-muted);">${product.id}</span>
                            </div>
                        </div>
                    </td>
                    <td><span class="status-badge" style="background: rgba(49, 93, 90, 0.08); color: var(--admin-teal);">${product.category}</span></td>
                    <td><strong>₹${product.price}</strong> ${product.originalPrice ? `<span style="text-decoration:line-through; font-size:10.5px; opacity:0.6;">₹${product.originalPrice}</span>` : ''}</td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span class="status-badge ${stockStatusClass}">${product.stock} pcs</span>
                            <button class="btn-icon" onclick="AdminApp.quickStockAdjust('${product.id}', -1)">−</button>
                            <button class="btn-icon" onclick="AdminApp.quickStockAdjust('${product.id}', 1)">+</button>
                        </div>
                    </td>
                    <td>
                        ${product.featured ? '<span class="status-badge status-confirmed">Featured</span>' : ''}
                        ${product.newArrival ? '<span class="status-badge status-placed">New</span>' : ''}
                        ${product.bestseller ? '<span class="status-badge status-packed">Bestseller</span>' : ''}
                    </td>
                    <td>
                        <div class="table-action-btns">
                            <button class="btn-icon" onclick="AdminApp.openEditProductModal('${product.id}')" title="Edit Product">✏️ Edit</button>
                            <button class="btn-icon btn-danger" onclick="AdminApp.deleteProduct('${product.id}')" title="Delete Product">🗑️</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Populate/update category dropdown filter
        this.updateCategoryFilterDropdown();
    },

    updateCategoryFilterDropdown() {
        const filterSelect = document.getElementById('admin-product-category-filter');
        if (filterSelect) {
            const currentVal = filterSelect.value || 'all';
            const categories = Store.getCategories();
            let optionsHtml = '<option value="all">All Categories</option>';
            categories.forEach(cat => {
                optionsHtml += `<option value="${cat}" ${cat === currentVal ? 'selected' : ''}>${cat}</option>`;
            });
            filterSelect.innerHTML = optionsHtml;
        }
    },

    quickStockAdjust(productId, delta) {
        const product = Store.getProductById(productId);
        if (product) {
            const newStock = Math.max(0, (parseInt(product.stock, 10) || 0) + delta);
            Store.updateStock(productId, newStock);
            this.renderProductsTab();
        }
    },

    openAddProductModal() {
        this.editingProductId = null;
        document.getElementById('product-modal-title').textContent = "Add New Boutique Product";
        document.getElementById('admin-product-form').reset();
        
        // Reset image upload state
        this.modalImages = [];
        this.imagesPendingDelete = [];
        this.hideImageUploadAlert();
        this.renderModalImagePreviews();

        // Populate category select
        this.populateModalCategorySelect();

        document.getElementById('admin-product-modal').classList.add('active');
    },

    openEditProductModal(productId) {
        const product = Store.getProductById(productId);
        if (!product) return;

        this.editingProductId = productId;
        document.getElementById('product-modal-title').textContent = `Edit Product: ${product.name}`;
        
        this.populateModalCategorySelect(product.category);

        document.getElementById('prod-name-input').value = product.name;
        document.getElementById('prod-price-input').value = product.price;
        document.getElementById('prod-orig-price-input').value = product.originalPrice || '';
        document.getElementById('prod-stock-input').value = product.stock;
        document.getElementById('prod-symbol-input').value = product.symbol || '🌸';
        document.getElementById('prod-desc-input').value = product.description || '';
        document.getElementById('prod-materials-input').value = product.materials || '';
        document.getElementById('prod-size-input').value = product.size || '';
        document.getElementById('prod-care-input').value = product.care || '';
        document.getElementById('prod-tags-input').value = (product.tags || []).join(', ');
        document.getElementById('prod-badge-input').value = product.badge || '';

        document.getElementById('prod-featured-check').checked = !!product.featured;
        document.getElementById('prod-new-check').checked = !!product.newArrival;
        document.getElementById('prod-bestseller-check').checked = !!product.bestseller;

        // Populate modalImages from product.images, product.image, or product.image_url
        let existingImages = [];
        if (Array.isArray(product.images) && product.images.length > 0) {
            existingImages = product.images;
        } else if (product.image) {
            existingImages = [product.image];
        } else if (product.image_url) {
            existingImages = [product.image_url];
        }

        this.modalImages = existingImages.map((url, idx) => ({
            url: url,
            file: null,
            isNew: false,
            isPrimary: idx === 0,
            status: 'uploaded'
        }));
        this.imagesPendingDelete = [];
        this.hideImageUploadAlert();
        this.renderModalImagePreviews();

        document.getElementById('admin-product-modal').classList.add('active');
    },

    closeProductModal() {
        document.getElementById('admin-product-modal').classList.remove('active');
        this.editingProductId = null;
        this.modalImages = [];
        this.imagesPendingDelete = [];
    },

    populateModalCategorySelect(selectedVal = '') {
        const select = document.getElementById('prod-category-select');
        if (!select) return;
        const categories = Store.getCategories();
        select.innerHTML = categories.map(cat => `
            <option value="${cat}" ${cat === selectedVal ? 'selected' : ''}>${cat}</option>
        `).join('');
    },

    // ==================== IMAGE UPLOAD COMPONENT (SUPABASE STORAGE) ====================
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        const dropzone = document.getElementById('product-image-dropzone');
        if (dropzone) dropzone.classList.add('dragover');
    },

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        const dropzone = document.getElementById('product-image-dropzone');
        if (dropzone) dropzone.classList.remove('dragover');
    },

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        const dropzone = document.getElementById('product-image-dropzone');
        if (dropzone) dropzone.classList.remove('dragover');
        if (e.dataTransfer && e.dataTransfer.files) {
            this.processSelectedFiles(e.dataTransfer.files);
        }
    },

    handleFileSelect(e) {
        if (e.target && e.target.files) {
            this.processSelectedFiles(e.target.files);
            e.target.value = '';
        }
    },

    processSelectedFiles(fileList) {
        this.hideImageUploadAlert();
        const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const maxSizeBytes = 5 * 1024 * 1024; // 5MB
        let addedCount = 0;
        let invalidFormats = [];
        let oversizeFiles = [];

        Array.from(fileList).forEach(file => {
            if (!validFormats.includes(file.type.toLowerCase())) {
                invalidFormats.push(file.name);
                return;
            }
            if (file.size > maxSizeBytes) {
                oversizeFiles.push(file.name);
                return;
            }

            const previewUrl = URL.createObjectURL(file);
            const isFirst = this.modalImages.length === 0;
            this.modalImages.push({
                file: file,
                url: previewUrl,
                isNew: true,
                isPrimary: isFirst,
                status: 'ready'
            });
            addedCount++;
        });

        if (invalidFormats.length > 0) {
            this.showImageUploadAlert('warning', `Unsupported file type for: ${invalidFormats.join(', ')}. Please use JPG, PNG, or WEBP.`);
        } else if (oversizeFiles.length > 0) {
            this.showImageUploadAlert('warning', `File exceeds 5MB limit: ${oversizeFiles.join(', ')}.`);
        }

        this.renderModalImagePreviews();
    },

    addManualImageUrl() {
        const input = document.getElementById('prod-manual-url-input');
        if (!input) return;
        const val = input.value.trim();
        if (!val) return;
        if (!val.startsWith('http://') && !val.startsWith('https://')) {
            alert('Please enter a valid URL starting with http:// or https://');
            return;
        }

        const isFirst = this.modalImages.length === 0;
        this.modalImages.push({
            file: null,
            url: val,
            isNew: false,
            isPrimary: isFirst,
            status: 'uploaded'
        });
        input.value = '';
        this.renderModalImagePreviews();
    },

    renderModalImagePreviews() {
        const container = document.getElementById('modal-image-preview-grid');
        if (!container) return;

        if (this.modalImages.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 12px; color: var(--admin-muted); font-size: 12px; font-style: italic;">
                    No images selected yet. Drag & drop or pick files above to preview.
                </div>
            `;
            return;
        }

        // Ensure index 0 is marked primary
        this.modalImages.forEach((img, idx) => {
            img.isPrimary = (idx === 0);
        });

        container.innerHTML = this.modalImages.map((img, index) => {
            const isPrimary = index === 0;
            const statusClass = img.status || 'ready';
            const statusLabel = img.status === 'uploaded' ? 'UPLOADED' : (img.status === 'uploading' ? 'UPLOADING...' : (img.status === 'error' ? 'FAILED' : 'READY'));

            return `
                <div class="img-preview-card ${isPrimary ? 'is-primary' : ''}">
                    <div class="img-preview-thumb-wrap">
                        <img src="${img.url}" alt="Product preview ${index + 1}" onerror="this.src='logo.png'">
                        ${isPrimary ? `<span class="primary-badge">★ PRIMARY</span>` : ''}
                        <span class="preview-status-chip ${statusClass}">${statusLabel}</span>
                    </div>

                    ${!isPrimary ? `
                        <button type="button" class="btn-set-primary" onclick="AdminApp.setPrimaryImage(${index})">
                            ★ Set as Primary
                        </button>
                    ` : ''}

                    <div class="img-preview-actions">
                        <button type="button" class="btn-preview-action" title="Move Left" ${index === 0 ? 'disabled style="opacity:0.3; cursor:default;"' : ''} onclick="AdminApp.moveModalImage(${index}, -1)">
                            ◀
                        </button>
                        <button type="button" class="btn-preview-action delete" title="Remove image" onclick="AdminApp.removeModalImage(${index})">
                            ✕ Remove
                        </button>
                        <button type="button" class="btn-preview-action" title="Move Right" ${index === this.modalImages.length - 1 ? 'disabled style="opacity:0.3; cursor:default;"' : ''} onclick="AdminApp.moveModalImage(${index}, 1)">
                            ▶
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    setPrimaryImage(index) {
        if (index <= 0 || index >= this.modalImages.length) return;
        const [target] = this.modalImages.splice(index, 1);
        this.modalImages.unshift(target);
        this.renderModalImagePreviews();
    },

    moveModalImage(index, delta) {
        const targetIndex = index + delta;
        if (targetIndex < 0 || targetIndex >= this.modalImages.length) return;
        const temp = this.modalImages[index];
        this.modalImages[index] = this.modalImages[targetIndex];
        this.modalImages[targetIndex] = temp;
        this.renderModalImagePreviews();
    },

    removeModalImage(index) {
        if (index < 0 || index >= this.modalImages.length) return;
        const removed = this.modalImages.splice(index, 1)[0];
        if (removed && !removed.isNew && removed.url) {
            this.imagesPendingDelete.push(removed.url);
        }
        this.renderModalImagePreviews();
    },

    showImageUploadAlert(type, message) {
        const el = document.getElementById('image-upload-alert');
        if (!el) return;
        el.className = `image-upload-alert ${type}`;
        el.innerHTML = message;
        el.style.display = 'block';
    },

    hideImageUploadAlert() {
        const el = document.getElementById('image-upload-alert');
        if (el) el.style.display = 'none';
    },

    getSupabaseClient() {
        const serviceKey = window.ENV?.SUPABASE_SERVICE_ROLE_KEY ||
            window.SUPABASE_SERVICE_KEY ||
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6c3Bma2h0YW16anRlenh1dGZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODA1OTc2MCwiZXhwIjoyMTAzNjM1NzYwfQ.l2wsRv7NKgrOK_VyAm4cVMgS96RUAPyEugdffN87XHc';
        const url = window.DEAR_DRAUPADI_SUPABASE_URL || window.SUPABASE_CONFIG?.url || 'https://hzspfkhtamzjtezxutfx.supabase.co';

        if (typeof supabase !== 'undefined' && supabase && typeof supabase.createClient === 'function' && serviceKey) {
            try {
                return supabase.createClient(url, serviceKey);
            } catch (e) {
                console.warn("⚠️ [Dear Draupadi] Using fallback supabaseClient:", e);
            }
        }
        return window.supabaseClient;
    },

    async saveProductForm(e) {
        if (e) e.preventDefault();

        const submitBtn = document.querySelector('#admin-product-modal button[type="submit"]');
        const origBtnText = submitBtn ? submitBtn.textContent : "Save Product";

        const name = document.getElementById('prod-name-input').value.trim();
        const category = document.getElementById('prod-category-select').value;
        const price = parseInt(document.getElementById('prod-price-input').value, 10);
        const originalPrice = parseInt(document.getElementById('prod-orig-price-input').value, 10) || null;
        const stock = parseInt(document.getElementById('prod-stock-input').value, 10) || 0;
        const symbol = document.getElementById('prod-symbol-input').value.trim() || '🌸';
        const description = document.getElementById('prod-desc-input').value.trim();
        const materials = document.getElementById('prod-materials-input').value.trim();
        const size = document.getElementById('prod-size-input').value.trim();
        const care = document.getElementById('prod-care-input').value.trim();
        const tags = document.getElementById('prod-tags-input').value.split(',').map(t => t.trim()).filter(t => t.length > 0);
        const badge = document.getElementById('prod-badge-input').value.trim();

        const featured = document.getElementById('prod-featured-check').checked;
        const newArrival = document.getElementById('prod-new-check').checked;
        const bestseller = document.getElementById('prod-bestseller-check').checked;

        if (!name || isNaN(price)) {
            alert("Please provide a valid Product Name and Price.");
            return;
        }

        const productId = this.editingProductId || ("DD-PRD-" + Date.now().toString().slice(-4));
        const client = this.getSupabaseClient();

        try {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = "Uploading Images & Saving...";
            }

            // Step 1, 2 & 8: Save/upsert product into Supabase `products` and resolve numeric ID (targetDbId)
            let targetDbId = null;

            if (this.editingProductId) {
                const existingProduct = Store.getProductById(this.editingProductId);
                if (existingProduct && existingProduct.supabase_id && Number.isInteger(Number(existingProduct.supabase_id))) {
                    targetDbId = Number(existingProduct.supabase_id);
                } else if (/^\d+$/.test(String(this.editingProductId))) {
                    targetDbId = Number(this.editingProductId);
                } else if (client) {
                    const searchName = (existingProduct ? existingProduct.name : name).trim();
                    const searchSlug = searchName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    const { data: matched } = await client
                        .from('products')
                        .select('id')
                        .or(`slug.eq.${searchSlug},name.eq.${searchName}`)
                        .limit(1);
                    if (matched && matched.length > 0) {
                        targetDbId = matched[0].id;
                    }
                }
            }

            if (client) {
                // Resolve category_id from Supabase categories table
                let categoryId = null;
                if (category) {
                    try {
                        const { data: catRows } = await client.from('categories').select('id, name, slug');
                        if (catRows && catRows.length > 0) {
                            const matchedCat = catRows.find(c => 
                                (c.name && c.name.toLowerCase() === category.toLowerCase()) ||
                                (c.slug && c.slug.toLowerCase() === category.toLowerCase())
                            );
                            if (matchedCat) categoryId = matchedCat.id;
                        }
                    } catch (catEx) {
                        console.warn("⚠️ [Dear Draupadi] Category resolution notice:", catEx.message);
                    }
                }

                // Generate clean slug
                let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                if (!slug) slug = 'product-' + Date.now().toString().slice(-4);

                // Prevent slug conflict
                if (targetDbId !== null) {
                    const { data: slugConflict } = await client
                        .from('products')
                        .select('id')
                        .eq('slug', slug)
                        .neq('id', targetDbId)
                        .limit(1);
                    if (slugConflict && slugConflict.length > 0) {
                        slug = `${slug}-${targetDbId}`;
                    }
                } else {
                    const { data: slugConflict } = await client
                        .from('products')
                        .select('id')
                        .eq('slug', slug)
                        .limit(1);
                    if (slugConflict && slugConflict.length > 0) {
                        slug = `${slug}-${Date.now().toString().slice(-4)}`;
                    }
                }

                const productDbPayload = {
                    name,
                    slug,
                    category_id: categoryId,
                    description: description || null,
                    price: price,
                    original_price: originalPrice || null,
                    stock: stock,
                    materials: materials || null,
                    size: size || null,
                    care_instructions: care || null,
                    featured: Boolean(featured),
                    new_arrival: Boolean(newArrival),
                    bestseller: Boolean(bestseller),
                    updated_at: new Date().toISOString()
                };

                // Save or upsert into Supabase products table
                if (targetDbId !== null) {
                    const { data: updatedProd, error: updateErr } = await client
                        .from('products')
                        .update(productDbPayload)
                        .eq('id', targetDbId)
                        .select('id')
                        .single();

                    if (updateErr) {
                        console.error("❌ SUPABASE PRODUCT UPDATE ERROR:", updateErr);
                        alert("Error updating product in Supabase: " + updateErr.message);
                        throw new Error(`Failed to update product in Supabase: ${updateErr.message}`);
                    }
                    if (updatedProd && updatedProd.id) {
                        targetDbId = updatedProd.id;
                    }
                } else {
                    const { data: insertedProd, error: insertErr } = await client
                        .from('products')
                        .insert(productDbPayload)
                        .select('id')
                        .single();

                    if (insertErr) {
                        console.error("❌ SUPABASE PRODUCT INSERT ERROR:", insertErr);
                        alert("Error saving product to Supabase: " + insertErr.message);
                        throw new Error(`Failed to insert product into Supabase: ${insertErr.message}`);
                    }
                    if (!insertedProd || !insertedProd.id) {
                        throw new Error("Supabase product insertion did not return an ID.");
                    }
                    targetDbId = insertedProd.id;
                }
            }

            // Step 4 & 5: Upload selected images to Supabase Storage bucket 'product-images' and get public URL
            let uploadErrors = [];

            for (let i = 0; i < this.modalImages.length; i++) {
                const img = this.modalImages[i];
                if (img.isNew && img.file) {
                    img.status = 'uploading';
                    this.renderModalImagePreviews();

                    if (client && client.storage) {
                        try {
                            const cleanName = img.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                            const storageFolder = targetDbId !== null ? targetDbId : productId;
                            const filePath = `products/${storageFolder}/${Date.now()}_${cleanName}`;
                            const { data, error } = await client.storage.from('product-images').upload(filePath, img.file, {
                                cacheControl: '3600',
                                upsert: true
                            });

                            if (error) {
                                img.status = 'error';
                                uploadErrors.push(error.message);
                                console.error("❌ [Dear Draupadi] Storage upload error:", error);
                            } else {
                                const { data: urlData } = client.storage.from('product-images').getPublicUrl(filePath);
                                if (urlData && urlData.publicUrl) {
                                    img.url = urlData.publicUrl;
                                    img.status = 'uploaded';
                                    img.isNew = false;
                                } else {
                                    img.status = 'error';
                                    uploadErrors.push("Failed to generate public URL for uploaded image.");
                                }
                            }
                        } catch (stEx) {
                            img.status = 'error';
                            uploadErrors.push(stEx.message);
                        }
                    } else {
                        img.status = 'error';
                        uploadErrors.push("Supabase Storage client is unavailable.");
                    }
                }
            }

            // Step 9: If storage upload fails, show the actual error clearly instead of silently continuing
            if (uploadErrors.length > 0) {
                this.renderModalImagePreviews();
                const errorMsg = uploadErrors.join('; ');
                this.showImageUploadAlert('error', `Image upload failed: ${errorMsg}`);
                alert(`Storage upload error:\n${uploadErrors.join('\n')}`);
                throw new Error(`Storage upload failed: ${errorMsg}`);
            }

            // Resolve final image URLs for persistence (preventing blob URLs)
            let finalImageUrls = this.modalImages
                .map(img => img.url)
                .filter(u => u && typeof u === 'string' && !u.startsWith('blob:') && u.trim().length > 0);

            // If newly added images failed or were blob URLs, preserve previous valid images
            const existingProduct = this.editingProductId ? Store.getProductById(this.editingProductId) : null;
            if (finalImageUrls.length === 0 && existingProduct && existingProduct.images && existingProduct.images.length > 0) {
                finalImageUrls = existingProduct.images;
            } else if (finalImageUrls.length === 0 && !this.editingProductId) {
                finalImageUrls = ["https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80"];
            }

            // Step 3, 6, 8, 10: Insert into product_images using numeric Supabase product ID (targetDbId)
            if (client && targetDbId !== null) {
                // Clear old images for this numeric product_id
                const { error: delImgErr } = await client
                    .from('product_images')
                    .delete()
                    .eq('product_id', targetDbId);

                if (delImgErr) {
                    console.error("❌ PRODUCT IMAGE DELETE ERROR:", delImgErr);
                    alert("Error updating product images: " + delImgErr.message);
                    throw new Error(`Failed to remove old product images: ${delImgErr.message}`);
                }

                if (finalImageUrls.length > 0) {
                    const imageRecords = finalImageUrls.map((url, sortOrder) => ({
                        product_id: targetDbId,
                        image_url: url,
                        sort_order: sortOrder
                    }));

                    const { error: insertImgErr } = await client
                        .from('product_images')
                        .insert(imageRecords);

                    if (insertImgErr) {
                        console.error("❌ PRODUCT IMAGE INSERT ERROR:", insertImgErr);
                        alert("Product images database error: " + insertImgErr.message);
                        throw new Error(`Supabase product_images insert error: ${insertImgErr.message}`);
                    }
                }
            }

            // Step 7: Keep the existing localStorage Store.saveProduct() behavior
            const productData = {
                id: productId,
                supabase_id: targetDbId,
                name,
                category,
                price,
                originalPrice,
                stock,
                symbol,
                description,
                materials,
                size,
                care,
                tags,
                badge,
                images: finalImageUrls,
                featured,
                newArrival,
                bestseller
            };

            Store.saveProduct(productData);

            // Clean up removed images from Supabase Storage
            if (client && client.storage && this.imagesPendingDelete.length > 0) {
                this.imagesPendingDelete.forEach(async (delUrl) => {
                    if (delUrl.includes('/product-images/')) {
                        const pathPart = delUrl.split('/product-images/')[1];
                        if (pathPart) {
                            try {
                                await client.storage.from('product-images').remove([pathPart]);
                            } catch (e) {}
                        }
                    }
                });
            }

            this.closeProductModal();
            this.renderProductsTab();
        } catch (err) {
            console.error("Save product error:", err);
            if (!err.message?.includes('Supabase') && !err.message?.includes('Storage upload') && !err.message?.includes('product images') && !err.message?.includes('product_images')) {
                alert("Error saving product: " + err.message);
            }
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = origBtnText;
            }
        }
    },

    // ==================== HAMPERS TAB ====================
    renderHampersTab() {
        const tableBody = document.getElementById('admin-hampers-table-body');
        if (!tableBody) return;

        const presets = Store.getHamperPresets();

        if (presets.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: var(--admin-muted);">
                        No hamper presets found. Click "+ Create Suggested Hamper" to add one.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = presets.map(h => {
            const includedList = (h.items || []).map(i => `${i.name} × ${i.quantity || 1}`).join(', ') || 'Custom assortment';
            const isActive = h.active !== false;

            return `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <img src="${h.image || 'logo.png'}" alt="${h.name}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 4px;" onerror="this.src='logo.png'">
                            <div>
                                <strong style="color: var(--admin-text); display: block;">${h.name}</strong>
                                <span style="font-size: 11.5px; color: var(--admin-muted);">${h.description || ''}</span>
                            </div>
                        </div>
                    </td>
                    <td><strong style="color: var(--admin-teal);">₹${h.price}</strong></td>
                    <td><span style="text-decoration: line-through; color: var(--admin-muted);">${h.originalPrice ? '₹' + h.originalPrice : '—'}</span></td>
                    <td style="max-width: 250px; font-size: 12px; color: var(--admin-text);">${includedList}</td>
                    <td>
                        <span class="status-badge ${isActive ? 'status-delivered' : 'status-cancelled'}" style="cursor: pointer;" onclick="AdminApp.toggleHamperActive('${h.id}')">
                            ${isActive ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td>
                        <div style="display: flex; gap: 6px;">
                            <button class="btn-icon" title="Edit Hamper" onclick="AdminApp.openEditHamperModal('${h.id}')">✏️</button>
                            <button class="btn-icon btn-danger" title="Delete Hamper" onclick="AdminApp.deleteHamper('${h.id}')">🗑️</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    openAddHamperModal() {
        this.editingHamperId = null;
        document.getElementById('hamper-modal-title').textContent = "Create Suggested Hamper";
        document.getElementById('admin-hamper-form').reset();
        this.populateHamperProductPicker();
        document.getElementById('admin-hamper-modal').classList.add('active');
    },

    openEditHamperModal(hamperId) {
        const preset = Store.getHamperPresetById(hamperId);
        if (!preset) return;

        this.editingHamperId = hamperId;
        document.getElementById('hamper-modal-title').textContent = `Edit Hamper: ${preset.name}`;

        document.getElementById('hamper-name-input').value = preset.name;
        document.getElementById('hamper-price-input').value = preset.price;
        document.getElementById('hamper-orig-price-input').value = preset.originalPrice || '';
        document.getElementById('hamper-image-input').value = preset.image || '';
        document.getElementById('hamper-desc-input').value = preset.description || '';
        document.getElementById('hamper-active-check').checked = preset.active !== false;
        document.getElementById('hamper-featured-check').checked = !!preset.featured;

        this.populateHamperProductPicker(preset.items || []);
        document.getElementById('admin-hamper-modal').classList.add('active');
    },

    closeHamperModal() {
        document.getElementById('admin-hamper-modal').classList.remove('active');
        this.editingHamperId = null;
    },

    populateHamperProductPicker(selectedItems = []) {
        const container = document.getElementById('hamper-included-products-picker');
        if (!container) return;

        const products = Store.getProducts().filter(p => p.category.toLowerCase() !== 'hampers');

        container.innerHTML = products.map(p => {
            const match = selectedItems.find(si => String(si.productId) === String(p.id) || si.name === p.name);
            const isChecked = !!match;
            const qty = match ? (match.quantity || 1) : 1;

            return `
                <div class="hamper-product-picker-item">
                    <label>
                        <input type="checkbox" class="hamper-prod-check" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}" ${isChecked ? 'checked' : ''}>
                        <span>${p.symbol || '🌸'} <strong>${p.name}</strong> (₹${p.price})</span>
                    </label>
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <span style="font-size: 11px; color: var(--admin-muted);">Qty:</span>
                        <input type="number" class="hamper-product-qty-input" data-id="${p.id}" value="${qty}" min="1" max="10">
                    </div>
                </div>
            `;
        }).join('');
    },

    saveHamperForm(e) {
        if (e) e.preventDefault();

        const name = document.getElementById('hamper-name-input').value.trim();
        const price = parseInt(document.getElementById('hamper-price-input').value);
        const originalPrice = parseInt(document.getElementById('hamper-orig-price-input').value) || null;
        const image = document.getElementById('hamper-image-input').value.trim() || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80';
        const description = document.getElementById('hamper-desc-input').value.trim();
        const active = document.getElementById('hamper-active-check').checked;
        const featured = document.getElementById('hamper-featured-check').checked;

        if (!name || isNaN(price)) {
            alert("Please enter a valid Hamper Name and Price.");
            return;
        }

        // Collect checked products
        const includedItems = [];
        document.querySelectorAll('.hamper-prod-check:checked').forEach(chk => {
            const pid = chk.dataset.id;
            const pname = chk.dataset.name;
            const pprice = parseFloat(chk.dataset.price) || 0;
            const qtyInput = document.querySelector(`.hamper-product-qty-input[data-id="${pid}"]`);
            const quantity = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;

            includedItems.push({
                productId: pid,
                name: pname,
                price: pprice,
                quantity: quantity
            });
        });

        const hamperData = {
            id: this.editingHamperId,
            name,
            price,
            originalPrice,
            image,
            description,
            symbol: "🎀",
            active,
            featured,
            items: includedItems
        };

        Store.saveHamperPreset(hamperData);
        this.closeHamperModal();
        this.renderHampersTab();
    },

    deleteHamper(id) {
        const preset = Store.getHamperPresetById(id);
        if (!preset) return;
        if (confirm(`Are you sure you want to delete "${preset.name}"?`)) {
            Store.deleteHamperPreset(id);
            this.renderHampersTab();
        }
    },

    toggleHamperActive(id) {
        Store.toggleHamperPresetActive(id);
        this.renderHampersTab();
    },

    deleteProduct(productId) {
        const product = Store.getProductById(productId);
        if (!product) return;
        if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
            Store.deleteProduct(productId);
            this.renderProductsTab();
        }
    },

    // ==================== 3. ORDERS TAB ====================
    async syncCloudOrders(btn) {
        if (btn) {
            btn.disabled = true;
            const textEl = btn.querySelector('#sync-text');
            if (textEl) textEl.textContent = 'Syncing...';
        }

        try {
            if (typeof Store !== 'undefined' && Store.fetchOrdersFromSupabase) {
                await Store.fetchOrdersFromSupabase();
            }
            this.renderOrdersTab();
            if (this.currentTab === 'overview') this.renderOverviewTab();
        } catch (err) {
            console.error("Cloud orders sync error:", err);
        } finally {
            if (btn) {
                btn.disabled = false;
                const textEl = btn.querySelector('#sync-text');
                if (textEl) textEl.textContent = 'Sync Cloud Orders';
            }
        }
    },

    renderOrdersTab() {
        const tableBody = document.getElementById('admin-orders-table-body');
        if (!tableBody) return;

        const searchTerm = (document.getElementById('admin-order-search')?.value || '').toLowerCase().trim();
        const statusFilter = document.getElementById('admin-order-status-filter')?.value || 'all';

        let orders = Store.getOrders();

        if (searchTerm) {
            orders = orders.filter(o => {
                const idMatch = (o.id || '').toLowerCase().includes(searchTerm);
                const nameMatch = (o.customer?.name || '').toLowerCase().includes(searchTerm);
                const phoneMatch = (o.customer?.phone || '').includes(searchTerm);
                const emailMatch = (o.customer?.email || '').toLowerCase().includes(searchTerm);
                return idMatch || nameMatch || phoneMatch || emailMatch;
            });
        }

        if (statusFilter !== 'all') {
            orders = orders.filter(o => (o.status || '').toLowerCase() === statusFilter.toLowerCase());
        }

        const totalOrders = orders.length;

        if (totalOrders === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: var(--admin-muted);">
                        <p style="font-size: 24px; margin-bottom: 8px;">🎀</p>
                        <p style="font-size: 14px; font-weight: 600; color: var(--admin-text);">No boutique orders found</p>
                        <p style="font-size: 12px; margin-top: 4px;">Click "Sync Cloud Orders" above to fetch latest orders from Supabase.</p>
                    </td>
                </tr>
            `;
            const paginationWrap = document.getElementById('admin-orders-pagination-wrap');
            if (paginationWrap) paginationWrap.style.display = 'none';
            return;
        }

        const totalPages = Math.ceil(totalOrders / this.ordersPerPage) || 1;
        if (this.currentOrderPage > totalPages) this.currentOrderPage = 1;
        const startIndex = (this.currentOrderPage - 1) * this.ordersPerPage;
        const endIndex = startIndex + this.ordersPerPage;
        const pagedOrders = orders.slice(startIndex, endIndex);

        tableBody.innerHTML = pagedOrders.map(order => {
            const statusOptions = ["Order Placed", "Confirmed", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"];
            const custName = order.customer?.name || 'Valued Customer';
            const custPhone = order.customer?.phone || '—';

            return `
                <tr>
                    <td>
                        <strong style="color: var(--admin-teal);">#${order.id}</strong>
                        ${order.supabaseId ? `<span style="display: block; font-size: 9.5px; color: var(--admin-muted);">Cloud ID: ${order.supabaseId}</span>` : ''}
                    </td>
                    <td>
                        <strong>${custName}</strong>
                        <span style="display: block; font-size: 11px; color: var(--admin-muted);">${custPhone}</span>
                    </td>
                    <td>
                        ${(order.items || []).map(i => {
                            const isHamper = !!i.isHamper || (i.hamperItems && i.hamperItems.length > 0) || (i.name && i.name.toLowerCase().includes('hamper'));
                            if (isHamper) {
                                const itemCount = i.hamperItems ? i.hamperItems.reduce((acc, h) => acc + (h.quantity || 1), 0) : 0;
                                return `
                                    <div style="margin-bottom: 6px; padding: 4px 6px; background: rgba(184, 115, 102, 0.05); border-left: 2px solid var(--admin-terracotta, #b87366); border-radius: 2px;">
                                        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                                            <span class="hamper-tag-badge">🎀 CUSTOM HAMPER</span>
                                            <strong style="color: var(--admin-text);">${i.name}</strong> (${i.quantity}x)
                                        </div>
                                        ${itemCount > 0 ? `<div style="font-size: 11px; color: var(--admin-muted); margin-top: 2px;">↳ <strong>${itemCount}</strong> custom pieces chosen</div>` : ''}
                                        ${i.customMessage ? `<div style="font-size: 11px; color: var(--admin-terracotta, #b87366); font-style: italic; margin-top: 2px;">💌 "${i.customMessage.length > 35 ? i.customMessage.slice(0, 35) + '…' : i.customMessage}"</div>` : ''}
                                    </div>
                                `;
                            }
                            return `<div style="margin-bottom: 3px;">${i.name} (${i.quantity}x)</div>`;
                        }).join('')}
                    </td>
                    <td><strong>₹${order.pricing ? order.pricing.total : 0}</strong></td>
                    <td>
                        <select class="form-group" style="padding: 4px 8px; font-size: 11px; border-radius: 4px;" onchange="AdminApp.updateOrderStatus('${order.id}', this.value)">
                            ${statusOptions.map(opt => `
                                <option value="${opt}" ${order.status === opt ? 'selected' : ''}>${opt}</option>
                            `).join('')}
                        </select>
                    </td>
                    <td>${new Date(order.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td>
                        <button class="btn-icon" onclick="AdminApp.viewOrderDetails('${order.id}')">View Details ↗</button>
                    </td>
                </tr>
            `;
        }).join('');

        // Render pagination controls (pack of 20)
        const paginationWrap = document.getElementById('admin-orders-pagination-wrap');
        const paginationInfo = document.getElementById('admin-orders-pagination-info');
        const paginationControls = document.getElementById('admin-orders-pagination-controls');

        if (paginationWrap) {
            if (totalOrders > this.ordersPerPage) {
                paginationWrap.style.display = 'block';
                if (paginationInfo) {
                    paginationInfo.innerHTML = `Showing <strong>${startIndex + 1}–${Math.min(endIndex, totalOrders)}</strong> of <strong>${totalOrders}</strong> orders (Pack of 20)`;
                }
                if (paginationControls) {
                    let controlsHtml = '';
                    if (this.currentOrderPage > 1) {
                        controlsHtml += `<button type="button" class="btn-icon" onclick="AdminApp.setOrderPage(${this.currentOrderPage - 1})">← Prev</button>`;
                    }
                    for (let p = 1; p <= totalPages; p++) {
                        controlsHtml += `<button type="button" class="btn-icon ${p === this.currentOrderPage ? 'active' : ''}" style="${p === this.currentOrderPage ? 'background: var(--admin-teal); color: #fff; font-weight: bold;' : ''}" onclick="AdminApp.setOrderPage(${p})">${p}</button>`;
                    }
                    if (this.currentOrderPage < totalPages) {
                        controlsHtml += `<button type="button" class="btn-icon" onclick="AdminApp.setOrderPage(${this.currentOrderPage + 1})">Next →</button>`;
                    }
                    paginationControls.innerHTML = controlsHtml;
                }
            } else {
                paginationWrap.style.display = 'none';
            }
        }
    },

    updateOrderStatus(orderId, newStatus) {
        Store.updateOrderStatus(orderId, newStatus);
        this.renderOrdersTab();
    },

    viewOrderDetails(orderId) {
        const order = Store.getOrderById(orderId);
        if (!order) return;

        const cust = order.customer || {};
        const ship = order.shipping || {};
        const body = document.getElementById('order-detail-modal-body');

        body.innerHTML = `
            <div style="background: var(--admin-surface); padding: 16px; border-radius: var(--radius-sm); margin-bottom: 16px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <h4 style="color:var(--admin-teal); font-size:16px; margin:0;">Order #${order.id}</h4>
                    <span class="status-badge status-${(order.status || '').toLowerCase().replace(/\s+/g, '')}">${order.status || 'Order Placed'}</span>
                </div>
                <p style="font-size:12px; color:var(--admin-muted); margin: 3px 0;">Placed on: ${new Date(order.date).toLocaleString('en-GB')}</p>
                <p style="font-size:12px; color:var(--admin-muted); margin: 3px 0;">Payment: <strong>${order.paymentMethod || 'Cash on Delivery'}</strong> (${order.paymentStatus || 'Pending'})</p>
                ${order.supabaseId ? `<p style="font-size:11px; color:var(--admin-teal); margin: 3px 0;">✓ Synced with Supabase Cloud Database (ID: ${order.supabaseId})</p>` : ''}
            </div>

            <div style="margin-bottom: 16px; padding: 12px; background: #faf8f5; border-radius: var(--radius-sm); border: 1px solid var(--admin-border-light);">
                <h5 style="font-size:11.5px; text-transform:uppercase; color:var(--admin-muted); margin-bottom:6px; letter-spacing: 0.5px;">Customer & Delivery Details</h5>
                <p style="font-size:13px; margin: 2px 0;"><strong>${cust.name || 'Valued Customer'}</strong> • Phone: ${cust.phone || '—'} • Email: ${cust.email || '—'}</p>
                <p style="font-size:12.5px; color:var(--admin-text); margin: 4px 0;">
                    📍 ${ship.address || 'Standard Delivery'}${ship.city ? `, ${ship.city}` : ''}${ship.state ? `, ${ship.state}` : ''}${ship.pincode ? ` - ${ship.pincode}` : ''}
                </p>
            </div>

            <div>
                <h5 style="font-size:11.5px; text-transform:uppercase; color:var(--admin-muted); margin-bottom:8px; letter-spacing: 0.5px;">Ordered Items & Customizations</h5>
                
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    ${(order.items || []).map(item => {
                        const isHamper = !!item.isHamper || (item.hamperItems && item.hamperItems.length > 0) || (item.name && item.name.toLowerCase().includes('hamper'));
                        const hamperItems = item.hamperItems || [];
                        const customNote = item.customMessage || '';

                        if (isHamper) {
                            return `
                                <div style="border: 1px solid rgba(184, 115, 102, 0.3); background: #ffffff; border-radius: 8px; padding: 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.03);">
                                    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; border-bottom: 1px solid #f0ebe4; padding-bottom: 8px;">
                                        <div>
                                            <span class="hamper-tag-badge">🎀 BESPOKE GIFT HAMPER</span>
                                            <h4 style="font-size: 15px; color: var(--admin-text); margin: 6px 0 2px;">${item.name}</h4>
                                            <span style="font-size: 11.5px; color: var(--admin-muted);">Quantity: ${item.quantity} box${item.quantity > 1 ? 'es' : ''}</span>
                                        </div>
                                        <div style="text-align: right;">
                                            <strong style="font-size: 15px; color: var(--admin-teal);">₹${item.price * item.quantity}</strong>
                                            ${item.quantity > 1 ? `<span style="display:block; font-size:11px; color:var(--admin-muted);">₹${item.price} each</span>` : ''}
                                        </div>
                                    </div>

                                    <!-- Customer Personalized Calligraphy Note -->
                                    <div style="background: #fff9f6; border: 1.5px dashed var(--admin-terracotta, #b87366); border-radius: 6px; padding: 12px 14px; margin: 10px 0;">
                                        <div style="font-size: 11px; font-weight: 700; color: var(--admin-terracotta, #b87366); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                                            <span>💌</span> <span>Personalized Calligraphy Note (To be handwritten on gift card):</span>
                                        </div>
                                        <div style="font-size: 13.5px; font-style: italic; color: #3b2c24; line-height: 1.5; padding: 6px 10px; background: rgba(255,255,255,0.8); border-radius: 4px; border-left: 3px solid var(--admin-terracotta, #b87366);">
                                            ${customNote ? `"${customNote}"` : `<em>No custom note provided by customer (leave boutique card blank).</em>`}
                                        </div>
                                    </div>

                                    <!-- Handpicked Hamper Contents -->
                                    ${hamperItems.length > 0 ? `
                                        <div style="background: #faf8f5; border: 1px solid #e8e3dc; border-radius: 6px; padding: 12px; margin-top: 10px;">
                                            <div style="font-size: 11px; font-weight: 700; color: var(--admin-teal); text-transform: uppercase; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                                                <span>🎁 Custom Pieces to Pack Inside (${hamperItems.length} items):</span>
                                                <span style="font-size: 10px; color: var(--admin-muted); background: #ffffff; padding: 2px 8px; border-radius: 4px; border: 1px solid #e0dbd5;">Signature Blush Keepsake Box</span>
                                            </div>
                                            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                                                <thead>
                                                    <tr style="border-bottom: 1px solid #ddd; text-align: left; color: var(--admin-muted); font-size: 10.5px; text-transform: uppercase;">
                                                        <th style="padding: 6px 4px;">Treasure</th>
                                                        <th style="padding: 6px 4px; text-align: center;">Qty</th>
                                                        <th style="padding: 6px 4px; text-align: right;">Unit Price</th>
                                                        <th style="padding: 6px 4px; text-align: right;">Subtotal</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    ${hamperItems.map(hi => `
                                                        <tr style="border-bottom: 1px solid rgba(0,0,0,0.04);">
                                                            <td style="padding: 7px 4px; display: flex; align-items: center; gap: 8px;">
                                                                ${hi.image ? `<img src="${hi.image}" style="width: 28px; height: 28px; object-fit: cover; border-radius: 4px;" onerror="this.outerHTML='<span style=\\'font-size:16px;\\'>🌸</span>'">` : `<span style="font-size: 16px;">${hi.symbol || '🌸'}</span>`}
                                                                <strong style="color: var(--admin-text);">${hi.name}</strong>
                                                            </td>
                                                            <td style="padding: 7px 4px; text-align: center;"><strong>${hi.quantity || 1}</strong></td>
                                                            <td style="padding: 7px 4px; text-align: right; color: var(--admin-muted);">₹${hi.price || 0}</td>
                                                            <td style="padding: 7px 4px; text-align: right; font-weight: 600;">₹${(hi.price || 0) * (hi.quantity || 1)}</td>
                                                        </tr>
                                                    `).join('')}
                                                </tbody>
                                            </table>
                                        </div>
                                    ` : `
                                        <div style="font-size: 11.5px; color: var(--admin-muted); padding: 6px 0;">
                                            <em>Curated boutique assortment box</em>
                                        </div>
                                    `}
                                </div>
                            `;
                        }

                        // Regular Item
                        return `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: #ffffff; border: 1px solid var(--admin-border-light); border-radius: 6px;">
                                <div>
                                    <strong style="font-size: 13.5px; color: var(--admin-text);">${item.name}</strong>
                                    <span style="display: block; font-size: 11.5px; color: var(--admin-muted);">Quantity: ${item.quantity}</span>
                                </div>
                                <div style="text-align: right;">
                                    <strong style="font-size: 14px; color: var(--admin-teal);">₹${item.price * item.quantity}</strong>
                                    ${item.quantity > 1 ? `<span style="display:block; font-size:11px; color:var(--admin-muted);">₹${item.price} each</span>` : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <div style="margin-top: 16px; border-top: 1px solid var(--admin-border); padding-top: 12px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: bold; font-size: 14px;">Total Order Amount</span>
                    <span style="font-weight: bold; font-size: 18px; color: var(--admin-teal);">₹${order.pricing ? order.pricing.total : 0}</span>
                </div>
            </div>
        `;

        document.getElementById('admin-order-modal').classList.add('active');
    },

    closeOrderModal() {
        document.getElementById('admin-order-modal').classList.remove('active');
    },

    // ==================== 4. CUSTOMERS TAB ====================
    renderCustomersTab() {
        const tableBody = document.getElementById('admin-customers-table-body');
        if (!tableBody) return;

        const customers = Store.getCustomers();
        const totalCustomers = customers.length;

        if (totalCustomers === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--admin-muted);">No customers found yet.</td></tr>`;
            const paginationWrap = document.getElementById('admin-customers-pagination-wrap');
            if (paginationWrap) paginationWrap.style.display = 'none';
            return;
        }

        const totalPages = Math.ceil(totalCustomers / this.customersPerPage) || 1;
        if (this.currentCustomerPage > totalPages) this.currentCustomerPage = 1;
        const startIndex = (this.currentCustomerPage - 1) * this.customersPerPage;
        const endIndex = startIndex + this.customersPerPage;
        const pagedCustomers = customers.slice(startIndex, endIndex);

        tableBody.innerHTML = pagedCustomers.map(c => `
            <tr>
                <td><strong>${c.name}</strong></td>
                <td>${c.email || '—'}</td>
                <td>${c.phone || '—'}</td>
                <td>${c.city ? `${c.city}, ${c.state}` : '—'}</td>
                <td><span class="status-badge status-confirmed">${c.totalOrders} Orders</span></td>
                <td><strong>₹${c.totalSpent.toLocaleString()}</strong></td>
                <td>${c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
            </tr>
        `).join('');

        // Render pagination controls (pack of 20)
        const paginationWrap = document.getElementById('admin-customers-pagination-wrap');
        const paginationInfo = document.getElementById('admin-customers-pagination-info');
        const paginationControls = document.getElementById('admin-customers-pagination-controls');

        if (paginationWrap) {
            if (totalCustomers > this.customersPerPage) {
                paginationWrap.style.display = 'block';
                if (paginationInfo) {
                    paginationInfo.innerHTML = `Showing <strong>${startIndex + 1}–${Math.min(endIndex, totalCustomers)}</strong> of <strong>${totalCustomers}</strong> customers (Pack of 20)`;
                }
                if (paginationControls) {
                    let controlsHtml = '';
                    if (this.currentCustomerPage > 1) {
                        controlsHtml += `<button type="button" class="btn-icon" onclick="AdminApp.setCustomerPage(${this.currentCustomerPage - 1})">← Prev</button>`;
                    }
                    for (let p = 1; p <= totalPages; p++) {
                        controlsHtml += `<button type="button" class="btn-icon ${p === this.currentCustomerPage ? 'active' : ''}" style="${p === this.currentCustomerPage ? 'background: var(--admin-teal); color: #fff; font-weight: bold;' : ''}" onclick="AdminApp.setCustomerPage(${p})">${p}</button>`;
                    }
                    if (this.currentCustomerPage < totalPages) {
                        controlsHtml += `<button type="button" class="btn-icon" onclick="AdminApp.setCustomerPage(${this.currentCustomerPage + 1})">Next →</button>`;
                    }
                    paginationControls.innerHTML = controlsHtml;
                }
            } else {
                paginationWrap.style.display = 'none';
            }
        }
    },

    // ==================== 5. REVIEWS TAB ====================
    renderReviewsTab() {
        const tableBody = document.getElementById('admin-reviews-table-body');
        if (!tableBody) return;

        const reviews = Store.getReviews();

        tableBody.innerHTML = reviews.map(r => `
            <tr>
                <td><strong>${r.author}</strong></td>
                <td>${r.productName || r.productId}</td>
                <td style="color: var(--admin-gold);">${'★'.repeat(r.rating)}</td>
                <td style="max-width: 250px;">"${r.comment}"</td>
                <td><span class="status-badge ${r.status === 'approved' ? 'status-instock' : 'status-lowstock'}">${r.status}</span></td>
                <td>${r.date}</td>
                <td>
                    <div class="table-action-btns">
                        ${r.status === 'approved' 
                            ? `<button class="btn-icon" onclick="Store.updateReviewStatus('${r.id}', 'hidden'); AdminApp.renderReviewsTab();">Hide</button>`
                            : `<button class="btn-icon" onclick="Store.updateReviewStatus('${r.id}', 'approved'); AdminApp.renderReviewsTab();">Approve</button>`
                        }
                        <button class="btn-icon btn-danger" onclick="Store.deleteReview('${r.id}'); AdminApp.renderReviewsTab();">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    // ==================== 6. COUPONS TAB ====================
    renderCouponsTab() {
        const tableBody = document.getElementById('admin-coupons-table-body');
        if (!tableBody) return;

        const coupons = Store.getCoupons();

        tableBody.innerHTML = coupons.map(c => `
            <tr>
                <td><strong style="color: var(--admin-terracotta); letter-spacing: 1px;">${c.code}</strong></td>
                <td>${c.type === 'percentage' ? `${c.value}% Off` : `Flat ₹${c.value} Off`}</td>
                <td>₹${c.minSpend}</td>
                <td>${c.description}</td>
                <td>
                    <button class="status-badge ${c.active ? 'status-instock' : 'status-outofstock'}" 
                            style="border:none; cursor:pointer;" 
                            onclick="Store.toggleCoupon('${c.id}'); AdminApp.renderCouponsTab();">
                        ${c.active ? '● Active' : '○ Disabled'}
                    </button>
                </td>
                <td>
                    <button class="btn-icon btn-danger" onclick="Store.deleteCoupon('${c.id}'); AdminApp.renderCouponsTab();">🗑️</button>
                </td>
            </tr>
        `).join('');
    },

    openAddCouponModal() {
        document.getElementById('admin-coupon-form').reset();
        document.getElementById('admin-coupon-modal').classList.add('active');
    },

    closeCouponModal() {
        document.getElementById('admin-coupon-modal').classList.remove('active');
    },

    saveCouponForm(e) {
        if (e) e.preventDefault();

        const code = document.getElementById('cpn-code-input').value.trim().toUpperCase();
        const type = document.getElementById('cpn-type-select').value;
        const value = parseInt(document.getElementById('cpn-value-input').value);
        const minSpend = parseInt(document.getElementById('cpn-minspend-input').value) || 0;
        const description = document.getElementById('cpn-desc-input').value.trim();

        if (!code || isNaN(value)) {
            alert("Please provide a valid code and discount value.");
            return;
        }

        Store.saveCoupon({
            code,
            type,
            value,
            minSpend,
            description,
            active: true,
            expiry: "2026-12-31"
        });

        this.closeCouponModal();
        this.renderCouponsTab();
    },

    // ==================== 7. CATEGORIES TAB ====================
    renderCategoriesTab() {
        const listContainer = document.getElementById('admin-categories-list');
        if (!listContainer) return;

        const categories = Store.getCategories();
        const products = Store.getProducts();

        if (categories.length === 0) {
            listContainer.innerHTML = `<p style="padding:20px; color:var(--admin-muted); text-align:center;">No categories found. Add one above!</p>`;
            return;
        }

        listContainer.innerHTML = categories.map((cat, idx) => {
            const count = products.filter(p => p.category && p.category.toLowerCase() === cat.toLowerCase()).length;
            const escapedCat = cat.replace(/"/g, '&quot;').replace(/'/g, "\\'");
            const color = Store.getCategoryColor ? Store.getCategoryColor(cat, idx) : '#315D5A';
            return `
                <div style="display:flex; justify-content:space-between; align-items:center; background:var(--admin-card); padding:14px 20px; border-radius:var(--radius-sm); border:1px solid var(--admin-border); margin-bottom:10px;">
                    <div style="display:flex; align-items:center; gap:14px;">
                        <input type="color" value="${color}" title="Change theme color for '${escapedCat}'" 
                               style="width:30px; height:30px; border:none; padding:0; background:transparent; cursor:pointer; border-radius:50%;" 
                               onchange="AdminApp.updateCategoryColor('${escapedCat}', this.value)">
                        <div>
                            <strong style="font-size:14px; color:var(--admin-teal);">${cat}</strong>
                            <span style="display:block; font-size:11.5px; color:var(--admin-muted);">${count} pieces currently in catalog</span>
                        </div>
                    </div>
                    <button type="button" class="btn-icon btn-danger" onclick="AdminApp.deleteCategory('${escapedCat}')">Delete</button>
                </div>
            `;
        }).join('');
    },

    async addNewCategory() {
        const input = document.getElementById('new-category-input');
        const colorInput = document.getElementById('new-category-color');
        if (!input || !input.value.trim()) return;

        const catName = input.value.trim();
        const catColor = colorInput ? colorInput.value : null;
        const success = await Store.addCategory(catName, catColor);
        if (success) {
            input.value = '';
            if (colorInput) {
                const nextIdx = Store.getCategories().length;
                colorInput.value = Store.getCategoryColor('', nextIdx);
            }
            this.renderCategoriesTab();
            this.updateCategoryFilterDropdown();
        } else {
            alert(`Collection/Category "${catName}" already exists or could not be added.`);
        }
    },

    updateCategoryColor(catName, color) {
        if (Store.setCategoryColor) {
            Store.setCategoryColor(catName, color);
            this.renderCategoriesTab();
        }
    },

    async deleteCategory(catName) {
        if (!confirm(`Are you sure you want to delete the collection/category "${catName}"?`)) return;
        await Store.deleteCategory(catName);
        this.renderCategoriesTab();
        this.updateCategoryFilterDropdown();
    },

    // ==================== 8. SETTINGS & RESET ====================
    resetStoreData() {
        if (confirm("Reset Dear Draupadi store to default catalog, sample orders, and reviews? Custom additions will be reset.")) {
            Store.resetToDefaults();
        }
    },

    // ==================== 9. DWDM / OLAP MULTI-DIMENSIONAL ANALYTICS ====================
    olapState: {
        metric: 'purchases', // 'purchases' | 'revenue' | 'registrations' | 'products' | 'categories' | 'materials'
        timePath: [],        // e.g. ['2026', '7', '24', '14']
        entityPath: [],      // e.g. ['Jewellery', 'DD-PRD-001']
        expandedNodes: new Set(),
        currentCube: null
    },

    switchOlapMetric(metric) {
        this.olapState.metric = metric;
        this.olapState.timePath = [];
        this.olapState.entityPath = [];

        document.querySelectorAll('.olap-metric-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.metric === metric);
        });

        const colVolume = document.getElementById('matrix-col-volume');
        const colMetric = document.getElementById('matrix-col-metric');
        if (colVolume && colMetric) {
            if (metric === 'revenue') {
                colVolume.textContent = 'Orders / Volume';
                colMetric.textContent = 'Monetary Revenue (₹)';
            } else if (metric === 'registrations') {
                colVolume.textContent = 'Accounts';
                colMetric.textContent = 'New Registrations';
            } else if (metric === 'products') {
                colVolume.textContent = 'Units Sold';
                colMetric.textContent = 'Catalog Revenue (₹)';
            } else if (metric === 'categories') {
                colVolume.textContent = 'Units Ordered';
                colMetric.textContent = 'Collection Revenue (₹)';
            } else if (metric === 'materials') {
                colVolume.textContent = 'Pieces Sold';
                colMetric.textContent = 'Material Share';
            } else {
                colVolume.textContent = 'Pieces Ordered';
                colMetric.textContent = 'Orders Placed';
            }
        }

        this.renderOlapSystem();
    },

    showAnalyticsTooltip(e, text) {
        const tooltip = document.getElementById('analytics-tooltip');
        if (!tooltip) return;
        tooltip.innerHTML = text;
        tooltip.style.display = 'block';
        tooltip.style.left = `${e.clientX + 14}px`;
        tooltip.style.top = `${e.clientY - 12}px`;
        tooltip.style.opacity = '1';
    },

    hideAnalyticsTooltip() {
        const tooltip = document.getElementById('analytics-tooltip');
        if (tooltip) {
            tooltip.style.opacity = '0';
            tooltip.style.display = 'none';
        }
    },

    olapToggleNode(nodeKey) {
        if (this.olapState.expandedNodes.has(nodeKey)) {
            this.olapState.expandedNodes.delete(nodeKey);
        } else {
            this.olapState.expandedNodes.add(nodeKey);
        }
        this.renderOlapMatrix();
    },

    olapExpandAll() {
        if (!this.olapState.currentCube || !this.olapState.currentCube.nodes) return;
        this.olapState.currentCube.nodes.forEach(node => {
            if (node.hasChildren) {
                this.olapState.expandedNodes.add(node.key);
            }
        });
        this.renderOlapMatrix();
    },

    olapCollapseAll() {
        this.olapState.expandedNodes.clear();
        this.renderOlapMatrix();
    },

    olapReset() {
        this.olapState.timePath = [];
        this.olapState.entityPath = [];
        this.renderOlapSystem();
    },

    olapDrillDown(key) {
        if (['products', 'categories', 'materials'].includes(this.olapState.metric)) {
            this.olapState.entityPath.push(String(key));
        } else {
            this.olapState.timePath.push(String(key));
        }
        // Expand the drilled node in matrix
        this.olapState.expandedNodes.add(String(key));
        this.renderOlapSystem();
    },

    olapRollUp(targetDepth) {
        if (['products', 'categories', 'materials'].includes(this.olapState.metric)) {
            this.olapState.entityPath = this.olapState.entityPath.slice(0, targetDepth);
        } else {
            this.olapState.timePath = this.olapState.timePath.slice(0, targetDepth);
        }
        this.renderOlapSystem();
    },

    olapDrillTo(pathArray) {
        if (['products', 'categories', 'materials'].includes(this.olapState.metric)) {
            this.olapState.entityPath = [...pathArray];
        } else {
            this.olapState.timePath = [...pathArray];
        }
        // Expand all ancestors along path
        for (let i = 1; i <= pathArray.length; i++) {
            this.olapState.expandedNodes.add(pathArray.slice(0, i).join('/'));
        }
        this.renderOlapSystem();
    },

    renderAnalyticsTab() {
        this.renderOlapSystem();
    },

    // ==================== OLAP SYSTEM ORCHESTRATOR ====================
    renderOlapSystem() {
        const metric = this.olapState.metric;
        const emptyStateEl = document.getElementById('olap-empty-state');
        const mainContentEl = document.getElementById('olap-main-content');
        const scopeBarEl = document.getElementById('olap-scope-bar');

        let cube;
        if (['products', 'categories', 'materials'].includes(metric)) {
            cube = this.buildEntityCube(metric);
        } else {
            cube = this.buildTimeCube(metric);
        }

        this.olapState.currentCube = cube;

        if (!cube || cube.isEmpty) {
            if (emptyStateEl) emptyStateEl.style.display = 'block';
            if (mainContentEl) mainContentEl.style.display = 'none';
            if (scopeBarEl) scopeBarEl.style.display = 'none';
            this.renderBreadcrumbs([]);
            return;
        }

        if (emptyStateEl) emptyStateEl.style.display = 'none';
        if (mainContentEl) mainContentEl.style.display = 'block';
        if (scopeBarEl) scopeBarEl.style.display = 'grid';

        // Synchronize breadcrumbs, scope chips, dynamic graph, and matrix table
        this.renderBreadcrumbs(cube.activeBreadcrumbs);
        this.renderScopeKpis(cube.scopeKpis);
        this.renderDynamicChart(cube.chartData);
        this.renderOlapMatrix();
    },

    // ==================== BREADCRUMBS & SCOPE KPIS ====================
    renderBreadcrumbs(crumbs) {
        const container = document.getElementById('olap-breadcrumbs');
        if (!container) return;

        if (!crumbs || crumbs.length === 0) {
            container.innerHTML = `<span class="olap-crumb-current">Analytics Root</span>`;
            return;
        }

        container.innerHTML = crumbs.map((crumb, idx) => {
            const isLast = idx === crumbs.length - 1;
            if (isLast) {
                return `<span class="olap-crumb-current">${crumb.label}</span>`;
            } else {
                return `
                    <span class="olap-crumb-item" onclick="AdminApp.olapRollUp(${crumb.depth})" title="Roll up to ${crumb.label}">
                        ${crumb.label}
                    </span>
                    <span class="olap-crumb-sep">›</span>
                `;
            }
        }).join('');
    },

    renderScopeKpis(kpis) {
        if (!kpis) return;
        const elLevel = document.getElementById('olap-scope-level');
        const elVol = document.getElementById('olap-scope-volume');
        const elRev = document.getElementById('olap-scope-revenue');
        const elPeak = document.getElementById('olap-scope-peak');

        if (elLevel) elLevel.textContent = kpis.level || '—';
        if (elVol) elVol.textContent = kpis.volume || '0';
        if (elRev) elRev.textContent = kpis.revenue || '₹0';
        if (elPeak) elPeak.textContent = kpis.peak || '—';
    },

    // ==================== TIME CUBE BUILDER (YEAR → MONTH → DAY → HOUR) ====================
    buildTimeCube(metric) {
        const MONTH_NAMES = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const MONTH_SHORTS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        let rawEvents = [];
        if (metric === 'registrations') {
            const registrations = Store.getCustomerRegistrations();
            if (!registrations || registrations.length === 0) return { isEmpty: true };
            rawEvents = registrations.map(r => {
                const d = new Date(r.timestamp || r.date || Date.now());
                const hour = (typeof r.hour === 'number') ? r.hour : d.getHours();
                return {
                    dateObj: d,
                    year: d.getFullYear(),
                    month: d.getMonth(),
                    day: d.getDate(),
                    hour: hour,
                    orderCount: 0,
                    volume: 1,
                    value: 1,
                    label: r.name || r.email || 'Customer Account',
                    details: r.email || 'Registration'
                };
            });
        } else {
            const orders = Store.getOrders();
            if (!orders || orders.length === 0) return { isEmpty: true };
            rawEvents = orders.map(o => {
                const d = new Date(o.date || Date.now());
                const totalPieces = (o.items || []).reduce((sum, itm) => sum + (itm.quantity || 1), 0);
                const revenue = (o.pricing && typeof o.pricing.total === 'number')
                    ? o.pricing.total 
                    : (o.items || []).reduce((s, itm) => s + ((itm.price || 0) * (itm.quantity || 1)), 0);

                return {
                    dateObj: d,
                    year: d.getFullYear(),
                    month: d.getMonth(),
                    day: d.getDate(),
                    hour: d.getHours(),
                    orderCount: 1,
                    volume: totalPieces,
                    value: metric === 'revenue' ? revenue : (metric === 'purchases' ? totalPieces : 1),
                    monetaryRevenue: revenue,
                    label: `Order ${o.id}`,
                    customerName: o.customer?.name || 'Customer',
                    details: `${o.customer?.name || 'Customer'} • ${totalPieces} pcs • ₹${revenue}`
                };
            });
        }

        // Aggregate multi-level tree
        const yearsMap = {};
        rawEvents.forEach(evt => {
            const y = evt.year;
            const m = evt.month;
            const d = evt.day;
            const h = evt.hour;

            if (!yearsMap[y]) yearsMap[y] = { key: String(y), year: y, months: {}, volume: 0, value: 0, monetaryRevenue: 0, orderCount: 0 };
            const yNode = yearsMap[y];

            if (!yNode.months[m]) yNode.months[m] = { key: `${y}-${m}`, year: y, month: m, days: {}, volume: 0, value: 0, monetaryRevenue: 0, orderCount: 0 };
            const mNode = yNode.months[m];

            if (!mNode.days[d]) mNode.days[d] = { key: `${y}-${m}-${d}`, year: y, month: m, day: d, hours: {}, volume: 0, value: 0, monetaryRevenue: 0, orderCount: 0 };
            const dNode = mNode.days[d];

            if (!dNode.hours[h]) dNode.hours[h] = { key: `${y}-${m}-${d}-${h}`, year: y, month: m, day: d, hour: h, events: [], volume: 0, value: 0, monetaryRevenue: 0, orderCount: 0 };
            const hNode = dNode.hours[h];

            // Roll-up additions: child node to parent exact sums
            hNode.events.push(evt);
            hNode.volume += evt.volume;
            hNode.value += evt.value;
            hNode.monetaryRevenue += (evt.monetaryRevenue || 0);
            hNode.orderCount += evt.orderCount;

            dNode.volume += evt.volume;
            dNode.value += evt.value;
            dNode.monetaryRevenue += (evt.monetaryRevenue || 0);
            dNode.orderCount += evt.orderCount;

            mNode.volume += evt.volume;
            mNode.value += evt.value;
            mNode.monetaryRevenue += (evt.monetaryRevenue || 0);
            mNode.orderCount += evt.orderCount;

            yNode.volume += evt.volume;
            yNode.value += evt.value;
            yNode.monetaryRevenue += (evt.monetaryRevenue || 0);
            yNode.orderCount += evt.orderCount;
        });

        // Grand Totals
        let grandVolume = 0;
        let grandValue = 0;
        let grandRevenue = 0;
        let grandOrders = 0;
        Object.values(yearsMap).forEach(y => {
            grandVolume += y.volume;
            grandValue += y.value;
            grandRevenue += y.monetaryRevenue;
            grandOrders += y.orderCount;
        });

        // Resolve active drill-down path
        const availableYears = Object.keys(yearsMap).sort();
        let path = [...this.olapState.timePath];

        // Default to first active year if path is empty
        if (path.length === 0 && availableYears.length > 0) {
            path = [availableYears[availableYears.length - 1]];
            this.olapState.timePath = [...path];
        }

        const activeYearKey = path[0];
        const activeYear = yearsMap[activeYearKey] || yearsMap[availableYears[0]];
        if (!activeYear) return { isEmpty: true };

        // Ensure year is expanded in matrix by default
        this.olapState.expandedNodes.add(activeYear.key);

        // Build active breadcrumbs
        const crumbs = [
            { label: 'Analytics Root', depth: 0 }
        ];

        let activeLevelName = `Year Level (${activeYear.year})`;
        let scopeVolume = `${activeYear.volume} ${metric === 'registrations' ? 'signups' : 'pieces'}`;
        let scopeRevenue = `₹${activeYear.monetaryRevenue.toLocaleString()}`;
        let scopePeak = 'Calculating...';

        crumbs.push({ label: `Year ${activeYear.year}`, depth: 1, path: [String(activeYear.year)] });

        let chartTitle = `${activeYear.year} ${metric.toUpperCase()} by Month`;
        let chartSubtitle = `Click any month bar to drill down into days`;
        let chartBars = [];

        // LEVEL 1: Year selected -> Show 12 Months
        if (path.length === 1) {
            let maxMonthVal = 0;
            let peakMonthName = '';

            chartBars = MONTH_NAMES.map((name, mIdx) => {
                const mData = activeYear.months[mIdx];
                const val = mData ? mData.value : 0;
                const vol = mData ? mData.volume : 0;
                const rev = mData ? mData.monetaryRevenue : 0;
                const ord = mData ? mData.orderCount : 0;

                if (val > maxMonthVal) {
                    maxMonthVal = val;
                    peakMonthName = name;
                }

                return {
                    key: String(mIdx),
                    drillKey: String(mIdx),
                    label: MONTH_SHORTS[mIdx],
                    fullLabel: `${name} ${activeYear.year}`,
                    value: val,
                    volume: vol,
                    revenue: rev,
                    orders: ord,
                    tooltip: `<strong>${name} ${activeYear.year}</strong><br>` +
                             (metric === 'revenue' 
                                ? `Revenue: ₹${rev.toLocaleString()} (${ord} orders)` 
                                : `${val} ${metric} • ₹${rev.toLocaleString()}`) +
                             `<br><span style="color:#C7A15A; font-size:11px;">↘ Click bar to drill down into days</span>`
                };
            });

            scopePeak = peakMonthName ? `Peak: ${peakMonthName} (${maxMonthVal})` : 'Even distribution';
        }
        // LEVEL 2: Month selected -> Show Days in Month
        else if (path.length === 2) {
            const mIdx = parseInt(path[1], 10);
            const activeMonth = activeYear.months[mIdx] || { days: {}, value: 0, volume: 0, monetaryRevenue: 0, orderCount: 0 };
            const monthName = MONTH_NAMES[mIdx];

            crumbs.push({ label: monthName, depth: 2, path: [String(activeYear.year), String(mIdx)] });
            activeLevelName = `Month Level: ${monthName} ${activeYear.year}`;
            scopeVolume = `${activeMonth.volume} ${metric === 'registrations' ? 'signups' : 'pieces'}`;
            scopeRevenue = `₹${activeMonth.monetaryRevenue.toLocaleString()}`;

            chartTitle = `${monthName} ${activeYear.year} — Daily Breakdown`;
            chartSubtitle = `Click any day bar to drill down into 24-hour distribution`;

            // Calculate days in this month
            const daysInMonth = new Date(activeYear.year, mIdx + 1, 0).getDate();
            let maxDayVal = 0;
            let peakDayStr = '';

            chartBars = Array.from({ length: daysInMonth }, (_, i) => {
                const dayNum = i + 1;
                const dData = activeMonth.days[dayNum];
                const val = dData ? dData.value : 0;
                const vol = dData ? dData.volume : 0;
                const rev = dData ? dData.monetaryRevenue : 0;
                const ord = dData ? dData.orderCount : 0;

                if (val > maxDayVal) {
                    maxDayVal = val;
                    peakDayStr = `${monthName} ${dayNum}`;
                }

                return {
                    key: String(dayNum),
                    drillKey: String(dayNum),
                    label: `${dayNum}`,
                    fullLabel: `${monthName} ${dayNum}, ${activeYear.year}`,
                    value: val,
                    volume: vol,
                    revenue: rev,
                    orders: ord,
                    tooltip: `<strong>${monthName} ${dayNum}, ${activeYear.year}</strong><br>` +
                             (metric === 'revenue' 
                                ? `Revenue: ₹${rev.toLocaleString()} (${ord} orders)` 
                                : `${val} ${metric} • ₹${rev.toLocaleString()}`) +
                             `<br><span style="color:#C7A15A; font-size:11px;">↘ Click bar to drill down into hours</span>`
                };
            });

            scopePeak = peakDayStr ? `Peak: ${peakDayStr} (${maxDayVal})` : 'Steady';
        }
        // LEVEL 3: Day selected -> Show 24 Hours
        else if (path.length >= 3) {
            const mIdx = parseInt(path[1], 10);
            const dayNum = parseInt(path[2], 10);
            const activeMonth = activeYear.months[mIdx] || { days: {} };
            const activeDay = activeMonth.days[dayNum] || { hours: {}, value: 0, volume: 0, monetaryRevenue: 0, orderCount: 0 };
            const monthName = MONTH_NAMES[mIdx];

            crumbs.push({ label: monthName, depth: 2, path: [String(activeYear.year), String(mIdx)] });
            crumbs.push({ label: `${MONTH_SHORTS[mIdx]} ${dayNum}`, depth: 3, path: [String(activeYear.year), String(mIdx), String(dayNum)] });

            activeLevelName = `Day Level: ${monthName} ${dayNum}, ${activeYear.year}`;
            scopeVolume = `${activeDay.volume} ${metric === 'registrations' ? 'signups' : 'pieces'}`;
            scopeRevenue = `₹${activeDay.monetaryRevenue.toLocaleString()}`;

            // If an hour is also selected (path.length === 4)
            if (path.length === 4) {
                const hourNum = parseInt(path[3], 10);
                const ampm = hourNum >= 12 ? 'PM' : 'AM';
                const h12 = hourNum % 12 || 12;
                crumbs.push({ label: `${h12} ${ampm}`, depth: 4, path: [String(activeYear.year), String(mIdx), String(dayNum), String(hourNum)] });
                chartTitle = `${monthName} ${dayNum} @ ${h12} ${ampm} — Orders & Transactions`;
                chartSubtitle = `Showing individual boutique events recorded during this hourly window`;
            } else {
                chartTitle = `${monthName} ${dayNum}, ${activeYear.year} — 24-Hour Timeline`;
                chartSubtitle = `Click any hour bar to view transactions in that hourly window`;
            }

            let maxHourVal = 0;
            let peakHourStr = '';

            chartBars = Array.from({ length: 24 }, (_, h) => {
                const hData = activeDay.hours[h];
                const val = hData ? hData.value : 0;
                const vol = hData ? hData.volume : 0;
                const rev = hData ? hData.monetaryRevenue : 0;
                const ord = hData ? hData.orderCount : 0;

                const ampm = h >= 12 ? 'PM' : 'AM';
                const h12 = h % 12 || 12;

                if (val > maxHourVal) {
                    maxHourVal = val;
                    peakHourStr = `${h12} ${ampm}`;
                }

                return {
                    key: String(h),
                    drillKey: String(h),
                    label: `${h12}${ampm}`,
                    fullLabel: `${h12} ${ampm} (${h}:00)`,
                    value: val,
                    volume: vol,
                    revenue: rev,
                    orders: ord,
                    tooltip: `<strong>${h12}:00 ${ampm} (${h}:00)</strong><br>` +
                             (metric === 'revenue' 
                                ? `Revenue: ₹${rev.toLocaleString()} (${ord} orders)` 
                                : `${val} ${metric} • ₹${rev.toLocaleString()}`) +
                             `<br><span style="color:#C7A15A; font-size:11px;">↘ Click to inspect hourly orders</span>`
                };
            });

            scopePeak = peakHourStr ? `Peak: ${peakHourStr} (${maxHourVal})` : 'Even';
        }

        // Highlight highest bar
        let maxVal = Math.max(...chartBars.map(b => b.value), 0);
        chartBars.forEach(b => {
            if (b.value > 0 && b.value === maxVal) b.isPeak = true;
        });

        // Build Tree Nodes for Matrix Table
        const treeNodes = [];
        Object.values(yearsMap).sort((a, b) => b.year - a.year).forEach(yNode => {
            treeNodes.push({
                key: yNode.key,
                path: [String(yNode.year)],
                depth: 0,
                hasChildren: Object.keys(yNode.months).length > 0,
                label: `Year ${yNode.year}`,
                subLabel: 'Fiscal Period',
                volume: yNode.volume,
                value: yNode.value,
                monetaryRevenue: yNode.monetaryRevenue,
                parentValue: grandValue,
                grandValue: grandValue
            });

            if (this.olapState.expandedNodes.has(yNode.key)) {
                Object.values(yNode.months).sort((a, b) => a.month - b.month).forEach(mNode => {
                    const mName = MONTH_NAMES[mNode.month];
                    treeNodes.push({
                        key: mNode.key,
                        path: [String(yNode.year), String(mNode.month)],
                        depth: 1,
                        hasChildren: Object.keys(mNode.days).length > 0,
                        label: `${mName} ${yNode.year}`,
                        subLabel: 'Monthly Aggregate',
                        volume: mNode.volume,
                        value: mNode.value,
                        monetaryRevenue: mNode.monetaryRevenue,
                        parentValue: yNode.value,
                        grandValue: grandValue
                    });

                    if (this.olapState.expandedNodes.has(mNode.key)) {
                        Object.values(mNode.days).sort((a, b) => a.day - b.day).forEach(dNode => {
                            const dateObj = new Date(yNode.year, mNode.month, dNode.day);
                            const dayOfWeek = dateObj.toLocaleDateString('en-GB', { weekday: 'short' });
                            treeNodes.push({
                                key: dNode.key,
                                path: [String(yNode.year), String(mNode.month), String(dNode.day)],
                                depth: 2,
                                hasChildren: Object.keys(dNode.hours).length > 0,
                                label: `${dayOfWeek}, ${MONTH_SHORTS[mNode.month]} ${dNode.day}`,
                                subLabel: 'Daily Inflow',
                                volume: dNode.volume,
                                value: dNode.value,
                                monetaryRevenue: dNode.monetaryRevenue,
                                parentValue: mNode.value,
                                grandValue: grandValue
                            });

                            if (this.olapState.expandedNodes.has(dNode.key)) {
                                Object.values(dNode.hours).sort((a, b) => a.hour - b.hour).forEach(hNode => {
                                    const ampm = hNode.hour >= 12 ? 'PM' : 'AM';
                                    const h12 = hNode.hour % 12 || 12;
                                    treeNodes.push({
                                        key: hNode.key,
                                        path: [String(yNode.year), String(mNode.month), String(dNode.day), String(hNode.hour)],
                                        depth: 3,
                                        hasChildren: false,
                                        label: `${h12}:00 ${ampm} (${hNode.hour}:00)`,
                                        subLabel: `${hNode.events.length} transactions`,
                                        volume: hNode.volume,
                                        value: hNode.value,
                                        monetaryRevenue: hNode.monetaryRevenue,
                                        parentValue: dNode.value,
                                        grandValue: grandValue
                                    });
                                });
                            }
                        });
                    }
                });
            }
        });

        return {
            isEmpty: false,
            activeBreadcrumbs: crumbs,
            scopeKpis: {
                level: activeLevelName,
                volume: scopeVolume,
                revenue: scopeRevenue,
                peak: scopePeak
            },
            chartData: {
                title: chartTitle,
                subtitle: chartSubtitle,
                bars: chartBars,
                metric: metric
            },
            nodes: treeNodes
        };
    },

    // ==================== ENTITY CUBE BUILDER (CATEGORIES, PRODUCTS, MATERIALS) ====================
    buildEntityCube(metric) {
        const orders = Store.getOrders();
        if (!orders || orders.length === 0) return { isEmpty: true };

        const productsCatalog = Store.getProducts();
        const categoriesCatalog = Store.getCategories();

        let grandVolume = 0;
        let grandValue = 0;
        let grandRevenue = 0;

        const entityMap = {};

        if (metric === 'categories') {
            categoriesCatalog.forEach(cat => {
                entityMap[cat] = { key: cat, name: cat, subLabel: 'Boutique Collection', volume: 0, value: 0, monetaryRevenue: 0, products: {} };
            });

            orders.forEach(order => {
                const orderTotal = order.pricing?.total || 0;
                (order.items || []).forEach(item => {
                    const cat = item.category || 'Jewellery';
                    const qty = item.quantity || 1;
                    const itemRev = (item.price || 0) * qty;

                    if (!entityMap[cat]) {
                        entityMap[cat] = { key: cat, name: cat, subLabel: 'Boutique Collection', volume: 0, value: 0, monetaryRevenue: 0, products: {} };
                    }

                    entityMap[cat].volume += qty;
                    entityMap[cat].value += qty;
                    entityMap[cat].monetaryRevenue += itemRev;

                    grandVolume += qty;
                    grandValue += qty;
                    grandRevenue += itemRev;

                    const pName = item.name || 'Treasure';
                    if (!entityMap[cat].products[pName]) {
                        entityMap[cat].products[pName] = { name: pName, volume: 0, monetaryRevenue: 0 };
                    }
                    entityMap[cat].products[pName].volume += qty;
                    entityMap[cat].products[pName].monetaryRevenue += itemRev;
                });
            });
        } else if (metric === 'products') {
            productsCatalog.forEach(prod => {
                entityMap[prod.id] = {
                    key: prod.id,
                    name: prod.name,
                    subLabel: `${prod.category} • ₹${prod.price}`,
                    volume: 0,
                    value: 0,
                    monetaryRevenue: 0,
                    orders: []
                };
            });

            orders.forEach(order => {
                const orderDate = order.date ? new Date(order.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Recent';
                (order.items || []).forEach(item => {
                    const pId = item.id || 'DD-CUSTOM';
                    const qty = item.quantity || 1;
                    const itemRev = (item.price || 0) * qty;

                    if (!entityMap[pId]) {
                        entityMap[pId] = { key: pId, name: item.name || 'Artisan Piece', subLabel: item.category || 'Catalog Piece', volume: 0, value: 0, monetaryRevenue: 0, orders: [] };
                    }

                    entityMap[pId].volume += qty;
                    entityMap[pId].value += qty;
                    entityMap[pId].monetaryRevenue += itemRev;

                    grandVolume += qty;
                    grandValue += qty;
                    grandRevenue += itemRev;

                    entityMap[pId].orders.push({ id: order.id, date: orderDate, qty, rev: itemRev, customer: order.customer?.name || 'Customer' });
                });
            });
        } else if (metric === 'materials') {
            const materialDefinitions = [
                { id: 'pearl', label: 'Baroque & Freshwater Pearl', test: /pearl/i },
                { id: 'gold', label: '18k Gold-Plated Brass', test: /gold/i },
                { id: 'bead', label: 'Glazed Ceramic Beads & Charms', test: /bead|charm/i },
                { id: 'silver', label: 'Antique Silver Findings', test: /silver/i },
                { id: 'crepe', label: 'Hand-Painted Crepe & Velvet Paper', test: /crepe|paper/i },
                { id: 'cotton', label: 'Milk Cotton Yarn & Crochet Fiber', test: /cotton|yarn/i },
                { id: 'velvet', label: 'Velvet & Satin Ribbon Accents', test: /velvet|satin/i },
                { id: 'beeswax', label: 'Natural Scented Beeswax', test: /beeswax|candle/i }
            ];

            materialDefinitions.forEach(m => {
                entityMap[m.id] = { key: m.id, name: m.label, subLabel: 'Artisan Specification', volume: 0, value: 0, monetaryRevenue: 0, products: {} };
            });

            orders.forEach(order => {
                (order.items || []).forEach(item => {
                    const qty = item.quantity || 1;
                    const matText = ((item.materials || '') + ' ' + (item.name || '')).toLowerCase();
                    const itemRev = (item.price || 0) * qty;

                    materialDefinitions.forEach(m => {
                        if (m.test.test(matText)) {
                            entityMap[m.id].volume += qty;
                            entityMap[m.id].value += qty;
                            entityMap[m.id].monetaryRevenue += itemRev;

                            grandVolume += qty;
                            grandValue += qty;
                            grandRevenue += itemRev;

                            const pName = item.name || 'Piece';
                            if (!entityMap[m.id].products[pName]) {
                                entityMap[m.id].products[pName] = { name: pName, volume: 0, monetaryRevenue: 0 };
                            }
                            entityMap[m.id].products[pName].volume += qty;
                            entityMap[m.id].products[pName].monetaryRevenue += itemRev;
                        }
                    });
                });
            });
        }

        const sortedEntities = Object.values(entityMap).sort((a, b) => b.volume - a.volume);
        if (sortedEntities.length === 0 || grandVolume === 0) return { isEmpty: true };

        const path = [...this.olapState.entityPath];
        const crumbs = [
            { label: 'Analytics Root', depth: 0 },
            { label: metric.charAt(0).toUpperCase() + metric.slice(1), depth: 1, path: [] }
        ];

        let chartTitle = `${metric.toUpperCase()} Demand Distribution`;
        let chartSubtitle = `Click any bar to drill down into piece breakdown`;
        let chartBars = [];

        if (path.length === 0) {
            chartBars = sortedEntities.map(ent => ({
                key: ent.key,
                drillKey: ent.key,
                label: ent.name.length > 12 ? ent.name.substring(0, 11) + '…' : ent.name,
                fullLabel: ent.name,
                value: ent.volume,
                volume: ent.volume,
                revenue: ent.monetaryRevenue,
                tooltip: `<strong>${ent.name}</strong><br>` +
                         `${ent.volume} pieces ordered • ₹${ent.monetaryRevenue.toLocaleString()} revenue<br>` +
                         `<span style="color:#C7A15A; font-size:11px;">↘ Click bar to inspect breakdown</span>`
            }));
        } else {
            const selectedKey = path[0];
            const activeEnt = entityMap[selectedKey];
            if (activeEnt) {
                crumbs.push({ label: activeEnt.name, depth: 2, path: [selectedKey] });
                chartTitle = `${activeEnt.name} — Breakdown`;
                chartSubtitle = `Detailed product and order breakdown`;

                const subItems = activeEnt.products 
                    ? Object.values(activeEnt.products) 
                    : (activeEnt.orders ? activeEnt.orders.map(o => ({ name: `${o.id} (${o.date})`, volume: o.qty, monetaryRevenue: o.rev })) : []);

                chartBars = subItems.map(si => ({
                    key: si.name,
                    drillKey: si.name,
                    label: si.name.length > 14 ? si.name.substring(0, 13) + '…' : si.name,
                    fullLabel: si.name,
                    value: si.volume,
                    volume: si.volume,
                    revenue: si.monetaryRevenue,
                    tooltip: `<strong>${si.name}</strong><br>${si.volume} units • ₹${si.monetaryRevenue.toLocaleString()}`
                }));
            }
        }

        // Tree nodes for matrix table
        const treeNodes = [];
        sortedEntities.forEach(ent => {
            const hasKids = (ent.products && Object.keys(ent.products).length > 0) || (ent.orders && ent.orders.length > 0);
            treeNodes.push({
                key: ent.key,
                path: [ent.key],
                depth: 0,
                hasChildren: hasKids,
                label: ent.name,
                subLabel: ent.subLabel,
                volume: ent.volume,
                value: ent.value,
                monetaryRevenue: ent.monetaryRevenue,
                parentValue: grandValue,
                grandValue: grandValue
            });

            if (this.olapState.expandedNodes.has(ent.key)) {
                if (ent.products) {
                    Object.values(ent.products).forEach(p => {
                        treeNodes.push({
                            key: `${ent.key}-${p.name}`,
                            path: [ent.key, p.name],
                            depth: 1,
                            hasChildren: false,
                            label: p.name,
                            subLabel: 'Catalog Piece',
                            volume: p.volume,
                            value: p.volume,
                            monetaryRevenue: p.monetaryRevenue,
                            parentValue: ent.volume,
                            grandValue: grandValue
                        });
                    });
                } else if (ent.orders) {
                    ent.orders.forEach(o => {
                        treeNodes.push({
                            key: `${ent.key}-${o.id}`,
                            path: [ent.key, o.id],
                            depth: 1,
                            hasChildren: false,
                            label: `${o.id} — ${o.customer}`,
                            subLabel: o.date,
                            volume: o.qty,
                            value: o.qty,
                            monetaryRevenue: o.rev,
                            parentValue: ent.volume,
                            grandValue: grandValue
                        });
                    });
                }
            }
        });

        return {
            isEmpty: false,
            activeBreadcrumbs: crumbs,
            scopeKpis: {
                level: `${metric.toUpperCase()} Scope`,
                volume: `${grandVolume} pieces`,
                revenue: `₹${grandRevenue.toLocaleString()}`,
                peak: sortedEntities.length > 0 ? `Top: ${sortedEntities[0].name} (${sortedEntities[0].volume} pcs)` : '—'
            },
            chartData: {
                title: chartTitle,
                subtitle: chartSubtitle,
                bars: chartBars,
                metric: metric
            },
            nodes: treeNodes
        };
    },

    // ==================== DYNAMIC SYNCHRONIZED GRAPH RENDERER ====================
    renderDynamicChart(data) {
        const container = document.getElementById('olap-dynamic-chart-container');
        const titleEl = document.getElementById('olap-graph-title');
        const subEl = document.getElementById('olap-graph-subtitle');

        if (!container || !data) return;
        if (titleEl) titleEl.textContent = data.title;
        if (subEl) subEl.textContent = data.subtitle;

        const bars = data.bars || [];
        if (bars.length === 0) {
            container.innerHTML = `<div class="olap-empty-card" style="padding:30px;"><p>No records for this level.</p></div>`;
            return;
        }

        const maxVal = Math.max(...bars.map(b => b.value), 1);
        const svgW = 760;
        const svgH = 220;
        const padL = 50;
        const padR = 25;
        const padT = 30;
        const padB = 45;

        const plotW = svgW - padL - padR;
        const plotH = svgH - padT - padB;

        const barCount = bars.length;
        const barSlot = plotW / barCount;
        const barW = Math.max(Math.min(barSlot * 0.65, 42), 10);

        // Y-axis gridlines (0%, 50%, 100%)
        const y0 = padT + plotH;
        const y50 = padT + plotH / 2;
        const y100 = padT;

        const maxFormatted = data.metric === 'revenue' ? `₹${maxVal.toLocaleString()}` : maxVal;
        const midFormatted = data.metric === 'revenue' ? `₹${Math.round(maxVal / 2).toLocaleString()}` : Math.round(maxVal / 2);

        const gridHtml = `
            <line x1="${padL}" y1="${y100}" x2="${svgW - padR}" y2="${y100}" class="olap-grid-line" />
            <text x="${padL - 8}" y="${y100 + 4}" text-anchor="end" font-size="10" fill="#8A786D">${maxFormatted}</text>

            <line x1="${padL}" y1="${y50}" x2="${svgW - padR}" y2="${y50}" class="olap-grid-line" />
            <text x="${padL - 8}" y="${y50 + 4}" text-anchor="end" font-size="10" fill="#8A786D">${midFormatted}</text>

            <line x1="${padL}" y1="${y0}" x2="${svgW - padR}" y2="${y0}" stroke="rgba(99, 68, 47, 0.25)" stroke-width="1.5" />
            <text x="${padL - 8}" y="${y0 + 4}" text-anchor="end" font-size="10" fill="#8A786D">0</text>
        `;

        const barsHtml = bars.map((bar, idx) => {
            const h = (bar.value / maxVal) * plotH;
            const barH = Math.max(h, 4);
            const x = padL + idx * barSlot + (barSlot - barW) / 2;
            const y = y0 - barH;

            // Palette colors: deep teal (#315D5A), terracotta (#B96F5F), gold peak (#C7A15A)
            let fillColor = '#315D5A';
            if (bar.isPeak) fillColor = '#C7A15A';
            else if (idx % 2 === 1) fillColor = '#B96F5F';
            if (bar.value === 0) fillColor = 'rgba(99, 68, 47, 0.12)';

            const valueLabel = bar.value > 0 ? (data.metric === 'revenue' ? `₹${bar.value}` : bar.value) : '';

            // Show label every N items if barCount is large
            const showLabel = barCount <= 14 || (idx % (Math.ceil(barCount / 12)) === 0) || idx === barCount - 1;

            return `
                <g class="olap-bar-group"
                   onmousemove="AdminApp.showAnalyticsTooltip(event, '${bar.tooltip.replace(/'/g, "\\'")}')"
                   onmouseleave="AdminApp.hideAnalyticsTooltip()"
                   onclick="AdminApp.olapDrillDown('${bar.drillKey}')">
                    <rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="4"
                          fill="${fillColor}" class="olap-bar" />
                    ${valueLabel && barH > 16 ? `<text x="${x + barW/2}" y="${y - 6}" class="olap-bar-val">${valueLabel}</text>` : ''}
                    ${showLabel ? `<text x="${x + barW/2}" y="${y0 + 16}" class="olap-axis-label">${bar.label}</text>` : ''}
                </g>
            `;
        }).join('');

        container.innerHTML = `
            <svg class="olap-svg" viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg">
                ${gridHtml}
                ${barsHtml}
            </svg>
        `;
    },

    // ==================== EXPANDABLE / COLLAPSIBLE MATRIX (TREE TABLE) ====================
    renderOlapMatrix() {
        const tbody = document.getElementById('olap-matrix-tbody');
        if (!tbody || !this.olapState.currentCube) return;

        const nodes = this.olapState.currentCube.nodes || [];
        if (nodes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--admin-muted);">No records in matrix view.</td></tr>`;
            return;
        }

        const metric = this.olapState.metric;

        tbody.innerHTML = nodes.map(node => {
            const isExpanded = this.olapState.expandedNodes.has(node.key);
            const indentPx = node.depth * 22;
            const depthClass = `tree-row-depth-${Math.min(node.depth, 3)}`;

            // Tree guides
            let toggleHtml = '';
            if (node.hasChildren) {
                toggleHtml = `
                    <button class="tree-toggle-btn" onclick="event.stopPropagation(); AdminApp.olapToggleNode('${node.key}')" title="${isExpanded ? 'Collapse' : 'Expand'}">
                        ${isExpanded ? '▼' : '▶'}
                    </button>
                `;
            } else {
                toggleHtml = `<span class="tree-spacer"></span>`;
            }

            // Indent connector line
            const connectorSymbol = node.depth > 0 ? `<span class="tree-indent-guide">└─</span>` : '';

            // Percentage calculations
            const pctOfParent = node.parentValue > 0 ? ((node.value / node.parentValue) * 100).toFixed(1) + '%' : '100%';
            const pctOfGrand = node.grandValue > 0 ? ((node.value / node.grandValue) * 100).toFixed(1) + '%' : '100%';

            const valueFormatted = metric === 'revenue' 
                ? `₹${node.monetaryRevenue.toLocaleString()}` 
                : (metric === 'registrations' ? `${node.value} accounts` : `${node.value} pieces`);

            const volumeFormatted = `${node.volume} ${metric === 'registrations' ? 'signups' : 'pieces'}`;

            return `
                <tr class="${depthClass}" onclick="AdminApp.olapDrillTo([${node.path.map(p => `'${p}'`).join(',')}])" style="cursor: pointer;">
                    <td>
                        <div class="tree-node-cell" style="padding-left: ${indentPx}px;">
                            ${connectorSymbol}
                            ${toggleHtml}
                            <span class="tree-node-title">
                                <strong>${node.label}</strong>
                            </span>
                        </div>
                    </td>
                    <td><span style="color:var(--admin-muted); font-size:11.5px;">${node.subLabel || '—'}</span></td>
                    <td style="text-align: right; font-weight: 500;">${volumeFormatted}</td>
                    <td style="text-align: right; font-weight: 600; color: var(--admin-teal);">${valueFormatted}</td>
                    <td style="text-align: right; color: var(--admin-text);">${pctOfParent}</td>
                    <td style="text-align: right; color: var(--admin-muted);">${pctOfGrand}</td>
                    <td style="text-align: center;">
                        <button class="btn-tree-drill" onclick="event.stopPropagation(); AdminApp.olapDrillTo([${node.path.map(p => `'${p}'`).join(',')}])">
                            Drill In ↘
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }
};

window.AdminApp = AdminApp;

