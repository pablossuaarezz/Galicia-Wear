// Capa de servicio (lógica de negocio) del módulo de diseñadores.
// Orquesta las operaciones del repositorio, aplica las reglas de negocio
// (perfil único por usuario, visibilidad según validación, autorización
// de operaciones de administración) y traduce situaciones inválidas en
// errores de dominio (ErrorConflicto, ErrorNoEncontrado).
import { ErrorConflicto, ErrorNoEncontrado } from '../../utilidades/errores';
import { repositorioDisenadores, type DisenadorPublico } from './repositorio';
import type {
  DatosSolicitarDisenador,
  DatosActualizarDisenador,
  FiltrosDisenadores,
  DatosValidarDisenador,
} from './dto';

export const servicioDisenadores = {
  /**
   * Crea el perfil de diseñador para un usuario, si todavía no lo tiene.
   * @param usuarioId id del usuario que solicita convertirse en diseñador.
   * @param datos datos de la solicitud (nombre de marca, biografía, IBAN, etc.).
   * @returns el perfil de diseñador recién creado.
   * @throws ErrorConflicto si el usuario ya tiene un perfil de diseñador registrado.
   */
  async solicitar(
    usuarioId: string,
    datos: DatosSolicitarDisenador,
  ): Promise<DisenadorPublico> {
    // Comprobación de unicidad: un usuario solo puede tener un perfil de diseñador.
    const existente = await repositorioDisenadores.buscarPorId(usuarioId);
    if (existente) throw new ErrorConflicto('Ya tienes un perfil de diseñador registrado');
    return repositorioDisenadores.crear(usuarioId, datos);
  },

  /**
   * Devuelve el listado público y paginado de diseñadores validados.
   * @param filtros filtros de paginación/ciudad (ya validados por zod).
   * @returns datos paginados junto con los metadatos de paginación (`pagina`, `limite`).
   */
  async listar(
    filtros: FiltrosDisenadores,
  ): Promise<{ datos: DisenadorPublico[]; total: number; pagina: number; limite: number }> {
    const resultado = await repositorioDisenadores.listar(filtros);
    // Se devuelven también los parámetros de paginación usados, para que el
    // cliente pueda construir la siguiente petición (página siguiente, etc.).
    return { ...resultado, pagina: filtros.pagina, limite: filtros.limite };
  },

  /**
   * Obtiene el perfil público de un diseñador, solo si está validado.
   * @param id usuarioId del diseñador.
   * @returns el perfil del diseñador.
   * @throws ErrorNoEncontrado si no existe o si aún no ha sido validado
   *   (un perfil pendiente de aprobación no debe ser visible públicamente).
   */
  async obtenerPublico(id: string): Promise<DisenadorPublico> {
    const disenador = await repositorioDisenadores.buscarPorId(id);
    if (!disenador || !disenador.validado) throw new ErrorNoEncontrado('Diseñador');
    return disenador;
  },

  // A diferencia de obtenerPublico, devuelve el perfil propio aunque aún no esté
  // validado: el diseñador necesita verlo para editarlo mientras espera aprobación.
  /**
   * Devuelve el perfil de diseñador del propio usuario autenticado,
   * independientemente de su estado de validación.
   * @param usuarioId id del usuario autenticado (propietario del perfil).
   * @returns el perfil de diseñador propio.
   * @throws ErrorNoEncontrado si el usuario no tiene perfil de diseñador creado.
   */
  async obtenerMio(usuarioId: string): Promise<DisenadorPublico> {
    const disenador = await repositorioDisenadores.buscarPorId(usuarioId);
    if (!disenador) throw new ErrorNoEncontrado('Perfil de diseñador');
    return disenador;
  },

  /**
   * Actualiza el perfil de marca del propio diseñador autenticado.
   * @param usuarioId id del usuario autenticado (propietario del perfil).
   * @param datos campos a actualizar (todos opcionales, edición parcial).
   * @returns el perfil de diseñador actualizado.
   * @throws ErrorNoEncontrado si el usuario no tiene perfil de diseñador creado.
   */
  async actualizarPropioPerfil(
    usuarioId: string,
    datos: DatosActualizarDisenador,
  ): Promise<DisenadorPublico> {
    const existente = await repositorioDisenadores.buscarPorId(usuarioId);
    if (!existente) throw new ErrorNoEncontrado('Perfil de diseñador');
    return repositorioDisenadores.actualizar(usuarioId, datos);
  },

  /**
   * Acción administrativa: aprueba o rechaza el perfil de un diseñador.
   * @param id usuarioId del diseñador a validar.
   * @param adminId id del usuario admin que realiza la validación (se guarda como auditoría).
   * @param datos contiene el flag `aprobar` que indica si se aprueba o se rechaza.
   * @returns el perfil de diseñador con su estado de validación actualizado.
   * @throws ErrorNoEncontrado si el diseñador indicado no existe.
   */
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
