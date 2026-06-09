// Cliente Socket.IO compartido para el chat en tiempo real. Conecta al mismo origen (el proxy
// de Vite en dev / nginx en prod reenvían /socket.io al backend). El JWT se envía en el
// handshake con una función `auth`, que se reevalúa en cada reconexión para usar el token vigente.
import { io, type Socket } from 'socket.io-client';
import { obtenerTokenAcceso } from '@/api/clienteApi';

let socket: Socket | null = null;

export function obtenerSocket(): Socket {
  if (!socket) {
    socket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
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
