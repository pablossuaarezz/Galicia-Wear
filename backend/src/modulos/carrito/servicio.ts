/**
 * Servicio del módulo Carrito.
 *
 * Contiene la lógica de negocio y las reglas de autorización para el carrito de
 * la compra: comprueba que el usuario que opera sobre el carrito tiene el rol
 * adecuado (CLIENTE), valida la existencia de los ítems antes de eliminarlos y
 * delega el acceso a datos en `repositorioCarrito`. No realiza llamadas directas
 * a Prisma: toda persistencia pasa por el repositorio.
 */
import { Rol } from '@prisma/client';
import {
  ErrorAccesoDenegado,
  ErrorNoEncontrado,
  ErrorReglaDeNegocio,
} from '../../utilidades/errores';
import { repositorioCarrito, type CarritoDetalle } from './repositorio';

export const servicioCarrito = {
  /**
   * Obtiene el carrito del cliente, creándolo si todavía no existe.
   * Solo los usuarios con rol CLIENTE disponen de carrito; cualquier otro rol
   * (DISENADOR, ADMIN, etc.) recibe un error de acceso denegado.
   * @param clienteId identificador del usuario autenticado.
   * @param rol rol del usuario autenticado, extraído del token JWT.
   * @returns el carrito con sus ítems detallados.
   */
  async obtener(clienteId: string, rol: Rol): Promise<CarritoDetalle> {
    if (rol !== Rol.CLIENTE) {
      throw new ErrorAccesoDenegado('Solo los clientes tienen carrito');
    }
    return repositorioCarrito.obtenerOCrear(clienteId);
  },

  /**
   * Añade una variante de producto al carrito o actualiza su cantidad si ya estaba
   * presente. Misma restricción de rol que `obtener`: solo clientes.
   * @param clienteId identificador del cliente propietario del carrito.
   * @param rol rol del usuario autenticado.
   * @param varianteId identificador de la variante de producto a añadir/actualizar.
   * @param cantidad nueva cantidad deseada para esa variante.
   * @returns el carrito actualizado con sus ítems detallados.
   */
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

  /**
   * Elimina un artículo concreto (por variante) del carrito del cliente.
   * Antes de eliminar, comprueba que el carrito exista y que la variante esté
   * realmente presente en él, devolviendo errores 404 descriptivos en caso contrario.
   * @param clienteId identificador del cliente propietario del carrito.
   * @param varianteId identificador de la variante a eliminar.
   * @returns el carrito actualizado tras la eliminación.
   */
  async eliminarItem(clienteId: string, varianteId: string): Promise<CarritoDetalle> {
    const carrito = await repositorioCarrito.buscarDeCliente(clienteId);
    if (!carrito) throw new ErrorNoEncontrado('Carrito');

    // Comprobamos que el artículo exista en el carrito antes de intentar borrarlo,
    // para poder devolver un 404 claro en lugar de un borrado silencioso sin efecto.
    const tieneItem = carrito.items.some((i) => i.variante.id === varianteId);
    if (!tieneItem) throw new ErrorNoEncontrado('Artículo en el carrito');

    return repositorioCarrito.eliminarItem(clienteId, varianteId);
  },

  /**
   * Vacía por completo el carrito del cliente, eliminando todos sus ítems.
   * @param clienteId identificador del cliente propietario del carrito.
   */
  async vaciar(clienteId: string): Promise<void> {
    await repositorioCarrito.vaciar(clienteId);
  },
};
