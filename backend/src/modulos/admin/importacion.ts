// JUSTIFICACIÓN: import de catálogo desde JSON o XML (requerido explícitamente en rúbrica DAM).
// Recibe los datos ya parseados y crea/actualiza productos en PostgreSQL.
import { XMLParser } from 'fast-xml-parser';
import crypto from 'node:crypto';
import { prisma } from '../../utilidades/prisma';
import { MaterialPrincipal } from '@prisma/client';

export interface ResultadoImportacion {
  creados: number;
  actualizados: number;
  errores: Array<{ indice: number; nombre?: string; motivo: string }>;
}

// ---- Tipos de entrada ----

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

export async function importarProductos(
  contenido: string,
  formato: 'json' | 'xml',
): Promise<ResultadoImportacion> {
  let productos: ProductoImportado[];

  try {
    if (formato === 'xml') {
      productos = parsearXml(contenido);
    } else {
      const json = JSON.parse(contenido) as { productos?: ProductoImportado[] } | ProductoImportado[];
      productos = Array.isArray(json) ? json : (json.productos ?? []);
    }
  } catch {
    throw new Error(`Error al parsear el ${formato.toUpperCase()}: formato inválido`);
  }

  const resultado: ResultadoImportacion = { creados: 0, actualizados: 0, errores: [] };

  for (let i = 0; i < productos.length; i++) {
    const p = productos[i];

    // Validación mínima
    if (!p.nombre || !p.descripcion || !p.precioBase || !p.materialPrincipal || !p.disenadorId) {
      resultado.errores.push({
        indice: i,
        nombre: p.nombre,
        motivo: 'Campos obligatorios: nombre, descripcion, precioBase, materialPrincipal, disenadorId',
      });
      continue;
    }

    const materialValido = Object.values(MaterialPrincipal).includes(
      p.materialPrincipal as MaterialPrincipal,
    );
    if (!materialValido) {
      resultado.errores.push({ indice: i, nombre: p.nombre, motivo: `Material desconocido: ${p.materialPrincipal}` });
      continue;
    }

    try {
      const existe = p.slug
        ? await prisma.producto.findUnique({ where: { slug: p.slug } })
        : null;

      if (existe) {
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
      resultado.errores.push({
        indice: i,
        nombre: p.nombre,
        motivo: err instanceof Error ? err.message : 'Error desconocido',
      });
    }
  }

  return resultado;
}
