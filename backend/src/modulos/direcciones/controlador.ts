/**
 * Controlador del módulo Direcciones.
 *
 * Manejadores HTTP (Express) para la gestión de direcciones de envío del
 * usuario autenticado: listar, crear, actualizar, eliminar y marcar una
 * dirección como principal. Toda la lógica de autorización (comprobar que la
 * dirección pertenece al usuario) se delega en `servicioDirecciones`.
 */
import { Request, Response, NextFunction } from 'express';
import { servicioDirecciones } from './servicio';
import type { DatosCrearDireccion, DatosActualizarDireccion } from './dto';

export const controladorDirecciones = {
  /**
   * GET /direcciones
   * Lista todas las direcciones del usuario autenticado.
   */
  async listar(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const direcciones = await servicioDirecciones.listar(peticion.usuario!.sub);
      respuesta.status(200).json({ direcciones });
    } catch (error) {
      siguiente(error);
    }
  },

  /**
   * POST /direcciones
   * Crea una nueva dirección para el usuario autenticado a partir del cuerpo
   * de la petición, ya validado por `dtoCrearDireccion`. Responde con 201
   * (creado) y la dirección resultante.
   */
  async crear(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const direccion = await servicioDirecciones.crear(
        peticion.usuario!.sub,
        peticion.body as DatosCrearDireccion,
      );
      respuesta.status(201).json({ direccion });
    } catch (error) {
      siguiente(error);
    }
  },

  /**
   * PATCH /direcciones/:id
   * Actualiza parcialmente una dirección existente. El servicio comprueba que
   * la dirección pertenezca al usuario autenticado antes de aplicar los cambios.
   */
  async actualizar(
    peticion: Request,
    respuesta: Response,
    siguiente: NextFunction,
  ): Promise<void> {
    try {
      const direccion = await servicioDirecciones.actualizar(
        peticion.params.id,
        peticion.usuario!.sub,
        peticion.body as DatosActualizarDireccion,
      );
      respuesta.status(200).json({ direccion });
    } catch (error) {
      siguiente(error);
    }
  },

  /**
   * DELETE /direcciones/:id
   * Elimina una dirección del usuario autenticado, previa comprobación de
   * propiedad en el servicio. Responde con 204 (sin contenido).
   */
  async eliminar(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      await servicioDirecciones.eliminar(peticion.params.id, peticion.usuario!.sub);
      respuesta.status(204).send();
    } catch (error) {
      siguiente(error);
    }
  },

  /**
   * PATCH /direcciones/:id/principal
   * Marca la dirección indicada como la dirección principal (predeterminada)
   * del usuario autenticado, desmarcando cualquier otra que lo fuera previamente.
   */
  async marcarPrincipal(
    peticion: Request,
    respuesta: Response,
    siguiente: NextFunction,
  ): Promise<void> {
    try {
      const direccion = await servicioDirecciones.marcarComoPrincipal(
        peticion.params.id,
        peticion.usuario!.sub,
      );
      respuesta.status(200).json({ direccion });
    } catch (error) {
      siguiente(error);
    }
  },
};
