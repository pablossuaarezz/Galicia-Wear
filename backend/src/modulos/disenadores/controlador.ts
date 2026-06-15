// Controlador HTTP del módulo de diseñadores.
// Recibe las peticiones Express, delega la lógica de negocio en el servicio
// y traduce el resultado en respuestas JSON con el código de estado adecuado.
// Cualquier error lanzado por el servicio se reenvía al middleware de errores
// mediante `siguiente(error)` (patrón estándar de Express).
import { Request, Response, NextFunction } from 'express';
import { servicioDisenadores } from './servicio';
import {
  dtoFiltrosDisenadores,
  type DatosSolicitarDisenador,
  type DatosActualizarDisenador,
  type DatosValidarDisenador,
} from './dto';

export const controladorDisenadores = {
  /**
   * Lista pública de diseñadores validados, con paginación y filtro opcional por ciudad.
   * @param peticion request de Express; los filtros llegan por query string.
   * @param respuesta response de Express; responde 200 con el listado paginado.
   * @param siguiente callback de error de Express.
   */
  async listar(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      // Parseamos directamente la query: zod aplica coerciones y defaults.
      const filtros = dtoFiltrosDisenadores.parse(peticion.query);
      const resultado = await servicioDisenadores.listar(filtros);
      respuesta.status(200).json(resultado);
    } catch (error) {
      siguiente(error);
    }
  },

  /**
   * Obtiene el perfil público de un diseñador validado a partir de su id.
   * @param peticion request con `params.id` = id del diseñador (usuarioId).
   * @param respuesta response que devuelve 200 con `{ disenador }`.
   * @param siguiente callback de error de Express.
   */
  async obtener(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const disenador = await servicioDisenadores.obtenerPublico(peticion.params.id);
      respuesta.status(200).json({ disenador });
    } catch (error) {
      siguiente(error);
    }
  },

  /**
   * Devuelve el perfil de diseñador del usuario autenticado, esté o no validado.
   * Requiere middleware de autenticación previo que rellene `peticion.usuario`.
   * @param peticion request autenticado; se usa `peticion.usuario.sub` como id propio.
   * @param respuesta response que devuelve 200 con `{ disenador }`.
   * @param siguiente callback de error de Express.
   */
  async obtenerMio(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const disenador = await servicioDisenadores.obtenerMio(peticion.usuario!.sub);
      respuesta.status(200).json({ disenador });
    } catch (error) {
      siguiente(error);
    }
  },

  /**
   * Crea el perfil de diseñador para el usuario autenticado (alta de marca).
   * @param peticion request autenticado; `body` ya validado como `DatosSolicitarDisenador`.
   * @param respuesta response que devuelve 201 con `{ disenador }` creado.
   * @param siguiente callback de error de Express.
   */
  async solicitar(
    peticion: Request,
    respuesta: Response,
    siguiente: NextFunction,
  ): Promise<void> {
    try {
      const disenador = await servicioDisenadores.solicitar(
        peticion.usuario!.sub,
        peticion.body as DatosSolicitarDisenador,
      );
      respuesta.status(201).json({ disenador });
    } catch (error) {
      siguiente(error);
    }
  },

  /**
   * Actualiza los datos del perfil de marca del diseñador autenticado.
   * @param peticion request autenticado; `body` ya validado como `DatosActualizarDisenador`.
   * @param respuesta response que devuelve 200 con `{ disenador }` actualizado.
   * @param siguiente callback de error de Express.
   */
  async actualizarMiPerfil(
    peticion: Request,
    respuesta: Response,
    siguiente: NextFunction,
  ): Promise<void> {
    try {
      const disenador = await servicioDisenadores.actualizarPropioPerfil(
        peticion.usuario!.sub,
        peticion.body as DatosActualizarDisenador,
      );
      respuesta.status(200).json({ disenador });
    } catch (error) {
      siguiente(error);
    }
  },

  /**
   * Acción administrativa: aprueba o rechaza el perfil de un diseñador.
   * Solo accesible a usuarios con rol admin (controlado por middleware de rutas).
   * @param peticion request con `params.id` = id del diseñador a validar,
   *   `peticion.usuario.sub` = id del admin que realiza la acción,
   *   `body` validado como `DatosValidarDisenador` (contiene `aprobar`).
   * @param respuesta response que devuelve 200 con `{ disenador }` ya validado/rechazado.
   * @param siguiente callback de error de Express.
   */
  async validar(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const disenador = await servicioDisenadores.validarDisenador(
        peticion.params.id,
        peticion.usuario!.sub,
        peticion.body as DatosValidarDisenador,
      );
      respuesta.status(200).json({ disenador });
    } catch (error) {
      siguiente(error);
    }
  },
};
