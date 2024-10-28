
{
  const crearNodo = (tipoNodo, props) =>{
    const tipos = {
        'nativo': nodos.Nativo,
        'declaracion': nodos.Declaracion,
        'referenciaVariable': nodos.ReferenciaVariable,
        'agrupacion': nodos.Agrupacion,
        'asignacion': nodos.Asignacion,
        'expresionStmt': nodos.ExpresionStmt,
        'binaria': nodos.OperacionBinaria,
        'unaria': nodos.OperacionUnaria,
        'bloque': nodos.Bloque,
        'if': nodos.If,
        'while': nodos.While,
        'for': nodos.For,
        'print': nodos.Print,
        'switch': nodos.Switch,
        'case': nodos.Case,
        'break': nodos.Break,
        'continue': nodos.Continue,
        'return': nodos.Return,
        'llamada': nodos.Llamada,
        'dclFunc': nodos.FuncDcl,
        'dclStruct': nodos.StructDcl,
        'instancia': nodos.Instancia,
        'get': nodos.Get,
        'set': nodos.Set,
        'keys': nodos.Keys,
        'arreglo': nodos.Arreglo,
        'dclArray': nodos.DclArray,
        'funcArray': nodos.FuncArray,
        'forEach': nodos.ForEach
    }

    const nodo = new tipos[tipoNodo](props)
    nodo.location = location()
    return nodo
  }
}


programa = _ dcl:Declaracion* _ {return dcl}

Declaracion = dcl:ArrDcl _ {return dcl}
            / dcl: VarDcl _ {return dcl }
            / dcl:FuncDcl _ { return dcl }
            / dcl:StructDcl _ { return dcl }
            / stmt: Stmt _ {return stmt }

VarDcl = tipo:Tipos _ id:Identificador _ ";" _{ return crearNodo("declaracion", {tipo, id, exp: null}) }
        / tipo:Tipos _ id:Identificador _ "=" _ exp:Expresion _ ";" _ { return crearNodo("declaracion", {tipo, id, exp}) }
        / "var" _ id:Identificador _ "=" _ exp:Expresion _ ";" _ { return crearNodo("declaracion", {tipo: "var", id, exp}) }
        / tipo:Identificador _ id:Identificador _ "=" _ exp:Expresion _ ";" _ { return crearNodo("declaracion", {tipo, id, exp}) }
        / tipo:Identificador _ id:Identificador _ ";" _ { return crearNodo("declaracion", {tipo, id, exp: null}) }

FuncDcl = tipo:Tipos _ id:Identificador _ "(" _ params:Parametros? _ ")" _ bloque:Bloque _ { return crearNodo('dclFunc', { tipo, id, params: params || [], bloque }) }

StructDcl = "struct" _ id:Identificador _ "{" _ dcls:VarDcl+ _ "}" _ ";" { return crearNodo('dclStruct', { id, dcls }) }

Parametros = tipo:Tipos _ id:Identificador _ params:(","_ tipos:Tipos _ ids:Identificador { return { tipo: tipos, id: ids } })* { return [{ tipo, id} , ...params] }

ArrDcl = tipo:Tipos _ dim:Dimensiones+ _ id:Identificador _ "=" _ exp:Expresion _ ";" _ { return crearNodo('dclArray', { tipo, id, dim: dim.length, exp }) }
      / tipo:Tipos _ dim:Dimensiones+ _ id:Identificador _ "=" _ "new" _ tipo2:Tipos _ exp:Elementos _ ";" _ { 
        if (tipo !== tipo2) {
          throw new Error('Los tipos del arreglos no coinciden')
        }
        return crearNodo('dclArray', { tipo, id, dim: dim.length, exp }) 
        }

Dimensiones = _"[" _ "]"_ 

Elementos = dim:(_"[" _ exp:Expresion _ "]"_  {return { exp } })+ { return dim }

Tipos = tipo:"int"  { return tipo }
    / tipo:"float"  { return tipo }
    / tipo:"char"   { return tipo }
    / tipo:"string" { return tipo }
    / tipo:"boolean"   { return tipo }
    / tipo:"void"   { return tipo }

Stmt = Bloque
    / "System.out.println(" _ exp:Expresion _ expansion:(',' _ der:Expresion _ { return der})* ")" _ ";" { return crearNodo('print', {exp, der: expansion}) }
    / "if" _ "(" _ cond:Expresion _ ")" _ stmtTrue:Stmt 
      stmtFalse:(
        _ "else" _ stmtFalse:Stmt { return stmtFalse } 
      )? { return crearNodo('if', { cond, stmtTrue, stmtFalse }) }
    / "while" _ "(" _ cond:Expresion _ ")" _ stmt:Stmt { return crearNodo('while', { cond, stmt }) }
    / "for" _ "(" _ tipo:Tipos _ id:Identificador _ ":" _ exp:Expresion _ ")" _ stmt:Stmt { return crearNodo('forEach', { tipo, id, exp, stmt }) }
    / "for" _ "(" _ init:ForInit _ cond:Expresion _ ";" _ inc:Expresion _ ")" _ stmt:Stmt {
      return crearNodo('for', { init, cond, inc, stmt })
    }
    / "switch" _ "(" _ exp:Expresion _ ")" _ "{" _ cases:Case* _  def:("default"_ ":" _ stmt:Declaracion* _ { return stmt})?"}" { return crearNodo('switch', { exp, cases, def}) }
    / "break" _ ";" { return crearNodo('break') }
    / "continue" _ ";" { return crearNodo('continue') }
    / "return" _ exp:Expresion? _ ";" { return crearNodo('return', { exp }) }
    / exp:Expresion _ ";" { return crearNodo('expresionStmt', {exp}) }


Bloque = "{" _ dcls:Declaracion* _ "}" { return crearNodo('bloque', { dcls }) }

Case = "case" _ exp:Expresion _ ":" _ stmt:Declaracion* _ { return crearNodo('case', { exp, stmt }) }

ForInit = dcl:VarDcl { return dcl }
    / exp:Expresion _ ";" { return exp }
    / ";" { return null }

Expresion = asgn:Asignacion _ "?" _ stmtTrue:Expresion _ ":" _ stmtFalse:Expresion { return crearNodo('if', { cond: asgn, stmtTrue, stmtFalse }) }
        / Asignacion

Asignacion = asignado:Llamada _ op:("="/"+="/ "-=") _ asgn:Asignacion { 
      if (asignado instanceof nodos.ReferenciaVariable) {
        switch (op) {
            case "+=":
                return crearNodo('asignacion', { id: asignado.id, asgn: crearNodo('binaria', { op: '+', izq: asignado, der: asgn }) })
            case "-=":
                return crearNodo('asignacion', { id: asignado.id, asgn: crearNodo('binaria', { op: '-', izq: asignado, der: asgn }) })
            case "=":
                return crearNodo('asignacion', { id: asignado.id, asgn })
            }
      }

      if (!(asignado instanceof nodos.Get)) {
          throw new Error('Solo se pueden asignar valores a propiedades de objetos')
      }

      return crearNodo('set', { objetivo: asignado.objetivo, propiedad: asignado.propiedad, valor: asgn })
    }
        / Or

Or = izq:And expansion:( 
    _ "||" _ der:And { return { tipo: "||", der }  } )* { 
  return expansion.reduce(
    (operacionAnterior, operacionActual) => {
    const { tipo, der } = operacionActual
      return crearNodo('binaria', { op: tipo, izq: operacionAnterior, der })
    },
    izq
  )
}

And = izq:Igualdad expansion:( 
    _ "&&" _ der:Igualdad { return { tipo: "&&", der }  } )* { 
  return expansion.reduce(
    (operacionAnterior, operacionActual) => {
    const { tipo, der } = operacionActual
      return crearNodo('binaria', { op: tipo, izq: operacionAnterior, der })
    },
    izq
  )
}

Igualdad = izq:Comparacion expansion:(
  _ op:("==" / "!=") _ der:Comparacion { return { tipo: op, der } }
)* { 
  return expansion.reduce(
    (operacionAnterior, operacionActual) => {
      const { tipo, der } = operacionActual
      return crearNodo('binaria', { op:tipo, izq: operacionAnterior, der })
    },
    izq
  )
}

Comparacion = izq:Suma expansion:(
  _ op:("<=" / "<" / ">=" / ">") _ der:Suma { return { tipo: op, der } }
)* { 
  return expansion.reduce(
    (operacionAnterior, operacionActual) => {
      const { tipo, der } = operacionActual
      return crearNodo('binaria', { op:tipo, izq: operacionAnterior, der })
    },
    izq
  )
}

Suma = izq:Multiplicacion expansion:(
  _ op:("+" / "-") _ der:Multiplicacion { return { tipo: op, der } }
)* { 
  return expansion.reduce(
    (operacionAnterior, operacionActual) => {
      const { tipo, der } = operacionActual
      return crearNodo('binaria', { op:tipo, izq: operacionAnterior, der })
    },
    izq
  )
}

Multiplicacion = izq:Unaria expansion:(
  _ op:("*" / "/" / "%") _ der:Unaria { return { tipo: op, der } }
)* {
    return expansion.reduce(
      (operacionAnterior, operacionActual) => {
        const { tipo, der } = operacionActual
        return crearNodo('binaria', { op:tipo, izq: operacionAnterior, der })
      },
      izq
    )
}

Unaria = op:("-" / "!") _ num:Unaria { return crearNodo('unaria', { op, exp: num }) }
/ TypeOF

TypeOF = callee:"typeof" _ args:Expresion _ { return crearNodo('llamada', { callee: crearNodo('referenciaVariable', { id: callee }), args: [args]}) } 
        / Llamada


Llamada = objetivoInicial:Nativo operaciones:(
  ("(" args:Argumentos? _ ")" { return {args, tipo: 'funcCall'}})
  / (".indexOf("_ id: Expresion _ ")"{ return {id, tipo: 'funcArray'}} )
  / (".length"_{ return {id: "length", tipo: 'funcArray'}} )
  / (".join()"{ return {id: "join", tipo: 'funcArray'}} )
  / ("." id:Identificador _ { return { id, tipo: 'get' } })
  / ("[" _ id:Expresion _ "]" { return { id, tipo: 'get' } })
  )* {
    const op =  operaciones.reduce(
    (objetivo, args) => {
      const { tipo, id, args: argumentos } = args

      if(tipo === 'funcCall') {
        return crearNodo('llamada', { callee: objetivo, args: argumentos || [] })
      }else if(tipo === 'get') {
        return crearNodo('get', { objetivo, propiedad: id})
      }else{
        return crearNodo('funcArray', { objetivo, id })
      }
    },
    objetivoInicial
  )

  return op
}

Argumentos = arg:Expresion _ args:("," _ exp:Expresion _ { return exp})* { return [arg, ...args] }


Nativo = "Object.keys(" _ objetivo:Llamada _ ")" { return crearNodo('keys', { objetivo }) }
        / id:Identificador _ "{" _ params:Propiedades _ "}" { return crearNodo('instancia', {id, params}) }
        / id:Identificador     { return crearNodo('referenciaVariable', { id }) }
        / exp:Decimal           { return exp }
        / exp:Entero          { return exp }
        / exp:Cadena            { return exp }
        / exp:Caracter          { return exp }
        / exp:Bool              { return exp }
        / "(" _ exp:Expresion _ ")" { return crearNodo('agrupacion', { exp }) }
        / "{" _ args:Argumentos _ "}" { return crearNodo('arreglo', { args }) }

Propiedades = id:Identificador _ ":" _ exp:Expresion _ args:("," _ ids:Identificador _ ":" _ exps:Expresion _ { return { id: ids, exp: exps } })* { return [ {id, exp} , ...args] }

Entero = [0-9]+ { return crearNodo("nativo", {tipo: "int", valor: parseInt(text(), 10)}) }

Decimal = [0-9]+ "." [0-9]+ { return crearNodo("nativo", {tipo: "float", valor: parseFloat(text(), 10)}) }

Cadena = "\"" texto:([^\"])* "\"" { return crearNodo("nativo", {tipo: "string", valor: texto.join('')}) }

Caracter = "'" ("\\" escape:[nrtvbf\\\'\"] / !"'" .)? "'" { return crearNodo("nativo", {tipo: "char", valor: text().replace(/['"]/g, '')}) }

Bool = "true" { return crearNodo("nativo", {tipo: "boolean", valor: true}) }
    / "false" { return crearNodo("nativo", {tipo: "boolean", valor: false}) }

Identificador = !reserved _ [a-zA-Z_] [a-zA-Z0-9_]* {  return text() }

reserved = "int " / "float" / "char" / "string" / "boolean" / "var" / "void" / "true" / "false" / "System" 
         / "if" / "else" / "while" / "for" / "switch" / "case" / "default" / "break" / "continue" / "return"
         / "System.out.println" / "struct" / "new" / "typeof" / "Object.keys" / "join" / "indexOf" / "length"

_ = ([ \t\n\r] / Comentarios)* 


Comentarios = "//" (![\n] .)*
            / "/*" (!("*/") .)* "*/"