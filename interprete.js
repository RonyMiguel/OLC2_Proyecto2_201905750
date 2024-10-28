import { Entorno } from "./entorno.js";
import { BaseVisitor } from "./visitor.js";
import nodos, { Arreglo, Expresion } from './nodos.js'
import { BreakException, ContinueException, ReturnException } from "./transferencia.js";
import { Invocable } from "./invocable.js";
import { embebidas } from "./nativas.js";
import { FuncionForanea } from "./foranea.js";
import { Struct } from "./struct.js";
import { Instancia } from "./instancia.js";


export class InterpreterVisitor extends BaseVisitor {

    constructor() {
        super();
        this.entornoActual = new Entorno();

        this.tablaSimbolos = [];

        // funciones embebidas
        Object.entries(embebidas).forEach(([nombre, funcion]) => {
            this.tablaSimbolos.push(this.entornoActual.set(nombre, funcion, "funcion", 0,0));
        });

        this.salida = '';
        this.errores = [];
        
         /**
         * @type {Expresion | null}
        */
         this.prevContinue = null;
    }

     /**
     * @type {BaseVisitor['visitNativo']}
     */
    visitNativo(node) {
        const tipo = node.tipo;
        let valor = node.valor;
        if (tipo === "string" || tipo === "char") {
            valor = RemoveCaracteresEspeciales(node.valor);
        }
        return {
            tipo: tipo,
            valor: valor
        };
    }

    /**
     * @type {BaseVisitor['visitDeclaracion']}
     */
    visitDeclaracion(node) {

        const id = node.id;
        let tipo = node.tipo;
        let valorFinal = null
        let exp = null;
        if (node.exp !== null){
            exp = node.exp.accept(this);
            if (exp !== null) valorFinal = exp.valor;
        }
        if (node.tipo == "var"){
            tipo = exp.tipo;
        }

        if (exp && tipo !== exp.tipo) {
            if (!(tipo === "float" && exp.tipo === "int")){
                this.tablaSimbolos.push(this.entornoActual.set(id, {tipo, id, valor: null}, "variable", node.location.start.line, node.location.start.column));
                this.errores.push({desc: `No se puede asignar un valor de tipo ${exp.tipo} a una variable de tipo ${tipo}`, linea: node.exp.location.start.line, columna: node.exp.location.start.column, tipo: "Semantico"});
                throw new Error(`No se puede asignar un valor de tipo ${exp.tipo} a una variable de tipo ${tipo}`);
            }else{
                valorFinal = parseFloat(exp.valor);
            }
        }
        

        if ( tipo !== "int" && tipo !== "float" && tipo !== "string" && tipo !== "char" && tipo !== "boolean" && tipo !== "void" && tipo !== "Array"){
            
            try {
                let struct = this.entornoActual.get(tipo);
                if (struct.tipo !== "struct"){
                    this.errores.push({desc: `No se puede declarar una variable de tipo ${tipo} porque el tipo no existe`, linea: node.location.start.line, columna: node.location.start.column, tipo: "Semantico"});
                    throw new Error(`No se puede declarar una variable de tipo ${tipo}`);
                }
            } catch (error) {
                
                this.errores.push({desc: `No se puede declarar una variable de tipo ${tipo} porque no existe`, linea: node.location.start.line, columna: node.location.start.column, tipo: "Semantico"});
                throw new Error(`No se puede declarar una variable de tipo ${tipo}`);
            }
            
        }

        

        try {
            if (tipo === "struct"){
                this.tablaSimbolos.push(this.entornoActual.set(id, {tipo, id, valor: valorFinal}, "struct", node.location.start.line, node.location.start.column));
            }else{
                this.tablaSimbolos.push(this.entornoActual.set(id, {tipo, id, valor: valorFinal}, "variable", node.location.start.line, node.location.start.column));
            }
            return {tipo, valor: valorFinal};
        } catch (error) {
            this.errores.push({desc: `La variable ${id} no se pudo crear porque ya existe :c`, linea: node.location.start.line, columna: node.location.start.column, tipo: "Semantico"});
            throw error
        }

        
    }
    
    /**
     * @type {BaseVisitor['visitReferenciaVariable']}
     */
    visitReferenciaVariable(node) {
        const id = node.id;
        try {
            const variable = this.entornoActual.get(id);
            return variable;
        } catch (error) {
            this.errores.push({desc: `La variable ${id} no existe`, linea: node.id.location.start.line, columna: node.id.location.start.column, tipo: "Semantico"});
            throw new Error(`La variable ${id} no existe`);
        }
        
    }

    /**
     * @type {BaseVisitor['visitAgrupacion']}
     */
    visitAgrupacion(node) {
        return node.exp.accept(this);
    }  

    /**
     * @type {BaseVisitor['visitAsignacion']}
     */
    visitAsignacion(node) {
        const id = node.id;
        const valor = node.asgn.accept(this);
        
        try {
            this.entornoActual.assign(id, valor);
            return valor;
        } catch (error) {
            this.errores.push({desc: `La variable ${id} no existe o el tipo a asignar es invalido`, linea: node.asgn.location.start.line, columna: node.asgn.location.start.column, tipo: "Semantico"});
            throw new Error(`La variable ${id} no existe`);
        }
    }

    /**
     * @type {BaseVisitor['visitExpresionStmt']}
     */
    visitExpresionStmt(node) {
        return node.exp.accept(this);
    }

    /**
     * @type {BaseVisitor['visitOperacionBinaria']}
     */
    visitOperacionBinaria(node) {
        const izq = node.izq.accept(this);
        const der = node.der.accept(this);

        switch (node.op) {
            case '+':
                switch (izq.tipo){
                    case "int":
                        switch (der.tipo){
                            case "int":
                                return {tipo: "int", valor: izq.valor + der.valor};
                            case "float":
                                return {tipo: "float", valor: parseFloat(izq.valor) + parseFloat(der.valor)};
                            default:
                                this.errores.push({desc: `No se puede sumar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                                throw new Error(`No se puede sumar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                        }
                    case "float":
                        switch (der.tipo){
                            case "int":
                                return {tipo: "float", valor: parseFloat(izq.valor) + parseFloat(der.valor)};
                            case "float":
                                return {tipo: "float", valor: parseFloat(izq.valor) + parseFloat(der.valor)};
                            default:
                                this.errores.push({desc: `No se puede sumar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                                throw new Error(`No se puede sumar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                        }
                    case "string":
                        switch (der.tipo){
                            case "string":
                                return {tipo: "string", valor: izq.valor + der.valor};
                            default:
                                this.errores.push({desc: `No se puede sumar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                                throw new Error(`No se puede sumar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                        }
                    default:
                        this.errores.push({desc: `No se puede sumar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                        throw new Error(`No se puede sumar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                    }
            case '-':
                switch (izq.tipo){
                    case "int":
                        switch (der.tipo){
                            case "int":
                                return {tipo: "int", valor: izq.valor - der.valor};
                            case "float":
                                return {tipo: "float", valor: parseFloat(izq.valor) - parseFloat(der.valor)};
                            default:
                                this.errores.push({desc: `No se puede restar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                                throw new Error(`No se puede restar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                        }
                    case "float":
                        switch (der.tipo){
                            case "int":
                                return {tipo: "float", valor: parseFloat(izq.valor) - parseFloat(der.valor)};
                            case "float":
                                return {tipo: "float", valor: parseFloat(izq.valor) - parseFloat(der.valor)};
                            default:
                                this.errores.push({desc: `No se puede restar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                                throw new Error(`No se puede restar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                        }
                    default:
                        this.errores.push({desc: `No se puede restar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                        throw new Error(`No se puede restar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                    }
            case '*':
                switch (izq.tipo){
                    case "int":
                        switch (der.tipo){
                            case "int":
                                return {tipo: "int", valor: izq.valor * der.valor};
                            case "float":
                                return {tipo: "float", valor: parseFloat(izq.valor) * parseFloat(der.valor)};
                            default:
                                this.errores.push({desc: `No se puede multiplicar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                                throw new Error(`No se puede multiplicar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                        }
                    case "float":
                        switch (der.tipo){
                            case "int":
                                return {tipo: "float", valor: parseFloat(izq.valor) * parseFloat(der.valor)};
                            case "float":
                                return {tipo: "float", valor: parseFloat(izq.valor) * parseFloat(der.valor)};
                            default:
                                this.errores.push({desc: `No se puede multiplicar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                                throw new Error(`No se puede multiplicar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                        }
                    default:
                        this.errores.push({desc: `No se puede multiplicar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                        throw new Error(`No se puede multiplicar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                    }
            case '/':
                switch (izq.tipo){
                    case "int":
                        if (der.valor == 0){
                            this.errores.push({desc: `No se puede dividir entre 0`, linea: node.der.location.start.line, columna: node.der.location.start.column, tipo: "Semantico"});
                            throw new Error(`No se puede dividir entre 0`);
                        }
                        switch (der.tipo){
                            case "int":
                                return {tipo: "int", valor: parseInt(izq.valor / der.valor)};
                            case "float":
                                return {tipo: "float", valor: parseFloat(izq.valor) / parseFloat(der.valor)};
                            default:
                                this.errores.push({desc: `No se puede dividir un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                                throw new Error(`No se puede dividir un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                        }
                    case "float":
                        if (der.valor == 0){
                            this.errores.push({desc: `No se puede dividir entre 0`, linea: node.der.location.start.line, columna: node.der.location.start.column, tipo: "Semantico"});
                            throw new Error(`No se puede dividir entre 0`);
                        }
                        switch (der.tipo){
                            case "int":
                                return {tipo: "float", valor: parseFloat(izq.valor) / parseFloat(der.valor)};
                            case "float":
                                return {tipo: "float", valor: parseFloat(izq.valor) / parseFloat(der.valor)};
                            default:
                                this.errores.push({desc: `No se puede dividir un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                                throw new Error(`No se puede dividir un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                        }
                    default:
                        this.errores.push({desc: `No se puede dividir un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                        throw new Error(`No se puede dividir un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                    }
            case '%':
                switch (izq.tipo){
                    case "int":
                        if (der.valor == 0){
                            this.errores.push({desc: `No se puede dividir entre 0`, linea: node.der.location.start.line, columna: node.der.location.start.column, tipo: "Semantico"});
                            throw new Error(`No se puede dividir entre 0`);
                        }
                        switch (der.tipo){
                            case "int":
                                return {tipo: "int", valor: izq.valor % der.valor};
                            default:
                                this.errores.push({desc: `No se puede ejecutar modulo de un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                                throw new Error(`No se puede ejecutar modulo de un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                        }
                    default:
                        this.errores.push({desc: `No se puede ejecutar modulo de un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                        throw new Error(`No se puede ejecutar modulo de un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                    }
            case '>':
                switch (izq.tipo){
                    case "int":
                        switch (der.tipo){
                            case "int":
                                return {tipo: "boolean", valor: izq.valor > der.valor};
                            case "float":
                                return {tipo: "boolean", valor: parseFloat(izq.valor) > parseFloat(der.valor)};
                            default:
                                this.errores.push({desc: `No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                                throw new Error(`No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                        }
                    case "float":
                        switch (der.tipo){
                            case "float":
                                return {tipo: "boolean", valor: parseFloat(izq.valor) > parseFloat(der.valor)};
                            case "int": 
                                return {tipo: "boolean", valor: parseFloat(izq.valor) > parseFloat(der.valor)};
                            default:
                                this.errores.push({desc: `No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                                throw new Error(`No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                        }
                    case "char":
                        switch (der.tipo){
                            case "char":
                                return {tipo: "boolean", valor: izq.valor > der.valor};
                            default:
                                this.errores.push({desc: `No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                                throw new Error(`No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                        }
                    default:
                        this.errores.push({desc: `No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                        throw new Error(`No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                    }
            case '<':
                switch (izq.tipo){
                    case "int":
                        switch (der.tipo){
                            case "int":
                                return {tipo: "boolean", valor: izq.valor < der.valor};
                            case "float":
                                return {tipo: "boolean", valor: parseFloat(izq.valor) < parseFloat(der.valor)};
                            default:
                                this.errores.push({desc: `No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                                throw new Error(`No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                        }
                    case "float":
                        switch (der.tipo){
                            case "float":
                                return {tipo: "boolean", valor: parseFloat(izq.valor) < parseFloat(der.valor)};
                            case "int":
                                return {tipo: "boolean", valor: parseFloat(izq.valor) < parseFloat(der.valor)};
                            default:
                                this.errores.push({desc: `No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                                throw new Error(`No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                        }
                    case "char":
                        switch (der.tipo){
                            case "char":
                                return {tipo: "boolean", valor: izq.valor < der.valor};
                            default:
                                this.errores.push({desc: `No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                                throw new Error(`No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                        }
                    default:
                        this.errores.push({desc: `No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                        throw new Error(`No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                    }
            case '>=':
                switch (izq.tipo){
                    case "int":
                        switch (der.tipo){
                            case "int":
                                return {tipo: "boolean", valor: izq.valor >= der.valor};
                            case "float":
                                return {tipo: "boolean", valor: parseFloat(izq.valor) >= parseFloat(der.valor)};
                            default:
                                this.errores.push({desc: `No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                                throw new Error(`No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                        }
                    case "float":
                        switch (der.tipo){
                            case "float":
                                return {tipo: "boolean", valor: parseFloat(izq.valor) >= parseFloat(der.valor)};
                            case "int":
                                return {tipo: "boolean", valor: parseFloat(izq.valor) >= parseFloat(der.valor)};
                            default:
                                this.errores.push({desc: `No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                                throw new Error(`No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                        }
                    case "char":
                        switch (der.tipo){
                            case "char":
                                return {tipo: "boolean", valor: izq.valor >= der.valor};
                            default:
                                this.errores.push({desc: `No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                                throw new Error(`No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                        }
                    default:
                        this.errores.push({desc: `No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                        throw new Error(`No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                    }
            case '<=':
                switch (izq.tipo){
                    case "int":
                        switch (der.tipo){
                            case "int":
                                return {tipo: "boolean", valor: izq.valor <= der.valor};
                            case "float":
                                return {tipo: "boolean", valor: parseFloat(izq.valor) <= parseFloat(der.valor)};
                            default:
                                this.errores.push({desc: `No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                                throw new Error(`No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                        }
                    case "float":
                        switch (der.tipo){
                            case "float":
                                return {tipo: "boolean", valor: parseFloat(izq.valor) <= parseFloat(der.valor)};
                            case "int":
                                return {tipo: "boolean", valor: parseFloat(izq.valor) <= parseFloat(der.valor)};
                            default:
                                this.errores.push({desc: `No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                                throw new Error(`No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                        }
                    case "char":
                        switch (der.tipo){
                            case "char":
                                return {tipo: "boolean", valor: izq.valor <= der.valor};
                            default:
                                this.errores.push({desc: `No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                                throw new Error(`No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                        }
                    default:
                        this.errores.push({desc: `No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                        throw new Error(`No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                    }
            case '!=':
                switch (izq.tipo){
                    case "int":
                        switch (der.tipo){
                            case "int":
                                return {tipo: "boolean", valor: izq.valor !== der.valor};
                            case "float":
                                return {tipo: "boolean", valor: parseFloat(izq.valor) !== parseFloat(der.valor)};
                            default:
                                this.errores.push({desc: `No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                                throw new Error(`No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                        }
                    case "float":
                        switch (der.tipo){
                            case "float":
                                return {tipo: "boolean", valor: parseFloat(izq.valor) !== parseFloat(der.valor)};
                            case "int":
                                return {tipo: "boolean", valor: parseFloat(izq.valor) !== parseFloat(der.valor)};
                            default:
                                this.errores.push({desc: `No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                                throw new Error(`No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                        }
                    case "boolean":
                        switch (der.tipo){
                            case "boolean":
                                return {tipo: "boolean", valor: izq.valor !== der.valor};
                            default:
                                this.errores.push({desc: `No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                                throw new Error(`No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                        }
                    case "string":
                        switch (der.tipo){
                            case "string":
                                return {tipo: "boolean", valor: izq.valor !== der.valor};
                            default:
                                this.errores.push({desc: `No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                                throw new Error(`No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                        }
                    case "char":
                        switch (der.tipo){
                            case "char":
                                return {tipo: "boolean", valor: izq.valor !== der.valor};
                            default:
                                this.errores.push({desc: `No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                                throw new Error(`No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                        }
                    default:
                        this.errores.push({desc: `No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                        throw new Error(`No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                    }
            case '==':
                switch (izq.tipo){
                    case "int":
                        switch (der.tipo){
                            case "int":
                                return {tipo: "boolean", valor: izq.valor === der.valor};
                            case "float":
                                return {tipo: "boolean", valor: parseFloat(izq.valor) === parseFloat(der.valor)};
                            default:
                                this.errores.push({desc: `No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                                throw new Error(`No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                        }
                    case "float":
                        switch (der.tipo){
                            case "float":
                                return {tipo: "boolean", valor: parseFloat(izq.valor) === parseFloat(der.valor)};
                            case "int":
                                return {tipo: "boolean", valor: parseFloat(izq.valor) === parseFloat(der.valor)};
                            default:
                                this.errores.push({desc: `No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                                throw new Error(`No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                        }
                    case "boolean":
                        switch (der.tipo){
                            case "boolean":
                                return {tipo: "boolean", valor: izq.valor === der.valor};
                            default:
                                this.errores.push({desc: `No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                                throw new Error(`No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                        }
                    case "string":
                        switch (der.tipo){
                            case "string":
                                return {tipo: "boolean", valor: izq.valor === der.valor};
                            default:
                                this.errores.push({desc: `No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                                throw new Error(`No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                        }
                    case "char":
                        switch (der.tipo){
                            case "char":
                                return {tipo: "boolean", valor: izq.valor === der.valor};
                            default:
                                this.errores.push({desc: `No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                                throw new Error(`No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                        }
                    default:
                        this.errores.push({desc: `No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                        throw new Error(`No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                    }
            case '&&':
                switch (izq.tipo){
                    case "boolean":
                        switch (der.tipo){
                            case "boolean":
                                return {tipo: "boolean", valor: izq.valor && der.valor};
                            default:
                                this.errores.push({desc: `No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                                throw new Error(`No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                        }
                    default:
                        this.errores.push({desc: `No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                        throw new Error(`No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                    }
            case '||':
                switch (izq.tipo){
                    case "boolean":
                        switch (der.tipo){
                            case "boolean":
                                return {tipo: "boolean", valor: izq.valor || der.valor};
                            default:
                                this.errores.push({desc: `No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                                throw new Error(`No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                        }
                    default:
                        this.errores.push({desc: `No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
                        throw new Error(`No se puede comparar un tipo ${der.tipo} con un tipo ${izq.tipo}`);
                    }
            default:
                this.errores.push({desc: `Operador no soportado: ${node.op}`, linea: node.op.location.start.line, columna: node.op.location.start.column, tipo: "Semantico"});
                throw new Error(`Operador no soportado: ${node.op}`);
        }
    }

     /**
     * @type {BaseVisitor['visitOperacionUnaria']}
     */
     visitOperacionUnaria(node) {
        const exp = node.exp.accept(this);

        switch (node.op) {
            case '-':
                switch (exp.tipo){
                    case "int":
                        return {tipo: exp.tipo, valor:-exp.valor};
                    case "float":
                        return {tipo: exp.tipo, valor:-exp.valor};
                    default:
                        this.errores.push({desc: `No se puede negar un tipo ${exp.tipo}`, linea: node.exp.location.start.line, columna: node.exp.location.start.column, tipo: "Semantico"});
                        throw new Error(`No se puede negar un tipo ${exp.tipo}`);
                }
            case '!':
                switch (exp.tipo){
                    case "boolean":
                        return {tipo: exp.tipo, valor:!exp.valor};
                    default:
                        this.errores.push({desc: `No se puede negar un tipo ${exp.tipo}`, linea: node.exp.location.start.line, columna: node.exp.location.start.column, tipo: "Semantico"});
                        throw new Error(`No se puede negar un tipo ${exp.tipo}`);
                }
            default:
                this.errores.push({desc: `Operador no soportado: ${node.op}`, linea: node.op.location.start.line, columna: node.op.location.start.column, tipo: "Semantico"});
                throw new Error(`Operador no soportado: ${node.op}`);
        }
    }

    /**
     * @type {BaseVisitor['visitBloque']}
     */
    visitBloque(node, ubicacion) {
        const entorno = new Entorno(this.entornoActual, ubicacion);
        this.entornoActual = entorno;

        node.dcls.forEach(sentencia => {
            if (sentencia instanceof nodos.While && ubicacion === 'for') {
                sentencia.accept(this, ubicacion);
            }else{
                sentencia.accept(this);
            }
        });
            
            

        this.entornoActual = entorno.padre;
    }

    /**
     * @type {BaseVisitor['visitIf']}
     */
    visitIf(node) {
        const condicion = node.cond.accept(this);

        if (condicion.tipo !== 'boolean') {
            this.errores.push({desc: `La condicion debe ser de tipo boolean, se recibio ${condicion.tipo}`, linea: node.cond.location.start.line, columna: node.cond.location.start.column, tipo: "Semantico"});
            throw new Error(`La condicion debe ser de tipo boolean, se recibio ${condicion.tipo}`);
        }

        if (condicion.valor) {
            if (node.stmtTrue instanceof nodos.Bloque) {
                node.stmtTrue.accept(this, 'if');
                return node.stmtTrue
            }else{
                node.stmtTrue.accept(this);
                return node.stmtTrue
            }
           
        }
        if (node.stmtFalse) {
            if (node.stmtFalse instanceof nodos.Bloque) {
                node.stmtFalse.accept(this, 'else');
                return node.stmtFalse
            }else{
                node.stmtFalse.accept(this);
                return node.stmtFalse
            }
        }
    }

    /**
     * @type {BaseVisitor['visitWhile']}
     */
    visitWhile(node, ubicacion) {
        const entornoAnterior = this.entornoActual
        try {
            let condicion = node.cond.accept(this);

            if (condicion.tipo !== 'boolean') {
                this.errores.push({desc: `La condicion debe ser de tipo boolean, se recibio ${condicion.tipo}`, linea: node.cond.location.start.line, columna: node.cond.location.start.column, tipo: "Semantico"});
                throw new Error(`La condicion debe ser de tipo boolean, se recibio ${condicion.tipo}`);
            }
            while (condicion.valor) {
                if(node.stmt instanceof nodos.Bloque){
                    node.stmt.accept(this, ubicacion);
                }else{
                    node.stmt.accept(this);
                }
                condicion = node.cond.accept(this);
            }
        } catch (error) {
            this.entornoActual = entornoAnterior;

            if (error instanceof BreakException) {
                return
            }

            if (error instanceof ContinueException) {
                return this.visitWhile(node);
            }

            throw error;

        }
    }

    /**
     * @type {BaseVisitor['visitFor']}
     */
    visitFor(node) {
        const incrementoAnterior = this.prevContinue;
        this.prevContinue = node.inc;

        const forTraducido = new nodos.Bloque({
            dcls: [
                node.init,
                new nodos.While({
                    cond: node.cond,
                    stmt: new nodos.Bloque({
                        dcls: [
                            node.stmt,
                            node.inc
                        ]
                    })
                })
            ]
        })

        forTraducido.accept(this, 'for');

        this.prevContinue = incrementoAnterior;
    }

    /**
     * @type {BaseVisitor['visitPrint']}
     */
    visitPrint(node) {
        let textoFinal = ""
        const izq = node.exp.accept(this);
        const der = node.der
        if (der.length !== 0){
            for (let texto of der){
                const valor = texto.accept(this);
                if (valor.tipo === "int" || valor.tipo === "float" || valor.tipo === "string" || valor.tipo === "char" || valor.tipo === "boolean"){
                    if(valor.valor !== null && (valor.tipo === "string" || valor.tipo === "char") && valor.valor[valor.valor.length-1] === "\n"){
                        textoFinal += valor.valor;
                    }
                    else{
                        textoFinal += valor.valor;
                    }
                }
            }
        }
        if (izq.tipo === "int" || izq.tipo === "float" || izq.tipo === "string" || izq.tipo === "char" || izq.tipo === "boolean"){
            if(izq.valor !== null &&(izq.tipo === "string" || izq.tipo === "char") && izq.valor[izq.valor.length-1] === "\n"){
                this.salida += izq.valor + textoFinal + "\n";
            }else{
                this.salida += izq.valor + textoFinal + "\n";   
            }
        }else{
            this.errores.push({desc: `No se puede imprimir un tipo no primitivo`, linea: node.izq.location.start.line, columna: node.izq.location.start.column, tipo: "Semantico"});
            throw new Error(`No se puede imprimir un tipo no primitivo`);
        }    

    }

    /**
     * @type {BaseVisitor['visitSwitch']}
     */
    visitSwitch(node) {
        const entornoAnterior = this.entornoActual
        try {
            const condicion = node.exp.accept(this);
            let breakFlag = false

            for (let i = 0; i < node.cases.length; i++){
                const valorCase = node.cases[i].exp.accept(this);
                if (condicion.tipo !== valorCase.tipo){
                    this.errores.push({desc: `No se puede comparar un tipo ${valorCase.tipo} con un tipo ${condicion.tipo}`, linea: node.exp.location.start.line, columna: node.exp.location.start.column, tipo: "Semantico"});
                    throw new Error(`No se puede comparar un tipo ${valorCase.tipo} con un tipo ${condicion.tipo}`);
                }

                if (!breakFlag){
                    if (condicion.valor === valorCase.valor){
                        node.cases[i].accept(this);
                        breakFlag = true;
                    }
                }else {
                        node.cases[i].accept(this);
                }
            }

            let newEntorno = new Entorno(this.entornoActual, 'switch');
            this.entornoActual = newEntorno;

            for (let i = 0; i < node.def.length; i++){
                node.def[i].accept(this);
            }
            this.entornoActual = newEntorno.padre;
        } catch (error) {
            this.entornoActual = entornoAnterior;
            if (error instanceof BreakException) {
                return
            }
            throw error;
            
        }
        
    }

    /**
     * @type {BaseVisitor['visitCase']}
     */
    visitCase(node) {
        let entorno = new Entorno(this.entornoActual, `case ${node.exp.accept(this).valor}`);
        this.entornoActual = entorno;

        node.stmt.forEach(sentencia => sentencia.accept(this));

        this.entornoActual = entorno.padre;
    }

    /**
     * @type {BaseVisitor['visitBreak']}
     */
    visitBreak(node) {
        throw new BreakException(node.location.start.line, node.location.start.column);
    }

    /**
     * @type {BaseVisitor['visitContinue']}
     */
    visitContinue(node) {
        if (this.prevContinue) {
            this.prevContinue.accept(this);
        }

        throw new ContinueException(node.location.start.line, node.location.start.column);
    }

    /**
     * @type {BaseVisitor['visitReturn']}
     */
    visitReturn(node) {
        let valor = {tipo:'void', valor:null}
        if (node.exp !== null) {
            valor = node.exp.accept(this);
        }
        throw new ReturnException(valor, node.location.start.line, node.location.start.column);
    }

    /**
     * @type {BaseVisitor['visitLlamada']}
     */
    visitLlamada(node) {
        const funcion = node.callee.accept(this);

        const argumentos = node.args.map(arg => arg.accept(this));
        if(!(funcion instanceof Invocable)){
            this.errores.push({desc: `No se puede llamar porque no es una funcion`, linea: node.callee.location.start.line, columna: node.callee.location.start.column, tipo: "Semantico"});
            throw new Error(`No se puede llamar porque no es una funcion`);
        }

        if(funcion.aridad() !== argumentos.length){
            this.errores.push({desc: `Se esperaban ${funcion.aridad()} argumentos pero se recibieron ${argumentos.length}`, linea: node.callee.location.start.line, columna: node.callee.location.start.column, tipo: "Semantico"});
            throw new Error(`Se esperaban ${funcion.aridad} argumentos pero se recibieron ${argumentos.length}`);
        }

        try {
            return {tipo: funcion.tipo, valor: funcion.invocar(this, argumentos)}
        } catch (error) {
            this.errores.push({desc: error.message, linea: node.callee.location.start.line, columna: node.callee.location.start.column, tipo: "Semantico"});
            throw error;
        }
        
    }

    /**
     * @type {BaseVisitor['visitFuncDcl']}
     */
    visitFuncDcl(node) {
        const funcion = new FuncionForanea(node, this.entornoActual);
        this.tablaSimbolos.push(this.entornoActual.set(node.id, funcion, "funcion", node.location.start.line, node.location.start.column));
    }

    /**
     * @type {BaseVisitor['visitStruct']}
     */
    visitStructDcl(node) {
        const propiedades = {};

        node.dcls.forEach(dcl => {
            propiedades[dcl.id] = {tipo: dcl.tipo, valor: dcl.exp}
        });

        const struct = new Struct(node.id, propiedades);

        this.tablaSimbolos.push(this.entornoActual.set(node.id, {tipo: 'struct', valor: struct}, "struct", node.location.start.line, node.location.start.column));
    }

    /**
     * @type {BaseVisitor['visitInstancia']}
     */
    visitInstancia(node) {
        const struct = this.entornoActual.get(node.id);

        const parametros = node.params


        if (!(struct.valor instanceof Struct)) {
            this.errores.push({desc: `No es posible instanciar algo que no es un struct`, linea: node.id.location.start.line, columna: node.id.location.start.column, tipo: "Semantico"});
            throw new Error('No es posible instanciar algo que no es un struct');
        }

        if (struct.valor.aridad() !== parametros.length) {
            this.errores.push({desc: `Se esperaban ${struct.valor.aridad()} argumentos pero se recibieron ${parametros.length}`, linea: node.params.location.start.line, columna: node.params.location.start.column, tipo: "Semantico"});
            throw new Error(`Se esperaban ${struct.valor.aridad()} argumentos pero se recibieron ${parametros.length}`);
        }

        return struct.valor.invocar(this, parametros);
    }

    /**
     * @type {BaseVisitor['visitGet']}
     */
    visitGet(node) {
        const instancia = node.objetivo.accept(this);

        if (!(instancia.valor instanceof Instancia)) {
            this.errores.push({desc: `No es posible acceder a algo que no es un struct o arreglo`, linea: node.objetivo.location.start.line, columna: node.objetivo.location.start.column, tipo: "Semantico"});
            throw new Error('No es posible acceder a algo que no es un struct o arreglo');
        }
        let propiedad = node.propiedad
        if (instancia.valor.struct instanceof Arreglo){
            propiedad = node.propiedad.accept(this).valor
        }

        return instancia.valor.get(propiedad);
    }

    /**
     * @type {BaseVisitor['visitSet']}
     */
    visitSet(node) {
        const instancia = node.objetivo.accept(this);

        if (!(instancia.valor instanceof Instancia)) {
            this.errores.push({desc: `No es posible acceder a algo que no es un struct o arreglo`, linea: node.objetivo.location.start.line, columna: node.objetivo.location.start.column, tipo: "Semantico"});
            throw new Error('No es posible acceder a algo que no es un struct');
        }
        let propiedad = node.propiedad
        if (instancia.valor.struct instanceof Arreglo){
            propiedad = node.propiedad.accept(this).valor
        }
        const valor = node.valor.accept(this);

        if (instancia.valor.struct instanceof Arreglo){
            try {
                instancia.valor.get(propiedad)
            } catch (error) {
                this.errores.push({desc: `No se puede asignar a una posicion que no existe`, linea: node.location.start.line, columna: node.location.start.column, tipo: "Semantico"});
                throw error
            }
            
            instancia.valor.set(propiedad, {tipo: valor.tipo, valor: valor.valor}, 'variable', node.location.start.line, node.location.start.column)
        }else{
            this.tablaSimbolos.push(instancia.valor.set(propiedad, {tipo: valor.tipo, valor: valor.valor}, 'variable', node.location.start.line, node.location.start.column));
        }
        

        return valor;
    }

    /**
     * @type {BaseVisitor['visitKeys']}
     */
    visitKeys(node) {
        const instancia = node.objetivo.accept(this);

        if (!(instancia.valor instanceof Instancia)) {
            this.errores.push({desc: `No es posible acceder a algo que no es un struct`, linea: node.objetivo.location.start.line, columna: node.objetivo.location.start.column, tipo: "Semantico"});
            throw new Error('No es posible acceder a algo que no es un struct');
        }
        let arregloKeys = "[ "
        Object.entries(instancia.valor.propiedades).forEach(([nombre, clave]) => {
            arregloKeys += nombre + ", ";
        });
        arregloKeys = arregloKeys.slice(0, arregloKeys.length-2) + " ]"

        return {tipo: 'string', valor: arregloKeys};
    }

    /**
     * @type {BaseVisitor['visitDclArray']}
     */
    visitDclArray(node) {
        const id = node.id;
        const tipo = node.tipo;
        const dim = node.dim;

        if (Array.isArray(node.exp)){
            let dimensiones = node.exp.length
            if (dimensiones !== dim){
                this.errores.push({desc: `El tamaño del arreglo no coincide con la cantidad de dimensiones`, linea: node.exp.location.start.line, columna: node.exp.location.start.column, tipo: "Semantico"});
                throw new Error(`El tamaño del arreglo no coincide con la cantidad de dimensiones`);
            }

            let valoresDimension = []
            for (let i = 0; i < node.exp.length; i++){
                let valorFinal = node.exp[i].exp.accept(this);
                valoresDimension.push(valorFinal.valor);
            }

            let arreglo = new nodos.Arreglo(
                {
                    args: [
                    ]
                }
            )
            let instancia = new Instancia(arreglo)
            crearArreglos(valoresDimension, instancia, tipo);
            this.tablaSimbolos.push(this.entornoActual.set(id, { tipo, id, valor: instancia }, "Array", node.location.start.line, node.location.start.column));
        }else if(node.exp instanceof nodos.ReferenciaVariable){
            let valorFinal = node.exp.accept(this);
            if (!(valorFinal.valor instanceof Instancia)){
                this.errores.push({desc: `No se puede asignar un valor de tipo ${valorFinal.tipo} a un arreglo`, linea: node.exp.location.start.line, columna: node.exp.location.start.column, tipo: "Semantico"});
                throw new Error(`No se puede asignar un valor de tipo ${valorFinal.tipo} a un arreglo`);
            }
            if (valorFinal.valor.struct instanceof nodos.Arreglo){
                this.tablaSimbolos.push(this.entornoActual.set(id, { tipo, id, valor: cloneInstancia(valorFinal.valor)}, "Array", node.location.start.line, node.location.start.column));
            }
        }else{
            let dimensiones = getDimensiones(node.exp)

            if (dimensiones !== dim){
                this.errores.push({desc: `El tamaño del arreglo no coincide con la cantidad de dimensiones`, linea: node.exp.location.start.line, columna: node.exp.location.start.column, tipo: "Semantico"});
                throw new Error(`El tamaño del arreglo no coincide con la cantidad de dimensiones`);
            }
    
            let instancia = new Instancia(node.exp)
            crearInstancia(node.exp, instancia, this);
            this.tablaSimbolos.push(this.entornoActual.set(id, { tipo, id, valor: instancia }, "Array", node.location.start.line, node.location.start.column));
        }


        
    }

    /**
     * @type {BaseVisitor['visitArreglo']}
     */
    visitArreglo(node) {
        return node.args
    }

    /**
     * @type {BaseVisitor['visitFuncArray']}
     */
    visitFuncArray(node) {
        const arreglo = node.objetivo.accept(this);

        if (!(arreglo.valor instanceof Instancia)) {
            this.errores.push({desc: `No es posible usar la funcion en algo que no es un Array`, linea: node.objetivo.location.start.line, columna: node.objetivo.location.start.column, tipo: "Semantico"});
            throw new Error('No es posible usar la funcion en algo que no es un Array');
        }

        if (node.id === "join"){
            let resultado = ""
            Object.entries(arreglo.valor.propiedades).forEach(([nombre, clave]) => {
                resultado += clave.valor+ ", ";
            });
            return {tipo: 'string', valor: resultado.slice(0, resultado.length-2)};
        }else if (node.id === "length"){
            let tamano = 0
            Object.entries(arreglo.valor.propiedades).forEach(([nombre, clave]) => {
                tamano++;
            });
            return {tipo: 'int', valor: tamano};
        }else{
            let propiedad = node.id.accept(this)
            let posicion = -1
            Object.entries(arreglo.valor.propiedades).forEach(([nombre, clave]) => {
                if (clave.valor === propiedad.valor){
                    posicion =  nombre;
                }
            });
            return {tipo: "int", valor: posicion};
        }
    }

    /**
     * @type {BaseVisitor['visitForEach']}
     */
    visitForEach(node){
        const incrementoAnterior = this.prevContinue;
        this.prevContinue = new nodos.Asignacion({
            id: "$",
            asgn: new nodos.OperacionBinaria({
                izq: new nodos.ReferenciaVariable({id: "$"}),
                der: new nodos.Nativo({tipo: "int", valor: 1}),
                op: '+'
            })
        });

        /*  
            for(int elemento : arreglo){
                System.out.println(elemento);
            }

            for( int i = 0; i < arreglo.length; i++){
                int elemento = arreglo[i]
                {
                    System.out.println(elemento);
                }
            }
        */

        let arreglo = node.exp.accept(this).valor;

        let tamanoArray = 0
         Object.entries(arreglo.propiedades).forEach(([nombre, clave]) => {
            tamanoArray++;
        });

        let iterable = new nodos.Nativo({tipo: "int", valor: 0})
        iterable.location = node.location

        let dec = new nodos.Declaracion({
            tipo: "int",
            id: "$",
            exp: iterable
        })
        dec.location = node.location

        let elem = new nodos.Declaracion({
            tipo: node.tipo,
            id: node.id,
            exp: new nodos.Get({
                objetivo: node.exp,
                propiedad: new nodos.ReferenciaVariable({id: "$"})
            })
            //exp: new nodos.Nativo({tipo: node.tipo, valor: arreglo.get(posicion.accept(this)).valor})
        })
        elem.location = node.location

        const forTraducido = new nodos.Bloque({
            dcls: [
                //inicializacion o int $ = 0
                dec,
                new nodos.While({
                    cond: new nodos.OperacionBinaria({
                        izq: new nodos.ReferenciaVariable({id: "$"}),
                        der: new nodos.Nativo({tipo: "int", valor: tamanoArray}),
                        op: '<'
                    }),
                    stmt: new nodos.Bloque({
                        dcls: [
                            elem,
                            node.stmt,
                            new nodos.Asignacion({
                                id: "$",
                                asgn: new nodos.OperacionBinaria({
                                    izq: new nodos.ReferenciaVariable({id: "$"}),
                                    der: new nodos.Nativo({tipo: "int", valor: 1}),
                                    op: '+'
                                })
                            })
                        ]
                    })
                })
            ]
        })

        forTraducido.accept(this, 'for');

        this.prevContinue = incrementoAnterior;
    }
    

}

function RemoveCaracteresEspeciales(cadena) {
    // Convierte las secuencias de escape
    let cadenaConvertida = cadena.replace(/\\([nrtvbf\\\"\'])/g, (match, grupo) => {
        if (grupo === "n") return "\n"; // Salto de línea
        if (grupo === "r") return "\r"; // Retorno de carro
        if (grupo === "t") return "\t"; // Tabulación
        if (grupo === "v") return "\v"; // Tabulación vertical
        if (grupo === "b") return "\b"; // Retroceso
        if (grupo === "f") return "\f"; // Salto de página
        if (grupo === "\\") return "\\"; // Barra invertida
        if (grupo === "\"") return "\"";  // Comilla doble
        if (grupo === "\'") return "\'";  // Comilla simple
        return match; // Si no coincide con ninguno, devolver el valor original
    });

    // Elimina las comillas al principio y al final de la cadena
    return cadenaConvertida.replace(/^["']|["']$/g, "");
}

function getDimensiones(arreglo){
    let dimensiones = 0

    if (arreglo instanceof nodos.Arreglo){
        dimensiones = 1
        let temp = arreglo.args[0]
        while (temp instanceof nodos.Arreglo){
            dimensiones++
            temp = temp.args[0]
        }
    }

    return dimensiones
}

function crearInstancia(arreglo, instancia, interprete){

    if (arreglo.args[0] instanceof nodos.Arreglo){
        let valores = arreglo.args;
        
        for (let i = 0; i < valores.length; i++){
            let instanciaNueva = new Instancia(valores[i]);
            crearInstancia(valores[i], instanciaNueva, interprete);
            instancia.set(i, {tipo: "Array", valor:instanciaNueva});
        }
    }else{
        for (let i = 0; i < arreglo.args.length; i++){
            let valorFinal = arreglo.args[i].accept(interprete);
            instancia.set(i, valorFinal);
        }
    }
}

function crearArreglos(valoresDimension, instancia, tipo){
    if ( valoresDimension.length > 1 ){
        for (let j = 0; j < valoresDimension[0]; j++){
            let newInstancia = new Instancia(new nodos.Arreglo({args: []}));
            crearArreglos(valoresDimension.slice(1), newInstancia, tipo);
            instancia.set(j, {tipo: "Array", valor: newInstancia});
        } 
    }else{
        for (let j = 0; j < valoresDimension[0]; j++){
            switch (tipo){
                case "int":
                    instancia.set(j, {tipo: "int", valor: 0});
                    break;
                case "float":
                    instancia.set(j, {tipo: "float", valor: 0.0});
                    break;
                case "string":
                    instancia.set(j, {tipo: "string", valor: ""});
                    break;
                case "char":
                    instancia.set(j, {tipo: "char", valor: ''});
                    break;
                case "boolean":
                    instancia.set(j, {tipo: "boolean", valor: false});
                    break;
                case "struct":
                    instancia.set(j, {tipo: "struct", valor: null});
                    break;
            }
        }
    }
}

function cloneInstancia(instancia){
    let instanciaNueva = new Instancia(new nodos.Arreglo({args: []}));
    Object.entries(instancia.propiedades).forEach(([nombre, clave]) => {
        let valor = clave.valor;
        if (clave.valor instanceof Instancia){
            valor = cloneInstancia(clave.valor);
            instanciaNueva.set(nombre, {tipo: "Array", valor: valor});
        }else{
            instanciaNueva.set(nombre, {tipo: clave.tipo, valor: clave.valor});
        }
    });
    return instanciaNueva;
}