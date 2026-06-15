// Retrasa un valor para no disparar una petición por cada pulsación (búsqueda del catálogo).
//
// Hook genérico de "debounce": devuelve una copia del valor recibido que solo se actualiza
// cuando ha pasado un tiempo sin cambios. Se usa típicamente en campos de búsqueda para evitar
// lanzar una petición de red en cada pulsación de teclado.
import { useEffect, useState } from 'react';

/**
 * Devuelve una versión "retrasada" (debounced) del valor recibido.
 *
 * @typeParam T - Tipo del valor a retrasar (string, número, objeto, etc.).
 * @param valor Valor actual (p. ej. el texto del input de búsqueda), que puede cambiar en
 *   cada render.
 * @param retrasoMs Tiempo en milisegundos que debe transcurrir sin cambios en `valor` antes
 *   de propagar la actualización. Por defecto 350 ms.
 * @returns El último valor de `valor` que permaneció estable durante `retrasoMs`
 *   milisegundos. Útil como dependencia de una consulta para evitar peticiones excesivas.
 */
export function usarDebounce<T>(valor: T, retrasoMs = 350): T {
  const [retrasado, setRetrasado] = useState(valor);
  useEffect(() => {
    // Programa la actualización del valor retrasado tras `retrasoMs` milisegundos.
    const temporizador = window.setTimeout(() => setRetrasado(valor), retrasoMs);
    // Si `valor` cambia antes de que se cumpla el plazo, se cancela el temporizador anterior
    // y se reinicia el conteo (efecto debounce clásico).
    return () => window.clearTimeout(temporizador);
  }, [valor, retrasoMs]);
  return retrasado;
}
