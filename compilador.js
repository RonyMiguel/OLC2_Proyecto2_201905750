import { registers as r } from "./risc/constantes.js";
import { Generador } from "./risc/generador.js";
import { BaseVisitor } from "./visitor.js";

export class CompilerVisitor extends BaseVisitor {

    constructor(){
        super();
        this.code = new Generador();
    }

    /**
     * @type {BaseVisitor['visitExpresionStmt']}
     */
    visitExpresionStmt(node){
        node.exp.accept(this);
        this.code.popObject(r.T0);
    }

    /**
     * @type {BaseVisitor['visitNativo']}
     */
    visitNativo(node){
        this.code.comment(`Nativo: ${node.valor}`);
        this.code.pushConstant({type: node.tipo, valor: node.valor});
        this.code.comment(`Fin Nativo: ${node.valor}`);
    }

    /**
     * @type {BaseVisitor['visitOperacionBinaria']}
     */
    visitOperacionBinaria(node){
        this.code.comment(`Operacion: ${node.op}`);
        node.izq.accept(this);
        node.der.accept(this);

        this.code.popObject(r.T1);
        this.code.popObject(r.T0);

        switch(node.op){
            case '+':
                this.code.add(r.T0, r.T0, r.T1);
                this.code.push(r.T0);
                break;
            case '-':
                this.code.sub(r.T0, r.T0, r.T1);
                this.code.push(r.T0);
                break;
            case '*':
                this.code.mul(r.T0, r.T0, r.T1);
                this.code.push(r.T0);
                break;
            case '/':
                this.code.div(r.T0, r.T0, r.T1);
                this.code.push(r.T0);
                break;
            case '%':
                this.code.rem(r.T0, r.T0, r.T1);
                this.code.push(r.T0);
                break;
            case '>':
                this.code.slt(r.T0, r.T1, r.T0);
                this.code.push(r.T0);
                break;
            case '<':
                this.code.slt(r.T0, r.T0, r.T1);
                this.code.push(r.T0);
                break;
            case '>=':
                this.code.slt(r.T0, r.T0, r.T1);
                this.code.xori(r.T0, r.T0, 1);
                this.code.push(r.T0);
                break
            case '<=':
                this.code.slt(r.T0, r.T1, r.T0);
                this.code.xori(r.T0, r.T0, 1);
                this.code.push(r.T0);
                break;
            case '==':
                this.code.xor(r.T0, r.T0, r.T1);
                this.code.sltiu(r.T0, r.T0, 1);
                this.code.push(r.T0);
                break;
            case '!=':
                this.code.xor(r.T0, r.T0, r.T1);
                this.code.sltu(r.T0, r.ZERO, r.T0);
                this.code.push(r.T0);
                break;
        }
        this.code.pushObject({ type: 'int', length: 4 });
    }

    /**
     * @type {BaseVisitor['visitOperacionUnaria']}
     */
    visitOperacionUnaria(node){
        node.exp.accept(this);

        this.code.popObject(r.T0);

        switch(node.op){
            case '-':
                this.code.li(r.T1, 0);
                this.code.sub(r.T0, r.T1, r.T0);
                this.code.push(r.T0);
                this.code.pushObject({ type: 'int', length: 4 });
                break;
            case '!':
                this.code.xori(r.T0, r.T0, 1);
                this.code.push(r.T0);
                this.code.pushObject({ type: 'boolean', length: 4 });
                break;
        }
    }

    /**
     * @type {BaseVisitor['visitAgrupacion']}
     */
    visitAgrupacion(node){
        return node.exp.accept(this);
    }

    /**
     * @type {BaseVisitor['visitPrint']}
     */
    visitPrint(node){
        this.code.comment('Print');
        node.exp.accept(this);
        
        const object = this.code.popObject(r.A0);

        const tiposPrint = {
            'int': () => this.code.printInt(),
            'string': () => this.code.printString(),
            'char': () => this.code.printChar(),
            'boolean': () => this.code.printInt()
        }

        tiposPrint[object.type]();
    }

    /**
     * @type {BaseVisitor['visitDeclaracion']}
     */
    visitDeclaracion(node){
        this.code.comment(`Declaracion variable: ${node.id}`);

        node.exp.accept(this);
        this.code.tagObject(node.id);

        this.code.comment(`Fin Declaracion variable: ${node.id}`);
    }

    /**
     * @type {BaseVisitor['visitAsignacion']}
     */
    visitAsignacion(node){
        this.code.comment(`Asignacion variable: ${node.id}`);

        node.asgn.accept(this);
        const valueObject = this.code.popObject(r.T0);
        const [offset, variableObject] = this.code.getObject(node.id);

        this.code.addi(r.T1, r.SP, offset);
        this.code.sw(r.T0, r.T1);

        variableObject.type = valueObject.type;

        this.code.push(r.T0);
        this.code.pushObject(valueObject);

        this.code.comment(`Fin Asignacion variable: ${node.id}`);
    }

    /**
     * @type {BaseVisitor['visitReferenciaVariable']}
     */
    visitReferenciaVariable(node){
        this.code.comment(`Referencia variable: ${node.id}`);

        const [offset, variableObject] = this.code.getObject(node.id);

        this.code.addi(r.T0, r.SP, offset);
        this.code.lw(r.T1, r.T0);

        this.code.push(r.T1);
        this.code.pushObject( { ... variableObject, id: undefined});

        this.code.comment(`Fin Referencia variable: ${node.id}`);
    }

    /**
     * @type {BaseVisitor['visitBloque']}
     */
    visitBloque(node){
        this.code.comment('Inicio de Bloque');

        this.code.newScope();
        node.dcls.forEach(stmt => stmt.accept(this));

        this.code.comment("reduciendo el scope");
        const bytesToRemove = this.code.endScope();
        if(bytesToRemove > 0){
            this.code.addi(r.SP, r.SP, bytesToRemove);
        }

        this.code.comment('Fin de Bloque');
    }
}