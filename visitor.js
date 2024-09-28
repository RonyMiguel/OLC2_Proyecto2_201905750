
/**

 * @typedef {import('./nodos').Expresion} Expresion


 * @typedef {import('./nodos').Nativo} Nativo


 * @typedef {import('./nodos').Declaracion} Declaracion


 * @typedef {import('./nodos').ReferenciaVariable} ReferenciaVariable


 * @typedef {import('./nodos').Agrupacion} Agrupacion


 * @typedef {import('./nodos').Asignacion} Asignacion


 * @typedef {import('./nodos').ExpresionStmt} ExpresionStmt


 * @typedef {import('./nodos').OperacionBinaria} OperacionBinaria


 * @typedef {import('./nodos').OperacionUnaria} OperacionUnaria


 * @typedef {import('./nodos').Bloque} Bloque


 * @typedef {import('./nodos').If} If


 * @typedef {import('./nodos').While} While


 * @typedef {import('./nodos').For} For


 * @typedef {import('./nodos').Print} Print


 * @typedef {import('./nodos').Switch} Switch


 * @typedef {import('./nodos').Case} Case


 * @typedef {import('./nodos').Break} Break


 * @typedef {import('./nodos').Continue} Continue


 * @typedef {import('./nodos').Return} Return


 * @typedef {import('./nodos').Llamada} Llamada


 * @typedef {import('./nodos').FuncDcl} FuncDcl


 * @typedef {import('./nodos').StructDcl} StructDcl


 * @typedef {import('./nodos').Instancia} Instancia


 * @typedef {import('./nodos').Get} Get


 * @typedef {import('./nodos').Set} Set


 * @typedef {import('./nodos').Keys} Keys


 * @typedef {import('./nodos').DclArray} DclArray


 * @typedef {import('./nodos').Arreglo} Arreglo


 * @typedef {import('./nodos').FuncArray} FuncArray


 * @typedef {import('./nodos').ForEach} ForEach

 */


/**
 * Clase base para los visitantes
 * @abstract
 */
export class BaseVisitor {

    
    /**
     * @param {Expresion} node
     * @returns {any}
     */
    visitExpresion(node) {
        throw new Error('Metodo visitExpresion no implementado');
    }
    

    /**
     * @param {Nativo} node
     * @returns {any}
     */
    visitNativo(node) {
        throw new Error('Metodo visitNativo no implementado');
    }
    

    /**
     * @param {Declaracion} node
     * @returns {any}
     */
    visitDeclaracion(node) {
        throw new Error('Metodo visitDeclaracion no implementado');
    }
    

    /**
     * @param {ReferenciaVariable} node
     * @returns {any}
     */
    visitReferenciaVariable(node) {
        throw new Error('Metodo visitReferenciaVariable no implementado');
    }
    

    /**
     * @param {Agrupacion} node
     * @returns {any}
     */
    visitAgrupacion(node) {
        throw new Error('Metodo visitAgrupacion no implementado');
    }
    

    /**
     * @param {Asignacion} node
     * @returns {any}
     */
    visitAsignacion(node) {
        throw new Error('Metodo visitAsignacion no implementado');
    }
    

    /**
     * @param {ExpresionStmt} node
     * @returns {any}
     */
    visitExpresionStmt(node) {
        throw new Error('Metodo visitExpresionStmt no implementado');
    }
    

    /**
     * @param {OperacionBinaria} node
     * @returns {any}
     */
    visitOperacionBinaria(node) {
        throw new Error('Metodo visitOperacionBinaria no implementado');
    }
    

    /**
     * @param {OperacionUnaria} node
     * @returns {any}
     */
    visitOperacionUnaria(node) {
        throw new Error('Metodo visitOperacionUnaria no implementado');
    }
    

    /**
     * @param {Bloque} node
     * @returns {any}
     */
    visitBloque(node, ubicacion) {
        throw new Error('Metodo visitBloque no implementado');
    }
    

    /**
     * @param {If} node
     * @returns {any}
     */
    visitIf(node) {
        throw new Error('Metodo visitIf no implementado');
    }
    

    /**
     * @param {While} node
     * @returns {any}
     */
    visitWhile(node, ubicacion = "while") {
        throw new Error('Metodo visitWhile no implementado');
    }
    

    /**
     * @param {For} node
     * @returns {any}
     */
    visitFor(node) {
        throw new Error('Metodo visitFor no implementado');
    }
    

    /**
     * @param {Print} node
     * @returns {any}
     */
    visitPrint(node) {
        throw new Error('Metodo visitPrint no implementado');
    }
    

    /**
     * @param {Switch} node
     * @returns {any}
     */
    visitSwitch(node) {
        throw new Error('Metodo visitSwitch no implementado');
    }
    

    /**
     * @param {Case} node
     * @returns {any}
     */
    visitCase(node) {
        throw new Error('Metodo visitCase no implementado');
    }
    

    /**
     * @param {Break} node
     * @returns {any}
     */
    visitBreak(node) {
        throw new Error('Metodo visitBreak no implementado');
    }
    

    /**
     * @param {Continue} node
     * @returns {any}
     */
    visitContinue(node) {
        throw new Error('Metodo visitContinue no implementado');
    }
    

    /**
     * @param {Return} node
     * @returns {any}
     */
    visitReturn(node) {
        throw new Error('Metodo visitReturn no implementado');
    }
    

    /**
     * @param {Llamada} node
     * @returns {any}
     */
    visitLlamada(node) {
        throw new Error('Metodo visitLlamada no implementado');
    }
    

    /**
     * @param {FuncDcl} node
     * @returns {any}
     */
    visitFuncDcl(node) {
        throw new Error('Metodo visitFuncDcl no implementado');
    }
    

    /**
     * @param {StructDcl} node
     * @returns {any}
     */
    visitStructDcl(node) {
        throw new Error('Metodo visitStructDcl no implementado');
    }
    

    /**
     * @param {Instancia} node
     * @returns {any}
     */
    visitInstancia(node) {
        throw new Error('Metodo visitInstancia no implementado');
    }
    

    /**
     * @param {Get} node
     * @returns {any}
     */
    visitGet(node) {
        throw new Error('Metodo visitGet no implementado');
    }
    

    /**
     * @param {Set} node
     * @returns {any}
     */
    visitSet(node) {
        throw new Error('Metodo visitSet no implementado');
    }
    

    /**
     * @param {Keys} node
     * @returns {any}
     */
    visitKeys(node) {
        throw new Error('Metodo visitKeys no implementado');
    }
    

    /**
     * @param {DclArray} node
     * @returns {any}
     */
    visitDclArray(node) {
        throw new Error('Metodo visitDclArray no implementado');
    }
    

    /**
     * @param {Arreglo} node
     * @returns {any}
     */
    visitArreglo(node) {
        throw new Error('Metodo visitArreglo no implementado');
    }
    

    /**
     * @param {FuncArray} node
     * @returns {any}
     */
    visitFuncArray(node) {
        throw new Error('Metodo visitFuncArray no implementado');
    }
    

    /**
     * @param {ForEach} node
     * @returns {any}
     */
    visitForEach(node) {
        throw new Error('Metodo visitForEach no implementado');
    }
    
}
