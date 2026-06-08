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

export const apiProductos = {
  listar(filtros: FiltrosCatalogo = {}, senal?: AbortSignal): Promise<RespuestaPaginada<ProductoResumen>> {
    return solicitar<RespuestaPaginada<ProductoResumen>>('/productos', {
      params: { ...filtros },
      senal,
    });
  },

  async obtener(slug: string): Promise<ProductoDetalle> {
    const { producto } = await solicitar<{ producto: ProductoDetalle }>(`/productos/${slug}`);
    return producto;
  },

  // ---- Catálogo propio del diseñador ----

  async listarMios(): Promise<{ datos: ProductoResumen[]; total: number }> {
    return solicitar<{ datos: ProductoResumen[]; total: number }>('/productos/mios');
  },

  async obtenerMio(id: string): Promise<ProductoDetalle> {
    const { producto } = await solicitar<{ producto: ProductoDetalle }>(`/productos/mios/${id}`);
    return producto;
  },

  async crear(datos: EntradaProducto): Promise<ProductoDetalle> {
    const { producto } = await solicitar<{ producto: ProductoDetalle }>('/productos', {
      metodo: 'POST',
      cuerpo: datos,
    });
    return producto;
  },

  async actualizar(id: string, datos: EntradaActualizarProducto): Promise<ProductoDetalle> {
    const { producto } = await solicitar<{ producto: ProductoDetalle }>(`/productos/${id}`, {
      metodo: 'PATCH',
      cuerpo: datos,
    });
    return producto;
  },

  eliminar(id: string): Promise<void> {
    return solicitar<void>(`/productos/${id}`, { metodo: 'DELETE' });
  },
};
