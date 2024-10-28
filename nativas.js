import { Invocable } from "./invocable.js";


class FuncionNativa extends Invocable {
    constructor(aridad, func, tipo) {
        super();
        this.aridad = aridad;
        this.invocar = func;
        this.tipo = tipo;
    }
}


export const embebidas = {
    'parseInt': new FuncionNativa(() => 1, (interprete, args) => {
        if (args[0].tipo !== "string") {
            throw new Error('parseInt solo acepta un argumento de tipo string');
        }

        if (isNaN(parseInt(args[0].valor))) {
            throw new Error('No se pudo convertir el string a entero');
        }
        return parseInt(args[0].valor)
    }, "int"),
    'parsefloat': new FuncionNativa(() => 1, (interprete, args) => {
        if (args[0].tipo !== "string") {
            throw new Error('parseFloat solo acepta un argumento de tipo string');
        }

        if (isNaN(parseFloat(args[0].valor))) {
            throw new Error('No se pudo convertir el string a decimal');
        }
        return parseFloat(args[0].valor)
    }, "float"),
    'toString': new FuncionNativa(() => 1, (interprete, args) => {
        if (args[0].tipo !== "int" && args[0].tipo !== "float" && args[0].tipo !== "boolean") {
            throw new Error('toSring solo acepta un argumento de tipo int, float o boolean');
        }

        return args[0].valor.toString()
    }, "string"),
    'toLowerCase': new FuncionNativa(() => 1, (interprete, args) => {
        if (args[0].tipo !== "string") {
            throw new Error('toLowerCase solo acepta un argumento de tipo string');
        }

        return args[0].valor.toLowerCase()
    }, "string"),
    'toUpperCase': new FuncionNativa(() => 1, (interprete, args) => {
        if (args[0].tipo !== "string") {
            throw new Error('toUpperCase solo acepta un argumento de tipo string');
        }

        return args[0].valor.toUpperCase()
    }, "string"),
    'typeof': new FuncionNativa(() => 1, (interprete, args) => {
        if (args[0].tipo !== "int" && args[0].tipo !== "float" && args[0].tipo !== "boolean" && args[0].tipo !== "string" && args[0].tipo !== "char" && args[0].tipo !== "void") {
            throw new Error('typeof solo acepta un argumento de tipo primitivo, falta agrega struct');
        }

        return args[0].tipo
    }, "string")
}