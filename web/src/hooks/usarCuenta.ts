// Hooks de la zona de cuenta del cliente: perfil completo y direcciones.
import { useQuery } from '@tanstack/react-query';
import { apiUsuarios } from '@/api/endpoints/usuarios';
import { apiDirecciones } from '@/api/endpoints/direcciones';
import { usarSesion } from '@/contexto/ContextoSesion';

export function usarPerfil() {
  const { estaAutenticado } = usarSesion();
  return useQuery({
    queryKey: ['perfilUsuario'],
    queryFn: () => apiUsuarios.yo(),
    enabled: estaAutenticado,
  });
}

export function usarDirecciones() {
  const { estaAutenticado } = usarSesion();
  return useQuery({
    queryKey: ['direcciones'],
    queryFn: () => apiDirecciones.listar(),
    enabled: estaAutenticado,
  });
}
