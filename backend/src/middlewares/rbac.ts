// JUSTIFICACIÓN: control de acceso basado en roles (RBAC). Se usa después de `verificarJwt`
// con `requerirRol(Rol.ADMIN)`, `requerirRol(Rol.DISENADOR, Rol.ADMIN)`, etc.
// Cumple "seguridad básica y roles" de la rúbrica DAM.
import { Request, Response, NextFunction } from 'express';
import { Rol } from '@prisma/client';
import { ErrorAccesoDenegado, ErrorNoAutenticado } from '../utilidades/errores';

/**
 * Fábrica de middlewares de autorización por rol (RBAC).
 *
 * Debe usarse SIEMPRE después de `verificarJwt`, ya que depende de que
 * `peticion.usuario` ya esté poblado con el payload del JWT.
 *
 * @param rolesPermitidos lista de roles (`Rol.CLIENTE`, `Rol.DISENADOR`, `Rol.ADMIN`, ...)
 *                          que tienen permiso para acceder a la ruta
 * @returns un middleware de Express que:
 *   - si no hay usuario autenticado, propaga `ErrorNoAutenticado` (401);
 *   - si el rol del usuario no está en `rolesPermitidos`, propaga
 *     `ErrorAccesoDenegado` (403);
 *   - en caso contrario, continúa la cadena con `siguiente()`.
 */
export function requerirRol(...rolesPermitidos: Rol[]) {
  return (peticion: Request, _respuesta: Response, siguiente: NextFunction): void => {
    // Comprobación defensiva: si este middleware se usa sin `verificarJwt` antes,
    // `peticion.usuario` sería undefined y no se podría comprobar el rol.
    if (!peticion.usuario) {
      return siguiente(new ErrorNoAutenticado('Necesita autenticarse para acceder'));
    }
    // El rol viene fijado en el JWT (no se puede falsificar sin conocer el secreto),
    // por lo que basta con comprobar pertenencia a la lista de roles permitidos.
    if (!rolesPermitidos.includes(peticion.usuario.rol)) {
      return siguiente(
        new ErrorAccesoDenegado(
          `Rol ${peticion.usuario.rol} no autorizado. Roles permitidos: ${rolesPermitidos.join(', ')}`,
        ),
      );
    }
    siguiente();
  };
}

// Atajos semánticos para mejorar legibilidad en las rutas: evitan repetir
// `requerirRol(Rol.XXX)` en cada definición de ruta y dejan claro de un vistazo
// qué rol(es) puede(n) acceder a cada endpoint.
/** Middleware que solo permite el acceso a usuarios con rol CLIENTE. */
export const soloCliente = requerirRol(Rol.CLIENTE);
/** Middleware que solo permite el acceso a usuarios con rol DISENADOR. */
export const soloDisenador = requerirRol(Rol.DISENADOR);
/** Middleware que solo permite el acceso a usuarios con rol ADMIN. */
export const soloAdmin = requerirRol(Rol.ADMIN);
/** Middleware que permite el acceso tanto a DISENADOR como a ADMIN. */
export const disenadorOAdmin = requerirRol(Rol.DISENADOR, Rol.ADMIN);
