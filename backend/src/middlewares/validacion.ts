// JUSTIFICACIÓN: middleware que valida `body`, `query` o `params` con un esquema zod.
// Si la validación falla, se lanza `ErrorValidacion` con detalles legibles.
// El controlador recibe siempre datos ya tipados → menos `as any`, menos bugs.
import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { ErrorValidacion } from '../utilidades/errores';

type FuenteValidacion = 'body' | 'query' | 'params';

export function validar<T>(esquema: ZodSchema<T>, fuente: FuenteValidacion = 'body') {
  return (peticion: Request, _respuesta: Response, siguiente: NextFunction): void => {
    const datosOriginales = peticion[fuente];
    const resultado = esquema.safeParse(datosOriginales);

    if (!resultado.success) {
      const error = resultado.error as ZodError;
      const detalles = error.errors.map((problema) => ({
        campo: problema.path.join('.'),
        mensaje: problema.message,
        codigo: problema.code,
      }));
      return siguiente(new ErrorValidacion(`Datos inválidos en ${fuente}`, detalles));
    }

    // Sobrescribimos con los datos parseados (incluye defaults aplicados por zod)
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
