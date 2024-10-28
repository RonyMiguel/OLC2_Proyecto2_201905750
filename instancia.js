
export class Instancia {
    constructor(struct) {
        this.struct = struct;
        this.propiedades = {};
    }

    set(nombre, valor, tipoSimbolo, linea, columna) {
        this.propiedades[nombre] = valor;
        return {id: nombre, tipo: valor.tipo,tipoSimbolo, ambito: this.struct.nombre, linea, columna};
    }

    get(nombre) {
        if (this.propiedades.hasOwnProperty(nombre)) {
            return this.propiedades[nombre];
        }

        throw new Error(`Propiedad no encontrada: ${nombre}`);
    }
}