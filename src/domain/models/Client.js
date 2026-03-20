// Domain Model: Client
class Client {
  constructor({ id, nombre, cedula_ruc, telefono, email = '', direccion, activo = true, fecha_registro, total_compras = 0, deuda = 0 }) {
    this.id = id;
    this.nombre = nombre;
    this.cedula_ruc = cedula_ruc;
    this.telefono = telefono;
    this.email = email;
    this.direccion = direccion;
    this.activo = activo;
    this.fecha_registro = fecha_registro || new Date().toISOString();
    this.total_compras = Number(total_compras) || 0;
    this.deuda = Number(deuda) || 0;
  }

  hasDebt() { return this.deuda > 0; }
  isActive() { return this.activo === true || this.activo === 'true' || this.activo === 'TRUE'; }
}

module.exports = Client;
