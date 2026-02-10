/**
 * Parsea el texto generado por IA o pegado manualmente para extraer estructuras de clases.
 * Soporta formatos con "Día X", "Clase X", "Sesión X" y secciones como Inicio, Desarrollo, Cierre.
 * 
 * @param {string} textoCompleto 
 * @returns {Array} Array de objetos clase
 */
export const parsearTextoDeClase = (textoCompleto) => {
    if (!textoCompleto) return [];

    const clases = [];
    const lineas = textoCompleto.split('\n');
    let claseActual = null;
    let campoActual = null;

    const camposOrdenados = ['objetivo', 'inicio', 'desarrollo', 'aplicacion', 'cierre'];
    const titulosRegex = /^(día \d+|clase \d+|sesión \d+|objetivo|inicio|desarrollo|aplicacion|cierre):?\s*/i;

    for (const linea of lineas) {
        const match = linea.match(titulosRegex);

        if (match) {
            const titulo = match[0].toLowerCase().replace(':', '').trim().split(' ')[0];
            const contenidoLinea = linea.substring(match[0].length).trim();

            // Detectar inicio de nueva clase
            if (titulo.startsWith('día') || titulo.startsWith('clase') || titulo.startsWith('sesión') || (titulo === 'objetivo' && claseActual !== null)) {
                if (claseActual) {
                    clases.push(claseActual);
                }
                claseActual = { objetivo: '', inicio: '', desarrollo: '', aplicacion: '', cierre: '' };
            }

            // Inicializar si es la primera línea y no hay header explícito pero empieza con un campo conocido
            if (!claseActual) {
                claseActual = { objetivo: '', inicio: '', desarrollo: '', aplicacion: '', cierre: '' };
            }

            if (camposOrdenados.includes(titulo)) {
                campoActual = titulo;
                if (claseActual[campoActual]) {
                    claseActual[campoActual] += '\n' + contenidoLinea;
                } else {
                    claseActual[campoActual] = contenidoLinea;
                }
            }
        } else if (claseActual && campoActual && linea.trim() !== '') {
            // Continuación de contenido multilínea
            claseActual[campoActual] += (claseActual[campoActual] ? '\n' : '') + linea.trim();
        }
    }

    // Push de la última clase procesada
    if (claseActual && Object.values(claseActual).some(v => v)) {
        clases.push(claseActual);
    }

    return clases;
};
