// Cliente Socket.IO compartido para el chat en tiempo real. Conecta al mismo origen (el proxy
// de Vite en dev / nginx en prod reenvían /socket.io al backend). El JWT se envía en el
// handshake con una función `auth`, que se reevalúa en cada reconexión para usar el token vigente.
import { io, type Socket } from 'socket.io-client';
import { obtenerTokenAcceso } from '@/api/clienteApi';

// Instancia única (singleton) del socket. Se crea de forma perezosa la primera vez que se
// solicita y se reutiliza en toda la aplicación para no abrir múltiples conexiones.
let socket: Socket | null = null;

/**
 * Devuelve el socket compartido de la aplicación, creándolo en la primera invocación.
 *
 * @returns La instancia única de `Socket` conectada al mismo origen. El JWT se envía en el
 *   handshake mediante la función `auth`, que `socket.io-client` reevalúa en cada (re)conexión,
 *   garantizando que siempre se use el token de acceso vigente.
 */
export function obtenerSocket(): Socket {
  if (!socket) {
    socket = io({
      // Ruta del endpoint de Socket.IO; el proxy de Vite (dev) o nginx (prod) la reenvían al backend.
      path: '/socket.io',
      // Se prioriza WebSocket y se mantiene polling como respaldo si el túnel WS no está disponible.
      transports: ['websocket', 'polling'],
      // Función de autenticación reevaluada en cada conexión: adjunta el token JWT al handshake.
      auth: (cb) => cb({ token: obtenerTokenAcceso() ?? '' }),
    });
  }
  return socket;
}

/** Cierra el socket (al cerrar sesión). La próxima llamada a obtenerSocket() crea uno nuevo. */
export function desconectarSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
