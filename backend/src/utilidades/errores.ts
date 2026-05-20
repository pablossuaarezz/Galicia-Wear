// JUSTIFICACIÓN: jerarquía de errores tipados → permite distinguir errores de negocio
// (cliente debe verlos) de errores internos (cliente solo ve "Internal Server Error").
// Cumple "POO + herencia" de la rúbrica DAM.

export class ErrorAplicacion extends Error {
  public readonly codigoEstado: number;
  public readonly codigo: string;
  public readonly detalles?: unknown;

  constructor(mensaje: string, codigoEstado = 500, codigo = 'ERROR_INTERNO', detalles?: unknown) {
    super(mensaje);
    this.name = this.constructor.name;
    this.codigoEstado = codigoEstado;
    this.codigo = codigo;
    this.detalles = detalles;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ErrorValidacion extends ErrorAplicacion {
  constructor(mensaje: string, detalles?: unknown) {
    super(mensaje, 400, 'ERROR_VALIDACION', detalles);
  }
}

export class ErrorNoAutenticado extends ErrorAplicacion {
  constructor(mensaje = 'No autenticado') {
    super(mensaje, 401, 'NO_AUTENTICADO');
  }
}

export class ErrorAccesoDenegado extends ErrorAplicacion {
  constructor(mensaje = 'Acceso denegado') {
    super(mensaje, 403, 'ACCESO_DENEGADO');
  }
}

export class ErrorNoEncontrado extends ErrorAplicacion {
  constructor(recurso = 'Recurso') {
    super(`${recurso} no encontrado`, 404, 'NO_ENCONTRADO');
  }
}

export class ErrorConflicto extends ErrorAplicacion {
  constructor(mensaje: string, detalles?: unknown) {
    super(mensaje, 409, 'CONFLICTO', detalles);
  }
}

export class ErrorReglaDeNegocio extends ErrorAplicacion {
  constructor(mensaje: string, detalles?: unknown) {
    super(mensaje, 422, 'REGLA_NEGOCIO', detalles);
  }
}
