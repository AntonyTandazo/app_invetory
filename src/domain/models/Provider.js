// Domain Model: Provider
class Provider {
    constructor({ id, nombre, contacto = '', telefono = '', email = '' }) {
        this.id = id;
        this.nombre = nombre;
        this.contacto = contacto;
        this.telefono = telefono;
        this.email = email;
    }
}
module.exports = Provider;
