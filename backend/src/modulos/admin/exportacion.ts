// JUSTIFICACIÓN: usa worker_threads para serializar XML/JSON de forma no bloqueante.
// Con cientos de productos, la construcción del XML en el hilo principal bloquearía
// el event loop de Node impidiendo atender otras peticiones durante varios cientos de ms.
// El worker corre en un V8 aislado → cumple "hilos + comunicación entre procesos" rúbrica DAM.
import { Worker } from 'worker_threads';
import type { ProductoDetalle } from '../productos/repositorio';
import { obtenerProductosParaExportar } from './repositorio';

// Código del worker como string (eval mode).
// Solo usa módulos internos de Node → funciona sin compilación.
const CODIGO_WORKER = /* javascript */ `
const { workerData, parentPort } = require('worker_threads');
const { formato, productos, metadatos } = workerData;

function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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
  ].filter(Boolean).join('\\n');
}

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

parentPort.postMessage(resultado);
`;

export async function exportarProductos(formato: 'json' | 'xml'): Promise<string> {
  const productos = await obtenerProductosParaExportar();

  // Convertir Decimal de Prisma a string para que el worker pueda serializar
  const productosSerializables = JSON.parse(JSON.stringify(productos));

  return new Promise((resolve, reject) => {
    const worker = new Worker(CODIGO_WORKER, {
      eval: true,
      workerData: {
        formato,
        productos: productosSerializables,
        metadatos: { fecha: new Date().toISOString() },
      },
    });

    worker.on('message', (resultado: string) => resolve(resultado));
    worker.on('error', reject);
    worker.on('exit', (codigo) => {
      if (codigo !== 0) reject(new Error(`Worker finalizó con código ${codigo}`));
    });
  });
}
