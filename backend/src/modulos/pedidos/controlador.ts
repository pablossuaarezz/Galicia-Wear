import { Request, Response, NextFunction } from 'express';
import { servicioPedidos } from './servicio';
import type { DatosCrearPedido } from './dto';

export const controladorPedidos = {
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
