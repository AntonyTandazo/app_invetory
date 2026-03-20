// ============================================================
// PRODUCTS.JS
// ============================================================
const Products = {
  allProducts: [],
  categories: [],

  async load() {
    const page = document.getElementById('page-products');
    const [statsRes, productsRes, catsRes] = await Promise.all([
      API.products.getStats(),
      API.products.getAll(),
      API.products.categories.getAll(),
    ]);
    this.allProducts = productsRes.ok ? productsRes.data : [];
    this.categories = catsRes.ok ? catsRes.data : [];
    const stats = statsRes.ok ? statsRes.data : {};

    page.innerHTML = `
      <div class="page-header">
        <div><h1 class="page-title">Productos</h1><p class="page-subtitle">Gestión de inventario</p></div>
        <div class="page-actions">
          <button class="btn btn-secondary" id="btn-orders-pdf">📋 Órdenes de compra</button>
          <button class="btn btn-secondary" id="btn-categories">🏷️ Categorías</button>
          <button class="btn btn-primary" id="btn-new-product">➕ Nuevo Producto</button>
        </div>
      </div>

      <div class="cards-grid">
        <div class="stat-card blue"><div class="stat-icon">📦</div><div class="stat-value">${stats.total || 0}</div><div class="stat-label">Total Productos</div></div>
        <div class="stat-card green"><div class="stat-icon">💵</div><div class="stat-value">${fmt(stats.valorTotal || 0)}</div><div class="stat-label">Valor Inventario</div></div>
        <div class="stat-card yellow"><div class="stat-icon">⚠️</div><div class="stat-value">${stats.bajoStock || 0}</div><div class="stat-label">Bajo Stock</div></div>
        <div class="stat-card red"><div class="stat-icon">🚨</div><div class="stat-value">${stats.critico || 0}</div><div class="stat-label">Stock Crítico</div></div>
      </div>

      <div class="search-bar">
        <div class="search-input-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="prod-search" class="search-input" placeholder="Buscar por nombre o código..."/>
        </div>
        <button class="filter-btn active" data-filter="all">Todos</button>
        <button class="filter-btn" data-filter="disponible">Disponibles</button>
        <button class="filter-btn" data-filter="bajo">Bajo stock</button>
        <button class="filter-btn" data-filter="critico">Crítico</button>
      </div>

      <div class="table-card">
        <div class="table-header"><span class="table-title">Lista de Productos</span><span class="text-muted" id="prod-count">0 productos</span></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Código</th><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock Actual</th><th>Stock Mínimo</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody id="prod-table-body"></tbody>
          </table>
        </div>
      </div>
    `;

    this.renderTable(this.allProducts);

    // Search
    let searchFilter = '';
    let statusFilter = 'all';
    document.getElementById('prod-search').addEventListener('input', e => {
      searchFilter = e.target.value; this.applyFilters(searchFilter, statusFilter);
    });

    // Filter buttons
    document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn[data-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        statusFilter = btn.dataset.filter;
        this.applyFilters(searchFilter, statusFilter);
      });
    });

    document.getElementById('btn-new-product').addEventListener('click', () => this.openProductModal());
    document.getElementById('btn-categories').addEventListener('click', () => this.openCategoriesModal());
    document.getElementById('btn-orders-pdf').addEventListener('click', () => this.openOrdersPdfModal());
  },

  applyFilters(search, status) {
    let filtered = this.allProducts;
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(p => p.nombre.toLowerCase().includes(s) || (p.codigo || '').toLowerCase().includes(s));
    }
    if (status === 'disponible') filtered = filtered.filter(p => Number(p.stock_actual) > Number(p.stock_minimo));
    if (status === 'bajo') filtered = filtered.filter(p => Number(p.stock_actual) <= Number(p.stock_minimo) && Number(p.stock_actual) > 0);
    if (status === 'critico') filtered = filtered.filter(p => Number(p.stock_actual) === 0);
    this.renderTable(filtered);
  },

  renderTable(products) {
    const body = document.getElementById('prod-table-body');
    const count = document.getElementById('prod-count');
    if (!body) return;
    count && (count.textContent = products.length + ' productos');
    if (products.length === 0) {
      body.innerHTML = `<tr><td colspan="8" class="table-empty"><span class="empty-icon">📦</span>No hay productos</td></tr>`;
      return;
    }
    body.innerHTML = products.map(p => {
      const st = Number(p.stock_actual);
      const sm = Number(p.stock_minimo);
      const status = st === 0 ? 'critico' : st <= sm ? 'bajo' : 'disponible';
      return `<tr>
        <td><code style="color:var(--color-accent)">${p.codigo || '—'}</code></td>
        <td><strong>${p.nombre}</strong></td>
        <td>${p.categoria_nombre || '—'}</td>
        <td>${fmt(p.precio)}</td>
        <td class="${st === 0 ? 'text-red' : st <= sm ? 'text-yellow' : 'text-green'} fw-600">${st}</td>
        <td>${sm}</td>
        <td>${statusBadge(status)}</td>
        <td>
          <button class="btn btn-ghost btn-sm" onclick="Products.editProduct('${p.id}')">✏️</button>
          <button class="btn btn-ghost btn-sm" onclick="Products.deleteProduct('${p.id}')">🗑️</button>
        </td>
      </tr>`;
    }).join('');
  },

  openProductModal(product = null) {
    const title = product ? 'Editar Producto' : 'Nuevo Producto';
    const catOptions = this.categories.map(c => `<option value="${c.id}" data-name="${c.nombre}" ${product?.categoria_id === c.id ? 'selected' : ''}>${c.nombre}</option>`).join('');
    Modal.open(title, `
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Código</label>
          <input type="text" id="f-codigo" class="form-input" value="${product?.codigo || ''}" placeholder="PROD-001"/>
        </div>
        <div class="form-group">
          <label class="form-label">Categoría <span class="form-required">*</span></label>
          <select id="f-categoria" class="form-select"><option value="">Seleccionar...</option>${catOptions}</select>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Nombre <span class="form-required">*</span></label>
          <input type="text" id="f-nombre" class="form-input" value="${product?.nombre || ''}" placeholder="Nombre del producto"/>
        </div>
        <div class="form-group">
          <label class="form-label">Precio Unitario <span class="form-required">*</span></label>
          <input type="number" id="f-precio" class="form-input" value="${product?.precio || ''}" min="0" step="0.01" placeholder="0.00"/>
        </div>
        <div class="form-group">
          <label class="form-label">Stock Mínimo <span class="form-required">*</span></label>
          <input type="number" id="f-stock-min" class="form-input" value="${product?.stock_minimo || ''}" min="0"/>
        </div>
        <div class="form-group">
          <label class="form-label">Stock Actual <span class="form-required">*</span></label>
          <input type="number" id="f-stock" class="form-input" value="${product?.stock_actual || ''}" min="0"/>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button>
        <button class="btn btn-primary" onclick="Products.saveProduct('${product?.id || ''}')">💾 Guardar</button>
      </div>
    `);
  },

  async saveProduct(id) {
    const catSel = document.getElementById('f-categoria');
    const data = {
      codigo: document.getElementById('f-codigo').value.trim(),
      nombre: document.getElementById('f-nombre').value.trim(),
      categoria_id: catSel.value,
      categoria_nombre: catSel.options[catSel.selectedIndex]?.dataset.name || '',
      precio: parseFloat(document.getElementById('f-precio').value) || 0,
      stock_minimo: parseInt(document.getElementById('f-stock-min').value) || 0,
      stock_actual: parseInt(document.getElementById('f-stock').value) || 0,
      activo: true,
    };
    if (!data.nombre) { Toast.show('El nombre es requerido', 'error'); return; }
    let res;
    if (id) { res = await API.products.update(id, data); }
    else { res = await API.products.create(data); }
    if (res.ok) { Toast.show(id ? 'Producto actualizado' : 'Producto creado', 'success'); Modal.close(); await this.load(); }
    else Toast.show('Error: ' + res.error, 'error');
  },

  async editProduct(id) {
    const product = this.allProducts.find(p => p.id === id);
    if (product) this.openProductModal(product);
  },

  async deleteProduct(id) {
    if (!confirm('¿Eliminar este producto?')) return;
    const res = await API.products.delete(id);
    if (res.ok) { Toast.show('Producto eliminado', 'success'); await this.load(); }
    else Toast.show('Error: ' + res.error, 'error');
  },

  openCategoriesModal() {
    const list = this.categories.map(c => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:var(--sp-2) var(--sp-3);background:var(--color-surface-2);border-radius:var(--radius-sm);margin-bottom:var(--sp-2);">
        <span>${c.nombre}</span>
        <button class="btn btn-ghost btn-sm" onclick="Products.deleteCategory('${c.id}')">🗑️</button>
      </div>`).join('');
    Modal.open('Categorías', `
      ${list || '<p class="text-muted text-center mb-4">Sin categorías creadas</p>'}
      <div style="display:flex;gap:var(--sp-2);margin-top:var(--sp-4);">
        <input type="text" id="new-cat-name" class="form-input" style="flex:1" placeholder="Nombre de la categoría"/>
        <button class="btn btn-primary" onclick="Products.createCategory()">➕ Crear</button>
      </div>
    `);
  },

  async createCategory() {
    const nombre = document.getElementById('new-cat-name').value.trim();
    if (!nombre) return;
    const res = await API.products.categories.create({ nombre });
    if (res.ok) { Toast.show('Categoría creada', 'success'); Modal.close(); await this.load(); this.openCategoriesModal(); }
    else Toast.show('Error: ' + res.error, 'error');
  },

  async deleteCategory(id) {
    if (!confirm('¿Eliminar categoría?')) return;
    const res = await API.products.categories.delete(id);
    if (res.ok) { Toast.show('Categoría eliminada', 'success'); Modal.close(); await this.load(); }
    else Toast.show('Error: ' + res.error, 'error');
  },

  openOrdersPdfModal() {
    Products._orderProducts = this.allProducts;

    Modal.open('Órdenes de Compra', `
      <div style="display:flex;align-items:center;gap:var(--sp-2);margin-bottom:var(--sp-3)">
        <div class="search-input-wrap" style="flex:1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="order-search" class="search-input" placeholder="Buscar producto por nombre o código..."/>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="Products.selectAllOrders(true)">✅ Todos</button>
        <button class="btn btn-secondary btn-sm" onclick="Products.selectAllOrders(false)">☐ Ninguno</button>
      </div>
      <p style="font-size:var(--fs-xs);color:var(--color-text-muted);margin-bottom:var(--sp-2)">⚠ amarillo = bajo stock · 🔴 rojo = sin stock. Los productos en bajo stock vienen pre-seleccionados.</p>
      <div style="max-height:340px;overflow-y:auto">
        <table style="width:100%">
          <thead><tr>
            <th style="text-align:left;padding:6px 8px;position:sticky;top:0;background:var(--color-surface-2)">Producto</th>
            <th style="text-align:left;padding:6px 8px;position:sticky;top:0;background:var(--color-surface-2)">Código</th>
            <th style="text-align:center;padding:6px 8px;position:sticky;top:0;background:var(--color-surface-2)">Stock / Mín</th>
            <th style="text-align:center;padding:6px 8px;position:sticky;top:0;background:var(--color-surface-2)">Cantidad</th>
          </tr></thead>
          <tbody id="order-tbody"></tbody>
        </table>
      </div>
      <div id="order-summary" style="background:var(--color-surface-2);border-radius:var(--radius-md);padding:var(--sp-2) var(--sp-3);margin-top:var(--sp-3);font-size:var(--fs-sm);color:var(--color-text-muted)">
        0 productos seleccionados
      </div>
      <div class="form-actions">
        <button class="btn btn-secondary" onclick="Modal.close()">Cerrar</button>
        <button class="btn btn-primary" onclick="Products.exportPdf()">📄 Exportar PDF</button>
      </div>
    `, { lg: true });

    const renderRows = (query = '') => {
      const tbody = document.getElementById('order-tbody');
      if (!tbody) return;
      const q = query.toLowerCase();
      const filtered = Products._orderProducts.filter(p =>
        !q || p.nombre.toLowerCase().includes(q) || (p.codigo || '').toLowerCase().includes(q)
      );
      tbody.innerHTML = filtered.map(p => {
        const st = Number(p.stock_actual);
        const sm = Number(p.stock_minimo);
        const isLow = st <= sm;
        const isCritical = st === 0;
        const suggestedQty = isLow ? Math.max(1, sm - st + 5) : 5;
        const stockColor = isCritical ? 'var(--color-red)' : isLow ? 'var(--color-yellow)' : 'var(--color-green)';
        const rowBg = isCritical ? 'rgba(239,68,68,0.05)' : isLow ? 'rgba(234,179,8,0.05)' : '';
        return `<tr style="background:${rowBg}">
          <td style="padding:6px 8px">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
              <input type="checkbox" data-id="${p.id}" data-nombre="${p.nombre.replace(/"/g, '&quot;')}"
                     data-codigo="${(p.codigo || '').replace(/"/g, '&quot;')}" data-precio="${p.precio}"
                     ${isLow ? 'checked' : ''} style="width:15px;height:15px;cursor:pointer" onchange="Products.updateOrderSummary()"/>
              <span>${p.nombre}</span>
              ${isCritical ? '<span class="badge badge-red" style="font-size:10px">🚨 sin stock</span>' :
            isLow ? '<span class="badge badge-yellow" style="font-size:10px">⚠ bajo</span>' : ''}
            </label>
          </td>
          <td style="padding:6px 8px;font-size:var(--fs-xs);color:var(--color-text-muted)">${p.codigo || '—'}</td>
          <td style="padding:6px 8px;text-align:center;font-weight:600;color:${stockColor}">${st} / ${sm}</td>
          <td style="padding:6px 8px;text-align:center">
            <input type="number" value="${suggestedQty}" min="1" class="form-input"
                   style="width:72px;text-align:center" data-qty="${p.id}" onchange="Products.updateOrderSummary()"/>
          </td>
        </tr>`;
      }).join('') || '<tr><td colspan="4" class="table-empty">Sin resultados</td></tr>';
      Products.updateOrderSummary();
    };

    Products._renderOrderRows = renderRows;
    renderRows();

    const searchInput = document.getElementById('order-search');
    if (searchInput) searchInput.addEventListener('input', e => renderRows(e.target.value));
  },

  updateOrderSummary() {
    const checked = document.querySelectorAll('#order-tbody input[type="checkbox"]:checked');
    const summary = document.getElementById('order-summary');
    if (summary) summary.textContent = `${checked.length} producto${checked.length !== 1 ? 's' : ''} seleccionado${checked.length !== 1 ? 's' : ''}`;
  },

  selectAllOrders(checked) {
    document.querySelectorAll('#order-tbody input[type="checkbox"]').forEach(cb => cb.checked = checked);
    this.updateOrderSummary();
  },

  exportPdf() {
    if (!window.jspdf) { Toast.show('jsPDF no cargado, verifica tu conexión a internet', 'error'); return; }

    // Collect checked items
    const selected = [];
    document.querySelectorAll('#order-tbody input[type="checkbox"]:checked').forEach(cb => {
      const id = cb.dataset.id;
      const qty = parseInt(document.querySelector(`input[data-qty="${id}"]`)?.value) || 1;
      selected.push({ nombre: cb.dataset.nombre, codigo: cb.dataset.codigo || '—', precio: Number(cb.dataset.precio) || 0, cantidad: qty });
    });

    if (selected.length === 0) { Toast.show('Selecciona al menos un producto', 'warning'); return; }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a5' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const today = new Date().toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' });
    const orderNum = 'OC-' + Date.now().toString().slice(-8);

    // ── Header band ──
    doc.setFillColor(79, 110, 247);
    doc.rect(0, 0, W, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20); doc.setFont('helvetica', 'bold');
    doc.text('ORDEN DE COMPRA', 14, 15);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Gestión de Inventario', 14, 23);
    doc.text(`N° ${orderNum}`, W - 14, 15, { align: 'right' });
    doc.text(`Fecha: ${today}`, W - 14, 23, { align: 'right' });

    // ── Info box ──
    doc.setFillColor(245, 247, 255);
    doc.roundedRect(14, 37, W - 28, 16, 2, 2, 'F');
    doc.setTextColor(60, 60, 80);
    doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
    doc.text('Orden generada:', 18, 44); doc.setFont('helvetica', 'normal');
    doc.text(today, 50, 44);
    doc.setFont('helvetica', 'bold'); doc.text('No. Orden:', 100, 44);
    doc.setFont('helvetica', 'normal'); doc.text(orderNum, 120, 44);
    doc.setFont('helvetica', 'bold'); doc.text('Total items:', 150, 44);
    doc.setFont('helvetica', 'normal'); doc.text(String(selected.length), 168, 44);

    // ── Section heading ──
    doc.setTextColor(79, 110, 247);
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('Detalle de Productos a Solicitar', 14, 64);
    doc.setDrawColor(79, 110, 247); doc.setLineWidth(0.4);
    doc.line(14, 66, W - 14, 66);

    // ── Table header ──
    let y = 74;
    doc.setFillColor(240, 242, 250);
    doc.rect(14, y - 5, W - 28, 8, 'F');
    doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(79, 110, 247);
    doc.text('#', 16, y);
    doc.text('CÓDIGO', 24, y);
    doc.text('DESCRIPCIÓN DEL PRODUCTO', 52, y);
    doc.text('CANTIDAD A PEDIR', W - 16, y, { align: 'right' });
    y += 6;

    // ── Rows ──
    doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 30, 30);

    selected.forEach((item, idx) => {
      if (idx % 2 === 0) { doc.setFillColor(252, 252, 255); doc.rect(14, y - 4, W - 28, 7, 'F'); }
      doc.setFontSize(8.5);
      doc.text(String(idx + 1), 16, y);
      doc.text(item.codigo.substring(0, 10), 24, y);
      const name = doc.splitTextToSize(item.nombre, 130)[0];
      doc.text(name, 52, y);
      doc.text(String(item.cantidad), W - 16, y, { align: 'right' });
      y += 7;
      if (y > H - 35) { doc.addPage(); y = 20; }
    });

    // ── Footer ──
    doc.setFillColor(79, 110, 247);
    doc.rect(0, H - 14, W, 14, 'F');
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(255, 255, 255);
    doc.text('Documento generado automáticamente', 14, H - 6);
    doc.text(`${orderNum} · ${today}`, W - 14, H - 6, { align: 'right' });

    doc.save(`OrdenCompra_${orderNum}.pdf`);
    Toast.show(`✅ PDF generado: OrdenCompra_${orderNum}.pdf`, 'success', 4000);
    Modal.close();
  }
};

