// Validaciones de cliente que reflejan las reglas zod del backend, para dar feedback inline
// inmediato sin esperar al 400. El servidor sigue siendo la autoridad final: estas funciones
// solo mejoran la experiencia de usuario adelantando los errores más evidentes en el navegador.
// Todas devuelven `undefined` si el valor es válido o un mensaje de error legible si no lo es.

/**
 * Valida una dirección de correo electrónico.
 *
 * @param valor - Texto introducido por el usuario (se recorta de espacios).
 * @returns `undefined` si es válido, o un mensaje de error en castellano.
 */
export function validarCorreo(valor: string): string | undefined {
  const correo = valor.trim();
  if (!correo) return 'El correo es obligatorio';
  // Patrón laxo: exige texto, una arroba, dominio y un punto, sin espacios ni arrobas extra.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return 'Correo electrónico no válido';
  return undefined;
}

/**
 * Valida la robustez de una contraseña según la política del backend.
 *
 * @param valor - Contraseña en claro a validar (no se recorta: los espacios cuentan).
 * @returns `undefined` si cumple todos los requisitos, o el primer error encontrado.
 */
export function validarContrasena(valor: string): string | undefined {
  // Requisitos acumulativos: longitud mínima y presencia de mayúscula, minúscula y dígito.
  if (valor.length < 8) return 'Mínimo 8 caracteres';
  if (!/[A-Z]/.test(valor)) return 'Debe incluir al menos una mayúscula';
  if (!/[a-z]/.test(valor)) return 'Debe incluir al menos una minúscula';
  if (!/[0-9]/.test(valor)) return 'Debe incluir al menos un número';
  return undefined;
}

/**
 * Valida que un campo de texto no esté vacío (ignorando espacios en blanco).
 *
 * @param valor - Texto a comprobar.
 * @param campo - Nombre del campo, usado para componer el mensaje de error.
 * @returns `undefined` si tiene contenido, o un mensaje indicando que es obligatorio.
 */
export function validarObligatorio(valor: string, campo: string): string | undefined {
  return valor.trim() ? undefined : `${campo} es obligatorio`;
}

/**
 * Valida un código postal español (exactamente 5 dígitos).
 *
 * @param valor - Código postal introducido (se recorta de espacios).
 * @returns `undefined` si tiene 5 dígitos, o un mensaje de error.
 */
export function validarCodigoPostal(valor: string): string | undefined {
  return /^\d{5}$/.test(valor.trim()) ? undefined : 'El código postal debe tener 5 dígitos';
}

/**
 * Valida la estructura formal de un IBAN (no comprueba el dígito de control).
 *
 * @param valor - IBAN introducido; se normaliza a mayúsculas y se le quitan los espacios.
 * @returns `undefined` si encaja con el formato esperado, o un mensaje de error.
 */
export function validarIban(valor: string): string | undefined {
  // Normalización: mayúsculas y sin espacios, como se suele escribir agrupado de 4 en 4.
  const iban = valor.toUpperCase().replace(/\s+/g, '');
  // Estructura: 2 letras de país + 2 dígitos de control + hasta 30 caracteres alfanuméricos.
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/.test(iban)) return 'Formato de IBAN no válido';
  return undefined;
}

/** Extrae un mensaje legible de cualquier error (ErrorApi u otro). */
export function mensajeDeError(error: unknown, porDefecto = 'Ha ocurrido un error'): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const mensaje = (error as { message?: unknown }).message;
    if (typeof mensaje === 'string' && mensaje) return mensaje;
  }
  return porDefecto;
}
