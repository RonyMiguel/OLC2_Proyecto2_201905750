export class BreakException extends Error {
    constructor(linea, columna) {
        super('Break');
        this.linea = linea;
        this.columna = columna;
    }
}

export class ContinueException extends Error {
    constructor(linea, columna) {
        super('Continue');
        this.linea = linea;
        this.columna = columna;
    }
}

export class ReturnException extends Error {
    /**
     * @param {any} value
     */
    constructor(value, linea, columna) {
        super('Return');
        this.value = value;
        this.linea = linea;
        this.columna = columna;
    }
}