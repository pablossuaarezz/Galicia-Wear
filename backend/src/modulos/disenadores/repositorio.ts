// Acceso a datos del módulo de diseñadores mediante Prisma.
// Centraliza las consultas y mutaciones sobre la tabla `disenador`, así como
// la selección de campos públicos (proyección que oculta datos sensibles
// como el IBAN cifrado) y el cifrado del IBAN antes de persistirlo.
import { Prisma, CiudadGallega } from '@prisma/client';
import { RepositorioBase } from '../../utilidades/repositorioBase';
import { cifrarTexto } from '../../utilidades/cifrado';
import type { DatosSolicitarDisenador, DatosActualizarDisenador, FiltrosDisenadores } from './dto';

// ibanCifrado se omite intencionadamente de todas las respuestas públicas.
/**
 * Proyección de campos "seguros" del modelo Disenador que se pueden exponer
 * en respuestas HTTP. Excluye explícitamente `ibanCifrado` para que el dato
 * bancario cifrado nunca salga de la base de datos hacia el cliente.
 */
const seleccionPublica = {
  usuarioId: true,
  nombreMarca: true,
  biografia: true,
  ciudad: true,
  validado: true,
  fechaValidacion: true,
  validadoPorId: true,
  urlLogo: true,
  urlWeb: true,
  fechaCreacion: true,
} as const;

/** Tipo resultante de aplicar `seleccionPublica` a una consulta Prisma de Disenador. */
export type DisenadorPublico = Prisma.DisenadorGetPayload<{ select: typeof seleccionPublica }>;

/**
 * Repositorio del módulo de diseñadores.
 * Encapsula todas las operaciones de lectura/escritura sobre la tabla `disenador`
 * usando el cliente Prisma proporcionado por `RepositorioBase`.
 */
export class RepositorioDisenadores extends RepositorioBase<DisenadorPublico> {
  /**
   * Busca un diseñador por su id de usuario (clave foránea hacia Usuario).
   * @param id usuarioId del diseñador.
   * @returns el diseñador con la proyección pública, o `null` si no existe.
   */
  async buscarPorId(id: string): Promise<DisenadorPublico | null> {
    return this.bd.disenador.findUnique({
      where: { usuarioId: id },
      select: seleccionPublica,
    });
  }

  /**
   * Listado público y paginado de diseñadores validados.
   * Solo devuelve diseñadores con `validado: true`; opcionalmente filtra por ciudad.
   * @param filtros página, límite y ciudad opcional (ya validados por zod).
   * @returns objeto con `datos` (página actual) y `total` de registros que cumplen el filtro.
   */
  async listar(
    filtros: FiltrosDisenadores,
  ): Promise<{ datos: DisenadorPublico[]; total: number }> {
    // Cálculo del offset de paginación a partir de página y límite (base 1 -> 0).
    const omitir = (filtros.pagina - 1) * filtros.limite;
    const condicion: Prisma.DisenadorWhereInput = {
      validado: true,
      ...(filtros.ciudad && { ciudad: filtros.ciudad }),
    };

    // Se ejecutan en paralelo la consulta de la página y el conteo total,
    // ya que ambas comparten la misma condición `where` y son independientes.
    const [datos, total] = await Promise.all([
      this.bd.disenador.findMany({
        where: condicion,
        select: seleccionPublica,
        orderBy: { nombreMarca: 'asc' },
        skip: omitir,
        take: filtros.limite,
      }),
      this.bd.disenador.count({ where: condicion }),
    ]);

    return { datos, total };
  }

  // Listado para el panel admin: permite incluir diseñadores aún no validados
  // (el listado público fuerza validado:true; aquí el filtro es opcional).
  /**
   * Listado paginado de diseñadores para el panel de administración.
   * A diferencia de `listar`, el filtro `validado` es opcional, de modo que
   * el admin puede ver también perfiles pendientes de aprobación.
   * @param filtros página, límite, ciudad opcional y estado de validación opcional.
   * @returns objeto con `datos` (página actual) y `total` de registros que cumplen el filtro.
   */
  async listarTodos(filtros: {
    pagina: number;
    limite: number;
    ciudad?: CiudadGallega;
    validado?: boolean;
  }): Promise<{ datos: DisenadorPublico[]; total: number }> {
    const omitir = (filtros.pagina - 1) * filtros.limite;
    const condicion: Prisma.DisenadorWhereInput = {
      // Solo se aplica el filtro de validación si se ha indicado explícitamente,
      // para poder distinguir entre "todos", "solo validados" y "solo pendientes".
      ...(filtros.validado !== undefined && { validado: filtros.validado }),
      ...(filtros.ciudad && { ciudad: filtros.ciudad }),
    };

    const [datos, total] = await Promise.all([
      this.bd.disenador.findMany({
        where: condicion,
        select: seleccionPublica,
        orderBy: { fechaCreacion: 'desc' },
        skip: omitir,
        take: filtros.limite,
      }),
      this.bd.disenador.count({ where: condicion }),
    ]);

    return { datos, total };
  }

  /**
   * Crea el perfil de diseñador para un usuario existente.
   * El IBAN recibido en texto plano se cifra antes de guardarse (`cifrarTexto`),
   * de forma que la base de datos nunca almacena el dato bancario sin proteger.
   * @param usuarioId id del usuario que solicita ser diseñador (clave primaria de Disenador).
   * @param datos datos del formulario de solicitud, ya validados por zod.
   * @returns el perfil de diseñador creado, con la proyección pública.
   */
  async crear(usuarioId: string, datos: DatosSolicitarDisenador): Promise<DisenadorPublico> {
    return this.bd.disenador.create({
      data: {
        usuarioId,
        nombreMarca: datos.nombreMarca,
        biografia: datos.biografia,
        ciudad: datos.ciudad,
        ibanCifrado: cifrarTexto(datos.iban),
        urlLogo: datos.urlLogo ?? null,
        urlWeb: datos.urlWeb ?? null,
      },
      select: seleccionPublica,
    });
  }

  /**
   * Actualiza parcialmente el perfil de un diseñador.
   * Solo se incluyen en el `data` de Prisma los campos presentes en `datos`
   * (distintos de `undefined`), permitiendo actualizaciones tipo PATCH sin
   * sobrescribir con `null`/valores por defecto los campos no enviados.
   * Si se envía un nuevo IBAN, se vuelve a cifrar antes de persistirlo.
   * @param usuarioId id del diseñador a actualizar.
   * @param datos campos a modificar (todos opcionales).
   * @returns el perfil de diseñador actualizado, con la proyección pública.
   */
  async actualizar(
    usuarioId: string,
    datos: DatosActualizarDisenador,
  ): Promise<DisenadorPublico> {
    return this.bd.disenador.update({
      where: { usuarioId },
      data: {
        ...(datos.nombreMarca !== undefined && { nombreMarca: datos.nombreMarca }),
        ...(datos.biografia !== undefined && { biografia: datos.biografia }),
        ...(datos.ciudad !== undefined && { ciudad: datos.ciudad }),
        ...(datos.iban !== undefined && { ibanCifrado: cifrarTexto(datos.iban) }),
        ...(datos.urlLogo !== undefined && { urlLogo: datos.urlLogo }),
        ...(datos.urlWeb !== undefined && { urlWeb: datos.urlWeb }),
      },
      select: seleccionPublica,
    });
  }

  /**
   * Marca un perfil de diseñador como validado (aprobado) o no validado (rechazado).
   * Al aprobar, registra la fecha de validación y el admin que la realizó;
   * al rechazar, limpia ambos campos para reflejar que no hay validación vigente.
   * @param usuarioId id del diseñador a validar/rechazar.
   * @param validadoPorId id del usuario admin que ejecuta la acción.
   * @param aprobar `true` para aprobar, `false` para rechazar/desvalidar.
   * @returns el perfil de diseñador actualizado, con la proyección pública.
   */
  async validar(
    usuarioId: string,
    validadoPorId: string,
    aprobar: boolean,
  ): Promise<DisenadorPublico> {
    return this.bd.disenador.update({
      where: { usuarioId },
      data: {
        validado: aprobar,
        fechaValidacion: aprobar ? new Date() : null,
        validadoPorId: aprobar ? validadoPorId : null,
      },
      select: seleccionPublica,
    });
  }

  /**
   * Elimina permanentemente el perfil de diseñador asociado a un usuario.
   * @param id usuarioId del diseñador a eliminar.
   */
  async eliminar(id: string): Promise<void> {
    await this.bd.disenador.delete({ where: { usuarioId: id } });
  }
}

// Instancia única (singleton) del repositorio, reutilizada por el servicio.
export const repositorioDisenadores = new RepositorioDisenadores();
