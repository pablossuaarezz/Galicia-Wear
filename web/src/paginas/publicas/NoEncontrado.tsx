// Página 404 cuidada, con enlace de vuelta al catálogo.
import { Compass } from 'lucide-react';
import { EnlaceBoton } from '@/componentes/ui';
import { usarTitulo } from '@/hooks/usarTitulo';

export default function NoEncontrado() {
  usarTitulo('Página no encontrada');
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-atlantic-50 text-atlantic-500">
        <Compass className="h-8 w-8" aria-hidden />
      </div>
      <p className="font-editorial text-6xl font-semibold text-atlantic-900">404</p>
      <h1 className="mt-3 font-display text-2xl font-semibold text-tinta-900">
        Esta página se perdió en la marea
      </h1>
      <p className="mt-2 text-tinta-500">
        No encontramos lo que buscabas. Quizá la prenda ya no está disponible o el enlace cambió.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <EnlaceBoton to="/catalogo" variante="primario">
          Ver el catálogo
        </EnlaceBoton>
        <EnlaceBoton to="/" variante="secundario">
          Volver al inicio
        </EnlaceBoton>
      </div>
    </div>
  );
}
