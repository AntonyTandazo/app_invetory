// ============================================================
// SALES.JS
// ============================================================
const Sales = {
  products: [],
  clients: [],
  cart: [],
  selectedClient: null,

  async load() {
    const page = document.getElementById('page-sales');
    const [productsRes, clientsRes] = await Promise.all([
      API.products.getAll(),
      API.clients.getAll(),
    ]);
    this.products = productsRes.ok ? productsRes.data : [];
    this.clients = clientsRes.ok ? clientsRes.data : [];
    this.cart = [];
    this.selectedClient = null;

    page.innerHTML = `
      <div class="page-header">
        <div><h1 class="page-title">Gestión de Ventas</h1><p class="page-subtitle">Registra ventas y servicios</p></div>
      </div>
      <div class="tabs">
        <button class="tab-btn active" data-tab="tab-venta">🛒 Venta de Productos</button>
        <button class="tab-btn" data-tab="tab-proforma">📄 Proforma</button>
        <button class="tab-btn" data-tab="tab-servicio">🔧 Servicio / Reparación</button>
        <button class="tab-btn" data-tab="tab-historial">📋 Historial de Ventas</button>
      </div>

      <!-- Tab: Venta -->
      <div class="tab-panel active" id="tab-venta">
        <div class="split-layout">
          <!-- Left: Product catalog -->
          <div class="split-left">
            <div class="panel-header">
              <span class="panel-title">Catálogo de Productos</span>
              <div class="search-input-wrap" style="width:200px">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" id="sale-search" class="search-input" style="width:100%" placeholder="Buscar..."/>
              </div>
            </div>
            <div class="panel-body">
              <div class="products-grid-sm" id="sale-products-grid"></div>
            </div>
          </div>

          <!-- Right: Cart -->
          <div class="split-right">
            <div class="panel-header">
              <span class="panel-title">🛒 Orden de Venta</span>
              <button class="btn btn-ghost btn-sm" onclick="Sales.clearCart()">Limpiar</button>
            </div>
            <div class="panel-header" style="border-top:none;padding-top:0">
              <div style="display:flex;gap:var(--sp-2);align-items:center;flex:1">
                <input type="text" id="client-search-input" class="form-input" style="flex:1" placeholder="Buscar cliente..."/>
                <button class="btn btn-secondary btn-sm" onclick="Sales.searchClient()">👤</button>
              </div>
            </div>
            <div id="selected-client-info" style="padding:0 var(--sp-4) var(--sp-2);font-size:var(--fs-sm);color:var(--color-text-muted)"></div>

            <div class="panel-body" id="cart-items-list" style="padding:var(--sp-3)">
              <div class="table-empty" id="cart-empty"><span class="empty-icon">🛒</span>Agrega productos al carrito</div>
            </div>

            <div class="cart-summary">
              <div class="cart-total-row"><span>Subtotal</span><span id="cart-subtotal">$0.00</span></div>
              <!-- IVA + Descuento a todos -->
              <div style="display:flex;gap:var(--sp-3);align-items:center;padding:var(--sp-2) 0;border-top:1px solid var(--color-border-soft)">
                <label style="display:flex;align-items:center;gap:var(--sp-2);cursor:pointer;flex:1">
                  <input type="checkbox" id="cart-iva-check" onchange="Sales.recalcCart()" style="width:16px;height:16px"/>
                  <span style="font-size:var(--fs-sm)">IVA (<span id="cart-iva-pct">15</span>%)</span>
                </label>
                <div style="display:flex;align-items:center;gap:4px;flex:1">
                  <span style="font-size:var(--fs-sm);white-space:nowrap">Dto %</span>
                  <input type="number" id="cart-dto-all" class="form-input" value="0" min="0" max="100" step="1"
                         style="width:60px;padding:4px 6px;font-size:var(--fs-sm)"/>
                  <button class="btn btn-ghost btn-sm" onclick="Sales.applyDtoAll()" title="Aplicar a todos">✓</button>
                </div>
              </div>
              <div id="cart-dto-row" style="display:none" class="cart-total-row"><span id="cart-dto-label">Descuentos</span><span id="cart-dto-amt" style="color:var(--color-green)">-$0.00</span></div>
              <div id="cart-iva-row" style="display:none" class="cart-total-row"><span id="cart-iva-label">IVA (15%)</span><span id="cart-iva-amt">$0.00</span></div>
              <div class="cart-total-row grand"><span>TOTAL</span><span id="cart-total">$0.00</span></div>
              <button class="btn btn-success w-full mt-4" style="margin-top:var(--sp-3)" onclick="Sales.openCheckout()">💳 Cobrar</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: Proforma -->
      <div class="tab-panel" id="tab-proforma">
        <div class="split-layout">
          <!-- Left: Product catalog -->
          <div class="split-left">
            <div class="panel-header">
              <span class="panel-title">Catálogo de Productos</span>
              <div class="search-input-wrap" style="width:200px">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" id="pf-search" class="search-input" style="width:100%" placeholder="Buscar..."/>
              </div>
            </div>
            <div class="panel-body">
              <div class="products-grid-sm" id="pf-products-grid"></div>
            </div>
          </div>
          <!-- Right: Proforma cart -->
          <div class="split-right">
            <div class="panel-header">
              <span class="panel-title">📄 Proforma / Cotización</span>
              <button class="btn btn-ghost btn-sm" onclick="Sales.clearProforma()">Limpiar</button>
            </div>
            <div class="panel-header" style="border-top:none;padding-top:0">
              <div style="position:relative;flex:1">
                <input type="text" id="pf-client-search" class="form-input" placeholder="Buscar cliente..." autocomplete="off" oninput="Sales.filterProformaClients(this.value)"/>
                <div id="pf-client-dropdown" style="position:absolute;top:100%;left:0;right:0;background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-md);max-height:160px;overflow-y:auto;z-index:200;display:none"></div>
              </div>
            </div>
            <div id="pf-client-info" style="padding:0 var(--sp-4) var(--sp-2);font-size:var(--fs-sm);color:var(--color-text-muted)"></div>
            <div class="panel-body" id="pf-items-list" style="padding:var(--sp-3)">
              <div class="table-empty" id="pf-empty"><span class="empty-icon">📄</span>Agrega productos a la proforma</div>
            </div>
            <div class="cart-summary">
              <div class="cart-total-row"><span>Subtotal</span><span id="pf-subtotal">$0.00</span></div>
              <div style="display:flex;gap:var(--sp-3);align-items:center;padding:var(--sp-2) 0;border-top:1px solid var(--color-border-soft)">
                <label style="display:flex;align-items:center;gap:var(--sp-2);cursor:pointer;flex:1">
                  <input type="checkbox" id="pf-iva-check" onchange="Sales.recalcProforma()" style="width:16px;height:16px"/>
                  <span style="font-size:var(--fs-sm)">IVA (<span id="pf-iva-pct">15</span>%)</span>
                </label>
                <div style="display:flex;align-items:center;gap:4px;flex:1">
                  <span style="font-size:var(--fs-sm);white-space:nowrap">Dto %</span>
                  <input type="number" id="pf-dto-all" class="form-input" value="0" min="0" max="100" step="1"
                         style="width:60px;padding:4px 6px;font-size:var(--fs-sm)"/>
                  <button class="btn btn-ghost btn-sm" onclick="Sales.applyPfDtoAll()" title="Aplicar a todos">✓</button>
                </div>
              </div>
              <div id="pf-dto-row" style="display:none" class="cart-total-row"><span id="pf-dto-label">Descuentos</span><span id="pf-dto-amt" style="color:var(--color-green)">-$0.00</span></div>
              <div id="pf-iva-row" style="display:none" class="cart-total-row"><span id="pf-iva-label">IVA</span><span id="pf-iva-amt">$0.00</span></div>
              <div class="cart-total-row grand"><span>TOTAL</span><span id="pf-total">$0.00</span></div>
              <button class="btn btn-primary w-full" style="margin-top:var(--sp-3)" onclick="Sales.exportProformaPdf()">🖨️ Exportar Proforma PDF</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: Service -->
      <div class="tab-panel" id="tab-servicio">
        <div class="split-layout">
          <div class="split-left">
            <div class="panel-header"><span class="panel-title">Detalle del Servicio</span></div>
            <div class="panel-body">
              <div class="form-group mb-4">
                <label class="form-label">Descripción del Servicio <span class="form-required">*</span></label>
                <textarea id="svc-descripcion" class="form-textarea" placeholder="ej. Reparación de cañería, instalación de motor..."></textarea>
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Costo del Servicio</label>
                  <input type="number" id="svc-costo" class="form-input" placeholder="0.00" min="0" step="0.01"/>
                </div>
                <div class="form-group">
                  <label class="form-label">Fecha estimada entrega</label>
                  <input type="date" id="svc-fecha" class="form-input"/>
                </div>
                <div class="form-group">
                  <label class="form-label">Repartidor / Técnico</label>
                  <input type="text" id="svc-repartidor" class="form-input" placeholder="Nombre del técnico"/>
                </div>
                <div class="form-group">
                  <label class="form-label">Dirección</label>
                  <input type="text" id="svc-direccion" class="form-input" placeholder="Dirección de entrega"/>
                </div>
              </div>
            </div>
          </div>

          <div class="split-right">
            <div class="panel-header"><span class="panel-title">Cliente & Cobro</span></div>
            <div class="panel-body">
              <div class="form-group mb-4">
                <label class="form-label">Buscar Cliente</label>
                <div style="position:relative">
                  <input type="text" id="svc-client-search" class="form-input" placeholder="Escribe nombre o cédula..." autocomplete="off" oninput="Sales.filterServiceClients(this.value)"/>
                  <div id="svc-client-dropdown" style="position:absolute;top:100%;left:0;right:0;background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-md);max-height:160px;overflow-y:auto;z-index:200;display:none"></div>
                </div>
              </div>
              <div id="svc-client-info" style="font-size:var(--fs-sm);color:var(--color-text-muted);margin-bottom:var(--sp-4)"></div>
              <div class="form-group mb-4">
                <label class="form-label">Notas adicionales</label>
                <textarea id="svc-notas" class="form-textarea" placeholder="Observaciones..."></textarea>
              </div>
            </div>
            <div class="cart-summary">
              <div class="cart-total-row grand"><span>TOTAL SERVICIO</span><span id="svc-total-display">$0.00</span></div>
              <button class="btn btn-success w-full" style="margin-top:var(--sp-3)" onclick="Sales.openServiceCheckout()">💳 Cobrar Servicio</button>
            </div>
          </div>
        </div>
      </div>


      <!-- Tab: History -->
      <div class="tab-panel" id="tab-historial">
        <div class="table-card">
          <div class="table-header">
            <span class="table-title">Historial de Ventas</span>
            <div class="search-input-wrap" style="width:220px">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" id="hist-search" class="search-input" placeholder="Buscar..."/>
            </div>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Método</th><th>Estado</th><th></th></tr></thead>
              <tbody id="sales-history-body"><tr><td colspan="7" class="table-empty"><div class="spinner"></div></td></tr></tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Setup tabs (scoped to this page only)
    const tabPage = document.getElementById('page-sales');
    tabPage.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        tabPage.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        tabPage.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab)?.classList.add('active');
        if (btn.dataset.tab === 'tab-historial') this.loadHistory();
        if (btn.dataset.tab === 'tab-proforma') {
          // populate IVA % label and product grid for proforma
          const ivaPct = Settings.getIva();
          const pfIvaPct = document.getElementById('pf-iva-pct');
          if (pfIvaPct) pfIvaPct.textContent = ivaPct;
          this.renderProformaGrid(this.products);
          const pfSearch = document.getElementById('pf-search');
          if (pfSearch && !pfSearch._bound) {
            pfSearch._bound = true;
            pfSearch.addEventListener('input', e => {
              const s = e.target.value.toLowerCase();
              Sales.renderProformaGrid(Sales.products.filter(p => p.nombre.toLowerCase().includes(s) || (p.codigo || '').toLowerCase().includes(s)));
            });
          }
        }
        // Attach service cost listener when switching to that tab
        if (btn.dataset.tab === 'tab-servicio') {
          const costoEl = document.getElementById('svc-costo');
          if (costoEl && !costoEl._bound) {
            costoEl._bound = true;
            costoEl.addEventListener('input', e => {
              const disp = document.getElementById('svc-total-display');
              if (disp) disp.textContent = fmt(parseFloat(e.target.value) || 0);
            });
          }
        }
      });
    });

    this.renderProductGrid(this.products);

    // Populate IVA % in cart
    const ivaPct = Settings.getIva();
    const cartIvaPct = document.getElementById('cart-iva-pct');
    if (cartIvaPct) cartIvaPct.textContent = ivaPct;

    document.getElementById('sale-search').addEventListener('input', e => {
      const s = e.target.value.toLowerCase();
      this.renderProductGrid(this.products.filter(p => p.nombre.toLowerCase().includes(s) || (p.codigo || '').toLowerCase().includes(s)));
    });
  },

  renderProductGrid(products) {
    const grid = document.getElementById('sale-products-grid');
    if (grid) {
      grid.innerHTML = products.map(p => `
        <div class="product-card-sm" onclick="Sales.addToCart('${p.id}')">
          <div class="p-name">${p.nombre}</div>
          <div class="p-price">${fmt(p.precio)}</div>
          <div class="p-stock">Stock: ${p.stock_actual}</div>
        </div>`).join('');
    }
  },

  renderProformaGrid(products) {
    const grid = document.getElementById('pf-products-grid');
    if (grid) {
      grid.innerHTML = products.map(p => `
        <div class="product-card-sm" onclick="Sales.addToProforma('${p.id}')">
          <div class="p-name">${p.nombre}</div>
          <div class="p-price">${fmt(p.precio)}</div>
          <div class="p-stock">Stock: ${p.stock_actual}</div>
        </div>`).join('');
    }
  },

  addToCart(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;
    const stock = Number(product.stock_actual) || 0;
    const existing = this.cart.find(i => i.producto_id === productId);
    if (existing) {
      if (existing.cantidad >= stock) {
        Toast.show(`⚠️ Stock máximo alcanzado (${stock} unid.)`, 'warning');
        return;
      }
      existing.cantidad++;
    } else {
      if (stock <= 0) { Toast.show('Sin stock disponible', 'warning'); return; }
      this.cart.push({ producto_id: productId, nombre: product.nombre, precio: Number(product.precio), cantidad: 1, descuento: 0 });
    }
    this.renderCart();
  },

  renderCart() {
    const list = document.getElementById('cart-items-list');
    if (!list) return;
    if (this.cart.length === 0) {
      list.innerHTML = `<div class="table-empty" id="cart-empty"><span class="empty-icon">🛒</span>Agrega productos al carrito</div>`;
      document.getElementById('cart-subtotal').textContent = fmt(0);
      document.getElementById('cart-total').textContent = fmt(0);
      return;
    }
    list.innerHTML = this.cart.map((item, idx) => `
      <div class="cart-item">
        <div class="cart-item-name" style="min-width:100px">${item.nombre}</div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="Sales.changeQty(${idx}, -1)">−</button>
          <input type="number" class="qty-input" value="${item.cantidad}" min="1" onchange="Sales.setQty(${idx}, this.value)"/>
          <button class="qty-btn" onclick="Sales.changeQty(${idx}, 1)">+</button>
        </div>
        <div style="display:flex;align-items:center;gap:2px">
          <input type="number" class="qty-input" value="${item.descuento || 0}" min="0" max="100" step="1"
                 style="width:45px" onchange="Sales.setItemDto(${idx}, this.value)"/>
          <span style="font-size:var(--fs-xs);color:var(--color-text-muted)">%</span>
        </div>
        <div class="cart-item-price">${fmt(item.precio * (1 - (item.descuento || 0) / 100) * item.cantidad)}</div>
        <button class="btn btn-ghost btn-sm" onclick="Sales.removeFromCart(${idx})">✕</button>
      </div>`).join('');
    this.recalcCart();
  },

  setItemDto(idx, val) {
    const v = Math.min(100, Math.max(0, parseFloat(val) || 0));
    this.cart[idx].descuento = v;
    this.renderCart();
  },

  applyDtoAll() {
    const v = Math.min(100, Math.max(0, parseFloat(document.getElementById('cart-dto-all')?.value) || 0));
    this.cart.forEach(i => { i.descuento = v; });
    this.renderCart();
    Toast.show(`Descuento de ${v}% aplicado a todos`, 'success');
  },

  recalcCart() {
    const totalDtos = this.cart.reduce((s, i) => s + i.precio * (i.descuento || 0) / 100 * i.cantidad, 0);
    const subtotal = this.cart.reduce((s, i) => s + i.precio * (1 - (i.descuento || 0) / 100) * i.cantidad, 0);
    const ivaPct = Settings.getIva();
    const ivaChecked = document.getElementById('cart-iva-check')?.checked || false;
    const ivaMonto = ivaChecked ? subtotal * ivaPct / 100 : 0;
    const total = subtotal + ivaMonto;

    const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
    const show = (id, visible) => { const el = document.getElementById(id); if (el) el.style.display = visible ? '' : 'none'; };

    set('cart-subtotal', fmt(subtotal));
    set('cart-iva-label', `IVA (${ivaPct}%)`);
    set('cart-iva-amt', fmt(ivaMonto));
    set('cart-dto-label', `Descuentos`);
    set('cart-dto-amt', `-${fmt(totalDtos)}`);
    set('cart-total', fmt(total));
    show('cart-iva-row', ivaChecked);
    show('cart-dto-row', totalDtos > 0);
  },

  changeQty(idx, delta) {
    const item = this.cart[idx];
    const product = this.products.find(p => p.id === item.producto_id);
    const stock = Number(product?.stock_actual) || Infinity;
    const newQty = Math.max(1, item.cantidad + delta);
    if (newQty > stock) { Toast.show(`⚠️ Stock máximo: ${stock} unid.`, 'warning'); return; }
    item.cantidad = newQty;
    this.renderCart();
  },
  setQty(idx, value) {
    const item = this.cart[idx];
    const product = this.products.find(p => p.id === item.producto_id);
    const stock = Number(product?.stock_actual) || Infinity;
    const newQty = Math.max(1, parseInt(value) || 1);
    if (newQty > stock) {
      Toast.show(`⚠️ Stock máximo: ${stock} unid. Se ajustó automáticamente.`, 'warning');
      item.cantidad = stock;
    } else {
      item.cantidad = newQty;
    }
    this.renderCart();
  },
  removeFromCart(idx) { this.cart.splice(idx, 1); this.renderCart(); },
  clearCart() {
    this.cart = [];
    this.selectedClient = null;
    const info = document.getElementById('selected-client-info');
    if (info) info.textContent = '';
    const ivaCheck = document.getElementById('cart-iva-check');
    if (ivaCheck) ivaCheck.checked = false;
    const dtoAll = document.getElementById('cart-dto-all');
    if (dtoAll) dtoAll.value = '0';
    this.renderCart();
  },

  // ── Proforma state ──
  proformaCart: [],
  proformaClient: null,

  addToProforma(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;
    const stock = Number(product.stock_actual) || 0;
    const existing = this.proformaCart.find(i => i.producto_id === productId);
    if (existing) {
      if (existing.cantidad >= stock) { Toast.show(`⚠️ Stock máximo alcanzado (${stock} unid.)`, 'warning'); return; }
      existing.cantidad++;
    } else {
      if (stock <= 0) { Toast.show('Sin stock disponible', 'warning'); return; }
      this.proformaCart.push({ producto_id: productId, nombre: product.nombre, precio: Number(product.precio), cantidad: 1, codigo: product.codigo || '', descuento: 0 });
    }
    this.renderProformaCart();
  },

  renderProformaCart() {
    const list = document.getElementById('pf-items-list');
    if (!list) return;
    if (this.proformaCart.length === 0) {
      list.innerHTML = `<div class="table-empty" id="pf-empty"><span class="empty-icon">📄</span>Agrega productos a la proforma</div>`;
      document.getElementById('pf-subtotal').textContent = fmt(0);
      document.getElementById('pf-total').textContent = fmt(0);
      return;
    }
    list.innerHTML = this.proformaCart.map((item, idx) => `
      <div class="cart-item">
        <div class="cart-item-name" style="min-width:100px">${item.nombre}</div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="Sales.changePfQty(${idx}, -1)">−</button>
          <input type="number" class="qty-input" value="${item.cantidad}" min="1" onchange="Sales.setPfQty(${idx}, this.value)"/>
          <button class="qty-btn" onclick="Sales.changePfQty(${idx}, 1)">+</button>
        </div>
        <div style="display:flex;align-items:center;gap:2px">
          <input type="number" class="qty-input" value="${item.descuento || 0}" min="0" max="100" step="1"
                 style="width:45px" onchange="Sales.setPfItemDto(${idx}, this.value)"/>
          <span style="font-size:var(--fs-xs);color:var(--color-text-muted)">%</span>
        </div>
        <div class="cart-item-price">${fmt(item.precio * (1 - (item.descuento || 0) / 100) * item.cantidad)}</div>
        <button class="btn btn-ghost btn-sm" onclick="Sales.removePfItem(${idx})">✕</button>
      </div>`).join('');
    this.recalcProforma();
  },

  changePfQty(idx, delta) {
    const item = this.proformaCart[idx];
    const product = this.products.find(p => p.id === item.producto_id);
    const stock = Number(product?.stock_actual) || Infinity;
    const newQty = Math.max(1, item.cantidad + delta);
    if (newQty > stock) { Toast.show(`⚠️ Stock máximo: ${stock} unid.`, 'warning'); return; }
    item.cantidad = newQty;
    this.renderProformaCart();
  },
  setPfQty(idx, v) {
    const item = this.proformaCart[idx];
    const product = this.products.find(p => p.id === item.producto_id);
    const stock = Number(product?.stock_actual) || Infinity;
    const newQty = Math.max(1, parseInt(v) || 1);
    if (newQty > stock) {
      Toast.show(`⚠️ Stock máximo: ${stock} unid. Se ajustó automáticamente.`, 'warning');
      item.cantidad = stock;
    } else {
      item.cantidad = newQty;
    }
    this.renderProformaCart();
  },
  removePfItem(idx) { this.proformaCart.splice(idx, 1); this.renderProformaCart(); },
  setPfItemDto(idx, val) {
    const v = Math.min(100, Math.max(0, parseFloat(val) || 0));
    this.proformaCart[idx].descuento = v;
    this.renderProformaCart();
  },

  applyPfDtoAll() {
    const v = Math.min(100, Math.max(0, parseFloat(document.getElementById('pf-dto-all')?.value) || 0));
    this.proformaCart.forEach(i => { i.descuento = v; });
    this.renderProformaCart();
    Toast.show(`Descuento de ${v}% aplicado a todos`, 'success');
  },

  clearProforma() {
    this.proformaCart = [];
    this.proformaClient = null;
    const info = document.getElementById('pf-client-info');
    if (info) info.textContent = '';
    const search = document.getElementById('pf-client-search');
    if (search) search.value = '';
    const ivaCheck = document.getElementById('pf-iva-check');
    if (ivaCheck) ivaCheck.checked = false;
    const dtoAll = document.getElementById('pf-dto-all');
    if (dtoAll) dtoAll.value = '0';
    this.renderProformaCart();
  },

  recalcProforma() {
    const totalDtos = this.proformaCart.reduce((s, i) => s + i.precio * (i.descuento || 0) / 100 * i.cantidad, 0);
    const subtotal = this.proformaCart.reduce((s, i) => s + i.precio * (1 - (i.descuento || 0) / 100) * i.cantidad, 0);
    const ivaPct = Settings.getIva();
    const ivaChecked = document.getElementById('pf-iva-check')?.checked || false;
    const ivaMonto = ivaChecked ? subtotal * ivaPct / 100 : 0;
    const total = subtotal + ivaMonto;
    const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
    const show = (id, visible) => { const el = document.getElementById(id); if (el) el.style.display = visible ? '' : 'none'; };
    set('pf-subtotal', fmt(subtotal));
    set('pf-iva-label', `IVA (${ivaPct}%)`);
    set('pf-iva-amt', fmt(ivaMonto));
    set('pf-dto-label', `Descuentos`);
    set('pf-dto-amt', `-${fmt(totalDtos)}`);
    set('pf-total', fmt(total));
    show('pf-iva-row', ivaChecked);
    show('pf-dto-row', totalDtos > 0);
  },

  filterProformaClients(q) {
    const dd = document.getElementById('pf-client-dropdown');
    if (!dd) return;
    if (!q || q.length < 1) { dd.style.display = 'none'; return; }
    const matches = (this.clients || []).filter(c =>
      c.nombre.toLowerCase().includes(q.toLowerCase()) ||
      (c.cedula_ruc || '').includes(q)
    ).slice(0, 8);
    if (matches.length === 0) { dd.style.display = 'none'; return; }
    dd.style.display = 'block';
    dd.innerHTML = matches.map(c => `
      <div style="padding:var(--sp-2) var(--sp-3);cursor:pointer;border-bottom:1px solid var(--color-border-soft);font-size:var(--fs-sm);"
           onmousedown="Sales.selectProformaClient('${c.id}')">
        <strong>${c.nombre}</strong><span style="color:var(--color-text-muted);margin-left:8px">${c.telefono || ''}</span>
      </div>`).join('');
  },

  selectProformaClient(id) {
    const c = (this.clients || []).find(c => c.id === id);
    if (!c) return;
    this.proformaClient = c;
    const searchEl = document.getElementById('pf-client-search');
    if (searchEl) searchEl.value = c.nombre;
    const dd = document.getElementById('pf-client-dropdown');
    if (dd) dd.style.display = 'none';
    const info = document.getElementById('pf-client-info');
    if (info) info.innerHTML = `<strong style="color:var(--color-green)">✅ ${c.nombre}</strong> — ${c.telefono || ''}`;
  },


  searchClient() {
    const q = document.getElementById('client-search-input').value.trim().toLowerCase();
    const found = this.clients.filter(c => c.nombre.toLowerCase().includes(q) || (c.cedula_ruc || '').includes(q));
    if (found.length === 0) { Toast.show('Cliente no encontrado', 'warning'); return; }
    if (found.length === 1) { this.selectClient(found[0]); return; }
    Modal.open('Seleccionar Cliente', `
      <div style="max-height:300px;overflow-y:auto">
        ${found.map(c => `<div class="cart-item" style="cursor:pointer" onclick="Sales.selectClient(${JSON.stringify(c).replace(/"/g, '&quot;')});Modal.close()">
          <div><strong>${c.nombre}</strong><br/><span class="text-muted">${c.cedula_ruc || ''} | ${c.telefono || ''}</span></div>
        </div>`).join('')}
      </div>`);
  },

  selectClient(client) {
    this.selectedClient = client;
    const info = document.getElementById('selected-client-info');
    if (info) info.innerHTML = `<strong style="color:var(--color-green)">✅ ${client.nombre}</strong> — ${client.telefono || ''} ${client.deuda > 0 ? `<span class="text-red">(Deuda: ${fmt(client.deuda)})</span>` : ''}`;
    Modal.close();
  },

  openCheckout() {
    if (this.cart.length === 0) { Toast.show('El carrito está vacío', 'warning'); return; }
    if (!this.selectedClient) { Toast.show('⚠️ Debes seleccionar un cliente antes de cobrar', 'warning'); return; }
    const dtoMonto = this.cart.reduce((s, i) => s + i.precio * (i.descuento || 0) / 100 * i.cantidad, 0);
    const subtotal = this.cart.reduce((s, i) => s + i.precio * (1 - (i.descuento || 0) / 100) * i.cantidad, 0);
    const ivaPct = Settings.getIva();
    const ivaChecked = document.getElementById('cart-iva-check')?.checked || false;
    const ivaMonto = ivaChecked ? subtotal * ivaPct / 100 : 0;
    const total = subtotal + ivaMonto;
    this._checkoutMeta = { subtotal, dtoMonto, ivaPct, ivaMonto, ivaChecked, total };
    const clienteDeudaActual = Number(this.selectedClient.deuda) || 0;
    Modal.open('Cobrar Venta', `
      <div style="background:var(--color-surface-2);border-radius:var(--radius-md);padding:var(--sp-3) var(--sp-4);margin-bottom:var(--sp-4)">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div><strong style="color:var(--color-accent)">${this.selectedClient.nombre}</strong><br/><span style="font-size:var(--fs-xs);color:var(--color-text-muted)">${this.selectedClient.telefono || ''}</span></div>
          ${clienteDeudaActual > 0 ? `<span class="badge badge-red">Deuda previa: ${fmt(clienteDeudaActual)}</span>` : '<span class="badge badge-green">Sin deuda</span>'}
        </div>
        <p style="font-size:var(--fs-2xl);font-weight:800;color:var(--color-green);margin-top:var(--sp-2)">Total: ${fmt(total)}</p>
      </div>

      <p class="form-label" style="margin-bottom:var(--sp-2)">Tipo de Pago</p>
      <div style="display:flex;gap:var(--sp-2);margin-bottom:var(--sp-4)">
        <label style="flex:1;cursor:pointer">
          <input type="radio" name="ck-tipo-pago" value="total" id="ck-tp-total" checked onchange="Sales.onPayTypeChange(${total})" style="display:none"/>
          <div class="pay-option" id="popt-total" data-active="true">✅ Pago Total</div>
        </label>
        <label style="flex:1;cursor:pointer">
          <input type="radio" name="ck-tipo-pago" value="parcial" id="ck-tp-parcial" onchange="Sales.onPayTypeChange(${total})" style="display:none"/>
          <div class="pay-option" id="popt-parcial">💸 Avance / Parcial</div>
        </label>
        <label style="flex:1;cursor:pointer">
          <input type="radio" name="ck-tipo-pago" value="deuda" id="ck-tp-deuda" onchange="Sales.onPayTypeChange(${total})" style="display:none"/>
          <div class="pay-option" id="popt-deuda">📋 Queda Debiendo</div>
        </label>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Método de Pago</label>
          <select id="ck-metodo" class="form-select">
            <option value="efectivo">💵 Efectivo</option>
            <option value="tarjeta">💳 Tarjeta</option>
            <option value="transferencia">🏦 Transferencia</option>
          </select>
        </div>
        <div class="form-group" id="ck-monto-group">
          <label class="form-label">Monto Pagado</label>
          <input type="number" id="ck-pagado" class="form-input" value="${total}" min="0" step="0.01" oninput="Sales.onPayAmountChange(${total})"/>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Dirección de entrega (opcional)</label>
          <input type="text" id="ck-direccion" class="form-input" value="${this.selectedClient?.direccion || ''}" placeholder="Dirección..."/>
        </div>
      </div>
      <div id="ck-result-box" style="background:var(--color-surface-2);border-radius:var(--radius-md);padding:var(--sp-3) var(--sp-4);margin-bottom:var(--sp-3)">
        <div style="display:flex;justify-content:space-between"><span>Total compra</span><strong>${fmt(total)}</strong></div>
        <div style="display:flex;justify-content:space-between"><span>Monto pagado</span><strong id="ck-res-pagado">${fmt(total)}</strong></div>
        <div style="display:flex;justify-content:space-between;margin-top:var(--sp-1)"><span id="ck-res-label">Vuelto</span><strong id="ck-res-valor" style="color:var(--color-green)">${fmt(0)}</strong></div>
      </div>
      <div class="form-actions">
        <button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button>
        <button class="btn btn-success" onclick="Sales.finalizeSale(${total})">✅ Confirmar Venta</button>
      </div>
    `, { lg: true });
    // Hook radio buttons (event delegation since innerHTML)
    document.querySelectorAll('input[name="ck-tipo-pago"]').forEach(r => {
      r.addEventListener('change', () => Sales.onPayTypeChange(total));
    });
  },

  onPayTypeChange(total) {
    const tipo = document.querySelector('input[name="ck-tipo-pago"]:checked')?.value || 'total';
    const pagadoInput = document.getElementById('ck-pagado');
    const montoGroup = document.getElementById('ck-monto-group');
    ['popt-total', 'popt-parcial', 'popt-deuda'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.setAttribute('data-active', id.includes(tipo) ? 'true' : 'false');
    });
    if (tipo === 'total') { if (pagadoInput) { pagadoInput.value = total; pagadoInput.readOnly = true; } }
    else if (tipo === 'deuda') { if (pagadoInput) { pagadoInput.value = 0; pagadoInput.readOnly = true; } }
    else { if (pagadoInput) { pagadoInput.readOnly = false; } }
    this.onPayAmountChange(total);
  },

  onPayAmountChange(total) {
    const pagado = parseFloat(document.getElementById('ck-pagado')?.value) || 0;
    const diff = pagado - total;
    const label = document.getElementById('ck-res-label');
    const valor = document.getElementById('ck-res-valor');
    const resPagado = document.getElementById('ck-res-pagado');
    if (resPagado) resPagado.textContent = fmt(pagado);
    if (diff >= 0) {
      if (label) label.textContent = 'Vuelto';
      if (valor) { valor.textContent = fmt(diff); valor.style.color = 'var(--color-green)'; }
    } else {
      if (label) label.textContent = 'Queda debiendo';
      if (valor) { valor.textContent = fmt(Math.abs(diff)); valor.style.color = 'var(--color-red)'; }
    }
  },

  async finalizeSale(total) {
    const meta = this._checkoutMeta || {};
    total = meta.total || total || this.cart.reduce((s, i) => s + i.precio * i.cantidad, 0);
    const tipo = document.querySelector('input[name="ck-tipo-pago"]:checked')?.value || 'total';
    let montoPagado;
    if (tipo === 'total') montoPagado = total;
    else if (tipo === 'deuda') montoPagado = 0;
    else montoPagado = parseFloat(document.getElementById('ck-pagado').value) || 0;
    const data = {
      cliente_id: this.selectedClient?.id || '',
      cliente_nombre: this.selectedClient?.nombre || '',
      items: this.cart,
      metodo_pago: document.getElementById('ck-metodo').value,
      monto_pagado: montoPagado,
      tipo: 'venta',
      direccion: document.getElementById('ck-direccion').value,
      descuento_pct: 0,
      descuento_monto: meta.dtoMonto || 0,
      iva_pct: meta.ivaChecked ? (meta.ivaPct || 0) : 0,
      iva_monto: meta.ivaMonto || 0,
      total_final: total,
    };
    const btn = document.querySelector('#modal-box .btn-success');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Guardando...'; }
    const res = await API.sales.register(data);
    if (res.ok) {
      const deuda = Math.max(0, total - montoPagado);
      const receiptData = {
        id: res.data?.sale?.id || ('VTA-' + Date.now()),
        cliente_nombre: data.cliente_nombre,
        items: data.items,
        total,
        subtotal: meta.subtotal || total,
        descuento_pct: 0,
        descuento_monto: meta.dtoMonto || 0,
        iva_pct: meta.ivaChecked ? (meta.ivaPct || 0) : 0,
        iva_monto: meta.ivaMonto || 0,
        monto_pagado: montoPagado,
        metodo_pago: data.metodo_pago,
        direccion: data.direccion,
        fecha: new Date().toISOString()
      };
      Modal.open('Venta Registrada', `
        <div style="text-align:center;padding:var(--sp-4) 0">
          <div style="font-size:3rem;margin-bottom:var(--sp-3)">✅</div>
          <h3 style="margin-bottom:var(--sp-2)">Venta registrada con éxito</h3>
          ${deuda > 0 ? `<p style="color:var(--color-red)">Deuda registrada: ${fmt(deuda)}</p>` : ''}
        </div>
        <div class="form-actions" style="justify-content:center;gap:var(--sp-3)">
          <button class="btn btn-secondary" onclick="Modal.close()">Cerrar</button>
          <button class="btn btn-primary" onclick="Sales.printReceipt(${JSON.stringify(receiptData).replace(/"/g, '&quot;')}, 'venta')">🖨️ Imprimir Recibo</button>
        </div>
      `);
      this.clearCart();
    } else {
      if (btn) { btn.disabled = false; btn.textContent = '✅ Confirmar Venta'; }
      console.error('[finalizeSale] Error al registrar venta:', res.error, data);
      Toast.show('❌ Error al registrar: ' + (res.error || 'Error desconocido'), 'error', 6000);
    }
  },

  filterServiceClients(q) {
    const dd = document.getElementById('svc-client-dropdown');
    if (!dd) return;
    if (!q || q.length < 1) { dd.style.display = 'none'; return; }
    const matches = (this.clients || []).filter(c =>
      c.nombre.toLowerCase().includes(q.toLowerCase()) ||
      (c.cedula_ruc || '').includes(q) ||
      (c.telefono || '').includes(q)
    ).slice(0, 8);
    if (matches.length === 0) { dd.style.display = 'none'; return; }
    dd.style.display = 'block';
    dd.innerHTML = matches.map(c => `
      <div style="padding:var(--sp-2) var(--sp-3);cursor:pointer;border-bottom:1px solid var(--color-border-soft);font-size:var(--fs-sm);"
           onmousedown="Sales.selectServiceClient('${c.id}')">
        <strong>${c.nombre}</strong><span style="color:var(--color-text-muted);margin-left:8px">${c.telefono || ''}</span>
        ${Number(c.deuda) > 0 ? `<span style="color:var(--color-red);font-size:var(--fs-xs);margin-left:4px">(Deuda: ${fmt(c.deuda)})</span>` : ''}
      </div>`).join('');
  },

  selectServiceClient(id) {
    const c = (this.clients || []).find(c => c.id === id);
    if (!c) return;
    this.selectedClient = c;
    const searchEl = document.getElementById('svc-client-search');
    if (searchEl) searchEl.value = c.nombre;
    const dd = document.getElementById('svc-client-dropdown');
    if (dd) dd.style.display = 'none';
    const info = document.getElementById('svc-client-info');
    if (info) info.innerHTML = `<strong style="color:var(--color-green)">✅ ${c.nombre}</strong> — ${c.telefono || ''}
      ${Number(c.deuda) > 0 ? `<span class="badge badge-red" style="margin-left:4px">Deuda: ${fmt(c.deuda)}</span>` : ''}`;
  },

  openServiceCheckout() {
    const costo = parseFloat(document.getElementById('svc-costo').value) || 0;
    const descripcion = document.getElementById('svc-descripcion').value.trim();
    if (!descripcion) { Toast.show('Agrega la descripción del servicio', 'warning'); return; }
    if (!this.selectedClient) { Toast.show('⚠️ Debes seleccionar un cliente antes de cobrar', 'warning'); return; }
    const clienteDeudaActual = Number(this.selectedClient.deuda) || 0;
    Modal.open('Cobrar Servicio', `
      <div style="background:var(--color-surface-2);border-radius:var(--radius-md);padding:var(--sp-3) var(--sp-4);margin-bottom:var(--sp-4)">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div><strong style="color:var(--color-accent)">${this.selectedClient.nombre}</strong></div>
          ${clienteDeudaActual > 0 ? `<span class="badge badge-red">Deuda previa: ${fmt(clienteDeudaActual)}</span>` : '<span class="badge badge-green">Sin deuda</span>'}
        </div>
        <p style="margin-top:var(--sp-1);font-size:var(--fs-sm);color:var(--color-text-muted)">${descripcion}</p>
        <p style="font-size:var(--fs-2xl);font-weight:800;color:var(--color-green);margin-top:var(--sp-1)">Total: ${fmt(costo)}</p>
      </div>

      <p class="form-label" style="margin-bottom:var(--sp-2)">Tipo de Pago</p>
      <div style="display:flex;gap:var(--sp-2);margin-bottom:var(--sp-4)">
        <label style="flex:1;cursor:pointer"><input type="radio" name="sv-tipo-pago" value="total" checked style="display:none"/><div class="pay-option" data-active="true">✅ Pago Total</div></label>
        <label style="flex:1;cursor:pointer"><input type="radio" name="sv-tipo-pago" value="parcial" style="display:none"/><div class="pay-option">💸 Avance / Parcial</div></label>
        <label style="flex:1;cursor:pointer"><input type="radio" name="sv-tipo-pago" value="deuda" style="display:none"/><div class="pay-option">📋 Queda Debiendo</div></label>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Método de Pago</label>
          <select id="svc-metodo" class="form-select">
            <option value="efectivo">💵 Efectivo</option>
            <option value="tarjeta">💳 Tarjeta</option>
            <option value="transferencia">🏦 Transferencia</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Monto Pagado</label>
          <input type="number" id="svc-pagado" class="form-input" value="${costo}" min="0" step="0.01"/>
        </div>
      </div>
      <div id="sv-result-box" style="background:var(--color-surface-2);border-radius:var(--radius-md);padding:var(--sp-3) var(--sp-4);margin-bottom:var(--sp-3)">
        <div style="display:flex;justify-content:space-between"><span>Total servicio</span><strong>${fmt(costo)}</strong></div>
        <div style="display:flex;justify-content:space-between;margin-top:var(--sp-1)"><span id="sv-res-label">Vuelto</span><strong id="sv-res-valor" style="color:var(--color-green)">${fmt(0)}</strong></div>
      </div>
      <div class="form-actions">
        <button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button>
        <button class="btn btn-success" onclick="Sales.finalizeService(${costo})">✅ Confirmar Servicio</button>
      </div>
    `, { lg: true });
    // Hook radio buttons
    document.querySelectorAll('input[name="sv-tipo-pago"]').forEach(r => {
      r.addEventListener('change', () => {
        const tipo = document.querySelector('input[name="sv-tipo-pago"]:checked')?.value;
        const pg = document.getElementById('svc-pagado');
        document.querySelectorAll('input[name="sv-tipo-pago"]').forEach(rb => {
          const dv = rb.closest('label')?.querySelector('.pay-option');
          if (dv) dv.setAttribute('data-active', rb.checked ? 'true' : 'false');
        });
        if (tipo === 'total' && pg) { pg.value = costo; pg.readOnly = true; }
        else if (tipo === 'deuda' && pg) { pg.value = 0; pg.readOnly = true; }
        else if (pg) pg.readOnly = false;
        const pagado = parseFloat(pg?.value) || 0;
        const diff = pagado - costo;
        const label = document.getElementById('sv-res-label');
        const valor = document.getElementById('sv-res-valor');
        if (label) label.textContent = diff >= 0 ? 'Vuelto' : 'Queda debiendo';
        if (valor) { valor.textContent = fmt(Math.abs(diff)); valor.style.color = diff >= 0 ? 'var(--color-green)' : 'var(--color-red)'; }
      });
    });
  },

  async finalizeService(costo) {
    costo = costo || parseFloat(document.getElementById('svc-costo')?.value) || 0;
    const tipo = document.querySelector('input[name="sv-tipo-pago"]:checked')?.value || 'total';
    let montoPagado;
    if (tipo === 'total') montoPagado = costo;
    else if (tipo === 'deuda') montoPagado = 0;
    else montoPagado = parseFloat(document.getElementById('svc-pagado')?.value) || 0;
    const data = {
      cliente_id: this.selectedClient?.id || '',
      cliente_nombre: this.selectedClient?.nombre || '',
      items: [{ producto_id: '', nombre: document.getElementById('svc-descripcion').value, precio: costo, cantidad: 1 }],
      metodo_pago: document.getElementById('svc-metodo').value,
      monto_pagado: montoPagado,
      tipo: 'servicio',
      repartidor: document.getElementById('svc-repartidor')?.value || '',
      fecha_estimada: document.getElementById('svc-fecha')?.value || '',
      direccion: document.getElementById('svc-direccion')?.value || '',
      notas: document.getElementById('svc-descripcion').value,
    };
    const btn = document.querySelector('#modal-box .btn-success');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Guardando...'; }
    const res = await API.sales.register(data);
    if (res.ok) {
      const deuda = Math.max(0, costo - montoPagado);
      Modal.open('Servicio Registrado', `
        <div style="text-align:center;padding:var(--sp-4) 0">
          <div style="font-size:3rem;margin-bottom:var(--sp-3)">✅</div>
          <h3 style="margin-bottom:var(--sp-2)">Servicio registrado con éxito</h3>
          ${deuda > 0 ? `<p style="color:var(--color-red)">Deuda registrada: ${fmt(deuda)}</p>` : ''}
        </div>
        <div class="form-actions" style="justify-content:center;gap:var(--sp-3)">
          <button class="btn btn-secondary" onclick="Modal.close();Sales.load()">Cerrar</button>
          <button class="btn btn-primary" onclick="Sales.printReceipt(${JSON.stringify({
        id: res.data?.sale?.id || ('SVC-' + Date.now()),
        cliente_nombre: data.cliente_nombre,
        items: data.items,
        total: costo,
        monto_pagado: montoPagado,
        metodo_pago: data.metodo_pago,
        repartidor: data.repartidor,
        direccion: data.direccion,
        fecha_estimada: data.fecha_estimada,
        fecha: new Date().toISOString(),
        estado: montoPagado >= costo ? 'pagado' : montoPagado > 0 ? 'parcial' : 'pendiente'
      }).replace(/"/g, '&quot;')}, 'servicio')">🖨️ Imprimir Ticket</button>
        </div>
      `);
      await this.load();
    } else {
      if (btn) { btn.disabled = false; btn.textContent = '✅ Confirmar Servicio'; }
      Toast.show('Error: ' + res.error, 'error');
    }
  },

  async loadHistory() {
    const res = await API.sales.getAll();
    const sales = res.ok ? res.data : [];
    const body = document.getElementById('sales-history-body');
    if (!body) return;
    if (sales.length === 0) { body.innerHTML = `<tr><td colspan="7" class="table-empty"><span class="empty-icon">📋</span>Sin ventas registradas</td></tr>`; return; }

    const renderRows = (list) => list.map(s => `<tr>
      <td class="text-accent fw-600">${s.id}</td>
      <td>${s.cliente_nombre || '—'}</td>
      <td>${fmtDate(s.fecha)}</td>
      <td><strong>${fmt(s.total)}</strong></td>
      <td>${s.metodo_pago || '—'}</td>
      <td>${statusBadge(s.estado)}</td>
      <td>
        <button class="btn btn-ghost btn-sm" title="Imprimir recibo"
          onclick='Sales.printReceipt(${JSON.stringify({
      id: s.id,
      cliente_nombre: s.cliente_nombre,
      items: s.items || [],
      total: s.total,
      subtotal: (s.items || []).reduce((sum, i) => sum + (Number(i.precio) * (i.cantidad || 1)), 0) || (s.total - (s.iva_monto || 0) + (s.descuento_monto || 0)),
      monto_pagado: s.monto_pagado ?? s.total,
      metodo_pago: s.metodo_pago,
      fecha: s.fecha,
      estado: s.estado,
      descuento_pct: s.descuento_pct || 0,
      descuento_monto: s.descuento_monto || 0,
      iva_pct: s.iva_pct || 0,
      iva_monto: s.iva_monto || 0
    }).replace(/'/g, "&apos;")}, "${s.id.startsWith('SVC') ? 'servicio' : 'venta'}")'
        >🖨️</button>
      </td>
    </tr>`).join('');

    body.innerHTML = renderRows(sales);

    const histSearch = document.getElementById('hist-search');
    if (histSearch) {
      histSearch.addEventListener('input', e => {
        const q = e.target.value.toLowerCase();
        body.innerHTML = renderRows(sales.filter(s => (s.cliente_nombre || '').toLowerCase().includes(q) || s.id.includes(q)));
      });
    }
  },

  printReceipt(saleDataRaw, tipo) {
    const s = typeof saleDataRaw === 'string' ? JSON.parse(saleDataRaw) : saleDataRaw;
    if (!window.jspdf) { Toast.show('jsPDF no cargado, verifica internet', 'error'); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a5', orientation: 'portrait' });
    const W = doc.internal.pageSize.getWidth();
    const today = s.fecha ? new Date(s.fecha).toLocaleString('es-EC') : new Date().toLocaleString('es-EC');
    const deuda = Math.max(0, (s.total || 0) - (s.monto_pagado || 0));
    const vuelto = Math.max(0, (s.monto_pagado || 0) - (s.total || 0));

    // ── Header ──
    doc.setFillColor(79, 110, 247);
    doc.rect(0, 0, W, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text(tipo === 'servicio' ? 'TICKET DE SERVICIO' : 'NOTA DE VENTA', W / 2, 8, { align: 'center' });
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
    doc.text('OJO nota: no declarable al SRI', W / 2, 14, { align: 'center' });

    let y = 23;
    const line = (label, val) => {
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 100); doc.setFont('helvetica', 'bold'); doc.text(label + ':', 8, y);
      doc.setTextColor(20, 20, 30); doc.setFont('helvetica', 'normal'); doc.text(String(val || '—'), 45, y);
      y += 6;
    };

    line('Número', s.id || '');
    line('Fecha', today);
    line('Cliente', s.cliente_nombre || 'Cliente General');
    if (s.metodo_pago) line('Método pago', s.metodo_pago);
    if (tipo === 'servicio' && s.repartidor) line('Técnico', s.repartidor);
    if (tipo === 'servicio' && s.direccion) line('Dirección', s.direccion);
    if (tipo === 'servicio' && s.fecha_estimada) line('Fecha est.', s.fecha_estimada);

    // ── Divider ──
    y += 1; doc.setDrawColor(200, 200, 220); doc.line(4, y, W - 4, y); y += 4;

    // ── Items table with price + DTO ──
    if (s.items && s.items.length > 0) {
      // Table header
      doc.setFillColor(240, 242, 255);
      doc.rect(4, y - 3, W - 8, 7, 'F');
      doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(33, 80, 200);
      doc.text('CANT.', 8, y + 1);
      doc.text('DESCRIPCIÓN', 22, y + 1);
      doc.text('P.UNIT', W - 52, y + 1, { align: 'right' });
      doc.text('DTO %', W - 32, y + 1, { align: 'right' });
      doc.text('SUBTOTAL', W - 8, y + 1, { align: 'right' });
      y += 8;

      doc.setFont('helvetica', 'normal'); doc.setTextColor(20, 20, 30);
      s.items.forEach((item, i) => {
        if (i % 2 === 0) { doc.setFillColor(249, 250, 255); doc.rect(4, y - 3, W - 8, 6.5, 'F'); }
        doc.setFontSize(7.5);
        const qty = item.cantidad || 1;
        const pUnit = Number(item.precio) || 0;
        const dtoPct = Number(item.descuento) || 0;
        const sub = pUnit * (1 - dtoPct / 100) * qty;
        const nm = doc.splitTextToSize(item.nombre || '', W - 80)[0];
        doc.text(String(qty), 8, y);
        doc.text(nm, 22, y);
        doc.text(fmt(pUnit), W - 52, y, { align: 'right' });
        doc.text(dtoPct > 0 ? dtoPct + '%' : '0', W - 32, y, { align: 'right' });
        doc.text(fmt(sub), W - 8, y, { align: 'right' });
        y += 6.5;
      });
    }

    // ── Divider ──
    doc.setDrawColor(200, 200, 220); doc.line(4, y, W - 4, y); y += 5;

    // ── Totals section ──
    const trow = (label, val, color, bold = false) => {
      doc.setFontSize(bold ? 9 : 8);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setTextColor(...(color || [20, 20, 30]));
      doc.text(label, 8, y);
      doc.text(val, W - 8, y, { align: 'right' });
      y += 6;
    };

    // Subtotal: compute from items with per-item percentage discounts
    const subtotal = (s.items && s.items.length > 0)
      ? s.items.reduce((sum, item) => sum + Number(item.precio) * (1 - (Number(item.descuento) || 0) / 100) * (item.cantidad || 1), 0)
      : (s.subtotal || s.total || 0);
    const totalDtos = (s.items && s.items.length > 0)
      ? s.items.reduce((sum, item) => sum + Number(item.precio) * (Number(item.descuento) || 0) / 100 * (item.cantidad || 1), 0)
      : (s.descuento_monto || 0);
    trow('Subtotal:', fmt(subtotal));
    if (totalDtos > 0) {
      trow('Total Descuentos:', `-${fmt(totalDtos)}`, [30, 150, 80]);
    }
    if ((s.iva_pct || 0) > 0) {
      trow(`IVA (${s.iva_pct}%):`, fmt(s.iva_monto || 0), [80, 80, 200]);
    }
    trow('TOTAL:', fmt(s.total || 0), [20, 20, 30], true);
    y += 1;

    if ((s.monto_pagado || 0) < (s.total || 0)) {
      trow('Monto pagado:', fmt(s.monto_pagado || 0));
      trow('PENDIENTE:', fmt(deuda), [200, 50, 50], true);
    } else if (vuelto > 0) {
      trow('Vuelto:', fmt(vuelto), [30, 150, 80]);
    }

    // ── Service payment status ──
    if (tipo === 'servicio') {
      y += 3; doc.setDrawColor(200, 200, 220); doc.line(8, y, W - 8, y); y += 6;
      const pagado = deuda === 0;
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(80, 80, 100);
      doc.text('Estado de pago:', 8, y);
      doc.setTextColor(pagado ? 30 : 200, pagado ? 150 : 50, pagado ? 80 : 50);
      doc.text(pagado ? 'Cancelado' : 'Pendiente', 55, y);
      doc.setTextColor(20, 20, 30);
      y += 8;
    }

    // ── Footer ──
    y += 4;
    doc.setFillColor(33, 80, 200);
    doc.rect(0, y, W, 10, 'F');
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(255, 255, 255);
    doc.text('Gracias por su preferencia', W / 2, y + 6, { align: 'center' });

    const fileName = tipo === 'servicio' ? `TicketServicio_${s.id || Date.now()}.pdf` : `NotaVenta_${s.id || Date.now()}.pdf`;
    doc.save(fileName);
    Toast.show(`🖨️ PDF generado: ${fileName}`, 'success', 3500);
    Modal.close();
  },

  exportProformaPdf() {
    if (this.proformaCart.length === 0) { Toast.show('Agrega productos a la proforma primero', 'warning'); return; }
    if (!window.jspdf) { Toast.show('jsPDF no cargado, verifica internet', 'error'); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a5', orientation: 'portrait' });
    const W = doc.internal.pageSize.getWidth();
    const today = new Date().toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' });
    const pfSeq = parseInt(localStorage.getItem('pf_seq') || '0', 10) + 1;
    localStorage.setItem('pf_seq', String(pfSeq));
    const pfNum = 'PF-' + String(pfSeq).padStart(10, '0');

    const ivaPct = Settings.getIva();
    const ivaChecked = document.getElementById('pf-iva-check')?.checked || false;
    const totalDtos = this.proformaCart.reduce((s, i) => s + i.precio * (i.descuento || 0) / 100 * i.cantidad, 0);
    const subtotal = this.proformaCart.reduce((s, i) => s + i.precio * (1 - (i.descuento || 0) / 100) * i.cantidad, 0);
    const ivaMonto = ivaChecked ? subtotal * ivaPct / 100 : 0;
    const total = subtotal + ivaMonto;

    // ── Header ──
    doc.setFillColor(79, 110, 247);
    doc.rect(0, 0, W, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.text('PROFORMA / COTIZACIÓN', W / 2, 9, { align: 'center' });
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
    doc.text(`N° ${pfNum}`, 8, 17);
    doc.text(`Fecha: ${today}`, W - 8, 17, { align: 'right' });

    let y = 30;

    // Client info
    if (this.proformaClient) {
      doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(33, 80, 200);
      doc.text('CLIENTE:', 8, y);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(20, 20, 30);
      doc.text(this.proformaClient.nombre, 28, y);
      if (this.proformaClient.telefono) { y += 5; doc.text(`Tel: ${this.proformaClient.telefono}`, 28, y); }
      y += 7;
    }

    // ── Products table ──
    doc.setFillColor(240, 242, 255);
    doc.rect(4, y - 3, W - 8, 7, 'F');
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(33, 80, 200);
    doc.text('CANT.', 8, y + 1);
    doc.text('DESCRIPCIÓN', 22, y + 1);
    doc.text('P.UNIT', W - 52, y + 1, { align: 'right' });
    doc.text('DTO %', W - 32, y + 1, { align: 'right' });
    doc.text('SUBTOTAL', W - 8, y + 1, { align: 'right' });
    y += 9;

    doc.setFont('helvetica', 'normal'); doc.setTextColor(20, 20, 30);
    this.proformaCart.forEach((item, i) => {
      if (i % 2 === 0) { doc.setFillColor(249, 250, 255); doc.rect(4, y - 3, W - 8, 6.5, 'F'); }
      doc.setFontSize(7.5);
      const qty = item.cantidad || 1;
      const pUnit = Number(item.precio) || 0;
      const dtoPct = Number(item.descuento) || 0;
      const sub = pUnit * (1 - dtoPct / 100) * qty;
      const nm = doc.splitTextToSize(item.nombre || '', W - 80)[0];
      doc.text(String(qty), 8, y);
      doc.text(nm, 22, y);
      doc.text(fmt(pUnit), W - 52, y, { align: 'right' });
      doc.text(dtoPct > 0 ? dtoPct + '%' : '0', W - 32, y, { align: 'right' });
      doc.text(fmt(sub), W - 8, y, { align: 'right' });
      y += 6.5;
    });

    // ── Totals ──
    y += 3; doc.setDrawColor(200, 200, 220); doc.line(W / 2, y, W - 8, y); y += 5;

    const trow = (label, val, color, bold = false) => {
      doc.setFontSize(bold ? 9 : 8); doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setTextColor(...(color || [20, 20, 30]));
      doc.text(label, W / 2, y); doc.text(val, W - 8, y, { align: 'right' });
      y += 6;
    };
    trow('Subtotal:', fmt(subtotal));
    if (totalDtos > 0) trow('Total Descuentos:', `-${fmt(totalDtos)}`, [30, 150, 80]);
    if (ivaChecked) trow(`IVA (${ivaPct}%):`, fmt(ivaMonto), [80, 80, 200]);
    trow('TOTAL:', fmt(total), [20, 20, 30], true);

    // ── Validity note ──
    y += 8;
    doc.setFontSize(7); doc.setFont('helvetica', 'italic'); doc.setTextColor(140, 140, 160);
    doc.text('Esta proforma tiene una validez de 15 días a partir de la fecha de emisión.', W / 2, y, { align: 'center' });
    y += 4;
    doc.text('OJO nota: no declarable al SRI', W / 2, y, { align: 'center' });

    // ── Footer ──
    y += 8;
    doc.setFillColor(33, 80, 200); doc.rect(0, y, W, 10, 'F');
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(255, 255, 255);
    doc.text('Gracias por su preferencia', W / 2, y + 6, { align: 'center' });

    doc.save(`Proforma_${pfNum}.pdf`);
    Toast.show(`🖨️ Proforma generada: Proforma_${pfNum}.pdf`, 'success', 3500);
  }
};
