// JUSTIFICACIÓN: middleware que valida `body`, `query` o `params` con un esquema zod.
// Si la validación falla, se lanza `ErrorValidacion` con detalles legibles.
// El controlador recibe siempre datos ya tipados → menos `as any`, menos bugs.
import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { ErrorValidacion } from '../utilidades/errores';

/** Parte de la petición HTTP que se va a validar contra el esquema zod. */
type FuenteValidacion = 'body' | 'query' | 'params';

/**
 * Fábrica de middlewares de validación de datos de entrada mediante esquemas zod.
 *
 * @typeParam T tipo inferido de los datos válidos según `esquema`
 * @param esquema esquema zod contra el que se valida `peticion[fuente]`
 * @param fuente parte de la petición a validar: `'body'` (por defecto), `'query'` o `'params'`
 * @returns un middleware de Express que:
 *   - si la validación falla, propaga `ErrorValidacion` (400) con el detalle de
 *     cada campo inválido (nombre del campo, mensaje y código de error de zod);
 *   - si la validación es correcta, sustituye los datos originales por los datos
 *     ya parseados por zod (incluyendo valores por defecto aplicados por el esquema)
 *     y continúa la cadena de middlewares.
 */
export function validar<T>(esquema: ZodSchema<T>, fuente: FuenteValidacion = 'body') {
  return (peticion: Request, _respuesta: Response, siguiente: NextFunction): void => {
    const datosOriginales = peticion[fuente];
    // safeParse no lanza excepción: devuelve un resultado discriminado
    // (success: true/false), lo que permite manejar el error de forma controlada.
    const resultado = esquema.safeParse(datosOriginales);

    if (!resultado.success) {
      const error = resultado.error as ZodError;
      // Se transforma el array de errores de zod en un formato más simple y
      // legible para el cliente: campo afectado, mensaje y código de error.
      const detalles = error.errors.map((problema) => ({
        campo: problema.path.join('.'),
        mensaje: problema.message,
        codigo: problema.code,
      }));
      return siguiente(new ErrorValidacion(`Datos inválidos en ${fuente}`, detalles));
    }

    // Sobrescribimos con los datos parseados (incluye defaults aplicados por zod),
    // de forma que los controladores reciban siempre datos ya saneados y tipados.
    if (fuente === 'body') {
      peticion.body = resultado.data;
    } else if (fuente === 'query') {
      // No reasignamos peticion.query (es readonly en Express 5); guardamos en validados.
      // En este proyecto la accedemos vía peticion.query directamente, ya validada.
      (peticion as Request & { datosValidados?: unknown }).datosValidados = resultado.data;
    } else {
      peticion.params = resultado.data as Request['params'];
    }

    siguiente();
  };
}
