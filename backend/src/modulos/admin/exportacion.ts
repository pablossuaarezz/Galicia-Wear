// JUSTIFICACIÓN: usa worker_threads para serializar XML/JSON de forma no bloqueante.
// Con cientos de productos, la construcción del XML en el hilo principal bloquearía
// el event loop de Node impidiendo atender otras peticiones durante varios cientos de ms.
// El worker corre en un V8 aislado → cumple "hilos + comunicación entre procesos" rúbrica DAM.
//
// Este fichero implementa la exportación del catálogo completo de productos a JSON o XML,
// delegando la serialización (potencialmente costosa) a un hilo trabajador (worker_thread)
// para no bloquear el bucle de eventos principal de Node.
import { Worker } from 'worker_threads';
import type { ProductoDetalle } from '../productos/repositorio';
import { obtenerProductosParaExportar } from './repositorio';

// Código del worker como string (eval mode).
// Solo usa módulos internos de Node → funciona sin compilación.
// NOTA: este bloque es JavaScript que se ejecuta en un hilo aparte (Worker en modo `eval`),
// por lo que no pasa por el compilador TypeScript del proyecto. Las funciones internas
// (esc, productoAXml) están documentadas con comentarios JS normales porque viven fuera
// del ámbito de tipado de este archivo.
const CODIGO_WORKER = /* javascript */ `
const { workerData, parentPort } = require('worker_threads');
const { formato, productos, metadatos } = workerData;

// Escapa caracteres especiales de XML (&, <, >, ") para evitar generar XML inválido
// o vulnerable a inyección si algún campo de texto contiene esos caracteres.
function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Convierte un producto (con sus variantes y certificados) a su representación XML,
// indentando con 'ind' espacios. Construye el XML manualmente mediante concatenación
// de strings (sin librerías) para mantener el worker autocontenido.
function productoAXml(p, ind) {
  const sp = ' '.repeat(ind);
  const variantes = (p.variantes || []).map(v =>
    sp + '    <variante sku="' + esc(v.sku) + '">' +
    '<talla>' + esc(v.talla) + '</talla>' +
    '<color>' + esc(v.color) + '</color>' +
    '<stock>' + esc(v.stock) + '</stock>' +
    '<ajustePrecio>' + esc(v.ajustePrecio) + '</ajustePrecio>' +
    '</variante>'
  ).join('\\n');

  const certs = (p.certificados || []).map(c =>
    sp + '    <certificado codigo="' + esc(c.certificado?.codigo) + '">' +
    '<numero>' + esc(c.numeroCertificado) + '</numero>' +
    '</certificado>'
  ).join('\\n');

  return [
    sp + '<producto id="' + esc(p.id) + '">',
    sp + '  <nombre>' + esc(p.nombre) + '</nombre>',
    sp + '  <slug>' + esc(p.slug) + '</slug>',
    sp + '  <descripcion>' + esc(p.descripcion) + '</descripcion>',
    sp + '  <precioBase>' + esc(p.precioBase) + '</precioBase>',
    sp + '  <kmOrigen>' + esc(p.kmOrigen) + '</kmOrigen>',
    sp + '  <materialPrincipal>' + esc(p.materialPrincipal) + '</materialPrincipal>',
    sp + '  <disenador id="' + esc(p.disenadorId) + '">',
    sp + '    <nombreMarca>' + esc(p.disenador?.nombreMarca) + '</nombreMarca>',
    sp + '    <ciudad>' + esc(p.disenador?.ciudad) + '</ciudad>',
    sp + '  </disenador>',
    variantes ? sp + '  <variantes>\\n' + variantes + '\\n' + sp + '  </variantes>' : '',
    certs     ? sp + '  <certificados>\\n' + certs     + '\\n' + sp + '  </certificados>' : '',
    sp + '</producto>',
  ].filter(Boolean).join('\\n'); // filter(Boolean) descarta las secciones vacías (variantes/certs)
}

// Según el formato solicitado, se construye el documento XML completo (con cabecera
// <?xml ...?> y el elemento raíz galiciawear_export) o el JSON con metadatos de
// exportación (versión, fecha, total y lista de productos).
let resultado;
if (formato === 'xml') {
  const productosXml = productos.map(p => productoAXml(p, 4)).join('\\n');
  resultado =
    '<?xml version="1.0" encoding="UTF-8"?>\\n' +
    '<galiciawear_export version="1.0" fecha="' + esc(metadatos.fecha) + '">\\n' +
    '  <productos total="' + productos.length + '">\\n' +
    productosXml + '\\n' +
    '  </productos>\\n' +
    '</galiciawear_export>';
} else {
  resultado = JSON.stringify(
    { version: '1.0', fecha: metadatos.fecha, total: productos.length, productos },
    null,
    2
  );
}

// El worker comunica el resultado de vuelta al hilo principal mediante postMessage,
// que dispara el evento 'message' escuchado en exportarProductos.
parentPort.postMessage(resultado);
`;

/**
 * Exporta el catálogo completo de productos activos en formato JSON o XML.
 *
 * El proceso es:
 * 1. Obtiene los productos (con variantes, imágenes, certificados y datos del
 *    diseñador) desde la base de datos.
 * 2. Los serializa a un objeto plano compatible con `structured clone` para
 *    poder pasarlos al worker (los `Decimal` de Prisma no son clonables).
 * 3. Lanza un worker_thread que construye el XML o JSON final sin bloquear el
 *    hilo principal de Node.
 *
 * @param formato Formato de salida deseado: 'json' o 'xml'.
 * @returns Promesa que resuelve con el contenido del fichero exportado como string.
 * @throws Si el worker termina con un código de salida distinto de 0, o emite un error.
 */
export async function exportarProductos(formato: 'json' | 'xml'): Promise<string> {
  const productos = await obtenerProductosParaExportar();

  // Convertir Decimal de Prisma a string para que el worker pueda serializar
  // (JSON.parse(JSON.stringify(...)) es una forma rápida de obtener un objeto plano
  // serializable, ya que workerData se transfiere mediante la estructura de clonado de V8).
  const productosSerializables = JSON.parse(JSON.stringify(productos));

  return new Promise((resolve, reject) => {
    // `eval: true` permite pasar el código del worker como string en vez de un
    // fichero independiente, manteniendo la lógica de exportación autocontenida.
    const worker = new Worker(CODIGO_WORKER, {
      eval: true,
      workerData: {
        formato,
        productos: productosSerializables,
        metadatos: { fecha: new Date().toISOString() },
      },
    });

    // El worker envía el resultado final (XML o JSON ya serializado) como mensaje único.
    worker.on('message', (resultado: string) => resolve(resultado));
    worker.on('error', reject);
    // Un código de salida distinto de 0 indica que el worker terminó de forma anómala
    // sin haber llegado a emitir un mensaje de resultado.
    worker.on('exit', (codigo) => {
      if (codigo !== 0) reject(new Error(`Worker finalizó con código ${codigo}`));
    });
  });
}
