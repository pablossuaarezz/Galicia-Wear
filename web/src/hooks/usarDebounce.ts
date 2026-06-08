// Retrasa un valor para no disparar una petición por cada pulsación (búsqueda del catálogo).
import { useEffect, useState } from 'react';

export function usarDebounce<T>(valor: T, retrasoMs = 350): T {
  const [retrasado, setRetrasado] = useState(valor);
  useEffect(() => {
    const temporizador = window.setTimeout(() => setRetrasado(valor), retrasoMs);
    return () => window.clearTimeout(temporizador);
  }, [valor, retrasoMs]);
  return retrasado;
}
