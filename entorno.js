export class Entorno {

    /**
        * @param {Entorno} padre
     */
    constructor(padre = undefined, nombre='Global') {
        this.valores = {};
        this.padre = padre;
        this.nombre = nombre;
    }

    /**
     * @param {string} nombre
     * @param {any} valor
     */
    set(nombre, valor, tipoSimbolo, linea, columna) {
        if (!this.valores.hasOwnProperty(nombre)) {
            this.valores[nombre] = valor;
            return {id: nombre, tipo: valor.tipo, tipoSimbolo, ambito: this.nombre, linea, columna}
        }else{
            throw new Error(`Variable ${nombre} ya definida`);
        }
    }

    /**
     * @param {string} nombre
     */
    get(nombre) {
        const valorActual = this.valores[nombre];

        if (valorActual !== undefined) return valorActual;

        if (!valorActual && this.padre) {
            return this.padre.get(nombre);
        }
        console.log("Error desde entorno")
        throw new Error(`Variable ${nombre} no definida`);
    }

    /**
   * @param {string} nombre
   * @param {any} valor
   */
    assign(nombre, valor) {
        const valorActual = this.valores[nombre];

        if (valorActual !== undefined) {
            if (valorActual.tipo !== valor.tipo) {
                this.valores[nombre].valor = null;
                throw new Error(`No se puede asignar ${valor.tipo} a ${valorActual.tipo}`);
            }
            this.valores[nombre] = valor;
            return;
        }

        if (!valorActual && this.padre) {
            this.padre.assign(nombre, valor);
            return;
        }

        throw new Error(`Variable ${nombre} no definida`);
    }
}