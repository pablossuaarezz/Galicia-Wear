// Punto único de acceso a la capa de datos: clientes por dominio + utilidades del cliente HTTP.
// Reexporta cada `api*` (objeto con los métodos de un recurso) definido en src/api/endpoints/,
// de forma que el resto de la aplicación pueda importar todo desde '@/api' sin conocer
// la estructura interna de carpetas.

/** Clase de error tipado para respuestas de error de la API (ver clienteApi.ts). */
export { ErrorApi } from './clienteApi';
/** Endpoints de autenticación: registro, login, perfil y logout. */
export { apiAuth } from './endpoints/auth';
export { apiProductos } from './endpoints/productos';
export { apiCarrito } from './endpoints/carrito';
export { apiPedidos } from './endpoints/pedidos';
export { apiDirecciones } from './endpoints/direcciones';
export { apiDisenadores } from './endpoints/disenadores';
export { apiCertificados } from './endpoints/catalogoApoyo';
export { apiUsuarios } from './endpoints/usuarios';
export { apiVariantes } from './endpoints/variantes';
export { apiImagenes } from './endpoints/imagenes';
export { apiNotificaciones } from './endpoints/notificaciones';
export { apiChat } from './endpoints/chat';
