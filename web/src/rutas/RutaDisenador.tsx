// Guarda de ruta del dashboard: exige sesión iniciada y rol DISENADOR. Un cliente autenticado
// que intente entrar al panel se redirige al inicio.
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usarSesion } from '@/contexto/ContextoSesion';
import { PantallaCargando } from './PantallaCargando';

/** Guarda del dashboard: requiere sesión y rol DISENADOR; redirige al inicio a otros roles. */
export function RutaDisenador({ children }: { children: ReactNode }) {
  const { estaAutenticado, esDisenador, cargando } = usarSesion();
  const ubicacion = useLocation();

  if (cargando) return <PantallaCargando />;
  if (!estaAutenticado) {
    const destino = encodeURIComponent(ubicacion.pathname + ubicacion.search);
    return <Navigate to={`/login?destino=${destino}`} replace />;
  }
  if (!esDisenador) return <Navigate to="/" replace />;
  return <>{children}</>;
}
