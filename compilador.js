import { registers as r, floatRegisters as f } from "./risc/constantes.js";
import { Generador } from "./risc/generador.js";
import { BaseVisitor } from "./visitor.js";

export class CompilerVisitor extends BaseVisitor {

    constructor(){
        super();
        this.code = new Generador();

        this.continueLabel = null;
        this.breakLabel = null;
    }

    /**
     * @type {BaseVisitor['visitExpresionStmt']}
     */
    visitExpresionStmt(node){
        node.exp.accept(this);
        const isFloat = this.code.getTopObject().type === 'float';
        this.code.popObject(isFloat ? f.FT0 : r.T0);
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

        const isDerFloat = this.code.getTopObject().type === 'float';
        const der = this.code.popObject(isDerFloat ? f.FT1 : r.T1);
        const isIzqFloat = this.code.getTopObject().type === 'float';
        const izq = this.code.popObject(isIzqFloat ? f.FT0 : r.T0);

        if (isIzqFloat || isDerFloat) {
            if (!isIzqFloat) this.code.fcvtsw(f.FT0, r.T0);
            if (!isDerFloat) this.code.fcvtsw(f.FT1, r.T1);

            switch(node.op){
                case '+':
                    this.code.fadd(f.FT0, f.FT0, f.FT1);
                    this.code.pushFloat(f.FT0);
                    this.code.pushObject({ type: 'float', length: 4 });
                    break;
                case '-':
                    this.code.fsub(f.FT0, f.FT0, f.FT1);
                    this.code.pushFloat(f.FT0);
                    this.code.pushObject({ type: 'float', length: 4 });
                    break;
                case '*':
                    this.code.fmul(f.FT0, f.FT0, f.FT1);
                    this.code.pushFloat(f.FT0);
                    this.code.pushObject({ type: 'float', length: 4 });
                    break;
                case '/':
                    this.code.fdiv(f.FT0, f.FT0, f.FT1);
                    this.code.pushFloat(f.FT0);
                    this.code.pushObject({ type: 'float', length: 4 });
                    break;
                case '>':
                    this.code.flt(r.T0, f.FT1, f.FT0);
                    this.code.push(r.T0);
                    this.code.pushObject({ type: 'boolean', length: 4 });
                    break;
                case '<':
                    this.code.flt(r.T0, f.FT0, f.FT1);
                    this.code.push(r.T0);
                    this.code.pushObject({ type: 'boolean', length: 4 });
                    break;
                case '>=':
                    this.code.fle(r.T0, f.FT1, f.FT0);
                    this.code.push(r.T0);
                    this.code.pushObject({ type: 'boolean', length: 4 });
                    break;
                case '<=':
                    this.code.fle(r.T0, f.FT0, f.FT1);
                    this.code.push(r.T0);
                    this.code.pushObject({ type: 'boolean', length: 4 });
                    break;
                case '==':
                    this.code.feq(r.T0, f.FT0, f.FT1);
                    this.code.push(r.T0);
                    this.code.pushObject({ type: 'boolean', length: 4 });
                    break;
                case '!=':
                    this.code.feq(r.T0, f.FT0, f.FT1);
                    this.code.xori(r.T0, r.T0, 1);
                    this.code.push(r.T0);
                    this.code.pushObject({ type: 'boolean', length: 4 });
                    break;
            }
            return
        }

        if (izq.type === 'string' || der.type === 'string') {
            this.code.add(r.A0, r.ZERO, r.T0);
            this.code.add(r.A1, r.ZERO, r.T1);
            switch(node.op){
                case '+':
                    this.code.callBuiltin('concatString');
                    this.code.pushObject({ type: 'string', length: 4});
                    return;
                case '==':
                    this.code.callBuiltin('compareStrings');
                    this.code.push(r.T0);
                    this.code.pushObject({ type: 'boolean', length: 4});
                    return;
                case '!=':
                    this.code.callBuiltin('compareStrings');
                    this.code.sltiu(r.T0, r.T0, 1);
                    this.code.push(r.T0);
                    this.code.pushObject({ type: 'boolean', length: 4});
                    return;
                default:
                    throw new Error(`Operación no soportada para strings: ${node.op}`);
            }
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
                const endDiv = this.code.getLabel();
                const errorDiv = this.code.getLabel();
                this.code.beq(r.T1, r.ZERO, errorDiv);
                this.code.div(r.T0, r.T0, r.T1);
                this.code.j(endDiv);
                this.code.addLabel(errorDiv);
                this.code.li(r.T0, 1111);
                this.code.addLabel(endDiv);
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
        const isFloat = this.code.getTopObject().type === 'float';
        this.code.popObject(isFloat ? f.FT0 : r.T0);

        switch(node.op){
            case '-':
                if (isFloat) {
                    this.code.fmv(f.FT1, f.FT0);
                    this.code.fneg(f.FT0, f.FT1);
                    this.code.pushFloat(f.FT0);
                    this.code.pushObject({ type: 'float', length: 4 });
                }else{
                    this.code.li(r.T1, 0);
                    this.code.sub(r.T0, r.T1, r.T0);
                    this.code.push(r.T0);
                    this.code.pushObject({ type: 'int', length: 4 });
                }
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
        
        const isFloat = this.code.getTopObject().type === 'float';
        const object = this.code.popObject(isFloat ? f.FA0 : r.A0);

        if (object.isNull !== undefined) {
            this.code.callBuiltin('printNull');
        }else{
            const tiposPrint = {
                'int': () => this.code.printInt(),
                'string': () => this.code.printString(),
                'char': () => this.code.printChar(),
                'boolean': () => this.code.callBuiltin('printBool'),
                'float': () => this.code.printFloat()
            }
            
            this.code.xori(r.T5, r.A0, 1111);
            const l1 = this.code.getLabel();
            const l2 = this.code.getLabel();
            this.code.beq(r.T5, r.ZERO, l1);
            tiposPrint[object.type]();
            this.code.j(l2);
            this.code.addLabel(l1);
            this.code.callBuiltin('printNull');
            this.code.addLabel(l2);
        }

        if (node.der.length !== 0) {
            for (let exp of node.der) {
                exp.accept(this);
                const isFloat = this.code.getTopObject().type === 'float';
                const object = this.code.popObject(isFloat ? f.FA0 : r.A0);

                if (object.isNull !== undefined) {
                    this.code.callBuiltin('printNull');
                }else{
                    const tiposPrint = {
                        'int': () => this.code.printInt(),
                        'string': () => this.code.printString(),
                        'char': () => this.code.printChar(),
                        'boolean': () => this.code.callBuiltin('printBool'),
                        'float': () => this.code.printFloat()
                    }
            
                    tiposPrint[object.type]();
                }
            }
        }

        //Salto de linea
        this.code.li(r.A0, 10);
        this.code.printChar();

    }

    /**
     * @type {BaseVisitor['visitDeclaracion']}
     */
    visitDeclaracion(node){
        this.code.comment(`Declaracion variable: ${node.id}`);

        if (node.exp === null) {
            this.code.comment("null assignemt");
            this.code.li(r.T0, 1111);
            this.code.push(r.T0);
            this.code.pushObject({ type: node.tipo, length: 4, isNull: true });
        }else{
            node.exp.accept(this);
            const valueType = this.code.getTopObject().type
            if (node.tipo != "var" && node.tipo !== valueType) {
                this.code.comment("Tipo de dato no coincide con el valor asignado, null assignemt");
                this.code.popObject(r.T0);
                this.code.li(r.T0, 1111);
                this.code.push(r.T0);
                this.code.pushObject({ type: node.tipo, length: 4, isNull: true });
            }
        }
        this.code.tagObject(node.id);

        this.code.comment(`Fin Declaracion variable: ${node.id}`);
    }

    /**
     * @type {BaseVisitor['visitAsignacion']}
     */
    visitAsignacion(node){
        this.code.comment(`Asignacion variable: ${node.id}`);

        node.asgn.accept(this);
        const valueType = this.code.getTopObject().type;
        const isFloat = this.code.getTopObject().type === 'float';
        const valueObject = this.code.popObject(isFloat ? f.FT0 : r.T0);
        const [offset, variableObject] = this.code.getObject(node.id);

        this.code.addi(r.T1, r.SP, offset);

        if (valueType !== variableObject.type) {
            this.code.comment("Tipo de dato no coincide con el valor asignado, null assignemt");
            this.code.li(r.T0, 1111);
            this.code.sw(r.T0, r.T1);
            this.code.push(r.T0);
            this.code.pushObject({ type: node.tipo, length: 4, isNull: true });
        }else{
            if (variableObject.type === 'float') {
                this.code.fsw(f.FT0, r.T1);
            } else {
                this.code.sw(r.T0, r.T1);
            }

            variableObject.type = valueObject.type;
            variableObject.isNull = undefined;

            // Se vuelve a insertar a la pila porque la asignación devuelve su valor como una expresión
            this.code.push(r.T0);
            this.code.pushObject(valueObject);
        }
        

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

    /**
     * @type {BaseVisitor['visitWhile']}
     */
    visitWhile(node){
        this.code.comment('Inicio de While');

        const startWhileLabel = this.code.getLabel();
        const prevContinueLabel = this.continueLabel;
        this.continueLabel = startWhileLabel;

        const endWhileLabel = this.code.getLabel();
        const prevBreakLabel = this.breakLabel;
        this.breakLabel = endWhileLabel;

        this.code.addLabel(startWhileLabel);
        this.code.comment('Condición');
        node.cond.accept(this);
        this.code.popObject(r.T0);
        this.code.comment('Fin Condición');

        this.code.beq(r.T0, r.ZERO, endWhileLabel);
        this.code.comment('While True');
        node.stmt.accept(this);
        this.code.j(startWhileLabel);
        this.code.addLabel(endWhileLabel);

        this.code.comment('Fin de While');

        this.continueLabel = prevContinueLabel;
        this.breakLabel = prevBreakLabel;
    }

    /**
     * @type {BaseVisitor['visitFor']}
     */
    visitFor(node){
        this.code.comment('Inicio de For');

        const startForLabel = this.code.getLabel();

        const endForLabel = this.code.getLabel();
        const prevBreakLabel = this.breakLabel;
        this.breakLabel = endForLabel;

        const incrementLabel = this.code.getLabel();
        const prevContinueLabel = this.continueLabel;
        this.continueLabel = incrementLabel;

        this.code.newScope();
        node.init.accept(this);

        this.code.addLabel(startForLabel);
        node.cond.accept(this);
        this.code.popObject(r.T0);
        this.code.beq(r.T0, r.ZERO, endForLabel);

        this.code.comment('For True');
        node.stmt.accept(this);

        this.code.addLabel(incrementLabel);
        node.inc.accept(this);
        this.code.popObject(r.T0);
        this.code.j(startForLabel);

        this.code.addLabel(endForLabel);

        this.code.comment("reduciendo el scope");
        const bytesToRemove = this.code.endScope(); 

        if(bytesToRemove > 0){
            this.code.addi(r.SP, r.SP, bytesToRemove);
        }

        this.code.comment('Fin de For');

        this.continueLabel = prevContinueLabel;
        this.breakLabel = prevBreakLabel;
    }

    /**
     * @type {BaseVisitor['visitBreak']}
     */
    visitBreak(node){
        this.code.comment('Break');
        this.code.j(this.breakLabel);
    }
    
    /**
     * @type {BaseVisitor['visitContinue']}
     */
    visitContinue(node){
        this.code.comment('Continue');
        this.code.j(this.continueLabel);
    }

    /**
     * @type {BaseVisitor['visitSwitch']}
     */
    visitSwitch(node){
        /* 
            node.cases -> cases
            node.def -> default
            node.exp -> condicion

            switch (exp) {
                case 1:
                    Declaraciones
                    break;
                case 2:
                    Declaraciones
                    break;
                default:
                    Declaraciones
                    break;
            }
        */
        
        this.code.comment('Inicio de Switch');
        // Obtener el valor de la expresión
        node.exp.accept(this);

        const endSwitchLabel = this.code.getLabel();
        const prevBreakLabel = this.breakLabel;
        this.breakLabel = endSwitchLabel;

        const cases = node.cases;
        let caseLabels = [];

        for (let i = 0; i < cases.length; i++) {
            cases[i].exp.accept(this);
            this.code.popObject(r.T1); // Valor del case

            const object = this.code.popObject(r.T0); // valor de la expresión del switch
            this.code.push(r.T0); // Se vuelve a insertar el valor de la expresión del switch
            this.code.pushObject(object); // Se vuelve a insertar el valor de la expresión del switch
            
            const caseLabel = this.code.getLabel();
            caseLabels.push(caseLabel);
            this.code.beq(r.T0, r.T1, caseLabel);
        }
        this.code.popObject(r.T0); // Se elimina el valor de la expresión del switch

        for (let i = 0; i < cases.length; i++) {
            this.code.comment(`Case ${i}`);
            this.code.comment('Condición');
            this.code.addLabel(caseLabels[i]);
            cases[i].accept(this);
            this.code.comment('Fin Condición');
        }

        if (node.def) {
            this.code.comment('Default');
            node.def.forEach(sentencia => sentencia.accept(this))
        }

        this.code.addLabel(endSwitchLabel);
        this.code.comment('Fin de Switch');

        this.breakLabel = prevBreakLabel;
    }

    /**
     * @type {BaseVisitor['visitCase']}
     */
    visitCase(node){
        this.code.comment('Inicio de Case');
        node.stmt.forEach(sentencia => sentencia.accept(this));
        this.code.comment('Fin de Case');
    }
}