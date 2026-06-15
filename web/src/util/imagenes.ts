// Normaliza la URL de una imagen servida por el backend. Las fotos de prenda se guardan con una
// URL ABSOLUTA construida con el host de quien subió (p. ej. desde Android: `http://10.0.2.2:3000
// /uploads/...`), que el navegador no puede alcanzar. Si la URL apunta a `/uploads/…`, la
// convertimos a ruta RELATIVA para que pase por el proxy (Vite en dev, nginx en prod) hacia el
// backend. Las URLs externas (Unsplash https, data URI base64…) se devuelven intactas.
/**
 * Normaliza la URL de una imagen para que sea alcanzable desde el navegador.
 *
 * Si la URL contiene el segmento `/uploads/` (foto subida al backend, posiblemente con un host
 * absoluto inservible para el navegador), la recorta a su parte relativa para que el proxy la
 * redirija al backend. Cualquier otra URL (externa o data URI) se devuelve sin cambios.
 *
 * @param url - URL original de la imagen (puede ser nula o indefinida).
 * @returns URL utilizable por el navegador, o `undefined` si no se proporcionó URL.
 */
export function resolverImagen(url?: string | null): string | undefined {
  if (!url) return undefined;
  // Si la URL apunta a un archivo subido, nos quedamos solo desde "/uploads/" (ruta relativa).
  const indice = url.indexOf('/uploads/');
  return indice >= 0 ? url.slice(indice) : url;
}

// Lee un archivo de imagen y lo reduce a un data URI JPEG (igual que hace la app Android antes
// de subir). Limita el lado mayor para no exceder el tamaño que acepta el backend.
export function archivoADataUri(archivo: File, maxLado = 1024, calidad = 0.82): Promise<string> {
  return new Promise((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onerror = () => rechazar(new Error('No se pudo leer el archivo'));
    lector.onload = () => {
      const imagen = new Image();
      imagen.onload = () => {
        const escala = Math.min(1, maxLado / Math.max(imagen.width, imagen.height));
        const ancho = Math.round(imagen.width * escala);
        const alto = Math.round(imagen.height * escala);
        const lienzo = document.createElement('canvas');
        lienzo.width = ancho;
        lienzo.height = alto;
        const contexto = lienzo.getContext('2d');
        if (!contexto) {
          resolver(lector.result as string);
          return;
        }
        contexto.drawImage(imagen, 0, 0, ancho, alto);
        resolver(lienzo.toDataURL('image/jpeg', calidad));
      };
      imagen.onerror = () => rechazar(new Error('El archivo no es una imagen válida'));
      imagen.src = lector.result as string;
    };
    lector.readAsDataURL(archivo);
  });
}
