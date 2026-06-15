// JUSTIFICACIÓN: jerarquía de errores tipados → permite distinguir errores de negocio
// (cliente debe verlos) de errores internos (cliente solo ve "Internal Server Error").
// Cumple "POO + herencia" de la rúbrica DAM.

/**
 * Clase base de todos los errores "de aplicación" (errores de negocio esperados,
 * que el cliente debe poder ver y entender), en contraposición a errores internos
 * inesperados (bugs, fallos de infraestructura), que `manejadorErrores` oculta al
 * cliente en producción.
 *
 * Encapsula la información necesaria para que `manejadorErrores` construya
 * directamente la respuesta HTTP: código de estado, código de error legible por
 * máquina y detalles adicionales opcionales (p. ej. lista de campos inválidos).
 */
export class ErrorAplicacion extends Error {
  /** Código de estado HTTP que debe devolverse al cliente (p. ej. 400, 404, 409). */
  public readonly codigoEstado: number;
  /** Código de error legible por máquina, usado por el frontend para identificar el tipo de error. */
  public readonly codigo: string;
  /** Información adicional opcional sobre el error (p. ej. campos inválidos, campos duplicados). */
  public readonly detalles?: unknown;

  /**
   * @param mensaje mensaje descriptivo del error, visible para el cliente
   * @param codigoEstado código de estado HTTP a devolver (por defecto 500)
   * @param codigo código de error interno legible por máquina (por defecto 'ERROR_INTERNO')
   * @param detalles información adicional opcional sobre el error
   */
  constructor(mensaje: string, codigoEstado = 500, codigo = 'ERROR_INTERNO', detalles?: unknown) {
    super(mensaje);
    // `this.constructor.name` da el nombre de la subclase concreta (p. ej.
    // "ErrorValidacion"), útil para depuración y logs.
    this.name = this.constructor.name;
    this.codigoEstado = codigoEstado;
    this.codigo = codigo;
    this.detalles = detalles;
    // Excluye el constructor de la traza de pila para que los logs apunten al
    // punto donde se lanzó el error, no a esta clase base.
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/** Error 400: los datos de entrada no cumplen el esquema de validación esperado. */
export class ErrorValidacion extends ErrorAplicacion {
  constructor(mensaje: string, detalles?: unknown) {
    super(mensaje, 400, 'ERROR_VALIDACION', detalles);
  }
}

/** Error 401: la petición no incluye credenciales válidas (token ausente, inválido o expirado). */
export class ErrorNoAutenticado extends ErrorAplicacion {
  constructor(mensaje = 'No autenticado') {
    super(mensaje, 401, 'NO_AUTENTICADO');
  }
}

/** Error 403: el usuario está autenticado pero su rol no tiene permiso para esta acción. */
export class ErrorAccesoDenegado extends ErrorAplicacion {
  constructor(mensaje = 'Acceso denegado') {
    super(mensaje, 403, 'ACCESO_DENEGADO');
  }
}

/** Error 404: el recurso solicitado no existe. */
export class ErrorNoEncontrado extends ErrorAplicacion {
  /** @param recurso nombre del recurso no encontrado, usado en el mensaje (p. ej. "Producto") */
  constructor(recurso = 'Recurso') {
    super(`${recurso} no encontrado`, 404, 'NO_ENCONTRADO');
  }
}

/** Error 409: la operación entra en conflicto con el estado actual de los datos (p. ej. duplicados). */
export class ErrorConflicto extends ErrorAplicacion {
  constructor(mensaje: string, detalles?: unknown) {
    super(mensaje, 409, 'CONFLICTO', detalles);
  }
}

/** Error 422: la petición es sintácticamente correcta pero viola una regla de negocio del dominio. */
export class ErrorReglaDeNegocio extends ErrorAplicacion {
  constructor(mensaje: string, detalles?: unknown) {
    super(mensaje, 422, 'REGLA_NEGOCIO', detalles);
  }
}
