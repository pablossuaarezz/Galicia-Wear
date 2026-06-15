// Ajusta document.title por página (SEO básico sin dependencias). Restaura al desmontar.
//
// Hook ligero para gestionar el título de la pestaña del navegador desde cada página de la
// SPA, sin depender de librerías externas de gestión de `<head>`.
import { useEffect } from 'react';

/**
 * Establece el título del documento (`document.title`) mientras el componente que lo invoca
 * está montado, y restaura el título previo al desmontarse.
 *
 * @param titulo Título específico de la página (opcional). Si se proporciona, el título final
 *   será `"<titulo> · GaliciaWear"`; si se omite, se usa el título genérico de la aplicación
 *   ("GaliciaWear — Moda sostenible gallega").
 * @returns No devuelve nada; el efecto secundario es la modificación de `document.title`.
 */
export function usarTitulo(titulo?: string): void {
  useEffect(() => {
    // Guarda el título anterior para poder restaurarlo al desmontar el componente
    // (p. ej. al navegar a otra página que no use este hook).
    const previo = document.title;
    document.title = titulo
      ? `${titulo} · GaliciaWear`
      : 'GaliciaWear — Moda sostenible gallega';
    return () => {
      document.title = previo;
    };
  }, [titulo]);
}
