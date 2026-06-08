// Endpoints de imágenes de prenda (anidados bajo producto). Envueltos en { imagenes } / { imagen }.
// La subida acepta una URL directa o un data URI base64 que el backend guarda en /uploads.
import { solicitar } from '../clienteApi';
import type { EntradaImagen, ImagenProducto } from '../tipos';

export const apiImagenes = {
  async listar(productoId: string): Promise<ImagenProducto[]> {
    const { imagenes } = await solicitar<{ imagenes: ImagenProducto[] }>(
      `/productos/${productoId}/imagenes`,
    );
    return imagenes;
  },

  async crear(productoId: string, datos: EntradaImagen): Promise<ImagenProducto> {
    const { imagen } = await solicitar<{ imagen: ImagenProducto }>(
      `/productos/${productoId}/imagenes`,
      { metodo: 'POST', cuerpo: datos },
    );
    return imagen;
  },

  async marcarPrincipal(productoId: string, id: string): Promise<ImagenProducto> {
    const { imagen } = await solicitar<{ imagen: ImagenProducto }>(
      `/productos/${productoId}/imagenes/${id}/principal`,
      { metodo: 'PATCH' },
    );
    return imagen;
  },

  eliminar(productoId: string, id: string): Promise<void> {
    return solicitar<void>(`/productos/${productoId}/imagenes/${id}`, { metodo: 'DELETE' });
  },
};
