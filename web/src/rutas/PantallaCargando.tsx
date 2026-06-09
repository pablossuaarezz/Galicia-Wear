// Pantalla de carga a pantalla (rehidratación de sesión, comprobación de guardas).
import { Spinner } from '@/componentes/ui';

export function PantallaCargando() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center text-atlantic-500">
      <Spinner tamano={32} />
    </div>
  );
}
