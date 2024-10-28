import { Invocable } from "./invocable.js";
import { Expresion } from "./nodos.js";
import { Instancia } from "./instancia.js";

export class Struct extends Invocable {

    constructor(nombre, propiedades){
        super();
        
        /**
        * @type {string}
        */
        this.nombre = nombre;

        /**
         * @type {Object.<string, Expresion>}
         */
        this.propiedades = propiedades;
    }

     aridad() {
         return Object.keys(this.propiedades).length;
     }

    /**
     * @type {Invocable['invocar']}
     */ 
     invocar(interprete, args) {
         const nuevaInstancia = new Instancia(this);

         // Valores por defecto
         Object.entries(this.propiedades).forEach(([nombre, clave]) => {
            let value = null
            if(clave.valor !== null){
                value = clave.valor.accept(interprete);
                if(value.tipo === "void"){
                    throw new Error(`No se puede asignar void a ${this.nombre}`);
                }

                if (value.tipo !== "int" && value.tipo !== "float" && value.tipo !== "boolean" && value.tipo !== "string" && value.tipo !== "char") {
                    let struct = this.entornoActual.get(tipo);
                    if (struct.tipo !== "struct"){
                        throw new Error(`No se puede declarar una variable de tipo ${tipo} porque no existe`);
                    }
                }

                if(value.tipo !== clave.tipo){
                    throw new Error(`No se puede asignar ${value.tipo} a ${clave.tipo}`);
                }
                value = value.valor;
            }
             nuevaInstancia.set(nombre, {tipo: clave.tipo, valor: value});
         });

         args.forEach((arg) => {
            let value = arg.exp.accept(interprete);
            if(value.tipo !== nuevaInstancia.propiedades[arg.id].tipo){
                throw new Error(`No se puede asignar ${value.tipo} a ${nuevaInstancia.propiedades[arg.id].tipo}`);
            }
            nuevaInstancia.propiedades[arg.id].valor = value.valor
         });


         return {tipo: this.nombre, valor: nuevaInstancia};
     }
}