// Capa Controller del módulo de administración. Cada función traduce una petición HTTP
// en una llamada al repositorio (o a las utilidades de exportación/importación) y devuelve
// la respuesta en formato JSON (o, en exportación, en JSON/XML como descarga de fichero).
// No contiene lógica de negocio: la validación de entrada se delega en los DTO (zod) y las
// reglas de negocio viven en repositorio.ts/exportacion.ts/importacion.ts.
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
  /**
   * GET /admin/estadisticas
   * Devuelve los KPIs del panel de administración (usuarios, productos, pedidos del
   * mes, ingresos, etc.). La agregación se realiza en el repositorio con Prisma.
   * @param peticion Petición Express (no requiere parámetros adicionales).
   * @param respuesta Responde 200 con `{ estadisticas: EstadisticasAdmin }`.
   * @param siguiente Middleware de manejo de errores de Express.
   */
  async estadisticas(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const datos = await obtenerEstadisticas();
      respuesta.status(200).json({ estadisticas: datos });
    } catch (error) {
      siguiente(error);
    }
  },

  /**
   * GET /admin/exportar/productos.json
   * Genera una exportación completa del catálogo de productos en formato JSON
   * (el trabajo pesado se delega a un worker_thread, ver exportacion.ts) y la
   * envía como fichero descargable.
   * @param respuesta Responde 200 con el JSON como adjunto (Content-Disposition).
   */
  async exportarJson(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const json = await exportarProductos('json');
      respuesta
        .status(200)
        // Cabeceras que indican al navegador/cliente que debe descargar el fichero
        // en lugar de mostrarlo, con un nombre que incluye un timestamp único.
        .setHeader('Content-Type', 'application/json; charset=utf-8')
        .setHeader('Content-Disposition', `attachment; filename="galiciawear_productos_${Date.now()}.json"`)
        .send(json);
    } catch (error) {
      siguiente(error);
    }
  },

  /**
   * GET /admin/exportar/productos.xml
   * Igual que exportarJson pero generando el catálogo en formato XML.
   * @param respuesta Responde 200 con el XML como adjunto (Content-Disposition).
   */
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
  /**
   * POST /admin/importar/productos
   * Importa un catálogo de productos desde un JSON o XML enviado como string dentro
   * de un envoltorio JSON `{ formato, datos }`. Valida manualmente el envoltorio
   * (no usa el middleware `validar` con zod porque el contenido es texto libre)
   * y delega el parseo/persistencia en `importarProductos`.
   * @throws ErrorValidacion si falta el formato o no es "json"/"xml", o si falta `datos`.
   * @param respuesta Responde 200 con `{ resultado: ResultadoImportacion }`.
   */
  async importar(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const { formato, datos } = peticion.body as { formato?: string; datos?: string };

      // Validación manual del envoltorio: el campo "formato" debe ser uno de los soportados.
      if (!formato || !['json', 'xml'].includes(formato)) {
        throw new ErrorValidacion('El campo "formato" debe ser "json" o "xml"');
      }
      // El contenido a importar debe llegar como cadena de texto (JSON o XML serializado).
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
  /**
   * GET /admin/logs
   * Lista paginada de logs de auditoría almacenados en MongoDB, con filtros
   * opcionales por acción, usuario y recurso (validados mediante `dtoFiltrosLogs`).
   * @param respuesta Responde 200 con `{ logs, total, pagina, limite }`.
   */
  async logs(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      // dtoFiltrosLogs.parse lanza ZodError (capturado por el manejador global) si los
      // query params no cumplen el esquema; también aplica valores por defecto de paginación.
      const filtros = dtoFiltrosLogs.parse(peticion.query);
      const { datos, total } = await listarLogs(filtros);
      respuesta.status(200).json({ logs: datos, total, pagina: filtros.pagina, limite: filtros.limite });
    } catch (error) {
      siguiente(error);
    }
  },

  // ---- Listado global de pedidos ----
  /**
   * GET /admin/pedidos
   * Lista paginada de todos los pedidos de la plataforma, con filtro opcional por
   * estado. Permite al administrador supervisar el flujo de pedidos sin restricción
   * de propiedad (a diferencia del endpoint de pedidos de un diseñador/cliente).
   * @param respuesta Responde 200 con `{ pedidos, total, pagina, limite }`.
   */
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
  /**
   * GET /admin/disenadores
   * Lista paginada de diseñadores, incluyendo aquellos pendientes de validación
   * (ocultos en los listados públicos), con filtros opcionales por ciudad y
   * estado de validación.
   * @param respuesta Responde 200 con `{ disenadores, total, pagina, limite }`.
   */
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
  /**
   * GET /admin/productos
   * Lista paginada del catálogo completo, incluyendo productos inactivos o
   * retirados (no visibles para clientes), con filtros de búsqueda, material
   * y estado de actividad.
   * @param respuesta Responde 200 con `{ productos, total, pagina, limite }`.
   */
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
  /**
   * PATCH /admin/productos/:id
   * Permite al administrador modificar cualquier producto (activar/desactivar,
   * editar datos) sin necesidad de ser su propietario, reutilizando el mismo
   * contrato de actualización que usa el diseñador (`dtoModerarProducto`).
   * @param peticion.params.id Identificador del producto a moderar.
   * @throws ErrorNoEncontrado si el producto no existe (gestionado en el repositorio).
   * @param respuesta Responde 200 con `{ producto }` actualizado.
   */
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
  /**
   * DELETE /admin/productos/:id
   * Retira un producto del catálogo mediante soft-delete (marca `activo=false`,
   * no elimina el registro físicamente, preservando el historial de pedidos).
   * @param peticion.params.id Identificador del producto a retirar.
   * @throws ErrorNoEncontrado si el producto no existe.
   * @param respuesta Responde 204 sin contenido.
   */
  async retirarProducto(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      await retirarProducto(peticion.params.id);
      respuesta.status(204).send();
    } catch (error) {
      siguiente(error);
    }
  },
};
