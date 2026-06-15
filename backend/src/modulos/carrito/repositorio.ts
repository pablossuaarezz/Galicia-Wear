/**
 * Repositorio del módulo Carrito.
 *
 * Encapsula todas las consultas a Prisma relacionadas con el carrito de la
 * compra y sus ítems (`carrito`, `itemCarrito`). Define la forma de selección
 * detallada del carrito (con producto, variante, imagen principal y diseñador)
 * y los tipos TypeScript correspondientes, dado que la inferencia automática de
 * tipos de Prisma para selects anidados tan profundos resulta poco práctica.
 */
import { Prisma, TallaPrenda, CiudadGallega } from '@prisma/client';
import { RepositorioBase } from '../../utilidades/repositorioBase';

// Selección completa del carrito: ítems → variante → producto → imágen principal + diseñador
/**
 * Objeto `select` de Prisma reutilizado en todas las consultas del carrito.
 * Recupera, para cada ítem, la variante asociada (talla, color, sku, stock,
 * ajuste de precio) y el producto al que pertenece dicha variante, incluyendo
 * únicamente la imagen marcada como principal y el nombre de marca del diseñador.
 * Mantener esta selección centralizada garantiza que todas las operaciones del
 * carrito devuelvan exactamente la misma forma de datos.
 */
const seleccionCarrito = {
  id: true,
  clienteId: true,
  fechaActualizacion: true,
  items: {
    select: {
      id: true,
      cantidad: true,
      fechaAnadido: true,
      variante: {
        select: {
          id: true,
          talla: true,
          color: true,
          sku: true,
          stock: true,
          ajustePrecio: true,
          producto: {
            select: {
              id: true,
              disenadorId: true,
              nombre: true,
              slug: true,
              precioBase: true,
              activo: true,
              imagenes: {
                where: { esPrincipal: true },
                take: 1,
                select: { url: true, textoAlternativo: true },
              },
              disenador: { select: { nombreMarca: true } },
            },
          },
        },
      },
    },
    // Los ítems más recientes (añadidos último al carrito) aparecen primero.
    orderBy: { fechaAnadido: Prisma.SortOrder.desc },
  },
};

/**
 * Tipo auxiliar derivado de `crearConsultaCarrito`, usado únicamente para
 * forzar la inferencia de tipos a partir de la forma de `seleccionCarrito`.
 * No se ejecuta en tiempo de ejecución (ver `crearConsultaCarrito`).
 */
export type CarritoConItems = Awaited<ReturnType<ReturnType<typeof crearConsultaCarrito>>>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
/**
 * Función "placeholder" que nunca se invoca realmente: existe únicamente para
 * que TypeScript pueda inferir el tipo `CarritoConItems` a partir de su firma,
 * evitando tener que escribir manualmente un tipo equivalente a `seleccionCarrito`.
 */
function crearConsultaCarrito(): () => Promise<any> {
  return () => Promise.resolve(null); // placeholder para inferencia de tipo
}
// Tipo manual para evitar complejidad de inferencia con Prisma
/**
 * Forma detallada de un ítem del carrito tal y como lo devuelve `seleccionCarrito`:
 * incluye la variante de producto y los datos mínimos del producto/diseñador
 * necesarios para mostrar el artículo en la interfaz del carrito.
 */
export interface ItemCarritoDetalle {
  id: string;
  cantidad: number;
  fechaAnadido: Date;
  variante: {
    id: string;
    talla: TallaPrenda;
    color: string;
    sku: string;
    stock: number;
    ajustePrecio: Prisma.Decimal;
    producto: {
      id: string;
      disenadorId: string;
      nombre: string;
      slug: string;
      precioBase: Prisma.Decimal;
      activo: boolean;
      imagenes: Array<{ url: string; textoAlternativo: string | null }>;
      disenador: { nombreMarca: string };
    };
  };
}

/**
 * Forma completa del carrito devuelta por las operaciones del repositorio,
 * incluyendo la lista de ítems con su detalle (`ItemCarritoDetalle`).
 */
export interface CarritoDetalle {
  id: string;
  clienteId: string;
  fechaActualizacion: Date;
  items: ItemCarritoDetalle[];
}

/**
 * Repositorio de acceso a datos del carrito de la compra.
 * Extiende `RepositorioBase` para heredar la conexión a la base de datos (`this.bd`)
 * y expone operaciones de lectura/escritura sobre `carrito` e `itemCarrito`.
 */
export class RepositorioCarrito extends RepositorioBase<CarritoDetalle> {
  /**
   * Busca un carrito por su identificador propio, con el detalle completo de ítems.
   * @param id identificador del carrito.
   * @returns el carrito detallado o `null` si no existe.
   */
  async buscarPorId(id: string): Promise<CarritoDetalle | null> {
    return this.bd.carrito.findUnique({
      where: { id },
      select: seleccionCarrito,
    }) as unknown as Promise<CarritoDetalle | null>;
  }

  /**
   * Busca el carrito asociado a un cliente concreto (relación 1:1 cliente-carrito).
   * @param clienteId identificador del cliente.
   * @returns el carrito detallado o `null` si el cliente no tiene carrito creado.
   */
  async buscarDeCliente(clienteId: string): Promise<CarritoDetalle | null> {
    return this.bd.carrito.findUnique({
      where: { clienteId },
      select: seleccionCarrito,
    }) as unknown as Promise<CarritoDetalle | null>;
  }

  /**
   * Obtiene el carrito del cliente o lo crea si todavía no existe (operación idempotente
   * mediante `upsert`). Garantiza que cualquier cliente siempre tenga un carrito al
   * que añadir artículos, sin necesidad de un paso de creación explícito previo.
   * @param clienteId identificador del cliente.
   * @returns el carrito detallado (existente o recién creado).
   */
  async obtenerOCrear(clienteId: string): Promise<CarritoDetalle> {
    return this.bd.carrito.upsert({
      where: { clienteId },
      create: { clienteId },
      update: {},
      select: seleccionCarrito,
    }) as unknown as Promise<CarritoDetalle>;
  }

  /**
   * Añade una variante al carrito o, si ya existía un ítem para esa variante,
   * actualiza su cantidad. Usa `upsert` sobre la clave compuesta
   * `carritoId_varianteId` para resolver ambos casos en una sola operación.
   * @param clienteId identificador del cliente propietario del carrito.
   * @param varianteId identificador de la variante a añadir/actualizar.
   * @param cantidad cantidad final que debe quedar para esa variante.
   * @returns el carrito actualizado con el detalle completo.
   */
  async agregarOActualizarItem(
    clienteId: string,
    varianteId: string,
    cantidad: number,
  ): Promise<CarritoDetalle> {
    const carrito = await this.obtenerOCrear(clienteId);

    await this.bd.itemCarrito.upsert({
      where: { carritoId_varianteId: { carritoId: carrito.id, varianteId } },
      create: { carritoId: carrito.id, varianteId, cantidad },
      update: { cantidad },
    });

    // Forzar actualización de fechaActualizacion en el carrito
    // (un `update` con `data: {}` no cambia ningún campo de negocio, pero Prisma
    // actualiza automáticamente los campos con @updatedAt, como fechaActualizacion).
    return this.bd.carrito.update({
      where: { id: carrito.id },
      data: {},
      select: seleccionCarrito,
    }) as unknown as Promise<CarritoDetalle>;
  }

  /**
   * Elimina del carrito todos los ítems que correspondan a la variante indicada.
   * @param clienteId identificador del cliente propietario del carrito.
   * @param varianteId identificador de la variante a eliminar.
   * @returns el carrito actualizado tras la eliminación.
   */
  async eliminarItem(clienteId: string, varianteId: string): Promise<CarritoDetalle> {
    const carrito = await this.obtenerOCrear(clienteId);
    await this.bd.itemCarrito.deleteMany({
      where: { carritoId: carrito.id, varianteId },
    });
    return this.buscarDeCliente(clienteId) as Promise<CarritoDetalle>;
  }

  /**
   * Elimina todos los ítems del carrito de un cliente, dejándolo vacío.
   * Si el cliente todavía no tiene carrito creado, no hace nada (no es un error).
   * @param clienteId identificador del cliente.
   */
  async vaciar(clienteId: string): Promise<void> {
    const carrito = await this.bd.carrito.findUnique({ where: { clienteId } });
    if (carrito) {
      await this.bd.itemCarrito.deleteMany({ where: { carritoId: carrito.id } });
    }
  }

  /**
   * Elimina por completo el registro de carrito indicado (no solo sus ítems).
   * @param id identificador del carrito a eliminar.
   */
  async eliminar(id: string): Promise<void> {
    await this.bd.carrito.delete({ where: { id } });
  }
}

/** Instancia única (singleton) del repositorio de carrito, lista para inyectar/usar. */
export const repositorioCarrito = new RepositorioCarrito();
