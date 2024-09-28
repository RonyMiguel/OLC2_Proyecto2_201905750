import { registers as r } from "./constantes.js";

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

    lw(rd, rs1, inmediato = 0){
        this.instrucciones.push(new Instruccion('lw', rd, `${inmediato}(${rs1})`))
    }

    li(rd, inmediato){
        this.instrucciones.push(new Instruccion('li', rd, inmediato))
    }

    push(rd = r.T0){
        this.addi(r.SP, r.SP, -4) // Decrementa el puntero de pila 4 bytes = 32 bits
        this.sw(rd, r.SP)
    }

    pop(rd = r.T0){
        this.lw(rd, r.SP)
        this.addi(r.SP, r.SP, 4) // Incrementa el puntero de pila 4 bytes = 32 bits
    }

    ecall(){
        this.instrucciones.push(new Instruccion('ecall'))
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

    endProgram(){
        this.li(r.A7, 10)
        this.ecall()
    }

    comment(text){
        this.instrucciones.push(new Instruccion(`# ${text}`))
    }

    toString(){
        return `
.text
main:
${this.instrucciones.map(instruccion => `${instruccion}`).join('\n')}
        `
    }
}