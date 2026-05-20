// JUSTIFICACIÓN: último middleware. Captura cualquier error lanzado en la cadena y lo
// transforma en una respuesta JSON consistente. Distingue errores de aplicación
// (mensaje visible al usuario) de errores internos (mensaje genérico, traza solo en logs).
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { ErrorAplicacion } from '../utilidades/errores';
import { registrador } from '../utilidades/registrador';
import { esProduccion } from '../configuracion/entorno';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function manejadorErrores(
  error: Error,
  peticion: Request,
  respuesta: Response,
  _siguiente: NextFunction,
): void {
  // 1. Errores propios del dominio
  if (error instanceof ErrorAplicacion) {
    respuesta.status(error.codigoEstado).json({
      error: error.message,
      codigo: error.codigo,
      detalles: error.detalles,
    });
    return;
  }

  // 2. Errores de validación zod sueltos (por si pasa alguno fuera del middleware `validar`)
  if (error instanceof ZodError) {
    respuesta.status(400).json({
      error: 'Datos inválidos',
      codigo: 'ERROR_VALIDACION',
      detalles: error.errors,
    });
    return;
  }

  // 3. Errores de Prisma traducidos a códigos HTTP estándar
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      respuesta.status(409).json({
        error: 'Conflicto: valor duplicado',
        codigo: 'DUPLICADO',
        detalles: { campos: error.meta?.target },
      });
      return;
    }
    if (error.code === 'P2025') {
      respuesta.status(404).json({ error: 'Registro no encontrado', codigo: 'NO_ENCONTRADO' });
      return;
    }
  }

  // 4. Cualquier otra cosa → 500 con mensaje genérico
  registrador.error(
    { err: error, ruta: peticion.path, metodo: peticion.method },
    'Error no controlado',
  );

  respuesta.status(500).json({
    error: 'Error interno del servidor',
    codigo: 'ERROR_INTERNO',
    ...(esProduccion ? {} : { detalles: error.message }),
  });
}
