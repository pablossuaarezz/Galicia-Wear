// Controlador HTTP del módulo de pedidos.
// Cada función recibe la petición Express, delega la lógica de negocio en
// `servicioPedidos` y traduce el resultado a una respuesta JSON con el
// código de estado adecuado. Los errores se propagan a `siguiente` (next)
// para que los gestione el middleware central de manejo de errores.

import { Request, Response, NextFunction } from 'express';
import { servicioPedidos } from './servicio';
import type { DatosCrearPedido } from './dto';

export const controladorPedidos = {
  /**
   * Procesa el checkout del carrito del cliente autenticado: crea un nuevo
   * pedido a partir de los artículos del carrito, valida stock/dirección y
   * devuelve el pedido recién creado.
   * @param peticion Request de Express; `peticion.usuario.sub` es el id del cliente
   *                  y `peticion.body` contiene los datos validados de `DatosCrearPedido`.
   * @param respuesta Responde con 201 y el pedido creado.
   */
  async checkout(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const pedido = await servicioPedidos.checkout(
        peticion.usuario!.sub,
        peticion.body as DatosCrearPedido,
      );
      respuesta.status(201).json({ pedido });
    } catch (error) {
      siguiente(error);
    }
  },

  /**
   * Lista los pedidos del usuario autenticado, adaptando el listado según su rol:
   * un cliente ve sus compras y un diseñador ve los pedidos en los que tiene líneas.
   * @param peticion Request de Express con `peticion.usuario.sub` (id) y `peticion.usuario.rol`.
   * @param respuesta Responde con 200 y la lista de pedidos.
   */
  async listar(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const pedidos = await servicioPedidos.listar(
        peticion.usuario!.sub,
        peticion.usuario!.rol,
      );
      respuesta.status(200).json({ pedidos });
    } catch (error) {
      siguiente(error);
    }
  },

  /**
   * Obtiene el detalle completo de un pedido (líneas, dirección de envío, envío).
   * El servicio comprueba que el usuario autenticado tiene permiso para verlo
   * (es el cliente, un diseñador con líneas en el pedido, o un admin).
   * @param peticion Request de Express; `peticion.params.id` es el id del pedido.
   * @param respuesta Responde con 200 y el detalle del pedido.
   */
  async obtener(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const pedido = await servicioPedidos.obtenerDetalle(
        peticion.params.id,
        peticion.usuario!.sub,
        peticion.usuario!.rol,
      );
      respuesta.status(200).json({ pedido });
    } catch (error) {
      siguiente(error);
    }
  },

  /**
   * Marca un pedido como pagado (flujo de pago "stub", sin pasarela real).
   * Solo el cliente propietario del pedido puede ejecutar esta acción.
   * @param peticion Request de Express; `peticion.params.id` es el id del pedido.
   * @param respuesta Responde con 200 y el pedido actualizado a estado PAGADO.
   */
  async pagar(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const pedido = await servicioPedidos.pagar(
        peticion.params.id,
        peticion.usuario!.sub,
      );
      respuesta.status(200).json({ pedido });
    } catch (error) {
      siguiente(error);
    }
  },

  /**
   * Permite a un diseñador aceptar sus líneas dentro de un pedido pagado,
   * lo que dispara la creación de un envío (stub) cuando corresponde.
   * @param peticion Request de Express; `peticion.params.id` es el id del pedido
   *                  y `peticion.usuario.sub` es el id del diseñador autenticado.
   * @param respuesta Responde con 200 y el pedido actualizado.
   */
  async aceptar(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const pedido = await servicioPedidos.aceptar(
        peticion.params.id,
        peticion.usuario!.sub,
      );
      respuesta.status(200).json({ pedido });
    } catch (error) {
      siguiente(error);
    }
  },

  /**
   * Cancela un pedido y restaura el stock reservado de sus variantes.
   * Solo el cliente propietario o un administrador pueden cancelar, y solo
   * si el pedido se encuentra en un estado cancelable.
   * @param peticion Request de Express; `peticion.params.id` es el id del pedido.
   * @param respuesta Responde con 200 y el pedido cancelado.
   */
  async cancelar(peticion: Request, respuesta: Response, siguiente: NextFunction): Promise<void> {
    try {
      const pedido = await servicioPedidos.cancelar(
        peticion.params.id,
        peticion.usuario!.sub,
        peticion.usuario!.rol,
      );
      respuesta.status(200).json({ pedido });
    } catch (error) {
      siguiente(error);
    }
  },
};
