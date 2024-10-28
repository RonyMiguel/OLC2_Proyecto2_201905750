import { Entorno } from "./entorno.js";
import { Invocable } from "./invocable.js";
import { FuncDcl } from "./nodos.js";
import { ReturnException } from "./transferencia.js";
import nodos from "./nodos.js";


export class FuncionForanea extends Invocable {


    constructor(nodo, clousure) {
        super();
        /**
         * @type {FuncDcl}
         */
        this.nodo = nodo;

        /**
         * @type {Entorno}
         */
        this.clousure = clousure;

        this.tipo = nodo.tipo
    }

    aridad() {
        return this.nodo.params.length;
    }


    /**
    * @type {Invocable['invocar']}
    */
    invocar(interprete, args) {
        const entornoNuevo = new Entorno(this.clousure, this.nodo.id);
        this.nodo.params.forEach((param, i) => {
            if (args[i].tipo !== param.tipo) {
                throw new Error(`No se puede asignar ${param.tipo} a ${args[i].tipo} desde funcion`);
            }
            interprete.tablaSimbolos.push(entornoNuevo.set(param.id, {tipo: param.tipo, valor:args[i].valor}, "variable", this.nodo.location.start.line, this.nodo.location.start.column));
        });

        const entornoAnterior = interprete.entornoActual;
        interprete.entornoActual = entornoNuevo;

        try {
            this.nodo.bloque.accept(interprete, this.nodo.id);
        } catch (error) {
            interprete.entornoActual = entornoAnterior;

            if (error instanceof ReturnException) {

                if (this.tipo !== error.value.tipo) {
                    throw new Error(`No se puede retornar ${error.value.tipo} en una funcion de tipo ${this.tipo}`);
                }
                return error.value.valor
            }

            // TODO: manejar el resto de sentencias de control
            throw error;
        }

        interprete.entornoActual = entornoAnterior;
        return null
    }

}