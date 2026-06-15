// Endpoints de catálogo y gestión de prendas del diseñador. Las respuestas de recurso van
// envueltas: lista pública → { datos, total, pagina, limite }; detalle → { producto }.
import { solicitar } from '../clienteApi';
import type {
  EntradaActualizarProducto,
  EntradaProducto,
  FiltrosCatalogo,
  ProductoDetalle,
  ProductoResumen,
  RespuestaPaginada,
} from '../tipos';

/**
 * Funciones que encapsulan los endpoints REST de productos (prendas). Distingue entre
 * el catálogo público (consulta por slug, listado filtrado) y el catálogo privado del
 * diseñador (CRUD de sus propias prendas bajo /productos/mios).
 */
export const apiProductos = {
  /**
   * Lista paginada del catálogo público con filtros (categoría, certificados, precio, etc.).
   * Llama a GET /productos. Acepta una señal de aborto para cancelar peticiones obsoletas
   * (p. ej. al teclear rápido en el buscador).
   * @param filtros Criterios de filtrado y paginación del catálogo.
   * @param senal Señal opcional de AbortController para cancelar la petición.
   * @returns Página de productos en formato resumido más metadatos de paginación.
   */
  listar(filtros: FiltrosCatalogo = {}, senal?: AbortSignal): Promise<RespuestaPaginada<ProductoResumen>> {
    return solicitar<RespuestaPaginada<ProductoResumen>>('/productos', {
      params: { ...filtros },
      senal,
    });
  },

  /**
   * Obtiene el detalle público de un producto a partir de su slug (URL amigable).
   * Llama a GET /productos/:slug.
   * @param slug Identificador legible del producto en la URL.
   * @returns El detalle completo del producto.
   */
  async obtener(slug: string): Promise<ProductoDetalle> {
    const { producto } = await solicitar<{ producto: ProductoDetalle }>(`/productos/${slug}`);
    return producto;
  },

  // ---- Catálogo propio del diseñador ----

  /**
   * Lista las prendas del diseñador autenticado (incluye no publicadas).
   * Llama a GET /productos/mios.
   * @returns Lista de productos propios y total.
   */
  async listarMios(): Promise<{ datos: ProductoResumen[]; total: number }> {
    return solicitar<{ datos: ProductoResumen[]; total: number }>('/productos/mios');
  },

  /**
   * Obtiene el detalle de una prenda propia por su identificador (para edición).
   * Llama a GET /productos/mios/:id.
   * @param id Identificador del producto propio.
   * @returns El detalle completo del producto.
   */
  async obtenerMio(id: string): Promise<ProductoDetalle> {
    const { producto } = await solicitar<{ producto: ProductoDetalle }>(`/productos/mios/${id}`);
    return producto;
  },

  /**
   * Crea una nueva prenda en el catálogo del diseñador. Llama a POST /productos.
   * @param datos Datos de la prenda (nombre, descripción, precio, categoría, etc.).
   * @returns El producto creado.
   */
  async crear(datos: EntradaProducto): Promise<ProductoDetalle> {
    const { producto } = await solicitar<{ producto: ProductoDetalle }>('/productos', {
      metodo: 'POST',
      cuerpo: datos,
    });
    return producto;
  },

  /**
   * Actualiza una prenda existente del diseñador. Llama a PATCH /productos/:id.
   * @param id Identificador del producto a modificar.
   * @param datos Campos a actualizar (parciales).
   * @returns El producto ya actualizado.
   */
  async actualizar(id: string, datos: EntradaActualizarProducto): Promise<ProductoDetalle> {
    const { producto } = await solicitar<{ producto: ProductoDetalle }>(`/productos/${id}`, {
      metodo: 'PATCH',
      cuerpo: datos,
    });
    return producto;
  },

  /**
   * Elimina una prenda del catálogo del diseñador. Llama a DELETE /productos/:id.
   * @param id Identificador del producto a eliminar.
   */
  eliminar(id: string): Promise<void> {
    return solicitar<void>(`/productos/${id}`, { metodo: 'DELETE' });
  },
};
