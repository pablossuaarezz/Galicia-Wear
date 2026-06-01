import { Request, Response, NextFunction } from 'express';
import { obtenerEstadisticas } from './repositorio';
import { exportarProductos } from './exportacion';
import { importarProductos } from './importacion';
import { ErrorValidacion } from '../../utilidades/errores';

export const controladorAdmin = {
  async estadisticas(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const datos = await obtenerEstadisticas();
      respuesta.status(200).json({ estadisticas: datos });
    } catch (error) {
      siguiente(error);
    }
  },

  async exportarJson(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const json = await exportarProductos('json');
      respuesta
        .status(200)
        .setHeader('Content-Type', 'application/json; charset=utf-8')
        .setHeader('Content-Disposition', `attachment; filename="galiciawear_productos_${Date.now()}.json"`)
        .send(json);
    } catch (error) {
      siguiente(error);
    }
  },

  async exportarXml(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const xml = await exportarProductos('xml');
      respuesta
        .status(200)
        .setHeader('Content-Type', 'application/xml; charset=utf-8')
        .setHeader('Content-Disposition', `attachment; filename="galiciawear_productos_${Date.now()}.xml"`)
        .send(xml);
    } catch (error) {
      siguiente(error);
    }
  },

  // Body: { formato: 'json'|'xml', datos: '<contenido como string>' }
  // Usar un wrapper JSON permite que express.json() parsee el envelope y el
  // contenido (JSON o XML) viaja como string sin interferir con el body parser global.
  async importar(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const { formato, datos } = peticion.body as { formato?: string; datos?: string };

      if (!formato || !['json', 'xml'].includes(formato)) {
        throw new ErrorValidacion('El campo "formato" debe ser "json" o "xml"');
      }
      if (!datos || typeof datos !== 'string') {
        throw new ErrorValidacion('El campo "datos" es obligatorio y debe ser una cadena de texto');
      }

      const resultado = await importarProductos(datos, formato as 'json' | 'xml');
      respuesta.status(200).json({ resultado });
    } catch (error) {
      siguiente(error);
    }
  },
};
