// JUSTIFICACIÓN: middleware único de verificación JWT. Si el token es válido, adjunta el
// payload a `peticion.usuario` para que los controladores lo usen sin volver a parsear.
// Cumple "Seguridad y roles" de la rúbrica DAM (autenticación stateless con JWT).
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { entorno } from '../configuracion/entorno';
import { ErrorNoAutenticado } from '../utilidades/errores';
import type { Rol } from '@prisma/client';

export interface PayloadJwt {
  sub: string;        // ID del usuario
  rol: Rol;
  correo: string;
}

// Ampliamos el tipo Request para incluir `usuario`. TypeScript module augmentation.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: PayloadJwt;
    }
  }
}

export function verificarJwt(peticion: Request, _respuesta: Response, siguiente: NextFunction): void {
  const cabecera = peticion.header('authorization') ?? peticion.header('Authorization');
  if (!cabecera?.startsWith('Bearer ')) {
    return siguiente(new ErrorNoAutenticado('Falta token Bearer'));
  }

  const token = cabecera.slice('Bearer '.length).trim();

  try {
    const payload = jwt.verify(token, entorno.JWT_SECRET) as PayloadJwt;
    peticion.usuario = payload;
    siguiente();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return siguiente(new ErrorNoAutenticado('Token expirado'));
    }
    return siguiente(new ErrorNoAutenticado('Token inválido'));
  }
}
