// JUSTIFICACIÓN: último middleware. Captura cualquier error lanzado en la cadena y lo
// transforma en una respuesta JSON consistente. Distingue errores de aplicación
// (mensaje visible al usuario) de errores internos (mensaje genérico, traza solo en logs).
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { ErrorAplicacion } from '../utilidades/errores';
import { registrador } from '../utilidades/registrador';
import { esProduccion } from '../configuracion/entorno';

/**
 * Middleware de manejo de errores global de Express.
 *
 * Debe registrarse el último mediante `aplicacion.use(manejadorErrores)`. Express lo
 * identifica como middleware de manejo de errores por tener 4 parámetros (incluyendo
 * `error` como primer argumento) y lo invoca automáticamente cuando algún middleware
 * o controlador anterior llama a `siguiente(error)` o lanza una excepción.
 *
 * Traduce distintos tipos de error a respuestas JSON consistentes con un código HTTP
 * y un código de error interno (`codigo`) que el frontend puede usar para mostrar
 * mensajes específicos:
 *  1. `ErrorAplicacion` (y subclases) → respuesta con el código de estado y código
 *     de error definidos por la propia excepción (errores de negocio "esperados").
 *  2. `ZodError` → 400, validación de datos fallida.
 *  3. Errores conocidos de Prisma (`P2002` duplicado, `P2025` no encontrado) → 409/404.
 *  4. Cualquier otro error no controlado → 500 genérico, registrando la traza completa
 *     en el logger pero sin exponer detalles internos al cliente en producción.
 *
 * @param error excepción capturada en la cadena de middlewares/controladores
 * @param peticion objeto Request de Express (se usa solo para logging)
 * @param respuesta objeto Response de Express, usado para enviar el JSON de error
 * @param _siguiente no se usa (Express exige la firma de 4 argumentos para
 *                    reconocer este middleware como manejador de errores)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function manejadorErrores(
  error: Error,
  peticion: Request,
  respuesta: Response,
  _siguiente: NextFunction,
): void {
  // 1. Errores propios del dominio: ya incluyen el código de estado HTTP correcto,
  //    un código de error legible por máquina y, opcionalmente, detalles adicionales
  //    (p. ej. lista de campos inválidos).
  if (error instanceof ErrorAplicacion) {
    respuesta.status(error.codigoEstado).json({
      error: error.message,
      codigo: error.codigo,
      detalles: error.detalles,
    });
    return;
  }

  // 2. Errores de validación zod sueltos (por si pasa alguno fuera del middleware `validar`):
  //    se devuelven los problemas de validación de zod tal cual en `detalles`.
  if (error instanceof ZodError) {
    respuesta.status(400).json({
      error: 'Datos inválidos',
      codigo: 'ERROR_VALIDACION',
      detalles: error.errors,
    });
    return;
  }

  // 3. Errores de Prisma traducidos a códigos HTTP estándar.
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: violación de restricción de unicidad (p. ej. correo ya registrado).
    if (error.code === 'P2002') {
      respuesta.status(409).json({
        error: 'Conflicto: valor duplicado',
        codigo: 'DUPLICADO',
        detalles: { campos: error.meta?.target },
      });
      return;
    }
    // P2025: la operación (update/delete) no encontró el registro esperado.
    if (error.code === 'P2025') {
      respuesta.status(404).json({ error: 'Registro no encontrado', codigo: 'NO_ENCONTRADO' });
      return;
    }
    // Cualquier otro código de error de Prisma cae al bloque genérico de abajo (500).
  }

  // 4. Cualquier otra cosa → 500 con mensaje genérico.
  //    Se registra siempre la traza completa del error (con ruta y método HTTP)
  //    para poder depurarlo desde los logs, independientemente de lo que vea el cliente.
  registrador.error(
    { err: error, ruta: peticion.path, metodo: peticion.method },
    'Error no controlado',
  );

  // En producción no se exponen detalles internos del error (mensaje de excepción,
  // posible información sensible de la pila) por motivos de seguridad; en desarrollo
  // sí se incluyen para facilitar la depuración.
  respuesta.status(500).json({
    error: 'Error interno del servidor',
    codigo: 'ERROR_INTERNO',
    ...(esProduccion ? {} : { detalles: error.message }),
  });
}
