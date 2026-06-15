// Endpoints de diseñadores. Lista pública → { datos, total, pagina, limite }; resto → { disenador }.
import { solicitar } from '../clienteApi';
import type {
  CiudadGallega,
  DisenadorPublico,
  EntradaActualizarDisenador,
  EntradaSolicitarDisenador,
  RespuestaPaginada,
} from '../tipos';

/**
 * Conjunto de funciones que encapsulan las llamadas a los endpoints REST de diseñadores.
 * Cada método devuelve directamente el modelo de dominio ya "desenvuelto" de la respuesta
 * del backend, de modo que las capas superiores (hooks, páginas) no manipulan envoltorios.
 */
export const apiDisenadores = {
  /**
   * Lista pública y paginada de diseñadores, con filtro opcional por ciudad gallega.
   * Llama a GET /disenadores.
   * @param filtros Criterios opcionales: ciudad, número de página y tamaño de página.
   * @returns Página de diseñadores públicos junto con metadatos de paginación.
   */
  listar(
    filtros: { ciudad?: CiudadGallega; pagina?: number; limite?: number } = {},
  ): Promise<RespuestaPaginada<DisenadorPublico>> {
    return solicitar<RespuestaPaginada<DisenadorPublico>>('/disenadores', {
      params: { ...filtros },
    });
  },

  /**
   * Obtiene el perfil público de un diseñador concreto. Llama a GET /disenadores/:id.
   * @param id Identificador del diseñador.
   * @returns Datos públicos del diseñador (se desenvuelve la clave `disenador`).
   */
  async obtener(id: string): Promise<DisenadorPublico> {
    const { disenador } = await solicitar<{ disenador: DisenadorPublico }>(`/disenadores/${id}`);
    return disenador;
  },

  /**
   * Obtiene el perfil del diseñador correspondiente al usuario autenticado.
   * Llama a GET /disenadores/yo (requiere sesión con rol diseñador).
   * @returns El perfil de diseñador propio.
   */
  async yo(): Promise<DisenadorPublico> {
    const { disenador } = await solicitar<{ disenador: DisenadorPublico }>('/disenadores/yo');
    return disenador;
  },

  /**
   * Envía una solicitud para convertir al usuario actual en diseñador (alta de marca).
   * Llama a POST /disenadores/solicitar.
   * @param datos Datos de la marca solicitada (nombre, descripción, ciudad, etc.).
   * @returns El perfil de diseñador recién creado, pendiente de validación.
   */
  async solicitar(datos: EntradaSolicitarDisenador): Promise<DisenadorPublico> {
    const { disenador } = await solicitar<{ disenador: DisenadorPublico }>('/disenadores/solicitar', {
      metodo: 'POST',
      cuerpo: datos,
    });
    return disenador;
  },

  /**
   * Actualiza el perfil del diseñador autenticado. Llama a PATCH /disenadores/yo.
   * @param datos Campos del perfil a modificar (parciales).
   * @returns El perfil de diseñador ya actualizado.
   */
  async actualizar(datos: EntradaActualizarDisenador): Promise<DisenadorPublico> {
    const { disenador } = await solicitar<{ disenador: DisenadorPublico }>('/disenadores/yo', {
      metodo: 'PATCH',
      cuerpo: datos,
    });
    return disenador;
  },
};
