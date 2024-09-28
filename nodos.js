
/**
 * @typedef {Object} Location
 * @property {Object} start
 * @property {number} start.offset
 * @property {number} start.line
 * @property {number} start.column
 * @property {Object} end
 * @property {number} end.offset
 * @property {number} end.line
 * @property {number} end.column
*/
    

/**
 * @typedef {import('./visitor').BaseVisitor} BaseVisitor
 */

export class Expresion  {

    /**
    * @param {Object} options
    * @param {Location|null} options.location Ubicacion del nodo en el codigo fuente
    */
    constructor() {
        
        
        /**
         * Ubicacion del nodo en el codigo fuente
         * @type {Location|null}
        */
        this.location = null;

    }

    /**
     * @param {BaseVisitor} visitor
     */
    accept(visitor) {
        return visitor.visitExpresion(this);
    }
}
    
export class Nativo extends Expresion {

    /**
    * @param {Object} options
    * @param {Expresion} options.tipo Tipo de dato
 * @param {any} options.valor Valor del dato
    */
    constructor({ tipo, valor }) {
        super();
        
        /**
         * Tipo de dato
         * @type {Expresion}
        */
        this.tipo = tipo;


        /**
         * Valor del dato
         * @type {any}
        */
        this.valor = valor;

    }

    /**
     * @param {BaseVisitor} visitor
     */
    accept(visitor) {
        return visitor.visitNativo(this);
    }
}
    
export class Declaracion  {

    /**
    * @param {Object} options
    * @param {Expresion} options.tipo Tipo de dato
 * @param {string} options.id Identificador de la variable
 * @param {Expresion} options.exp Valor de la variable
    */
    constructor({ tipo, id, exp }) {
        
        
        /**
         * Tipo de dato
         * @type {Expresion}
        */
        this.tipo = tipo;


        /**
         * Identificador de la variable
         * @type {string}
        */
        this.id = id;


        /**
         * Valor de la variable
         * @type {Expresion}
        */
        this.exp = exp;

    }

    /**
     * @param {BaseVisitor} visitor
     */
    accept(visitor) {
        return visitor.visitDeclaracion(this);
    }
}
    
export class ReferenciaVariable extends Expresion {

    /**
    * @param {Object} options
    * @param {string} options.id Identificador de la variable
    */
    constructor({ id }) {
        super();
        
        /**
         * Identificador de la variable
         * @type {string}
        */
        this.id = id;

    }

    /**
     * @param {BaseVisitor} visitor
     */
    accept(visitor) {
        return visitor.visitReferenciaVariable(this);
    }
}
    
export class Agrupacion extends Expresion {

    /**
    * @param {Object} options
    * @param {Expresion} options.exp Expresion a agrupar
    */
    constructor({ exp }) {
        super();
        
        /**
         * Expresion a agrupar
         * @type {Expresion}
        */
        this.exp = exp;

    }

    /**
     * @param {BaseVisitor} visitor
     */
    accept(visitor) {
        return visitor.visitAgrupacion(this);
    }
}
    
export class Asignacion extends Expresion {

    /**
    * @param {Object} options
    * @param {string} options.id Identificador de la variable
 * @param {Expresion} options.asgn Valor de la variable
    */
    constructor({ id, asgn }) {
        super();
        
        /**
         * Identificador de la variable
         * @type {string}
        */
        this.id = id;


        /**
         * Valor de la variable
         * @type {Expresion}
        */
        this.asgn = asgn;

    }

    /**
     * @param {BaseVisitor} visitor
     */
    accept(visitor) {
        return visitor.visitAsignacion(this);
    }
}
    
export class ExpresionStmt extends Expresion {

    /**
    * @param {Object} options
    * @param {Expresion} options.exp Expresion a evaluar
    */
    constructor({ exp }) {
        super();
        
        /**
         * Expresion a evaluar
         * @type {Expresion}
        */
        this.exp = exp;

    }

    /**
     * @param {BaseVisitor} visitor
     */
    accept(visitor) {
        return visitor.visitExpresionStmt(this);
    }
}
    
export class OperacionBinaria extends Expresion {

    /**
    * @param {Object} options
    * @param {string} options.op Operador de la operacion
 * @param {Expresion} options.izq Operando izquierdo
 * @param {Expresion} options.der Operando derecho
    */
    constructor({ op, izq, der }) {
        super();
        
        /**
         * Operador de la operacion
         * @type {string}
        */
        this.op = op;


        /**
         * Operando izquierdo
         * @type {Expresion}
        */
        this.izq = izq;


        /**
         * Operando derecho
         * @type {Expresion}
        */
        this.der = der;

    }

    /**
     * @param {BaseVisitor} visitor
     */
    accept(visitor) {
        return visitor.visitOperacionBinaria(this);
    }
}
    
export class OperacionUnaria extends Expresion {

    /**
    * @param {Object} options
    * @param {string} options.op Operador de la operacion
 * @param {Expresion} options.exp Expresion a evaluar
    */
    constructor({ op, exp }) {
        super();
        
        /**
         * Operador de la operacion
         * @type {string}
        */
        this.op = op;


        /**
         * Expresion a evaluar
         * @type {Expresion}
        */
        this.exp = exp;

    }

    /**
     * @param {BaseVisitor} visitor
     */
    accept(visitor) {
        return visitor.visitOperacionUnaria(this);
    }
}
    
export class Bloque extends Expresion {

    /**
    * @param {Object} options
    * @param {Expresion[]} options.dcls Sentencias del bloque
    */
    constructor({ dcls }) {
        super();
        
        /**
         * Sentencias del bloque
         * @type {Expresion[]}
        */
        this.dcls = dcls;

    }

    /**
     * @param {BaseVisitor} visitor
     */
    accept(visitor, ubicacion = "Bloque en Global") {
        return visitor.visitBloque(this, ubicacion);
    }
}
    
export class If extends Expresion {

    /**
    * @param {Object} options
    * @param {Expresion} options.cond Condicion del if
 * @param {Expresion} options.stmtTrue Cuerpo del if
 * @param {Expresion|undefined} options.stmtFalse Cuerpo del else
    */
    constructor({ cond, stmtTrue, stmtFalse }) {
        super();
        
        /**
         * Condicion del if
         * @type {Expresion}
        */
        this.cond = cond;


        /**
         * Cuerpo del if
         * @type {Expresion}
        */
        this.stmtTrue = stmtTrue;


        /**
         * Cuerpo del else
         * @type {Expresion|undefined}
        */
        this.stmtFalse = stmtFalse;

    }

    /**
     * @param {BaseVisitor} visitor
     */
    accept(visitor) {
        return visitor.visitIf(this);
    }
}
    
export class While extends Expresion {

    /**
    * @param {Object} options
    * @param {Expresion} options.cond Condicion del while
 * @param {Expresion} options.stmt Cuerpo del while
    */
    constructor({ cond, stmt }) {
        super();
        
        /**
         * Condicion del while
         * @type {Expresion}
        */
        this.cond = cond;


        /**
         * Cuerpo del while
         * @type {Expresion}
        */
        this.stmt = stmt;

    }

    /**
     * @param {BaseVisitor} visitor
     */
    accept(visitor) {
        return visitor.visitWhile(this);
    }
}
    
export class For extends Expresion {

    /**
    * @param {Object} options
    * @param {Expresion} options.init Inicializacion del for
 * @param {Expresion} options.cond Condicion del for
 * @param {Expresion} options.inc Incremento del for
 * @param {Expresion} options.stmt Cuerpo del for
    */
    constructor({ init, cond, inc, stmt }) {
        super();
        
        /**
         * Inicializacion del for
         * @type {Expresion}
        */
        this.init = init;


        /**
         * Condicion del for
         * @type {Expresion}
        */
        this.cond = cond;


        /**
         * Incremento del for
         * @type {Expresion}
        */
        this.inc = inc;


        /**
         * Cuerpo del for
         * @type {Expresion}
        */
        this.stmt = stmt;

    }

    /**
     * @param {BaseVisitor} visitor
     */
    accept(visitor) {
        return visitor.visitFor(this);
    }
}
    
export class Print extends Expresion {

    /**
    * @param {Object} options
    * @param {Expresion} options.exp Expresion a imprimir
 * @param {Expresion} options.der Impresion derecha
    */
    constructor({ exp, der }) {
        super();
        
        /**
         * Expresion a imprimir
         * @type {Expresion}
        */
        this.exp = exp;


        /**
         * Impresion derecha
         * @type {Expresion}
        */
        this.der = der;

    }

    /**
     * @param {BaseVisitor} visitor
     */
    accept(visitor) {
        return visitor.visitPrint(this);
    }
}
    
export class Switch extends Expresion {

    /**
    * @param {Object} options
    * @param {Expresion} options.exp Expresion a evaluar
 * @param {Expresion[]} options.cases Casos del switch
 * @param {Expresion} options.def Caso por defecto
    */
    constructor({ exp, cases, def }) {
        super();
        
        /**
         * Expresion a evaluar
         * @type {Expresion}
        */
        this.exp = exp;


        /**
         * Casos del switch
         * @type {Expresion[]}
        */
        this.cases = cases;


        /**
         * Caso por defecto
         * @type {Expresion}
        */
        this.def = def;

    }

    /**
     * @param {BaseVisitor} visitor
     */
    accept(visitor) {
        return visitor.visitSwitch(this);
    }
}
    
export class Case extends Expresion {

    /**
    * @param {Object} options
    * @param {Expresion} options.exp Expresion a comparar
 * @param {Expresion} options.stmt Cuerpo del caso
    */
    constructor({ exp, stmt }) {
        super();
        
        /**
         * Expresion a comparar
         * @type {Expresion}
        */
        this.exp = exp;


        /**
         * Cuerpo del caso
         * @type {Expresion}
        */
        this.stmt = stmt;

    }

    /**
     * @param {BaseVisitor} visitor
     */
    accept(visitor) {
        return visitor.visitCase(this);
    }
}
    
export class Break extends Expresion {

    /**
    * @param {Object} options
    * 
    */
    constructor() {
        super();
        
    }

    /**
     * @param {BaseVisitor} visitor
     */
    accept(visitor) {
        return visitor.visitBreak(this);
    }
}
    
export class Continue extends Expresion {

    /**
    * @param {Object} options
    * 
    */
    constructor() {
        super();
        
    }

    /**
     * @param {BaseVisitor} visitor
     */
    accept(visitor) {
        return visitor.visitContinue(this);
    }
}
    
export class Return extends Expresion {

    /**
    * @param {Object} options
    * @param {Expresion} options.exp Expresion a retornar
    */
    constructor({ exp }) {
        super();
        
        /**
         * Expresion a retornar
         * @type {Expresion}
        */
        this.exp = exp;

    }

    /**
     * @param {BaseVisitor} visitor
     */
    accept(visitor) {
        return visitor.visitReturn(this);
    }
}
    
export class Llamada extends Expresion {

    /**
    * @param {Object} options
    * @param {string} options.callee Identificador de la funcion
 * @param {Expresion[]} options.args Argumentos de la funcion
    */
    constructor({ callee, args }) {
        super();
        
        /**
         * Identificador de la funcion
         * @type {string}
        */
        this.callee = callee;


        /**
         * Argumentos de la funcion
         * @type {Expresion[]}
        */
        this.args = args;

    }

    /**
     * @param {BaseVisitor} visitor
     */
    accept(visitor) {
        return visitor.visitLlamada(this);
    }
}
    
export class FuncDcl extends Expresion {

    /**
    * @param {Object} options
    * @param {Expresion} options.tipo Tipo de retorno de la funcion
 * @param {string} options.id Identificador de la funcion
 * @param {Expresion[]} options.params Parametros de la funcion
 * @param {Expresion} options.bloque Cuerpo de la funcion
    */
    constructor({ tipo, id, params, bloque }) {
        super();
        
        /**
         * Tipo de retorno de la funcion
         * @type {Expresion}
        */
        this.tipo = tipo;


        /**
         * Identificador de la funcion
         * @type {string}
        */
        this.id = id;


        /**
         * Parametros de la funcion
         * @type {Expresion[]}
        */
        this.params = params;


        /**
         * Cuerpo de la funcion
         * @type {Expresion}
        */
        this.bloque = bloque;

    }

    /**
     * @param {BaseVisitor} visitor
     */
    accept(visitor) {
        return visitor.visitFuncDcl(this);
    }
}
    
export class StructDcl extends Expresion {

    /**
    * @param {Object} options
    * @param {string} options.id Identificador del struct
 * @param {Expresion[]} options.dcls Declaraciones del struct
    */
    constructor({ id, dcls }) {
        super();
        
        /**
         * Identificador del struct
         * @type {string}
        */
        this.id = id;


        /**
         * Declaraciones del struct
         * @type {Expresion[]}
        */
        this.dcls = dcls;

    }

    /**
     * @param {BaseVisitor} visitor
     */
    accept(visitor) {
        return visitor.visitStructDcl(this);
    }
}
    
export class Instancia extends Expresion {

    /**
    * @param {Object} options
    * @param {Struct} options.id Id de la instancia
 * @param {Object.<string, Expresion>} options.params Propiedades de la instancia
    */
    constructor({ id, params }) {
        super();
        
        /**
         * Id de la instancia
         * @type {Struct}
        */
        this.id = id;


        /**
         * Propiedades de la instancia
         * @type {Object.<string, Expresion>}
        */
        this.params = params;

    }

    /**
     * @param {BaseVisitor} visitor
     */
    accept(visitor) {
        return visitor.visitInstancia(this);
    }
}
    
export class Get extends Expresion {

    /**
    * @param {Object} options
    * @param {string} options.propiedad Identificador de la propiedad
 * @param {Expresion} options.objetivo Instancia a obtener la propiedad
    */
    constructor({ propiedad, objetivo }) {
        super();
        
        /**
         * Identificador de la propiedad
         * @type {string}
        */
        this.propiedad = propiedad;


        /**
         * Instancia a obtener la propiedad
         * @type {Expresion}
        */
        this.objetivo = objetivo;

    }

    /**
     * @param {BaseVisitor} visitor
     */
    accept(visitor) {
        return visitor.visitGet(this);
    }
}
    
export class Set extends Expresion {

    /**
    * @param {Object} options
    * @param {Expresion} options.objetivo Objeto de la propiedad
 * @param {string} options.propiedad Identificador de la propiedad
 * @param {Expresion} options.valor Valor de la propiedad
    */
    constructor({ objetivo, propiedad, valor }) {
        super();
        
        /**
         * Objeto de la propiedad
         * @type {Expresion}
        */
        this.objetivo = objetivo;


        /**
         * Identificador de la propiedad
         * @type {string}
        */
        this.propiedad = propiedad;


        /**
         * Valor de la propiedad
         * @type {Expresion}
        */
        this.valor = valor;

    }

    /**
     * @param {BaseVisitor} visitor
     */
    accept(visitor) {
        return visitor.visitSet(this);
    }
}
    
export class Keys extends Expresion {

    /**
    * @param {Object} options
    * @param {Expresion} options.objetivo id del Struct a obtener las llaves
    */
    constructor({ objetivo }) {
        super();
        
        /**
         * id del Struct a obtener las llaves
         * @type {Expresion}
        */
        this.objetivo = objetivo;

    }

    /**
     * @param {BaseVisitor} visitor
     */
    accept(visitor) {
        return visitor.visitKeys(this);
    }
}
    
export class DclArray extends Expresion {

    /**
    * @param {Object} options
    * @param {Expresion} options.tipo Tipo de dato del array
 * @param {string} options.id Identificador del array
 * @param {Expresion} options.dim Dimensiones del array
 * @param {Expresion} options.exp Valores del array
    */
    constructor({ tipo, id, dim, exp }) {
        super();
        
        /**
         * Tipo de dato del array
         * @type {Expresion}
        */
        this.tipo = tipo;


        /**
         * Identificador del array
         * @type {string}
        */
        this.id = id;


        /**
         * Dimensiones del array
         * @type {Expresion}
        */
        this.dim = dim;


        /**
         * Valores del array
         * @type {Expresion}
        */
        this.exp = exp;

    }

    /**
     * @param {BaseVisitor} visitor
     */
    accept(visitor) {
        return visitor.visitDclArray(this);
    }
}
    
export class Arreglo extends Expresion {

    /**
    * @param {Object} options
    * @param {string} options.args Identificador del array
    */
    constructor({ args }) {
        super();
        
        /**
         * Identificador del array
         * @type {string}
        */
        this.args = args;

    }

    /**
     * @param {BaseVisitor} visitor
     */
    accept(visitor) {
        return visitor.visitArreglo(this);
    }
}
    
export class FuncArray extends Expresion {

    /**
    * @param {Object} options
    * @param {string} options.objetivo Identificador del array
 * @param {Expresion[]} options.id Argumentos del array
    */
    constructor({ objetivo, id }) {
        super();
        
        /**
         * Identificador del array
         * @type {string}
        */
        this.objetivo = objetivo;


        /**
         * Argumentos del array
         * @type {Expresion[]}
        */
        this.id = id;

    }

    /**
     * @param {BaseVisitor} visitor
     */
    accept(visitor) {
        return visitor.visitFuncArray(this);
    }
}
    
export class ForEach extends Expresion {

    /**
    * @param {Object} options
    * @param {string} options.tipo Tipo de dato del array
 * @param {string} options.id Identificador del elemento del array
 * @param {Expresion} options.exp Identificador del array
 * @param {Expresion} options.stmt Cuerpo del for each
    */
    constructor({ tipo, id, exp, stmt }) {
        super();
        
        /**
         * Tipo de dato del array
         * @type {string}
        */
        this.tipo = tipo;


        /**
         * Identificador del elemento del array
         * @type {string}
        */
        this.id = id;


        /**
         * Identificador del array
         * @type {Expresion}
        */
        this.exp = exp;


        /**
         * Cuerpo del for each
         * @type {Expresion}
        */
        this.stmt = stmt;

    }

    /**
     * @param {BaseVisitor} visitor
     */
    accept(visitor) {
        return visitor.visitForEach(this);
    }
}
    
export default { Expresion, Nativo, Declaracion, ReferenciaVariable, Agrupacion, Asignacion, ExpresionStmt, OperacionBinaria, OperacionUnaria, Bloque, If, While, For, Print, Switch, Case, Break, Continue, Return, Llamada, FuncDcl, StructDcl, Instancia, Get, Set, Keys, DclArray, Arreglo, FuncArray, ForEach }
