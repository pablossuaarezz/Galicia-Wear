import { ErrorConflicto, ErrorNoEncontrado } from '../../utilidades/errores';
import { repositorioDisenadores, type DisenadorPublico } from './repositorio';
import type {
  DatosSolicitarDisenador,
  DatosActualizarDisenador,
  FiltrosDisenadores,
  DatosValidarDisenador,
} from './dto';

export const servicioDisenadores = {
  async solicitar(
    usuarioId: string,
    datos: DatosSolicitarDisenador,
  ): Promise<DisenadorPublico> {
    const existente = await repositorioDisenadores.buscarPorId(usuarioId);
    if (existente) throw new ErrorConflicto('Ya tienes un perfil de diseñador registrado');
    return repositorioDisenadores.crear(usuarioId, datos);
  },

  async listar(
    filtros: FiltrosDisenadores,
  ): Promise<{ datos: DisenadorPublico[]; total: number; pagina: number; limite: number }> {
    const resultado = await repositorioDisenadores.listar(filtros);
    return { ...resultado, pagina: filtros.pagina, limite: filtros.limite };
  },

  async obtenerPublico(id: string): Promise<DisenadorPublico> {
    const disenador = await repositorioDisenadores.buscarPorId(id);
    if (!disenador || !disenador.validado) throw new ErrorNoEncontrado('Diseñador');
    return disenador;
  },

  // A diferencia de obtenerPublico, devuelve el perfil propio aunque aún no esté
  // validado: el diseñador necesita verlo para editarlo mientras espera aprobación.
  async obtenerMio(usuarioId: string): Promise<DisenadorPublico> {
    const disenador = await repositorioDisenadores.buscarPorId(usuarioId);
    if (!disenador) throw new ErrorNoEncontrado('Perfil de diseñador');
    return disenador;
  },

  async actualizarPropioPerfil(
    usuarioId: string,
    datos: DatosActualizarDisenador,
  ): Promise<DisenadorPublico> {
    const existente = await repositorioDisenadores.buscarPorId(usuarioId);
    if (!existente) throw new ErrorNoEncontrado('Perfil de diseñador');
    return repositorioDisenadores.actualizar(usuarioId, datos);
  },

  async validarDisenador(
    id: string,
    adminId: string,
    datos: DatosValidarDisenador,
  ): Promise<DisenadorPublico> {
    const existente = await repositorioDisenadores.buscarPorId(id);
    if (!existente) throw new ErrorNoEncontrado('Diseñador');
    return repositorioDisenadores.validar(id, adminId, datos.aprobar);
  },
};
