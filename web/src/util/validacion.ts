// Validaciones de cliente que reflejan las reglas zod del backend, para dar feedback inline
// inmediato sin esperar al 400. El servidor sigue siendo la autoridad final.

export function validarCorreo(valor: string): string | undefined {
  const correo = valor.trim();
  if (!correo) return 'El correo es obligatorio';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return 'Correo electrónico no válido';
  return undefined;
}

export function validarContrasena(valor: string): string | undefined {
  if (valor.length < 8) return 'Mínimo 8 caracteres';
  if (!/[A-Z]/.test(valor)) return 'Debe incluir al menos una mayúscula';
  if (!/[a-z]/.test(valor)) return 'Debe incluir al menos una minúscula';
  if (!/[0-9]/.test(valor)) return 'Debe incluir al menos un número';
  return undefined;
}

export function validarObligatorio(valor: string, campo: string): string | undefined {
  return valor.trim() ? undefined : `${campo} es obligatorio`;
}

export function validarCodigoPostal(valor: string): string | undefined {
  return /^\d{5}$/.test(valor.trim()) ? undefined : 'El código postal debe tener 5 dígitos';
}

export function validarIban(valor: string): string | undefined {
  const iban = valor.toUpperCase().replace(/\s+/g, '');
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
