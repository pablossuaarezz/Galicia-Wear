// Ajusta document.title por página (SEO básico sin dependencias). Restaura al desmontar.
import { useEffect } from 'react';

export function usarTitulo(titulo?: string): void {
  useEffect(() => {
    const previo = document.title;
    document.title = titulo
      ? `${titulo} · GaliciaWear`
      : 'GaliciaWear — Moda sostenible gallega';
    return () => {
      document.title = previo;
    };
  }, [titulo]);
}
