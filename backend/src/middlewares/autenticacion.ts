// JUSTIFICACIÓN: middleware único de verificación JWT. Si el token es válido, adjunta el
// payload a `peticion.usuario` para que los controladores lo usen sin volver a parsear.
// Cumple "Seguridad y roles" de la rúbrica DAM (autenticación stateless con JWT).
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { entorno } from '../configuracion/entorno';
import { ErrorNoAutenticado } from '../utilidades/errores';
import type { Rol } from '@prisma/client';

/**
 * Forma del payload contenido dentro del token JWT de acceso.
 * Se firma en el módulo de autenticación al hacer login/registro y se verifica
 * en cada petición protegida mediante `verificarJwt`.
 */
export interface PayloadJwt {
  sub: string;        // ID del usuario
  rol: Rol;
  correo: string;
}

// Ampliamos el tipo Request para incluir `usuario`. TypeScript module augmentation.
// Esto permite que, tras pasar por `verificarJwt`, cualquier controlador pueda
// acceder a `peticion.usuario` con tipado fuerte sin necesidad de `as any`.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: PayloadJwt;
    }
  }
}

/**
 * Middleware de autenticación: verifica que la petición incluya un token JWT
 * válido en la cabecera `Authorization: Bearer <token>`.
 *
 * Si el token es válido, decodifica su payload y lo adjunta en `peticion.usuario`
 * para que los middlewares/controladores siguientes (p. ej. `requerirRol`) puedan
 * usarlo sin tener que volver a parsear o verificar el token.
 *
 * Si falta la cabecera, no tiene el prefijo `Bearer `, el token ha caducado o es
 * inválido, se delega el error a `siguiente(...)` para que lo procese el
 * `manejadorErrores` global, devolviendo un 401.
 *
 * @param peticion objeto Request de Express de la petición entrante
 * @param _respuesta objeto Response (no se usa directamente; los errores se
 *                    delegan al manejador global)
 * @param siguiente función para continuar la cadena de middlewares o propagar un error
 */
export function verificarJwt(peticion: Request, _respuesta: Response, siguiente: NextFunction): void {
  // Se acepta la cabecera tanto en minúsculas como con la capitalización estándar
  // HTTP, ya que distintos clientes/proxies pueden normalizarla de forma distinta.
  const cabecera = peticion.header('authorization') ?? peticion.header('Authorization');
  if (!cabecera?.startsWith('Bearer ')) {
    return siguiente(new ErrorNoAutenticado('Falta token Bearer'));
  }

  // Se elimina el prefijo "Bearer " para quedarnos solo con el token JWT.
  const token = cabecera.slice('Bearer '.length).trim();

  try {
    // jwt.verify comprueba la firma con el secreto compartido y la fecha de
    // expiración; si todo es correcto devuelve el payload decodificado.
    const payload = jwt.verify(token, entorno.JWT_SECRET) as PayloadJwt;
    peticion.usuario = payload;
    siguiente();
  } catch (error) {
    // Se distingue el caso de token expirado (mensaje específico para que el
    // cliente sepa que debe usar el refresh token) del resto de errores de
    // verificación (firma inválida, token malformado, etc.), que se reportan
    // de forma genérica como "Token inválido" para no dar pistas a un atacante.
    if (error instanceof jwt.TokenExpiredError) {
      return siguiente(new ErrorNoAutenticado('Token expirado'));
    }
    return siguiente(new ErrorNoAutenticado('Token inválido'));
  }
}
