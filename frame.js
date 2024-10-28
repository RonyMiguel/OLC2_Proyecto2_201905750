import { BaseVisitor } from "./visitor.js";

export class FrameVisitor extends BaseVisitor {

    constructor(baseOffset){
        super();
        this.frame = [];
        this.localSize = 0;
        this.baseOffset = baseOffset;
    }
   
    visitExpresionStmt(node) { }
    visitNativo(node) { }
    visitOperacionBinaria(node) { }
    visitOperacionUnaria(node) { }
    visitAgrupacion(node) { }
    visitPrint(node) { }
    /**
     * 
     * @type {BaseVisitor['visitDeclaracion']}
     */
    visitDeclaracion(node) { 
        this.frame.push({
            id: node.id, 
            offset: this.baseOffset + this.localSize,
            local: true,
        });
        this.localSize += 1;
    }
    visitAsignacion(node) { }
    visitReferenciaVariable(node) { }
    /**
     * 
     * @type {BaseVisitor['visitBloque']}
     */
    visitBloque(node) { 
        node.dcls.forEach(dcl => dcl.accept(this));
    }
    /**
     * 
     * @type {BaseVisitor['visitIf']}
     */
    visitIf(node) { 
        node.stmtTrue.accept(this);

        if(node.stmtFalse){
            node.stmtFalse.accept(this);
        }
    }
    /**
     * 
     * @type {BaseVisitor['visitWhile']}
     */
    visitWhile(node) { 
        node.stmt.accept(this);
    }
    /**
     * 
     * @type {BaseVisitor['visitFor']}
     */
    visitFor(node) { 
        node.stmt.accept(this);
    }

    visitBreak(node) { }
    visitContinue(node) { }
    visitSwitch(node) { }
    /**
     * 
     * @type {BaseVisitor['visitCase']}
     */
    visitCase(node) {
        node.stmt.forEach(stmt => stmt.accept(this));
     }

    visitFuncDcl(node) { }
    visitLlamada(node) { }

    visitExpresion(node) {}
    visitReturn(node) {}
    visitStructDcl(node) {}
    visitInstancia(node) {}
    visitGet(node) {}
    visitSet(node) {}
    visitKeys(node) {}
    visitDclArray(node) {}
    visitArreglo(node) {}
    visitFuncArray(node) {}
    visitForEach(node) {}

    }   