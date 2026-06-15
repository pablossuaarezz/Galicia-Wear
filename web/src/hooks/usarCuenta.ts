// Hooks de la zona de cuenta del cliente: perfil completo y direcciones.
//
// Ambos hooks consultan datos privados del usuario autenticado (perfil propio y libreta de
// direcciones de envío), por lo que las consultas se desactivan automáticamente si no hay
// sesión iniciada.
import { useQuery } from '@tanstack/react-query';
import { apiUsuarios } from '@/api/endpoints/usuarios';
import { apiDirecciones } from '@/api/endpoints/direcciones';
import { usarSesion } from '@/contexto/ContextoSesion';

/**
 * Obtiene el perfil completo del usuario autenticado (datos personales, etc.).
 *
 * @returns El resultado de `useQuery` con el perfil del usuario. La consulta solo se ejecuta
 *   si hay sesión iniciada.
 */
export function usarPerfil() {
  const { estaAutenticado } = usarSesion();
  return useQuery({
    queryKey: ['perfilUsuario'],
    queryFn: () => apiUsuarios.yo(),
    enabled: estaAutenticado,
  });
}

/**
 * Obtiene la lista de direcciones de envío guardadas por el usuario autenticado.
 *
 * @returns El resultado de `useQuery` con la lista de direcciones. La consulta solo se
 *   ejecuta si hay sesión iniciada.
 */
export function usarDirecciones() {
  const { estaAutenticado } = usarSesion();
  return useQuery({
    queryKey: ['direcciones'],
    queryFn: () => apiDirecciones.listar(),
    enabled: estaAutenticado,
  });
}
