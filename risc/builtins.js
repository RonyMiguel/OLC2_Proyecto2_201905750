import { registers as r, floatRegisters as f } from "./constantes.js"
import { Generador } from "./generador.js"

/**
 * @param {Generador} code
 */
export const concatString = (code) => {
    // A0 -> dirección en heap de la primera cadena
    // A1 -> dirección en heap de la segunda cadena
    // result -> push en el stack la dirección en heap de la cadena concatenada

    code.comment('Guardando en el stack la dirección en heap de la cadena concatenada')
    code.push(r.HP);

    code.comment('Copiando la 1er cadena en el heap')
    const end1 = code.getLabel()
    const loop1 = code.addLabel()

    code.lb(r.T1, r.A0)
    code.beq(r.T1, r.ZERO, end1)
    code.sb(r.T1, r.HP)
    code.addi(r.HP, r.HP, 1)
    code.addi(r.A0, r.A0, 1)
    code.j(loop1)
    code.addLabel(end1)

    code.comment('Copiando la 2da cadena en el heap')
    const end2 = code.getLabel()
    const loop2 = code.addLabel()

    code.lb(r.T1, r.A1)
    code.beq(r.T1, r.ZERO, end2)
    code.sb(r.T1, r.HP)
    code.addi(r.HP, r.HP, 1)
    code.addi(r.A1, r.A1, 1)
    code.j(loop2)
    code.addLabel(end2)

    code.comment('Agregando el caracter nulo al final')
    code.sb(r.ZERO, r.HP)
    code.addi(r.HP, r.HP, 1)
}

export const printBool = (code) => {
    // A0 -> dirección en heap de la cadena a imprimir
    // T0 -> valor booleano a imprimir
    code.comment('Imprimiendo boolean')
    code.beq(r.T0, r.ZERO, 'false')
    code.addLabel('true')
    code.la(r.A0, 'trueStr')
    code.j('printB')
    code.addLabel('false')
    code.la(r.A0, 'falseStr')
    code.addLabel('printB')
    code.li(r.A7, 4)
    code.ecall()
    code.comment('Fin de impresión de boolean')
}

export const printNull = (code) => {
    // A0 -> dirección en heap de la cadena a imprimir
    code.comment('Imprimiendo null')
    code.la(r.A0, 'nullStr')
    code.li(r.A7, 4)
    code.ecall()
    code.comment('Fin de impresión de null')
}
export const compareStrings = (code) => {
    // A0 -> dirección en heap de la primera cadena
    // A1 -> dirección en heap de la segunda cadena
    // T0 -> 1 si son iguales, 0 si no lo son

    code.comment('Comparando cadenas')

    code.addLabel("compareChar");
    code.lb(r.T1, r.A0)
    code.lb(r.T2, r.A1)
    code.beq(r.T1, r.ZERO, 'endString')
    code.beq(r.T2, r.ZERO, 'endString')
    code.xor(r.T0, r.T1, r.T2);
    code.sltiu(r.T0, r.T0, 1);
    code.beq(r.T0, r.ZERO, 'endCompare')
    code.addi(r.A0, r.A0, 1)
    code.addi(r.A1, r.A1, 1)
    code.j("compareChar")
    code.addLabel("endString")
    code.xor(r.T0, r.T1, r.T2);
    code.sltiu(r.T0, r.T0, 1);
    code.addLabel("endCompare")

    code.comment('Fin de comparación de cadenas')
}

// Funciones embebidads
export const atoi = (code) => {
    // A0 -> dirección en heap de la cadena a convertir
    // T0 -> valor entero convertido
    code.comment('Convirtiendo cadena a entero')
    code.li(r.T0, 0)
    code.li(r.T1, 10)
    code.li(r.T3, 48)
    code.li(r.T4, 58)
    code.li(r.T5, 46)
    code.addLabel('parseChar')
    code.lb(r.T2, r.A0)
    code.beq(r.T2, r.ZERO, 'endParse')
    code.beq(r.T2, r.T5, 'endParse')
    code.blt(r.T2, r.T3, 'errorParse')
    code.bge(r.T2, r.T4, 'errorParse')
    code.mul(r.T0, r.T0, r.T1)
    code.addi(r.T2, r.T2, -48)
    code.add(r.T0, r.T0, r.T2)
    code.addi(r.A0, r.A0, 1)
    code.j('parseChar')
    code.addLabel('errorParse')
    code.addi(r.T0, r.ZERO, 1111);
    code.addLabel('endParse')
    code.comment('Fin de conversión a entero')
}

export const atof = (code) => {
    // A0 -> dirección en heap de la cadena a convertir
    // T0 -> valor entero convertido
    // T1 -> valor decimal convertido
    code.comment('Convirtiendo cadena a entero')
    code.li(r.T0, 0)
    code.li(r.T1, 10)
    code.li(r.T3, 48)
    code.li(r.T4, 58)
    code.li(r.T5, 46)
    code.addLabel('Lfloat')
    code.lb(r.T2, r.A0)
    code.beq(r.T2, r.ZERO, 'LendIntFloat')
    code.beq(r.T2, r.T5, 'decimal')
    code.blt(r.T2, r.T3, 'Lerror')
    code.bge(r.T2, r.T4, 'Lerror')
    code.mul(r.T0, r.T0, r.T1)
    code.addi(r.T2, r.T2, -48)
    code.add(r.T0, r.T0, r.T2)
    code.addi(r.A0, r.A0, 1)
    code.j('Lfloat')
    code.addLabel('decimal')
    code.fcvtsw(f.FT0, r.T0);   // Guardar la parte entera en FT0
    code.li(r.T0, 0)            // Limpiar el entero
    code.li(r.T5, 1)           // Base para la parte decimal
    code.addLabel('Ldecimal')
    code.addi(r.A0, r.A0, 1)    
    code.lb(r.T2, r.A0)         // Leer el primer decimal
    code.beq(r.T2, r.ZERO, 'LendFloat')
    code.blt(r.T2, r.T3, 'Lerror')
    code.bge(r.T2, r.T4, 'Lerror')
    code.mul(r.T5, r.T5, r.T1)  // Multiplicar la base por 10
    code.addi(r.T2, r.T2, -48)  // Convertir a número
    code.add(r.T0, r.T0, r.T2)  // Sumar el decimal
    code.j('Ldecimal')
    code.addLabel('Lerror')
    code.addi(r.T0, r.ZERO, 1111);
    code.fcvtsw(f.FT0, r.T0);   // Guardar la parte entera en FT0
    code.j('finFloat')
    code.addLabel('LendFloat')
    code.fcvtsw(f.FT1, r.T0);       // Guardar la parte decimal en FT1
    code.fcvtsw(f.FT2, r.T5);       // Guardar la base para dividir en FT2
    code.fdiv(f.FT1, f.FT1, f.FT2); // Dividir la parte decimal para convertirla en float
    code.fadd(f.FT0, f.FT0, f.FT1); // Sumar las 2 partes
    code.j('finFloat')
    code.addLabel('LendIntFloat')
    code.fcvtsw(f.FT0, r.T0);   // Guardar la parte entera en FT0
    code.addLabel('finFloat')
    code.pushFloat(f.FT0)
    code.comment('Fin de conversión a entero')
}

export const IntToString = (code) => {
    /*
        Divide el numero entre 10 para ir obteniendo el digito mas a la derecha
        Se alamacena en el hep de derecha a izquierda por lo que el heap empieza a guardar
        desde el digito menos significativo al menos significativo
        ej. 1369
        Se obtienen en este orden y se guardan en el heap asi
        9
        6
        3
        1
        el puntero del heap se posiciona en la siguiente posicion libre al final de la cadena
        antes de empezar a guardar
     */
    // T0 -> valor entero a convertir
    code.comment('Convirtiendo entero a cadena')
    code.push(r.HP); // Guardar la dirección en heap de la cadena
    code.add(r.T1, r.T0, r.ZERO);  // Copiar el valor a otro registro
    code.li(r.T2, 10);      // Base para convertir a decimal
    code.li(r.T3, 0);      // Tamano de la cadena

    code.addLabel('IntGetSize')
    code.div(r.T1, r.T1, r.T2); // Dividir el valor entre 10
    code.addi(r.T3, r.T3, 1);   // Aumentar el tamaño de la cadena
    code.beq(r.T1, r.ZERO, 'IntConvert') // Si el resultado es 0, terminar
    code.j('IntGetSize')

    code.addLabel('IntConvert')
    code.addi(r.T3, r.T3, 1);   // Aumentar el tamaño de la cadena con el caracter nulo y la siguiente posicion libre
    code.add(r.HP, r.HP, r.T3); // Mover el puntero de heap hasta el final de la cadena
    code.addi(r.T4, r.HP, -1); // Copia de la direccion del heap quedando en la posicion del caracter nulo
    code.sb(r.ZERO, r.T4);     // Agregar el caracter nulo al final
    code.addi(r.T4, r.T4, -1);      // Mover el puntero de la cadena

    code.addLabel('loopInt')
    code.div(r.T1, r.T0, r.T2);     // Dividir el valor entre 10
    code.mul(r.T3, r.T1, r.T2);     // Multiplicar el resultado por 10
    code.sub(r.T3, r.T0, r.T3);     // Obtener el sobrante
    code.addi(r.T3, r.T3, 48);      // Convertir el residuo a caracter
    code.sb(r.T3, r.T4);             // Guardar el caracter en la cadena
    code.addi(r.T4, r.T4, -1);      // Mover el puntero de la cadena
    code.addi(r.T0, r.T1, 0);       // Copiar el resultado de la division
    code.beq(r.T0, r.ZERO, 'endInt') // Si el resultado es 0, terminar
    code.j('loopInt')
    code.addLabel('endInt')

    code.comment('Fin de conversión a cadena')
}

export const FloatToString = (code) => {
    // FT0 -> valor flotante a convertir
    code.comment('Convirtiendo float a cadena')
    code.push(r.HP); // Guardar la dirección en heap de la cadena
    code.addi(r.T0, r.ZERO, 10)
    code.fcvtsw(f.FT1, r.T0)
    code.fmul(f.FT0, f.FT0, f.FT1); // Multiplicar el valor por 1000
    code.fcvt(r.T0, f.FT0); // Convertir el valor a entero

    code.add(r.T1, r.T0, r.ZERO);  // Copiar el valor a otro registro
    code.li(r.T2, 10);      // Base para convertir a decimal
    code.li(r.T3, 0);      // Tamano de la cadena

    code.addLabel('FloatGetSize')
    code.div(r.T1, r.T1, r.T2); // Dividir el valor entre 10
    code.addi(r.T3, r.T3, 1);   // Aumentar el tamaño de la cadena
    code.beq(r.T1, r.ZERO, 'FloatConvert') // Si el resultado es 0, terminar
    code.j('FloatGetSize')
   
    code.addLabel('FloatConvert')
    code.addi(r.T3, r.T3, 2);   // Aumentar el tamaño de la cadena con el caracter nulo y la siguiente posicion libre
    code.add(r.HP, r.HP, r.T3); // Mover el puntero de heap hasta el final de la cadena
    code.addi(r.T4, r.HP, -1); // Copia de la direccion del heap quedando en la posicion del caracter nulo
    code.sb(r.ZERO, r.T4);     // Agregar el caracter nulo al final
    code.addi(r.T4, r.T4, -1);      // Mover el puntero de la cadena

    code.li(r.T5, 0)            // Base para la parte decimal
    code.addLabel('loopForDecimals')
    code.div(r.T1, r.T0, r.T2);     // Dividir el valor entre 10
    code.mul(r.T3, r.T1, r.T2);     // Multiplicar el resultado por 10
    code.sub(r.T3, r.T0, r.T3);     // Obtener el sobrante
    code.addi(r.T3, r.T3, 48);      // Convertir el residuo a caracter
    code.sb(r.T3, r.T4);             // Guardar el caracter en la cadena
    code.addi(r.T4, r.T4, -1);      // Mover el puntero de la cadena
    code.addi(r.T0, r.T1, 0);       // Copiar el resultado de la division
    code.li(r.T3, 1)
    code.addi(r.T5, r.T5, 1);       // Aumentar el contador de decimales
    code.beq(r.T5, r.T3, 'addPoint') // Si el resultado es 0, terminar\
    code.j('loopForDecimals')

    code.addLabel('addPoint')
    code.li(r.T3, 46)
    code.sb(r.T3, r.T4);             // Guardar el caracter en la cadena
    code.addi(r.T4, r.T4, -1);      // Mover el puntero de la cadena

    code.addLabel('loopFloat')
    code.div(r.T1, r.T0, r.T2);     // Dividir el valor entre 10
    code.mul(r.T3, r.T1, r.T2);     // Multiplicar el resultado por 10
    code.sub(r.T3, r.T0, r.T3);     // Obtener el sobrante
    code.addi(r.T3, r.T3, 48);      // Convertir el residuo a caracter
    code.sb(r.T3, r.T4);             // Guardar el caracter en la cadena
    code.addi(r.T4, r.T4, -1);      // Mover el puntero de la cadena
    code.addi(r.T0, r.T1, 0);       // Copiar el resultado de la division
    code.beq(r.T0, r.ZERO, 'endFloat') // Si el resultado es 0, terminar
    code.j('loopFloat')
    code.addLabel('endFloat')

    code.comment('Fin de conversión a cadena')

}

export const BoolToString = (code) => {
    // T0 -> valor booleano a convertir
    code.comment('Convirtiendo boolean a cadena')
    code.push(r.HP)             // Guardar la dirección en heap de la cadena
    code.beq(r.T0, r.ZERO, 'Lfalse')
    code.la(r.T0, 'trueStr')    // Copiar la direcion del string "true"
    code.j('LBool')
    code.addLabel('Lfalse')
    code.la(r.T0, 'falseStr')   // Copiar la direcion del string "false"
    code.addLabel('LBool')
    code.lb(r.T1, r.T0)         // Leer el caracter
    code.sb(r.T1, r.HP)         // Guardar el caracter en el heap
    code.addi(r.T0, r.T0, 1)    // Mover el puntero de la cadena
    code.addi(r.HP, r.HP, 1)    // Aumentar el puntero de heap
    code.beq(r.T1, r.ZERO, 'endBool') // Si el caracter es nulo, terminar
    code.j('LBool')
    code.addLabel('endBool')

    code.comment('Fin de conversión a cadena')

}

export const LowerCase = (code) => {
    // A0 -> dirección en heap de la cadena a convertir
    code.comment('Convirtiendo cadena a minusculas')
    code.push(r.HP); // Guardar la dirección en heap de la cadena

    code.addLabel('loopLower')
    code.lb(r.T1, r.A0)         // Leer el caracter
    code.beq(r.T1, r.ZERO, 'endLower') // Si el caracter es nulo, terminar
    code.li(r.T2, 65)           // 'A'
    code.li(r.T3, 91)           // 'Z'
    code.blt(r.T1, r.T2, 'nextLower') // Si el caracter es menor que 'A', no hacer nada
    code.bge(r.T1, r.T3, 'nextLower') // Si el caracter es mayor que 'Z', no hacer nada
    code.addi(r.T1, r.T1, 32)   // Convertir a minuscula
    code.addLabel('nextLower')
    code.sb(r.T1, r.HP)         // Guardar el caracter en el heap
    code.addi(r.HP, r.HP, 1)    // Aumentar el puntero de heap
    code.addi(r.A0, r.A0, 1)    // Mover el puntero de la cadena
    code.j('loopLower')
    code.addLabel('endLower')
    code.sb(r.T1, r.HP)         // Guardar el caracter nulo en el heap
    code.addi(r.HP, r.HP, 1)    // Aumentar el puntero de heap

    code.comment('Fin de conversión a minusculas')
}

export const UpperCase = (code) => {
    // A0 -> dirección en heap de la cadena a convertir
    code.comment('Convirtiendo cadena a mayusculas')
    code.push(r.HP); // Guardar la dirección en heap de la cadena

    code.addLabel('loopUpper')
    code.lb(r.T1, r.A0)         // Leer el caracter
    code.beq(r.T1, r.ZERO, 'endUpper') // Si el caracter es nulo, terminar
    code.li(r.T2, 97)           // 'a'
    code.li(r.T3, 123)          // 'z'
    code.blt(r.T1, r.T2, 'nextUpper') // Si el caracter es menor que 'a', no hacer nada
    code.bge(r.T1, r.T3, 'nextUpper') // Si el caracter es mayor que 'z', no hacer nada
    code.addi(r.T1, r.T1, -32)  // Convertir a mayuscula
    code.addLabel('nextUpper')
    code.sb(r.T1, r.HP)         // Guardar el caracter en el heap
    code.addi(r.HP, r.HP, 1)    // Aumentar el puntero de heap
    code.addi(r.A0, r.A0, 1)    // Mover el puntero de la cadena
    code.j('loopUpper')
    code.addLabel('endUpper')
    code.sb(r.T1, r.HP)         // Guardar el caracter nulo en el heap
    code.addi(r.HP, r.HP, 1)    // Aumentar el puntero de heap

    code.comment('Fin de conversión a mayusculas')
}

export const copyArray = (code) => {
    // A0 -> dirección en heap de la cadena a copiar
    // A1 -> dirección en heap de la cadena destino
    code.comment('Copiando cadena')
    code.li(r.T0, 1112)     // Finalizacion de array
    
    code.addLabel('loopCopy')
    code.lw(r.T1, r.A0)     // Copiar el elemento
    code.beq(r.T1, r.T0, 'endCopy') // Si el elemento es nulo, terminar
    code.pushToHeap(r.T1)   // Guardar el elemento en el heap
    code.addi(r.A0, r.A0, 4) // Mover el puntero de la cadena
    code.j('loopCopy')
    code.addLabel('endCopy')

    code.comment('Fin de copia de cadena')
}

export const getArray = (code) => {
    // A0 -> dirección en heap del array referenciado
    // T0 -> posicion del heap a devolver

    code.comment('Obteniendo elemento indicado')
    code.li(r.T1, 4);           // Offset de cada posicion del array
    code.mul(r.T0, r.T0, r.T1)  // Calcular la posición con offset en el heap
    code.add(r.A0, r.A0, r.T0)  // Sumar el offset a la direccion del array
    code.lw(r.T0, r.A0)         // Obtener el valor de la posicion
    code.comment('Fin de obtención de elemento')
}

export const setArray = (code, isFloat) => {
    // A0 -> dirección en heap del array referenciado
    // T5 -> posicion del heap a modificar
    // T0 -> valor a guardar

    code.comment('Obteniendo elemento indicado')
    code.li(r.T1, 4);           // Offset de cada posicion del array
    code.mul(r.T5, r.T5, r.T1)  // Calcular la posición con offset en el heap
    code.add(r.A0, r.A0, r.T5)  // Sumar el offset a la direccion del array
    if (isFloat) {
        code.fsw(f.FT0, r.A0)         // Guardar el valor en la posicion
    }else{
        code.sw(r.T0, r.A0)         // Guardar el valor en la posicion
    }
    
    code.comment('Fin de obtención de elemento')
}

export const builtins = {
    concatString: concatString,
    printBool: printBool,
    printNull: printNull,
    atoi: atoi,
    atof: atof,
    BoolToString: BoolToString,
    IntToString: IntToString,
    FloatToString: FloatToString,
    LowerCase: LowerCase,
    UpperCase: UpperCase,
    copyArray: copyArray,
    compareStrings: compareStrings,
    getArray: getArray,
    setArray: setArray
}