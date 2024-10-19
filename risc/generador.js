import { builtins } from "./builtins.js";
import { registers as r } from "./constantes.js";
import { stringTo1ByteArray, numberToF32 } from "./utils.js";

class Instruccion {

    constructor(Instruccion, rd, rs1, rs2){
        this.Instruccion = Instruccion;
        this.rd = rd;
        this.rs1 = rs1;
        this.rs2 = rs2;
    }

    toString(){
        const operandos = []
        if(this.rd !== undefined) operandos.push(this.rd)
        if(this.rs1 !== undefined) operandos.push(this.rs1)
        if(this.rs2 !== undefined) operandos.push(this.rs2)
        return `${this.Instruccion} ${operandos.join(', ')}`
    }
}

export class Generador {
    constructor(){
        this.instrucciones = []
        this.objectStack = []
        this.depth = 0
        this._usedBuiltins = new Set() // '_' representa una variable privada
        this._labelCounter = 0
    }

    getLabel(){
        return `L${this._labelCounter++}`
    }

    addLabel(label){
        label = label || this.getLabel()
        this.instrucciones.push(new Instruccion(`${label}:`))
        return label
    }

    add(rd, rs1, rs2){
        this.instrucciones.push(new Instruccion('add', rd, rs1, rs2))
    }

    sub(rd, rs1, rs2){
        this.instrucciones.push(new Instruccion('sub', rd, rs1, rs2))
    }

    mul(rd, rs1, rs2){
        this.instrucciones.push(new Instruccion('mul', rd, rs1, rs2))
    }

    div(rd, rs1, rs2){
        this.instrucciones.push(new Instruccion('div', rd, rs1, rs2))
    }

    addi(rd, rs1, inmediato){
        this.instrucciones.push(new Instruccion('addi', rd, rs1, inmediato))
    }

    sw(rs1, rs2, inmediato = 0){
        this.instrucciones.push(new Instruccion('sw', rs1, `${inmediato}(${rs2})`))
    }

    sb(rs1, rs2, inmediato = 0){
        this.instrucciones.push(new Instruccion('sb', rs1, `${inmediato}(${rs2})`))
    }

    lw(rd, rs1, inmediato = 0){
        this.instrucciones.push(new Instruccion('lw', rd, `${inmediato}(${rs1})`))
    }

    lb(rd, rs1, inmediato = 0){
        this.instrucciones.push(new Instruccion('lb', rd, `${inmediato}(${rs1})`))
    }

    beq(rs1, rs2, label){
        this.instrucciones.push(new Instruccion('beq', rs1, rs2, label))
    }

    bne(rs1, rs2, label){
        this.instrucciones.push(new Instruccion('bne', rs1, rs2, label))
    }

    blt(rs1, rs2, label){
        this.instrucciones.push(new Instruccion('blt', rs1, rs2, label))
    }

    bge(rs1, rs2, label){
        this.instrucciones.push(new Instruccion('bge', rs1, rs2, label))
    }

    li(rd, inmediato){
        this.instrucciones.push(new Instruccion('li', rd, inmediato))
    }

    push(rd = r.T0){
        this.addi(r.SP, r.SP, -4) // Decrementa el puntero de pila 4 bytes = 32 bits
        this.sw(rd, r.SP)
    }

    pushFloat(rd = r.FT0){
        this.addi(r.SP, r.SP, -4) // Decrementa el puntero de pila 4 bytes = 32 bits
        this.fsw(rd, r.SP)
    }

    pop(rd = r.T0){
        this.lw(rd, r.SP)
        this.addi(r.SP, r.SP, 4) // Incrementa el puntero de pila 4 bytes = 32 bits
    }

    rem(rd, rs1, rs2) {
        this.instrucciones.push(new Instruccion('rem', rd, rs1, rs2))
    }

    slt(rd, rs1, rs2) {
        this.instrucciones.push(new Instruccion('slt', rd, rs1, rs2))
    }

    sltu(rd, rs1, rs2) {
        this.instrucciones.push(new Instruccion('sltu', rd, rs1, rs2))
    }

    sltiu(rd, rs1, inmediato) {
        this.instrucciones.push(new Instruccion('sltiu', rd, rs1, inmediato))
    }

    xor(rd, rs1, rs2) {
        this.instrucciones.push(new Instruccion('xor', rd, rs1, rs2))
    }

    xori(rd, rs1, inmediato) {
        this.instrucciones.push(new Instruccion('xori', rd, rs1, inmediato))
    }

    jal(label){
        this.instrucciones.push(new Instruccion('jal', label))
    }

    j(label){
        this.instrucciones.push(new Instruccion('j', label))
    }

    ret(){
        this.instrucciones.push(new Instruccion('ret'))
    }

    ecall(){
        this.instrucciones.push(new Instruccion('ecall'))
    }

    callBuiltin(builtinName){
        if(!builtins[builtinName]){
            throw new Error(`Builtin ${builtinName} not found`)
        }
        this._usedBuiltins.add(builtinName)
        this.jal(builtinName)
    }

    printInt(rd = r.A0){
        
        if(rd !== r.A0){
            this.push(r.A0)
            this.add(r.A0, rd, r.ZERO)
        }

        this.li(r.A7, 1)
        this.ecall()

        if(rd !== r.A0){
            this.pop(r.A0)
        }
    }

    printFloat(){
        this.li(r.A7, 2)
        this.ecall()
    }

    printChar(rd = r.A0) {

        if(rd !== r.A0){
            this.push(r.A0)
            this.add(r.A0, rd, r.ZERO)
        }

        this.li(r.A7, 11)
        this.ecall()

        if(rd !== r.A0){
            this.pop(r.A0)
        }
    }

    printString(rd = r.A0) {

        if (rd !== r.A0) {
            this.push(r.A0)
            this.add(r.A0, rd, r.ZERO)
        }

        this.li(r.A7, 4)
        this.ecall()

        if (rd !== r.A0) {
            this.pop(r.A0)
        }
    }

    endProgram(){
        this.li(r.A7, 10)
        this.ecall()
    }

    comment(text){
        this.instrucciones.push(new Instruccion(`# ${text}`))
    }

    pushConstant(object){
        let length = 0;

        switch(object.type){
            case 'int':
                this.li(r.T0, object.valor);
                this.push();
                length = 4;
                break;

            case 'string':
                let valorS = RemoveCaracteresEspeciales(object.valor);
                const stringArray = stringTo1ByteArray(valorS);

                this.comment(`Pushing string ${object.valor}`);
                this.push(r.HP);

                stringArray.forEach((charCode) => {
                    this.li(r.T0, charCode);
                    //this.push(r.T0);
                    //this.addi(r.HP, r.HP, 4);
                    //this.sw(r.T0, r.HP);

                    this.sb(r.T0, r.HP);
                    this.addi(r.HP, r.HP, 1);
                });

                length = 4;
                break;

            case 'char':
                let valor = RemoveCaracteresEspeciales(object.valor);

                this.li(r.T0, valor.charCodeAt(0));
                this.push();
                length = 4;
                break;

            case 'boolean':
                this.li(r.T0, object.valor ? 1 : 0);
                this.push();
                length = 4;
                break;

            case 'float':
                const ieee754 = numberToF32(object.valor);
                this.li(r.T0, ieee754);
                this.push();
                length = 4;
                break;
            default:
                break;
        }

        this.pushObject({ type: object.type , length, depth: this.depth });
    }

    pushObject(object){
        //this.objectStack.push(object);

        this.objectStack.push({
            ...object,
            depth: object.depth
        });
    }

    popFloat(rd = r.FT0){
        this.flw(rd, r.SP);
        this.addi(r.SP, r.SP, 4);
    }

    popObject(rd = r.T0){
        const object =  this.objectStack.pop();

        switch (object.type) {
            case 'int':
                this.pop(rd);
                break;

            case 'string':
                /*
                this.addi(rd, r.SP, 0);
                this.addi(r.SP, r.SP, object.length);
                */
               this.pop(rd);
                break;

            case 'char':
                this.pop(rd);
                break;
            
            case 'boolean':
                this.pop(rd);
                /*
                console.log(object)
                this.pushConstant({ type: 'string', valor: object.valor ? "true" : "false" });
                this.pop(rd)
                */
            break;

            case 'float':
                this.popFloat(rd);
                break;

            default:
                break;
        }

        return object
    }

    getTopObject(){
        return this.objectStack[this.objectStack.length - 1]
    }

    newScope(){
        this.depth++
    }

    endScope(){
        let byteOffset = 0;

        for(let i = this.objectStack.length - 1; i >= 0; i--){
            if(this.objectStack[i].depth === this.depth){
                byteOffset += this.objectStack[i].length
                this.objectStack.pop()
            } else {
                break;
            }
        }
        this.depth--;

        return byteOffset;
    }

    tagObject(id){
        this.objectStack[this.objectStack.length - 1].id = id
    }

    getObject(id){
        let byteOffset = 0;
        for(let i = this.objectStack.length - 1; i >= 0; i--){
            if(this.objectStack[i].id === id){
                return [byteOffset, this.objectStack[i]];
            }
            byteOffset += this.objectStack[i].length
        }

        throw new Error(`Variable ${id} not found`)
    }

    toString(){
        this.comment('fin del programa')
        this.endProgram();
        this.comment('Builtins')

        Array.from(this._usedBuiltins).forEach(builtinName => {
            this.addLabel(builtinName)
            builtins[builtinName](this)
            this.ret()
        })
        return `
.data
heap:
.text

# inicializando el heap pointer
    la ${r.HP}, heap

main:
    ${this.instrucciones.map(instruccion => `${instruccion}`).join('\n')}
`
    }

    // --- Instrucciones flotantes

    fadd(rd, rs1, rs2){
        this.instrucciones.push(new Instruccion('fadd.s', rd, rs1, rs2))
    }

    fsub(rd, rs1, rs2){
        this.instrucciones.push(new Instruccion('fsub.s', rd, rs1, rs2))
    }

    fmul(rd, rs1, rs2){
        this.instrucciones.push(new Instruccion('fmul.s', rd, rs1, rs2))
    }

    fdiv(rd, rs1, rs2){
        this.instrucciones.push(new Instruccion('fdiv.s', rd, rs1, rs2))
    }

    fli(rd, inmediato){
        this.instrucciones.push(new Instruccion('fli', rd, inmediato))
    }

    fmv(rd, rs){
        this.instrucciones.push(new Instruccion('fmv.s', rd, rs))
    }

    flw(rd, rs1, inmediato = 0){
        this.instrucciones.push(new Instruccion('flw', rd, `${inmediato}(${rs1})`))
    }

    fsw(rs1, rs2, inmediato = 0){
        this.instrucciones.push(new Instruccion('fsw', rs1, `${inmediato}(${rs2})`))
    }

    fcvtsw(rd, rs){
        this.instrucciones.push(new Instruccion('fcvt.s.w', rd, rs))
    }

    flt(rd, rs1, rs2){
        this.instrucciones.push(new Instruccion('flt.s', rd, rs1, rs2))
    }

    fle(rd, rs1, rs2){
        this.instrucciones.push(new Instruccion('fle.s', rd, rs1, rs2))
    }

    feq(rd, rs1, rs2){
        this.instrucciones.push(new Instruccion('feq.s', rd, rs1, rs2))
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