/* eslint-disable react-refresh/only-export-components */
// Sesión del usuario: estado de autenticación + acciones (login, registro, logout) y
// rehidratación al arrancar a partir del tokenRefresco persistido. Concentra aquí el ciclo de
// vida del token para que el resto de la app solo consuma `usarSesion`.
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiAuth } from '@/api/endpoints/auth';
import {
  establecerSesion,
  hayTokenRefresco,
  limpiarSesion,
  registrarCierreForzado,
} from '@/api/clienteApi';
import { desconectarSocket } from '@/tiempoReal/socket';
import type { EntradaLogin, EntradaRegistro, PerfilUsuario, Rol } from '@/api/tipos';

interface ValorSesion {
  usuario: PerfilUsuario | null;
  rol: Rol | null;
  estaAutenticado: boolean;
  esDisenador: boolean;
  /** True mientras se intenta rehidratar la sesión al cargar la página. */
  cargando: boolean;
  iniciarSesion: (datos: EntradaLogin) => Promise<PerfilUsuario>;
  registrarse: (datos: EntradaRegistro) => Promise<PerfilUsuario>;
  cerrarSesion: () => Promise<void>;
  refrescarPerfil: () => Promise<void>;
}

const ContextoSesion = createContext<ValorSesion | null>(null);

/** Proveedor que expone el estado de sesión y las acciones de autenticación a toda la app. */
export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<PerfilUsuario | null>(null);
  const [cargando, setCargando] = useState<boolean>(() => hayTokenRefresco());
  const clienteConsultas = useQueryClient();
  const rehidratado = useRef(false);

  // Rehidratación: si hay tokenRefresco persistido, recuperamos el perfil (el clienteApi
  // renovará el access token automáticamente al recibir el primer 401).
  useEffect(() => {
    if (rehidratado.current) return;
    rehidratado.current = true;

    if (!hayTokenRefresco()) {
      setCargando(false);
      return;
    }
    apiAuth
      .yo()
      .then((perfil) => setUsuario(perfil))
      .catch(() => {
        limpiarSesion();
        setUsuario(null);
      })
      .finally(() => setCargando(false));
  }, []);

  // Si una renovación falla en mitad de la sesión, el clienteApi fuerza el cierre.
  useEffect(() => {
    return registrarCierreForzado(() => {
      setUsuario(null);
      clienteConsultas.clear();
      desconectarSocket();
    });
  }, [clienteConsultas]);

  const valor = useMemo<ValorSesion>(() => {
    /** Login: guarda los tokens, carga el perfil y actualiza el estado de sesión. */
    async function iniciarSesion(datos: EntradaLogin): Promise<PerfilUsuario> {
      const tokens = await apiAuth.login(datos);
      establecerSesion(tokens);
      const perfil = await apiAuth.yo();
      setUsuario(perfil);
      return perfil;
    }

    /** Registro: crea la cuenta, deja la sesión iniciada y carga el perfil. */
    async function registrarse(datos: EntradaRegistro): Promise<PerfilUsuario> {
      const tokens = await apiAuth.registro(datos);
      establecerSesion(tokens);
      const perfil = await apiAuth.yo();
      setUsuario(perfil);
      return perfil;
    }

    /** Logout: revoca la sesión en el servidor y limpia tokens, socket y caché de consultas. */
    async function cerrarSesion(): Promise<void> {
      await apiAuth.logout();
      limpiarSesion();
      desconectarSocket();
      setUsuario(null);
      clienteConsultas.clear();
    }

    /** Recarga el perfil del usuario (tras editar datos personales, por ejemplo). */
    async function refrescarPerfil(): Promise<void> {
      const perfil = await apiAuth.yo();
      setUsuario(perfil);
    }

    return {
      usuario,
      rol: usuario?.rol ?? null,
      estaAutenticado: usuario !== null,
      esDisenador: usuario?.rol === 'DISENADOR',
      cargando,
      iniciarSesion,
      registrarse,
      cerrarSesion,
      refrescarPerfil,
    };
  }, [usuario, cargando, clienteConsultas]);

  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>;
}

/** Hook de acceso a la sesión; lanza si se usa fuera del proveedor. */
export function usarSesion(): ValorSesion {
  const contexto = useContext(ContextoSesion);
  if (!contexto) throw new Error('usarSesion debe usarse dentro de <ProveedorSesion>');
  return contexto;
}
