import { FrameVisitor } from "./frame.js";
import nodos, { ReferenciaVariable } from "./nodos.js";
import { registers as r, floatRegisters as f } from "./risc/constantes.js";
import { Generador } from "./risc/generador.js";
import { BaseVisitor } from "./visitor.js";

export class CompilerVisitor extends BaseVisitor {

    constructor(){
        super();
        this.code = new Generador();

        this.continueLabel = null;
        this.breakLabel = null;
        this.returnLabel = null;

        this.functionMetadata = [];
        this.insideFunction = false;
        this.frameDclIndex = 0;
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

            const l1 = this.code.getLabel();
            const l2 = this.code.getLabel();
            if (isFloat){
                this.code.li(r.T0, 1111);
                this.code.fcvtsw(f.FT0, r.T0);
                this.code.feq(r.T0, f.FT0, f.FA0);
                this.code.bne(r.T0, r.ZERO, l1);
            }else{
                this.code.xori(r.T5, r.A0, 1111);
                this.code.beq(r.T5, r.ZERO, l1);
            }
            
            
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

            if (this.insideFunction){
                const localObject = this.code.getFrameLocal(this.frameDclIndex)
                const valueObject = this.code.popObject(r.T0);


                this.code.addi(r.T1, r.FP, -localObject.offset * 4);
                this.code.sw(r.T0, r.T1);

                // ! inferir el tipo
                localObject.type = valueObject.type;
                this.frameDclIndex++;

                return;
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

        if (this.insideFunction){
            this.code.addi(r.T1, r.FP, -variableObject.offset * 4); // ! Revisar
            this.code.sw(r.T0, r.T1);
            return;
        }

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

        if (this.insideFunction){
            this.code.addi(r.T1, r.FP, -variableObject.offset * 4);
            this.code.lw(r.T0, r.T1);
            this.code.push(r.T0);
            this.code.pushObject( { ...variableObject, id: undefined});
            return;
        }

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
        this.code.popObject(r.T0); 
        const defaultLabel = this.code.getLabel();
        if (node.def) {
            this.code.j(defaultLabel)
        }else{
            this.code.j(endSwitchLabel);
        }

        for (let i = 0; i < cases.length; i++) {
            this.code.comment(`Case ${i}`);
            this.code.comment('Condición');
            this.code.addLabel(caseLabels[i]);
            cases[i].accept(this);
            this.code.comment('Fin Condición');
        }

        if (node.def) {
            this.code.comment('Default');
            this.code.addLabel(defaultLabel);
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

    /**
     * @type {BaseVisitor['visitFuncDcl']}
     */
    visitFuncDcl(node){
        /*
            node.tipo
            node.id
            node.params
            node.bloque 
        */
        const baseSize = 2; // ra y fp
        const paramSize = node.params.length; // | ra | fp | p1 | p2 | ... | pn |

        const frameVisitor = new FrameVisitor(baseSize + paramSize);
        node.bloque.accept(frameVisitor);
        const localFrame = frameVisitor.frame;
        const localSize = localFrame.length;  // | ra | fp | p1 | p2 | ... | pn | l1 | l2 | ... | ln |

        const returnSize = 1; // | ra | fp | p1 | p2 | ... | pn | l1 | l2 | ... | ln | rv |

        const totalSize = baseSize + paramSize + localSize + returnSize;
        this.functionMetadata[node.id] = {
            frameSize: totalSize,
            returnType: node.tipo
        }

        const instruccionesDeMain = this.code.instrucciones;
        const instruccionesDeDeclaracionDeFuncion = [];
        this.code.instrucciones = instruccionesDeDeclaracionDeFuncion;

        node.params.forEach((param, index) => {
            this.code.pushObject({
                id: param.id,
                type: param.tipo,
                length: 4,
                offset: baseSize + index
            });
        });

        localFrame.forEach( variableLocal => {
            this.code.pushObject({
                ...variableLocal,
                type: 'local',
                length: 4,
            });
        });

        this.insideFunction = node.id;
        this.frameDclIndex = 0;
        this.returnLabel = this.code.getLabel();

        this.code.comment(`Declaracion de Función: ${node.id}`);
        this.code.addLabel(node.id);

        node.bloque.accept(this);

        this.code.addLabel(this.returnLabel);

        this.code.add(r.T0, r.FP, r.ZERO);
        this.code.lw(r.RA, r.T0);
        this.code.jalr(r.ZERO, r.RA, 0);
        this.code.comment(`Fin de Declaracion de Función: ${node.id}`);

        // Limpiar metadatos
        for (let i = 0; i < paramSize + localSize; i++) {
            this.code.objectStack.pop();// ! aqui no retrocedemos el SP, hay que hacerlo mas adelante
        }

        this.code.instrucciones = instruccionesDeMain

        instruccionesDeDeclaracionDeFuncion.forEach(instruccion => {
            this.code.instruccionesDeFunciones.push(instruccion);
        });
    }


    /**
     * @type {BaseVisitor['visitLlamada']}
     */
    visitLlamada(node){
        if (!(node.callee instanceof ReferenciaVariable)) return;

        if (node.callee.id === 'parseInt') {
            this.code.comment('Llamada a parseInt');
            node.args[0].accept(this);
            this.code.popObject(r.A0);
            this.code.callBuiltin('atoi');
            this.code.push(r.T0)
            this.code.pushObject({ type: 'int', length: 4 })
            return;
        }else if (node.callee.id === 'parsefloat') {
            this.code.comment('Llamada a parseFloat');
            node.args[0].accept(this);
            this.code.popObject(r.A0);
            this.code.callBuiltin('atof');
            this.code.pushObject({ type: 'float', length: 4 })
            return
        }else if (node.callee.id === 'toString') {
            this.code.comment('Llamada a toString');
            node.args[0].accept(this);
            const isFloat = this.code.getTopObject().type === 'float';
            const obj = this.code.popObject(isFloat ? f.FT0 : r.T0);
            console.log(obj)
            if (obj.type === 'int') {
                this.code.callBuiltin('IntToString');
            }else if (obj.type === 'boolean') {
                this.code.callBuiltin('BoolToString');

            }else if (obj.type === 'float') {
                this.code.callBuiltin('FloatToString');
            }
            this.code.pushObject({ type: 'string', length: 4 })
            return
        } else if (node.callee.id === 'toLowerCase') {
            this.code.comment('Llamada a toLowerCase');
            node.args[0].accept(this);
            const obj = this.code.popObject(r.A0);
            if (obj.type !== 'string') {
               throw new Error('Solo se puede llamar a toLowerCase con un string');
            }
            this.code.callBuiltin('LowerCase');
            this.code.pushObject({ type: 'string', length: 4 })
            return
        } else if (node.callee.id === 'toUpperCase') {
            this.code.comment('Llamada a toUpperCase');
            node.args[0].accept(this);
            const obj = this.code.popObject(r.A0);
            if (obj.type !== 'string') {
               throw new Error('Solo se puede llamar a toUpperCase con un string');
            }
            this.code.callBuiltin('UpperCase');
            this.code.pushObject({ type: 'string', length: 4 })
            return
        } else if(node.callee.id === 'typeof') {
            this.code.comment('Llamada a typeof');
            node.args[0].accept(this);
            const isFloat = this.code.getTopObject().type === 'float';
            const obj = this.code.popObject(isFloat ? f.FT0 : r.T0);

            const newNode = new nodos.Nativo({ tipo: 'string', valor: obj.type });
            newNode.accept(this);

            return
        }

        const nombreFuncion = node.callee.id;

        this.code.comment(`Llamada a función: ${nombreFuncion}`);

        const etiquetaRetornoLlamada = this.code.getLabel();

        // 1. Guardar los argumentos
        node.args.forEach((arg, index) => {
            arg.accept(this);
            this.code.popObject(r.T0);
            this.code.addi(r.T1, r.SP, -4 * (3 + index));
            this.code.sw(r.T0, r.T1);
        });

        // Calcular la direccion del nuevo FP en T1
        this.code.addi(r.T1, r.SP, -4);

        // Guardar direccion de retorno
        this.code.la(r.T0, etiquetaRetornoLlamada);
        this.code.push(r.T0);

        // Guardar el FP
        this.code.push(r.FP);
        this.code.addi(r.FP, r.T1, 0);

        // Colocar el SP al final del frame
        this.code.addi(r.SP, r.SP, - (4 * (node.args.length))); // ! Revisar el offset

        // Saltar a la funcion
        this.code.j(nombreFuncion);
        this.code.addLabel(etiquetaRetornoLlamada);

        // Recuperar el valor de retorno
        const frameSize = this.functionMetadata[nombreFuncion].frameSize;
        const returnSize = frameSize - 1;
        this.code.addi(r.T0, r.FP, -returnSize * 4);
        const isFloat = this.functionMetadata[nombreFuncion].returnType === "float";
        if (isFloat) {
            this.code.flw(f.FA0, r.T0);
        }else{
            this.code.lw(r.A0, r.T0);
        }

        // Regresar el FP al contexto de ejecucion anterior
        this.code.addi(r.T0, r.FP, -4);
        this.code.lw(r.FP, r.T0);

        // Regresar el SP al contexto de ejecucion anterior
        this.code.addi(r.SP, r.SP, (frameSize-1) * 4);

        if (isFloat) {
            this.code.pushFloat(f.FA0);
        } else {
            this.code.push(r.A0);
        }
        this.code.pushObject({ type: this.functionMetadata[nombreFuncion].returnType, length: 4 });

        this.code.comment(`Fin de Llamada a función: ${nombreFuncion}`);
    }

    /**
     * @type {BaseVisitor['visitReturn']}
     */
    visitReturn(node){
        this.code.comment('Inicio de Return');

        if (node.exp) {
            node.exp.accept(this);
            const isFloat = this.code.getTopObject().type === 'float';
            this.code.popObject(isFloat ? f.FA0 : r.A0);

            const frameSize = this.functionMetadata[this.insideFunction].frameSize;
            const returnOffset = frameSize - 1;
            this.code.addi(r.T0, r.FP, -returnOffset * 4);
            if (isFloat) {
                this.code.fsw(f.FA0, r.T0);
            } else {
                this.code.sw(r.A0, r.T0);
            }
        }

        this.code.j(this.returnLabel);
        this.code.comment('Fin de Return');
    }

    /**
     * @type {BaseVisitor['visitDclArray']}
     */
    visitDclArray(node){
        /*
            node.tipo
            node.id
            node.dim
            node.exp

            tipos de declaracino
            int [] numbers = {1, 2, 3, 4, 5};
            int [] numbers1 = new int[5];
            int [] numbersCopia = numbers;
        */
        this.code.comment(`Declaracion de Array: ${node.id}`);
        // Guardamos la direccion en heap para el array
        // Asegurarse que el heap este en un multiplo de 4
        this.code.li(r.T1, 4);
        this.code.li(r.T0, 4);
        this.code.rem(r.T0, r.HP, r.T0);
        this.code.sub(r.T0, r.T1, r.T0);
        this.code.add(r.HP, r.HP, r.T0);


        this.code.push(r.HP);
        this.code.pushObject({ type: node.tipo, length: 4})
        this.code.tagObject(node.id);

        if (Array.isArray(node.exp)){
            /* int [] numbers1 = new int[5];
               exp = lista de la cantidad de elementos
               la cantidad indicada en la lista es la cantidad de elementos a crear con su valor inicial
            */
           
            // Ya que solo habran arrays de 1 dimension siempre visitaremos el primer elemento
            node.exp[0].exp.accept(this);   // Obtener el valor de elementos que tendra el arreglo
            this.code.popObject(r.T3);  // Guardamos en T3 ese valor

            // Usar un ciclo para ingresar al heap esa cantidad de elementos con su valor por defecto
            this.code.li(r.T1, 0);       // Inicializamos el contador en 0
            if (node.tipo === 'int' || node.tipo === 'boolean' || node.tipo === 'char'){
                this.code.li(r.T2, 0);      // valor por defecto
                const label = this.code.getLabel();
                this.code.addLabel(label);
                this.code.beq(r.T1, r.T3, label + '_end'); // Valor por defecto
                this.code.pushToHeap(r.T2); // Guardamos en el heap el valor
                this.code.addi(r.T1, r.T1, 1); // Incrementamos el contador
                this.code.j(label);
                this.code.addLabel(label + '_end');

            }else if(node.tipo === 'float'){
                const newNode = new nodos.Nativo({ tipo: 'float', valor: 0.0 });
                newNode.accept(this);
                this.code.popObject(f.FT0);   // valor por defecto
                const label = this.code.getLabel();
                this.code.addLabel(label);
                this.code.beq(r.T1, r.T3, label + '_end'); // Valor por defecto
                this.code.pushFloatToHeap(f.FT0);        // Guardamos en el heap el valor
                this.code.addi(r.T1, r.T1, 1); // Incrementamos el contador
                this.code.j(label);
                this.code.addLabel(label + '_end');
            }


        }else if(node.exp instanceof nodos.ReferenciaVariable){
            /* int [] numbersCopia = numbers;
               exp = nodo ReferenciaVariable -> id
               Para este caso solo se debe copiar la direccion del array
            */

            node.exp.accept(this);
            this.code.popObject(r.A0);

            this.code.callBuiltin('copyArray');

        }else{
            /* int [] numbers = {1, 2, 3, 4, 5};
               exp = nodo Arreglo -> args
               se debe recorrer cada uno de los argumentos y pushearlos al heap
            */

            // Recorremos los argumentos y los pusheamos al heap
            if(node.tipo !== 'string'){
                node.exp.args.forEach(arg => {
                arg.accept(this);
                const isFloat = this.code.getTopObject().type === 'float';
                this.code.popObject(isFloat ? f.FT0 : r.T0);
                if (isFloat) {
                    this.code.pushFloatToHeap(f.FT0);
                } else{
                    this.code.pushToHeap(r.T0);               // Cada argumento se pushea al heap y ocupa 4 bytes
                }
                });

            }else{
                // Si el tipo es string, se debe guardar la longitud de la cadena
            }
        }

        //agregar un caracter de finalizacion de arrays
        this.code.li(r.T0, 1112);   // 1112 es el valor de finalizacion de arrays
        this.code.pushToHeap(r.T0); // Se pushea al heap el valor de finalizacion de arrays

        
    
        
        
        this.code.comment(`Fin de Declaracion de Array: ${node.id}`);
    }

    /**
     * @type {BaseVisitor['visitGet']}
     */
    visitGet(node){
        /*
            node.objetivo       // Nombre del array del que se quiere obtener informacion
            node.propiedad      // posicion del array que se quiere obtener
        */        

        this.code.comment(`Inicio de Get`);

        /* 
            Primero se debe saber que array se quiere obtener informacion
            por lo tanto al visitar referencia variable nos devuelve la direccion del 
            Esa direccion se guarda en A0
        */
       node.objetivo.accept(this);
       const obj = this.code.popObject(r.A0);  
       
       /*
           Lo siguiente es obtener la posicion del array que se quiere obtener
           Para eso debemos recorrer la propiedad y obtener el valor de la posicion
           Esa posicion se guarda en T0
       */
        node.propiedad.accept(this);
        this.code.popObject(r.T0);

        this.code.callBuiltin('getArray');
        
        // El valor esta en T0 y ahora se debe pushear a la pila
        this.code.push(r.T0);
        this.code.pushObject({ type: obj.type, length: 4 });


        this.code.comment(`Fin de Get`);
    }

    /**
     * @type {BaseVisitor['visitSet']}
     */
    visitSet(node){
        /*
            node.objetivo       // Nombre del array al que se quiere asignar un valor
            node.propiedad      // posicion del array que se quiere asignar
            node.valor            // valor que se quiere asignar
        */
        
        this.code.comment(`Inicio de Set`);

        /* 
            Primero se debe saber que array se quiere obtener informacion
            por lo tanto al visitar referencia variable nos devuelve la direccion del 
            Esa direccion se guarda en A0
        */
       node.objetivo.accept(this);
       this.code.popObject(r.A0);  
       
       /*
           Lo siguiente es obtener la posicion del array que se quiere modificar
           Para eso debemos recorrer la propiedad y obtener el valor de la posicion
           Esa posicion se guarda en T5
       */
        node.propiedad.accept(this);
        this.code.popObject(r.T5);

        /*
            Ahora se debe obtener el valor que se quiere asignar
            Para eso recorremos el valor y obtenemos el valor
            Ese valor se guarda en T0 o FT0
        */
        node.valor.accept(this);
        const isFloat = this.code.getTopObject().type === 'float';
        const obj = this.code.popObject(isFloat ? f.FT0 : r.T0);

        if (isFloat) {
            this.code.pushFloat(f.FT0);
        }else{
            this.code.push(r.T0);
        }
        this.code.pushObject({ type: obj.type, length: 4 });

        this.code.callBuiltin('setArray');

        this.code.comment(`Fin de Set`);
    }
}