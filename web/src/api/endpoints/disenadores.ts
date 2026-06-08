// Endpoints de diseñadores. Lista pública → { datos, total, pagina, limite }; resto → { disenador }.
import { solicitar } from '../clienteApi';
import type {
  CiudadGallega,
  DisenadorPublico,
  EntradaActualizarDisenador,
  EntradaSolicitarDisenador,
  RespuestaPaginada,
} from '../tipos';

export const apiDisenadores = {
  listar(
    filtros: { ciudad?: CiudadGallega; pagina?: number; limite?: number } = {},
  ): Promise<RespuestaPaginada<DisenadorPublico>> {
    return solicitar<RespuestaPaginada<DisenadorPublico>>('/disenadores', {
      params: { ...filtros },
    });
  },

  async obtener(id: string): Promise<DisenadorPublico> {
    const { disenador } = await solicitar<{ disenador: DisenadorPublico }>(`/disenadores/${id}`);
    return disenador;
  },

  async yo(): Promise<DisenadorPublico> {
    const { disenador } = await solicitar<{ disenador: DisenadorPublico }>('/disenadores/yo');
    return disenador;
  },

  async solicitar(datos: EntradaSolicitarDisenador): Promise<DisenadorPublico> {
    const { disenador } = await solicitar<{ disenador: DisenadorPublico }>('/disenadores/solicitar', {
      metodo: 'POST',
      cuerpo: datos,
    });
    return disenador;
  },

  async actualizar(datos: EntradaActualizarDisenador): Promise<DisenadorPublico> {
    const { disenador } = await solicitar<{ disenador: DisenadorPublico }>('/disenadores/yo', {
      metodo: 'PATCH',
      cuerpo: datos,
    });
    return disenador;
  },
};
