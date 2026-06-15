// JUSTIFICACIÓN: import de catálogo desde JSON o XML (requerido explícitamente en rúbrica DAM).
// Recibe los datos ya parseados y crea/actualiza productos en PostgreSQL.
//
// Este fichero implementa la importación masiva de productos: parsea el contenido recibido
// (JSON o XML), valida cada elemento de forma individual y realiza un "upsert" manual
// (actualizar si existe por slug, crear si no) contra la base de datos mediante Prisma.
// Los errores de elementos individuales no abortan la importación completa: se acumulan
// en `resultado.errores` para que el administrador pueda revisar qué filas fallaron.
import { XMLParser } from 'fast-xml-parser';
import crypto from 'node:crypto';
import { prisma } from '../../utilidades/prisma';
import { MaterialPrincipal } from '@prisma/client';

/** Resultado agregado de un proceso de importación de productos. */
export interface ResultadoImportacion {
  /** Número de productos creados como nuevos registros. */
  creados: number;
  /** Número de productos existentes (mismo slug) que se han actualizado. */
  actualizados: number;
  /** Lista de errores por elemento, con el índice dentro del array de entrada y el motivo. */
  errores: Array<{ indice: number; nombre?: string; motivo: string }>;
}

// ---- Tipos de entrada ----

/**
 * Forma esperada de un producto en el fichero de importación (JSON o XML).
 * Todos los campos son opcionales a nivel de tipo porque la validación real
 * (campos obligatorios) se realiza en tiempo de ejecución dentro de `importarProductos`.
 */
interface ProductoImportado {
  nombre?: string;
  slug?: string;
  descripcion?: string;
  precioBase?: number | string;
  kmOrigen?: number | string;
  materialPrincipal?: string;
  disenadorId?: string;
  activo?: boolean | string;
}

// ---- Parser XML → array de productos ----

/**
 * Convierte un documento XML de exportación de GaliciaWear en un array de productos.
 * Usa `fast-xml-parser` configurado para que el tag `<producto>` siempre se interprete
 * como array, incluso si el XML contiene un único producto.
 * @param xml Contenido XML completo (debe seguir la estructura `<galiciawear_export><productos><producto>...`).
 * @returns Array de productos importados (vacío si la estructura no contiene productos).
 */
function parsearXml(xml: string): ProductoImportado[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    isArray: (tag) => tag === 'producto',
  });
  const documento = parser.parse(xml) as {
    galiciawear_export?: { productos?: { producto?: ProductoImportado[] } };
  };
  return documento?.galiciawear_export?.productos?.producto ?? [];
}

// ---- Generador de slug ----

/**
 * Genera un slug único a partir del nombre del producto cuando el elemento importado
 * no incluye uno propio. Normaliza el texto (minúsculas, sin tildes/diacríticos,
 * solo letras/números/espacios convertidos a guiones) y añade un sufijo aleatorio
 * hexadecimal de 3 bytes para garantizar unicidad incluso con nombres repetidos.
 * @param nombre Nombre del producto.
 * @returns Slug en formato `nombre-normalizado-xxxxxx`.
 */
function generarSlug(nombre: string): string {
  const base = nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return `${base}-${crypto.randomBytes(3).toString('hex')}`;
}

// ---- Importador principal ----

/**
 * Importa un lote de productos desde un contenido JSON o XML.
 *
 * Flujo por cada producto del lote:
 * 1. Comprueba que estén presentes los campos obligatorios (nombre, descripción,
 *    precioBase, materialPrincipal, disenadorId); si falta alguno, se registra
 *    como error y se continúa con el siguiente.
 * 2. Comprueba que `materialPrincipal` sea un valor válido del enum de Prisma.
 * 3. Si el producto ya existe (mismo `slug`), se actualiza; si no, se crea
 *    (generando un slug nuevo si no se proporcionó uno).
 * 4. Cualquier error de Prisma durante la creación/actualización se captura y
 *    se añade a `resultado.errores` sin interrumpir el resto del lote.
 *
 * @param contenido Contenido del fichero a importar, como string.
 * @param formato Formato del contenido: 'json' o 'xml'.
 * @returns Resumen con el número de productos creados, actualizados y la lista de errores.
 * @throws Error si el contenido no se puede parsear según el formato indicado.
 */
export async function importarProductos(
  contenido: string,
  formato: 'json' | 'xml',
): Promise<ResultadoImportacion> {
  let productos: ProductoImportado[];

  try {
    if (formato === 'xml') {
      productos = parsearXml(contenido);
    } else {
      // El JSON puede venir como array de productos directamente o envuelto en
      // un objeto `{ productos: [...] }` (formato que genera la propia exportación).
      const json = JSON.parse(contenido) as { productos?: ProductoImportado[] } | ProductoImportado[];
      productos = Array.isArray(json) ? json : (json.productos ?? []);
    }
  } catch {
    // Si JSON.parse o el XMLParser lanzan excepción, el contenido no tiene una
    // sintaxis válida: se aborta toda la importación con un error claro.
    throw new Error(`Error al parsear el ${formato.toUpperCase()}: formato inválido`);
  }

  const resultado: ResultadoImportacion = { creados: 0, actualizados: 0, errores: [] };

  for (let i = 0; i < productos.length; i++) {
    const p = productos[i];

    // Validación mínima
    // Estos campos son obligatorios en el esquema de Prisma (o necesarios para crear
    // la relación con el diseñador); sin ellos no se puede crear/actualizar el producto.
    if (!p.nombre || !p.descripcion || !p.precioBase || !p.materialPrincipal || !p.disenadorId) {
      resultado.errores.push({
        indice: i,
        nombre: p.nombre,
        motivo: 'Campos obligatorios: nombre, descripcion, precioBase, materialPrincipal, disenadorId',
      });
      continue;
    }

    // Comprueba que el material indicado exista en el enum MaterialPrincipal de Prisma;
    // de lo contrario, Prisma rechazaría la operación con un error menos descriptivo.
    const materialValido = Object.values(MaterialPrincipal).includes(
      p.materialPrincipal as MaterialPrincipal,
    );
    if (!materialValido) {
      resultado.errores.push({ indice: i, nombre: p.nombre, motivo: `Material desconocido: ${p.materialPrincipal}` });
      continue;
    }

    try {
      // Si el elemento importado trae slug, comprobamos si ya existe un producto con
      // ese slug para decidir entre actualizar (upsert manual) o crear uno nuevo.
      const existe = p.slug
        ? await prisma.producto.findUnique({ where: { slug: p.slug } })
        : null;

      if (existe) {
        // Actualización: se sobrescriben los campos principales del producto existente.
        await prisma.producto.update({
          where: { slug: p.slug },
          data: {
            nombre: p.nombre,
            descripcion: p.descripcion,
            precioBase: Number(p.precioBase),
            kmOrigen: p.kmOrigen ? Number(p.kmOrigen) : 0,
            materialPrincipal: p.materialPrincipal as MaterialPrincipal,
          },
        });
        resultado.actualizados++;
      } else {
        // Creación: si no se proporcionó slug, se genera uno a partir del nombre.
        await prisma.producto.create({
          data: {
            disenadorId: String(p.disenadorId),
            nombre: p.nombre,
            slug: p.slug ?? generarSlug(p.nombre),
            descripcion: p.descripcion,
            precioBase: Number(p.precioBase),
            kmOrigen: p.kmOrigen ? Number(p.kmOrigen) : 0,
            materialPrincipal: p.materialPrincipal as MaterialPrincipal,
          },
        });
        resultado.creados++;
      }
    } catch (err) {
      // Errores de Prisma (p. ej. disenadorId inexistente, violación de constraint, etc.)
      // se registran por índice sin abortar el resto del lote.
      resultado.errores.push({
        indice: i,
        nombre: p.nombre,
        motivo: err instanceof Error ? err.message : 'Error desconocido',
      });
    }
  }

  return resultado;
}
