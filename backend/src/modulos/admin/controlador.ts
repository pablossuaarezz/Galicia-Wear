import { Request, Response, NextFunction } from 'express';
import {
  obtenerEstadisticas,
  listarLogs,
  listarPedidosAdmin,
  listarDisenadoresAdmin,
  listarProductosAdmin,
  moderarProducto,
  retirarProducto,
} from './repositorio';
import { exportarProductos } from './exportacion';
import { importarProductos } from './importacion';
import {
  dtoFiltrosLogs,
  dtoFiltrosPedidosAdmin,
  dtoFiltrosDisenadoresAdmin,
  dtoFiltrosProductosAdmin,
  dtoModerarProducto,
} from './dto';
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

  // ---- Visor de logs de auditoría (MongoDB) ----
  async logs(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const filtros = dtoFiltrosLogs.parse(peticion.query);
      const { datos, total } = await listarLogs(filtros);
      respuesta.status(200).json({ logs: datos, total, pagina: filtros.pagina, limite: filtros.limite });
    } catch (error) {
      siguiente(error);
    }
  },

  // ---- Listado global de pedidos ----
  async pedidos(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const filtros = dtoFiltrosPedidosAdmin.parse(peticion.query);
      const { datos, total } = await listarPedidosAdmin(filtros);
      respuesta.status(200).json({ pedidos: datos, total, pagina: filtros.pagina, limite: filtros.limite });
    } catch (error) {
      siguiente(error);
    }
  },

  // ---- Listado de diseñadores (incluye pendientes) ----
  async disenadores(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const filtros = dtoFiltrosDisenadoresAdmin.parse(peticion.query);
      const { datos, total } = await listarDisenadoresAdmin(filtros);
      respuesta.status(200).json({ disenadores: datos, total, pagina: filtros.pagina, limite: filtros.limite });
    } catch (error) {
      siguiente(error);
    }
  },

  // ---- Listado de productos (incluye inactivos/retirados) ----
  async productos(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const filtros = dtoFiltrosProductosAdmin.parse(peticion.query);
      const { datos, total } = await listarProductosAdmin(filtros);
      respuesta.status(200).json({ productos: datos, total, pagina: filtros.pagina, limite: filtros.limite });
    } catch (error) {
      siguiente(error);
    }
  },

  // ---- Moderar un producto (activar/desactivar, editar datos) ----
  async moderarProducto(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const datos = dtoModerarProducto.parse(peticion.body);
      const producto = await moderarProducto(peticion.params.id, datos);
      respuesta.status(200).json({ producto });
    } catch (error) {
      siguiente(error);
    }
  },

  // ---- Retirar un producto (soft-delete) ----
  async retirarProducto(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      await retirarProducto(peticion.params.id);
      respuesta.status(204).send();
    } catch (error) {
      siguiente(error);
    }
  },
};
