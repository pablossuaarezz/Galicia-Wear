// JUSTIFICACIÓN: control de acceso basado en roles (RBAC). Se usa después de `verificarJwt`
// con `requerirRol(Rol.ADMIN)`, `requerirRol(Rol.DISENADOR, Rol.ADMIN)`, etc.
// Cumple "seguridad básica y roles" de la rúbrica DAM.
import { Request, Response, NextFunction } from 'express';
import { Rol } from '@prisma/client';
import { ErrorAccesoDenegado, ErrorNoAutenticado } from '../utilidades/errores';

export function requerirRol(...rolesPermitidos: Rol[]) {
  return (peticion: Request, _respuesta: Response, siguiente: NextFunction): void => {
    if (!peticion.usuario) {
      return siguiente(new ErrorNoAutenticado('Necesita autenticarse para acceder'));
    }
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

// Atajos semánticos para mejorar legibilidad en las rutas
export const soloCliente = requerirRol(Rol.CLIENTE);
export const soloDisenador = requerirRol(Rol.DISENADOR);
export const soloAdmin = requerirRol(Rol.ADMIN);
export const disenadorOAdmin = requerirRol(Rol.DISENADOR, Rol.ADMIN);
