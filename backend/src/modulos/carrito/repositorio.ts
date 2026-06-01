import { Prisma, TallaPrenda, CiudadGallega } from '@prisma/client';
import { RepositorioBase } from '../../utilidades/repositorioBase';

// Selección completa del carrito: ítems → variante → producto → imágen principal + diseñador
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
    orderBy: { fechaAnadido: Prisma.SortOrder.desc },
  },
};

export type CarritoConItems = Awaited<ReturnType<ReturnType<typeof crearConsultaCarrito>>>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function crearConsultaCarrito(): () => Promise<any> {
  return () => Promise.resolve(null); // placeholder para inferencia de tipo
}
// Tipo manual para evitar complejidad de inferencia con Prisma
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

export interface CarritoDetalle {
  id: string;
  clienteId: string;
  fechaActualizacion: Date;
  items: ItemCarritoDetalle[];
}

export class RepositorioCarrito extends RepositorioBase<CarritoDetalle> {
  async buscarPorId(id: string): Promise<CarritoDetalle | null> {
    return this.bd.carrito.findUnique({
      where: { id },
      select: seleccionCarrito,
    }) as unknown as Promise<CarritoDetalle | null>;
  }

  async buscarDeCliente(clienteId: string): Promise<CarritoDetalle | null> {
    return this.bd.carrito.findUnique({
      where: { clienteId },
      select: seleccionCarrito,
    }) as unknown as Promise<CarritoDetalle | null>;
  }

  async obtenerOCrear(clienteId: string): Promise<CarritoDetalle> {
    return this.bd.carrito.upsert({
      where: { clienteId },
      create: { clienteId },
      update: {},
      select: seleccionCarrito,
    }) as unknown as Promise<CarritoDetalle>;
  }

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
    return this.bd.carrito.update({
      where: { id: carrito.id },
      data: {},
      select: seleccionCarrito,
    }) as unknown as Promise<CarritoDetalle>;
  }

  async eliminarItem(clienteId: string, varianteId: string): Promise<CarritoDetalle> {
    const carrito = await this.obtenerOCrear(clienteId);
    await this.bd.itemCarrito.deleteMany({
      where: { carritoId: carrito.id, varianteId },
    });
    return this.buscarDeCliente(clienteId) as Promise<CarritoDetalle>;
  }

  async vaciar(clienteId: string): Promise<void> {
    const carrito = await this.bd.carrito.findUnique({ where: { clienteId } });
    if (carrito) {
      await this.bd.itemCarrito.deleteMany({ where: { carritoId: carrito.id } });
    }
  }

  async eliminar(id: string): Promise<void> {
    await this.bd.carrito.delete({ where: { id } });
  }
}

export const repositorioCarrito = new RepositorioCarrito();
