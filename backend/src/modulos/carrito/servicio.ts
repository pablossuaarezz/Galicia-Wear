import { Rol } from '@prisma/client';
import {
  ErrorAccesoDenegado,
  ErrorNoEncontrado,
  ErrorReglaDeNegocio,
} from '../../utilidades/errores';
import { repositorioCarrito, type CarritoDetalle } from './repositorio';

export const servicioCarrito = {
  async obtener(clienteId: string, rol: Rol): Promise<CarritoDetalle> {
    if (rol !== Rol.CLIENTE) {
      throw new ErrorAccesoDenegado('Solo los clientes tienen carrito');
    }
    return repositorioCarrito.obtenerOCrear(clienteId);
  },

  async agregarItem(
    clienteId: string,
    rol: Rol,
    varianteId: string,
    cantidad: number,
  ): Promise<CarritoDetalle> {
    if (rol !== Rol.CLIENTE) {
      throw new ErrorAccesoDenegado('Solo los clientes pueden gestionar el carrito');
    }
    return repositorioCarrito.agregarOActualizarItem(clienteId, varianteId, cantidad);
  },

  async eliminarItem(clienteId: string, varianteId: string): Promise<CarritoDetalle> {
    const carrito = await repositorioCarrito.buscarDeCliente(clienteId);
    if (!carrito) throw new ErrorNoEncontrado('Carrito');

    const tieneItem = carrito.items.some((i) => i.variante.id === varianteId);
    if (!tieneItem) throw new ErrorNoEncontrado('Artículo en el carrito');

    return repositorioCarrito.eliminarItem(clienteId, varianteId);
  },

  async vaciar(clienteId: string): Promise<void> {
    await repositorioCarrito.vaciar(clienteId);
  },
};
