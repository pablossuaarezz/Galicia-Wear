// JUSTIFICACIÓN: separar `aplicacion` (Express puro, testeable con Supertest) de `index.ts`
// (arranque). Esto permite tests de integración sin abrir puertos reales.
//
// Este módulo define y configura la instancia de Express de GaliciaWear: middlewares de
// seguridad (helmet, cors, rate limit), parseo del cuerpo de las peticiones, logging HTTP,
// documentación Swagger, montaje de todas las rutas de la API REST y los manejadores finales
// de 404 y de errores. No arranca ningún servidor HTTP (eso ocurre en `index.ts`).
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { entorno } from './configuracion/entorno';
import { DIR_SUBIDAS } from './configuracion/almacenamiento';
import { registrador } from './utilidades/registrador';
import { manejadorErrores } from './middlewares/manejadorErrores';
import { especificacionSwagger } from './configuracion/swagger';
import { rutasAutenticacion } from './modulos/autenticacion/rutas';
import { rutasUsuarios } from './modulos/usuarios/rutas';
import { rutasDisenadores } from './modulos/disenadores/rutas';
import { rutasDirecciones } from './modulos/direcciones/rutas';
import { rutasCertificados } from './modulos/certificados/rutas';
import { rutasProductos } from './modulos/productos/rutas';
import { rutasCarrito } from './modulos/carrito/rutas';
import { rutasPedidos } from './modulos/pedidos/rutas';
import { rutasChat } from './modulos/chat/rutas';
import { rutasNotificaciones } from './modulos/notificaciones/rutas';
import { rutasAdmin } from './modulos/admin/rutas';

/**
 * Crea y configura una instancia de la aplicación Express de GaliciaWear.
 *
 * Aplica, en orden, los middlewares de seguridad, CORS, parseo de cuerpo, logging,
 * límite de peticiones, documentación Swagger, endpoints públicos (salud y raíz),
 * servicio estático de imágenes subidas, todas las rutas de la API REST, un
 * manejador 404 genérico y, por último, el manejador de errores global.
 *
 * El orden de `aplicacion.use(...)` es importante: Express ejecuta los middlewares
 * en el orden en que se registran, por lo que el manejador de errores debe ir
 * siempre el último para poder capturar errores lanzados por cualquier middleware
 * o ruta anterior.
 *
 * @returns la instancia de `Application` de Express, lista para escuchar peticiones
 *          (mediante `.listen(...)` en `index.ts`) o para usarse directamente en tests
 *          con Supertest sin necesidad de abrir un puerto real.
 */
export function crearAplicacion(): Application {
  const aplicacion = express();

  // 1. Seguridad: cabeceras HTTP estándar (CSP, XSS, HSTS, ...)
  //    helmet() añade automáticamente cabeceras como X-Content-Type-Options,
  //    X-Frame-Options, Strict-Transport-Security, etc., reduciendo la superficie
  //    de ataque por configuración por defecto sin tener que añadirlas a mano.
  aplicacion.use(helmet());

  // 2. CORS controlado por variable de entorno: solo el origen configurado
  //    (la URL del frontend React) puede hacer peticiones con credenciales
  //    (cookies/cabeceras de autorización) desde el navegador.
  aplicacion.use(cors({ origin: entorno.CORS_ORIGIN, credentials: true }));

  // 3. Body parsers: permiten leer `peticion.body` como JSON (límite de 1MB para
  //    evitar payloads abusivos) y como formularios urlencoded.
  aplicacion.use(express.json({ limit: '1mb' }));
  aplicacion.use(express.urlencoded({ extended: true }));

  // 4. Logger HTTP estructurado: registra cada petición/respuesta (método, ruta,
  //    código de estado, duración) usando el logger pino compartido, en formato
  //    JSON apto para herramientas de observabilidad.
  aplicacion.use(pinoHttp({ logger: registrador }));

  // 5. Rate limit global (anti DoS básico): limita el número de peticiones por IP
  //    en una ventana de tiempo configurable mediante variables de entorno.
  const limiteGlobal = rateLimit({
    windowMs: entorno.RATE_LIMIT_WINDOW_MS,
    max: entorno.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    // No se cuentan recursos estáticos ni el health-check: una página del catálogo con muchas
    // imágenes de /uploads no debe agotar el cupo de la API (evita 429 espurios en la web).
    skip: (peticion) =>
      peticion.path.startsWith('/uploads') ||
      peticion.path === '/salud' ||
      peticion.path === '/',
  });
  aplicacion.use(limiteGlobal);

  // 6. Swagger UI + spec JSON: expone la documentación interactiva de la API
  //    (sin helmet para que cargue el CSS/JS de swagger-ui-dist, que helmet
  //    bloquearía por su política de seguridad de contenido por defecto)
  aplicacion.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(especificacionSwagger, { customSiteTitle: 'GaliciaWear API Docs' }),
  );
  aplicacion.get('/api/docs.json', (_peticion: Request, respuesta: Response) => {
    respuesta.json(especificacionSwagger);
  });

  // 7. Endpoints públicos:
  //    - /salud: usado por sistemas de monitorización/orquestación para comprobar
  //      que el servicio está vivo (no requiere autenticación).
  aplicacion.get('/salud', (_peticion: Request, respuesta: Response) => {
    respuesta.status(200).json({
      estado: 'ok',
      servicio: 'galiciawear-backend',
      version: '0.6.0',
      entorno: entorno.NODE_ENV,
      marcaTiempo: new Date().toISOString(),
    });
  });

  // - /: endpoint raíz informativo con un mensaje de bienvenida y enlace a la
  //   documentación; útil para verificar rápidamente que la API responde.
  aplicacion.get('/', (_peticion: Request, respuesta: Response) => {
    respuesta.status(200).json({
      mensaje: 'GaliciaWear API — moda sostenible gallega',
      documentacion: '/api/docs (disponible cuando se completen los módulos restantes)',
      version: '0.6.0',
    });
  });

  // 7b. Imágenes subidas (fotos de prenda) servidas estáticamente desde disco.
  //     En SQL solo se guarda la URL, así que no requiere migración.
  aplicacion.use(
    '/uploads',
    express.static(DIR_SUBIDAS, { maxAge: '7d', fallthrough: true }),
  );

  // 8. Rutas de la API REST: cada módulo expone su propio router de Express,
  //    montado bajo el prefijo correspondiente a su recurso.
  aplicacion.use('/auth', rutasAutenticacion);
  aplicacion.use('/usuarios', rutasUsuarios);
  aplicacion.use('/disenadores', rutasDisenadores);
  aplicacion.use('/direcciones', rutasDirecciones);
  aplicacion.use('/certificados', rutasCertificados);
  aplicacion.use('/productos', rutasProductos);
  aplicacion.use('/carrito', rutasCarrito);
  aplicacion.use('/pedidos', rutasPedidos);
  aplicacion.use('/chat', rutasChat);
  aplicacion.use('/notificaciones', rutasNotificaciones);
  aplicacion.use('/admin', rutasAdmin);

  // 9. 404 controlado para cualquier ruta no definida: si la petición llega hasta
  //    aquí, ninguna de las rutas anteriores ha coincidido, así que respondemos
  //    con un JSON consistente en lugar del HTML por defecto de Express.
  aplicacion.use((_peticion: Request, respuesta: Response) => {
    respuesta.status(404).json({ error: 'Recurso no encontrado', codigo: 'NO_ENCONTRADO' });
  });

  // 10. Handler de errores global (DEBE ir el último): Express lo reconoce como
  //     middleware de errores por tener 4 parámetros (error, peticion, respuesta,
  //     siguiente) y lo invoca cuando cualquier middleware/ruta anterior llama a
  //     `siguiente(error)` o lanza una excepción dentro de un handler async envuelto.
  aplicacion.use(manejadorErrores);

  return aplicacion;
}
