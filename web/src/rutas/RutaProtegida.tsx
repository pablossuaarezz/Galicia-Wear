// Guarda de ruta: exige sesión iniciada. Mientras se rehidrata muestra el cargador; si no hay
// sesión, redirige a /login conservando el destino para volver tras autenticarse.
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usarSesion } from '@/contexto/ContextoSesion';
import { PantallaCargando } from './PantallaCargando';

/** Envuelve rutas que requieren sesión: muestra cargador, redirige a login si no hay sesión. */
export function RutaProtegida({ children }: { children: ReactNode }) {
  const { estaAutenticado, cargando } = usarSesion();
  const ubicacion = useLocation();

  if (cargando) return <PantallaCargando />;
  if (!estaAutenticado) {
    const destino = encodeURIComponent(ubicacion.pathname + ubicacion.search);
    return <Navigate to={`/login?destino=${destino}`} replace />;
  }
  return <>{children}</>;
}
