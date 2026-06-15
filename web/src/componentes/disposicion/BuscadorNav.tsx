// Buscador de la barra de navegación: envía a /catalogo?busqueda=...
//
// Se usa tanto en la barra de escritorio (BarraNavegacion) como dentro del cajón de navegación
// móvil. Es un componente "no controlado" desde fuera: mantiene su propio estado de texto y
// solo notifica al padre (mediante `alEnviar`) cuando se envía el formulario, para que este
// pueda cerrar el cajón si procede.
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { cx } from '@/util/cx';

/**
 * Campo de búsqueda que redirige a la página de catálogo con el término introducido como
 * parámetro de consulta `busqueda`.
 *
 * @param className - Clases Tailwind adicionales para el formulario contenedor.
 * @param alEnviar - Callback opcional invocado tras enviar el formulario (por ejemplo, para
 *   cerrar el cajón de navegación móvil tras realizar la búsqueda).
 */
export function BuscadorNav({ className, alEnviar }: { className?: string; alEnviar?: () => void }) {
  // Texto introducido por el usuario; se mantiene en estado local del componente.
  const [texto, setTexto] = useState('');
  const navegar = useNavigate();

  /**
   * Maneja el envío del formulario de búsqueda: evita la recarga de página, recorta espacios
   * en blanco y navega a `/catalogo` (con o sin parámetro `busqueda` según si hay texto).
   */
  function enviar(evento: FormEvent) {
    evento.preventDefault();
    const consulta = texto.trim();
    // Si no hay texto, se navega al catálogo sin filtro de búsqueda.
    navegar(consulta ? `/catalogo?busqueda=${encodeURIComponent(consulta)}` : '/catalogo');
    // Notifica al componente padre (p. ej. para cerrar el cajón móvil).
    alEnviar?.();
  }

  return (
    <form role="search" onSubmit={enviar} className={cx('relative', className)}>
      {/* Icono decorativo de lupa; no interactivo y oculto a lectores de pantalla. */}
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-400"
        aria-hidden
      />
      <input
        type="search"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Buscar prendas, materiales…"
        aria-label="Buscar en el catálogo"
        className="h-10 w-full rounded-full border border-piedra-200 bg-sand-50 pl-9 pr-4 text-sm text-tinta-800 placeholder:text-tinta-400 transition-colors focus:border-atlantic-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-atlantic-500/30"
      />
    </form>
  );
}
