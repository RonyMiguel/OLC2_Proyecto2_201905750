import * as monaco from 'https://cdn.jsdelivr.net/npm/monaco-editor@0.50.0/+esm'

import { parse } from './analizador.js'
import { CompilerVisitor } from './compilador.js';

const btn = document.getElementById('btn-ejecutar')

const editor = monaco.editor.create(
    document.getElementById('editor'), {
    value: '',
    language: 'java',
    theme: 'vs-dark',
    fontSize: 14
},
);

const content = localStorage.getItem('content')
editor.setValue(content || "")

// save content in local storage
editor.onDidChangeModelContent(() => {
    localStorage.setItem('content', editor.getValue())
})

let consola = monaco.editor.create(
    document.getElementById('console'), {
    value: '',
    theme: 'vs-dark',
    readOnly: true,
    fontSize: 14
},
);

// Objeto para almacenar el contenido de cada archivo
let archivos = {};
let currentTab = null; // No hay pestaña activa inicialmente
let tabCounter = 0; // Contador de pestañas
let errores = []
let tablaSimbolos = []

// Seleccionar elementos del DOM
const tabsContainer = document.getElementById('tabs');
const fileInput = document.getElementById('file-input');

// Cambiar entre pestañas
tabsContainer.addEventListener('click', function(event) {
  const clickedTab = event.target.closest('.tab');
  if (clickedTab && !event.target.classList.contains('close-tab')) {
    const tabId = clickedTab.getAttribute('data-tab');
    
    // Cambiar la pestaña activa
    currentTab = tabId;
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    clickedTab.classList.add('active');
    
    // Mostrar el contenido de la pestaña seleccionada
    editor.setValue(archivos[currentTab]);;
  }
});

// Abrir archivo desde el botón "Archivo"
document.getElementById('btn-archivo').addEventListener('click', () => {
  fileInput.click(); // Simular click en el input de archivo
});

// Leer el archivo seleccionado y crear/actualizar una pestaña
fileInput.addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const fileName = file.name;
      const newTabId = tabCounter++;
      
      // Crear una nueva pestaña con el nombre del archivo
      const newTab = document.createElement('div');
      newTab.classList.add('tab');
      newTab.classList.add('active');
      newTab.setAttribute('data-tab', newTabId);
      newTab.innerHTML = `${fileName} <span class="close-tab">x</span>`;
      
      // Desactivar todas las otras pestañas
      document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
      
      // Agregar la nueva pestaña al contenedor
      tabsContainer.appendChild(newTab);
      
      // Guardar el contenido del archivo
      archivos[newTabId] = e.target.result;
      currentTab = newTabId;
      editor.setValue(archivos[currentTab]);
    };
    reader.readAsText(file);
  }
});

// Cerrar pestañas
tabsContainer.addEventListener('click', function(event) {
  if (event.target.classList.contains('close-tab')) {
    const tabToClose = event.target.closest('.tab');
    const tabId = tabToClose.getAttribute('data-tab');

    // Eliminar la pestaña y su contenido
    delete archivos[tabId];
    tabToClose.remove();

    // Si la pestaña cerrada era la activa, seleccionar otra o limpiar el área de código
    if (currentTab == tabId) {
      const remainingTabs = document.querySelectorAll('.tab');
      if (remainingTabs.length > 0) {
        const firstTab = remainingTabs[0];
        firstTab.classList.add('active');
        currentTab = firstTab.getAttribute('data-tab');
        editor.setValue(archivos[currentTab]);
      } else {
        currentTab = null;
        editor.setValue('');
      }
    }
  }
});

btn.addEventListener('click', () => {
    const codigoFuente = editor.getValue()
    try {
        const sentencias = parse(codigoFuente)
        console.log(sentencias);
        const interprete = new CompilerVisitor()

        sentencias.forEach(sentencia => {
            try {
                sentencia.accept(interprete);
            } catch (error) {
                /*
                if (error instanceof ReturnException) {
                    interprete.errores.push({desc: "No se esperaba un return", linea: error.linea, columna: error.columna, tipo: "Semántico"})
                }else if (error instanceof BreakException) {
                    interprete.errores.push({desc: "No se esperaba un break", linea: error.linea, columna: error.columna, tipo: "Semántico"})
                }else if (error instanceof ContinueException) {
                    interprete.errores.push({desc: "No se esperaba un continue", linea: error.linea, columna: error.columna, tipo: "Semántico"})
                }
                    */
                console.log(error);
            }
        });
        consola.setValue(interprete.code.toString())
        /*
        errores = interprete.errores
        
        function sonIguales(obj1, obj2) {
            return JSON.stringify(obj1) === JSON.stringify(obj2);
        }
        
        // Función para filtrar objetos únicos
        function obtenerObjetosUnicos(arr) {
            return arr.filter((obj, index, self) =>
                index === self.findIndex((o) => sonIguales(o, obj))
            );
        }

        const unicos = obtenerObjetosUnicos(interprete.tablaSimbolos);
        tablaSimbolos = unicos;
        */
    } catch (error) {
        console.log(error);
        consola.setValue(error.message + ' at line ' + error.location.start.line + ' column ' + error.location.start.column)
        //console.log(error);
        //consola.setValue(error.message);
    }
    
})

function mostrarTablaErrores() {
    const nuevaVentanaErrores = window.open("", "_blank");

    const tablaErrores = `
        <html>
        <head>
            <title>Tabla de Errores</title>
            <style>
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                table, th, td {
                    border: 1px solid black;
                }
                th, td {
                    padding: 8px;
                    text-align: left;
                }
                th {
                    background-color: #f2f2f2;
                }
                .columna-indice {
                    width: 50px;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <h2>Lista de Errores</h2>
            <table>
                <thead>
                    <tr>
                        <th class="columna-indice">#</th>
                        <th>Descripción</th>
                        <th>Línea</th>
                        <th>Columna</th>
                        <th>Tipo</th>
                    </tr>
                </thead>
                <tbody>
                    ${errores.length > 0 ? 
                        errores.map((error, index) => `
                            <tr>
                                <td class="columna-indice">${index + 1}</td>
                                <td>${error.desc}</td>
                                <td>${error.linea}</td>
                                <td>${error.columna}</td>
                                <td>${error.tipo}</td>
                            </tr>
                        `).join('') 
                        : 
                        '<tr><td colspan="5">No hay errores.</td></tr>'}
                </tbody>
            </table>
        </body>
        </html>
    `;

    nuevaVentanaErrores.document.write(tablaErrores);
    nuevaVentanaErrores.document.close();
}

// Función para mostrar la tabla de símbolos en una nueva pestaña
function mostrarTablaSimbolos() {
    const nuevaVentanaSimbolos = window.open("", "_blank");

    const tablaSimbolosHTML = `
        <html>
        <head>
            <title>Tabla de Símbolos</title>
            <style>
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                table, th, td {
                    border: 1px solid black;
                }
                th, td {
                    padding: 8px;
                    text-align: left;
                }
                th {
                    background-color: #f2f2f2;
                }
                .columna-indice {
                    width: 50px;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <h2>Tabla de Símbolos</h2>
            <table>
                <thead>
                    <tr>
                        <th class="columna-indice">#</th>
                        <th>ID</th>
                        <th>Tipo de Símbolo</th>
                        <th>Tipo</th>
                        <th>Ámbito</th>
                        <th>Línea</th>
                        <th>Columna</th>
                    </tr>
                </thead>
                <tbody>
                    ${tablaSimbolos.length > 0 ? 
                        tablaSimbolos.map((simbolo, index) => `
                            <tr>
                                <td class="columna-indice">${index + 1}</td>
                                <td>${simbolo.id}</td>
                                <td>${simbolo.tipoSimbolo}</td>
                                <td>${simbolo.tipo}</td>
                                <td>${simbolo.ambito}</td>
                                <td>${simbolo.linea}</td>
                                <td>${simbolo.columna}</td>
                            </tr>
                        `).join('') 
                        : 
                        '<tr><td colspan="7">No hay símbolos.</td></tr>'}
                </tbody>
            </table>
        </body>
        </html>
    `;

    nuevaVentanaSimbolos.document.write(tablaSimbolosHTML);
    nuevaVentanaSimbolos.document.close();
}

// Asignar el evento de clic al botón para abrir ambas pestañas
document.getElementById('btn-reportes').addEventListener('click', () => {
    mostrarTablaErrores();   // Abre la pestaña con la tabla de errores
});

document.getElementById('btn-simbolos').addEventListener('click', () => {
mostrarTablaSimbolos();  // Abre la pestaña con la tabla de símbolos después de 500 ms
});