// ============================================================
// COBRANZA.JS
// ============================================================
const Cobranza = {
  allPayments: [],
  debtors: [],

  async load() {
    const page = document.getElementById('page-cobranza');
    const [paymentsRes, debtsRes, monthlyRes] = await Promise.all([
      API.payments.getAll(),
      API.payments.getDebts(),
      API.payments.getMonthlyTotal(),
    ]);
    this.allPayments = paymentsRes.ok ? paymentsRes.data : [];
    this.debtors = debtsRes.ok ? debtsRes.data : [];
    const monthlyTotal = monthlyRes.ok ? monthlyRes.data : 0;
    const completados = this.allPayments.length;

    page.innerHTML = `
      <div class="page-header">
        <div><h1 class="page-title">Cobranza</h1><p class="page-subtitle">Control de pagos y deudas</p></div>
      </div>

      <div class="tabs">
        <button class="tab-btn active" data-tab="tab-pagos">💳 Gestión de Pagos</button>
        <button class="tab-btn" data-tab="tab-cobranza">🔔 Gestión de Cobranza</button>
      </div>

      <!-- Tab Pagos -->
      <div class="tab-panel active" id="tab-pagos">
        <div class="cards-grid" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr));margin-bottom:var(--sp-5)">
          <div class="stat-card green"><div class="stat-icon">💰</div><div class="stat-value">${fmt(monthlyTotal)}</div><div class="stat-label">Total Cobrado (Mes)</div></div>
          <div class="stat-card blue"><div class="stat-icon">✅</div><div class="stat-value">${completados}</div><div class="stat-label">Pagos Completados</div></div>
        </div>

        <div class="search-bar">
          <div class="search-input-wrap">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="pago-search" class="search-input" placeholder="Buscar por cliente..."/>
          </div>
        </div>

        <div class="table-card">
          <div class="table-header"><span class="table-title">Historial de Pagos</span></div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Cliente</th><th>Monto</th><th>Fecha</th><th>Método</th><th>Referencia</th><th></th></tr></thead>
              <tbody id="pagos-body">
                ${this.renderPaymentsRows(this.allPayments)}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Tab Cobranza -->
      <div class="tab-panel" id="tab-cobranza">
        <div class="search-bar">
          <div class="search-input-wrap">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="debt-search" class="search-input" placeholder="Buscar deudor por nombre o cédula..."/>
          </div>
          <button class="btn btn-secondary" onclick="Cobranza.applyDebtSearch()">🔍 Buscar</button>
        </div>

        <div class="table-card">
          <div class="table-header"><span class="table-title">Clientes con Deuda</span><span class="text-red fw-600" id="debt-count">${this.debtors.length} deudores</span></div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Cliente</th><th>Cédula/RUC</th><th>Teléfono</th><th>Deuda</th><th>Acciones</th></tr></thead>
              <tbody id="debtors-body">
                ${this.renderDebtorsRows(this.debtors)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Tab switching
    document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn[data-tab]').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel[id]').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab)?.classList.add('active');
      });
    });

    // Payment search
    document.getElementById('pago-search').addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      const filtered = this.allPayments.filter(p => (p.cliente_nombre || '').toLowerCase().includes(q));
      document.getElementById('pagos-body').innerHTML = this.renderPaymentsRows(filtered);
    });
  },

  renderPaymentsRows(payments) {
    if (payments.length === 0) return `<tr><td colspan="7" class="table-empty"><span class="empty-icon">💳</span>Sin pagos registrados</td></tr>`;
    return payments.map(p => `<tr>
      <td class="text-accent" style="font-size:var(--fs-xs)">${p.id}</td>
      <td>${p.cliente_nombre || '—'}</td>
      <td class="text-green fw-600">${fmt(p.monto)}</td>
      <td>${fmtDate(p.fecha)}</td>
      <td>${p.metodo || '—'}</td>
      <td>${p.referencia || '—'}</td>
      <td><button class="btn btn-ghost btn-sm" title="Imprimir ticket" onclick='Cobranza.printPaymentTicket(${JSON.stringify(p).replace(/'/g, "&apos;")})'>🖨️</button></td>
    </tr>`).join('');
  },

  renderDebtorsRows(debtors) {
    if (debtors.length === 0) return `<tr><td colspan="5" class="table-empty"><span class="empty-icon">✅</span>Sin deudores</td></tr>`;
    return debtors.map(c => `<tr>
      <td><strong>${c.nombre}</strong></td>
      <td>${c.cedula_ruc || '—'}</td>
      <td>${c.telefono || '—'}</td>
      <td class="text-red fw-600">${fmt(c.deuda)}</td>
      <td><button class="btn btn-primary btn-sm" onclick="Cobranza.registerPayment('${c.id}','${c.nombre.replace(/'/g, "\\'")}',${c.deuda})">💳 Registrar Pago</button></td>
    </tr>`).join('');
  },

  async applyDebtSearch() {
    const q = document.getElementById('debt-search').value.trim();
    const res = await API.payments.getDebts(q);
    const debtors = res.ok ? res.data : [];
    document.getElementById('debtors-body').innerHTML = this.renderDebtorsRows(debtors);
    document.getElementById('debt-count').textContent = debtors.length + ' deudores';
  },

  registerPayment(clienteId, nombre, deudaActual) {
    Modal.open(`Registrar Pago — ${nombre}`, `
      <p style="margin-bottom:var(--sp-4)">Deuda actual: <strong class="text-red">${fmt(deudaActual)}</strong></p>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Monto a Pagar <span class="form-required">*</span></label>
          <input type="number" id="rp-monto" class="form-input" value="${deudaActual}" min="0.01" step="0.01" max="${deudaActual}"/>
        </div>
        <div class="form-group">
          <label class="form-label">Método de Pago</label>
          <select id="rp-metodo" class="form-select">
            <option value="efectivo">💵 Efectivo</option>
            <option value="tarjeta">💳 Tarjeta</option>
            <option value="transferencia">🏦 Transferencia</option>
          </select>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Referencia / Comprobante</label>
          <input type="text" id="rp-ref" class="form-input" placeholder="Número de comprobante..."/>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button>
        <button class="btn btn-success" onclick="Cobranza.confirmPayment('${clienteId}','${nombre.replace(/'/g, "\\'")}')">✅ Confirmar Pago</button>
      </div>
    `);
  },

  async confirmPayment(clienteId, nombre) {
    const monto = parseFloat(document.getElementById('rp-monto').value) || 0;
    const metodo = document.getElementById('rp-metodo').value;
    const referencia = document.getElementById('rp-ref').value;
    if (monto <= 0) { Toast.show('Ingresa un monto válido', 'error'); return; }
    const data = { cliente_id: clienteId, cliente_nombre: nombre, monto, metodo, referencia };
    const res = await API.payments.register(data);
    if (res.ok) {
      const pmt = res.data;
      const paymentRecord = {
        id: pmt?.id || ('PAG-' + Date.now()),
        cliente_nombre: nombre,
        monto,
        metodo,
        referencia,
        saldo_restante: pmt?.saldo_restante ?? 0,
        fecha: pmt?.fecha || new Date().toISOString()
      };
      Modal.open('Pago Registrado', `
        <div style="text-align:center;padding:var(--sp-4) 0">
          <div style="font-size:3rem;margin-bottom:var(--sp-3)">✅</div>
          <h3 style="margin-bottom:var(--sp-2)">Pago registrado con éxito</h3>
          <p style="color:var(--color-green);font-size:var(--fs-xl);font-weight:700">${fmt(monto)}</p>
          ${paymentRecord.saldo_restante > 0 ? `<p style="color:var(--color-red)">Saldo pendiente: <strong>${fmt(paymentRecord.saldo_restante)}</strong></p>` : '<p style="color:var(--color-green)">Deuda saldada ✅</p>'}
        </div>
        <div class="form-actions" style="justify-content:center;gap:var(--sp-3)">
          <button class="btn btn-secondary" onclick="Modal.close()">Cerrar</button>
          <button class="btn btn-primary" onclick="Cobranza.printPaymentTicket(${JSON.stringify(paymentRecord).replace(/"/g, '&quot;')})">🖨️ Imprimir Ticket de Pago</button>
        </div>
      `);
      await this.load();
    } else {
      Toast.show('Error: ' + res.error, 'error');
    }
  },

  printPaymentTicket(paymentRaw) {
    const p = typeof paymentRaw === 'string' ? JSON.parse(paymentRaw) : paymentRaw;
    if (!window.jspdf) { Toast.show('jsPDF no cargado', 'error'); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a5', orientation: 'portrait' });
    const W = doc.internal.pageSize.getWidth();
    const fecha = p.fecha ? new Date(p.fecha).toLocaleString('es-EC') : new Date().toLocaleString('es-EC');

    // ── Header ──
    doc.setFillColor(30, 150, 80);
    doc.rect(0, 0, W, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.text('COMPROBANTE DE PAGO', W / 2, 10, { align: 'center' });
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
    doc.text('OJO nota: no declarable al SRI', W / 2, 17, { align: 'center' });

    let y = 32;
    const row = (label, val, bold = false) => {
      doc.setFontSize(8.5);
      doc.setTextColor(80, 80, 100); doc.setFont('helvetica', 'bold'); doc.text(label + ':', 8, y);
      doc.setTextColor(20, 20, 30); doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.text(String(val || '—'), 48, y);
      y += 7;
    };

    row('N° Comprobante', p.id || '');
    row('Fecha', fecha);
    row('Cliente', p.cliente_nombre || '—');
    row('Método de Pago', p.metodo || '—');
    if (p.referencia) row('Referencia', p.referencia);

    // ── Monto box ──
    y += 4;
    doc.setFillColor(240, 250, 244);
    doc.roundedRect(8, y, W - 16, 22, 3, 3, 'F');
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 120, 80);
    doc.text('MONTO PAGADO', W / 2, y + 8, { align: 'center' });
    doc.setFontSize(20); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 150, 80);
    doc.text(fmt(p.monto || 0), W / 2, y + 18, { align: 'center' });
    y += 26;

    // ── Saldo restante ──
    y += 5;
    const saldo = Number(p.saldo_restante) || 0;
    if (saldo > 0) {
      doc.setFillColor(255, 245, 245);
      doc.roundedRect(8, y, W - 16, 16, 3, 3, 'F');
      doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(180, 60, 60);
      doc.text('SALDO PENDIENTE', W / 2, y + 6, { align: 'center' });
      doc.setFontSize(13); doc.setFont('helvetica', 'bold');
      doc.text(fmt(saldo), W / 2, y + 13, { align: 'center' });
    } else {
      doc.setFillColor(240, 255, 245);
      doc.roundedRect(8, y, W - 16, 12, 3, 3, 'F');
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 150, 80);
      doc.text('✓ Deuda saldada completamente', W / 2, y + 8, { align: 'center' });
    }
    y += 20;

    // ── Footer ──
    y += 6;
    doc.setFillColor(30, 150, 80);
    doc.rect(0, y, W, 10, 'F');
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(255, 255, 255);
    doc.text('Gracias por su pago', W / 2, y + 6, { align: 'center' });

    const fileName = `TicketPago_${p.id || Date.now()}.pdf`;
    doc.save(fileName);
    Toast.show(`🖨️ Ticket generado: ${fileName}`, 'success', 3000);
    Modal.close();
  }
};

