// Buscador de la barra de navegación: envía a /catalogo?busqueda=...
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { cx } from '@/util/cx';

export function BuscadorNav({ className, alEnviar }: { className?: string; alEnviar?: () => void }) {
  const [texto, setTexto] = useState('');
  const navegar = useNavigate();

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    const consulta = texto.trim();
    navegar(consulta ? `/catalogo?busqueda=${encodeURIComponent(consulta)}` : '/catalogo');
    alEnviar?.();
  }

  return (
    <form role="search" onSubmit={enviar} className={cx('relative', className)}>
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
