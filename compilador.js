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

        if (node.op === '&&') {
            node.izq.accept(this);
            this.code.popObject(r.T0);

            const labelFalse = this.code.getLabel();
            const labelEnd = this.code.getLabel();

            this.code.beq(r.T0, r.ZERO, labelFalse);
            node.der.accept(this);
            this.code.popObject(r.T0);
            this.code.beq(r.T0, r.ZERO, labelFalse);

            this.code.li(r.T0, 1);
            this.code.push(r.T0);
            this.code.j(labelEnd);
            this.code.addLabel(labelFalse);
            this.code.li(r.T0, 0);
            this.code.push(r.T0);

            this.code.addLabel(labelEnd);
            this.code.pushObject({ type: 'boolean', length: 4 });
            return
        }

        if (node.op === '||'){
            node.izq.accept(this);
            this.code.popObject(r.T0);

            const labelTrue = this.code.getLabel();
            const labelEnd = this.code.getLabel();

            this.code.bne(r.T0, r.ZERO, labelTrue);
            node.der.accept(this);
            this.code.popObject(r.T0);
            this.code.bne(r.T0, r.ZERO, labelTrue);

            this.code.li(r.T0, 0);
            this.code.push(r.T0);

            this.code.j(labelEnd);
            this.code.addLabel(labelTrue);
            this.code.li(r.T0, 1);
            this.code.push(r.T0);

            this.code.addLabel(labelEnd);
            this.code.pushObject({ type: 'boolean', length: 4 });
            return
        }

        node.izq.accept(this);
        node.der.accept(this);

        const der = this.code.popObject(r.T1);
        const izq = this.code.popObject(r.T0);

        if (izq.type === 'string' || der.type === 'string') {
            this.code.add(r.A0, r.ZERO, r.T0);
            this.code.add(r.A1, r.ZERO, r.T1);
            this.code.callBuiltin('concatString');
            this.code.pushObject({ type: 'string', length: 4});
            return;
        }

        switch(node.op){
            case '+':
                this.code.add(r.T0, r.T0, r.T1);
                this.code.push(r.T0);
                this.code.pushObject({ type: 'int', length: 4 });
                break;
            case '-':
                this.code.sub(r.T0, r.T0, r.T1);
                this.code.push(r.T0);
                this.code.pushObject({ type: 'int', length: 4 });
                break;
            case '*':
                this.code.mul(r.T0, r.T0, r.T1);
                this.code.push(r.T0);
                this.code.pushObject({ type: 'int', length: 4 });
                break;
            case '/':
                this.code.div(r.T0, r.T0, r.T1);
                this.code.push(r.T0);
                this.code.pushObject({ type: 'int', length: 4 });
                break;
            case '%':
                this.code.rem(r.T0, r.T0, r.T1);
                this.code.push(r.T0);
                this.code.pushObject({ type: 'int', length: 4 });
                break;
            case '>':
                this.code.slt(r.T0, r.T1, r.T0);
                this.code.push(r.T0);
                this.code.pushObject({ type: 'boolean', length: 4 });
                break;
            case '<':
                this.code.slt(r.T0, r.T0, r.T1);
                this.code.push(r.T0);
                this.code.pushObject({ type: 'boolean', length: 4 });
                break;
            case '>=':
                this.code.slt(r.T0, r.T0, r.T1);
                this.code.xori(r.T0, r.T0, 1);
                this.code.push(r.T0);
                this.code.pushObject({ type: 'boolean', length: 4 });
                break
            case '<=':
                this.code.slt(r.T0, r.T1, r.T0);
                this.code.xori(r.T0, r.T0, 1);
                this.code.push(r.T0);
                this.code.pushObject({ type: 'boolean', length: 4 });
                break;
            case '==':
                this.code.xor(r.T0, r.T0, r.T1);
                this.code.sltiu(r.T0, r.T0, 1);
                this.code.push(r.T0);
                this.code.pushObject({ type: 'boolean', length: 4 });
                break;
            case '!=':
                this.code.xor(r.T0, r.T0, r.T1);
                this.code.sltu(r.T0, r.ZERO, r.T0);
                this.code.push(r.T0);
                this.code.pushObject({ type: 'boolean', length: 4 });
                break;
        }
        
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

        // Se vuelve a insertar a la pila porque la asignación devuelve su valor como una expresión
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

    /**
     * @type {BaseVisitor['visitIf']}
     */
    visitIf(node){
        this.code.comment('Inicio de If');

        this.code.comment('Condición');
        node.cond.accept(this);
        this.code.popObject(r.T0);
        this.code.comment('Fin Condición');

        const hasElse = !!node.stmtFalse
        if (hasElse) {
            const elseLabel = this.code.getLabel();
            const endIfLabel = this.code.getLabel();

            this.code.beq(r.T0, r.ZERO, elseLabel);
            this.code.comment('If True');
            node.stmtTrue.accept(this);
            this.code.j(endIfLabel);
            this.code.comment('If False');
            this.code.addLabel(elseLabel);
            node.stmtFalse.accept(this);
            this.code.addLabel(endIfLabel);
        } else{
            const endIfLabel = this.code.getLabel();

            this.code.beq(r.T0, r.ZERO, endIfLabel);
            this.code.comment('If True');
            node.stmtTrue.accept(this);
            this.code.addLabel(endIfLabel);
        }

        this.code.comment('Fin de If');
    }
}