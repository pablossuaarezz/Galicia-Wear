// JUSTIFICACIÓN: separar `aplicacion` (Express puro, testeable con Supertest) de `index.ts`
// (arranque). Esto permite tests de integración sin abrir puertos reales.
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

export function crearAplicacion(): Application {
  const aplicacion = express();

  // 1. Seguridad: cabeceras HTTP estándar (CSP, XSS, HSTS, ...)
  aplicacion.use(helmet());

  // 2. CORS controlado por variable de entorno
  aplicacion.use(cors({ origin: entorno.CORS_ORIGIN, credentials: true }));

  // 3. Body parsers
  aplicacion.use(express.json({ limit: '1mb' }));
  aplicacion.use(express.urlencoded({ extended: true }));

  // 4. Logger HTTP estructurado
  aplicacion.use(pinoHttp({ logger: registrador }));

  // 5. Rate limit global (anti DoS básico)
  const limiteGlobal = rateLimit({
    windowMs: entorno.RATE_LIMIT_WINDOW_MS,
    max: entorno.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  });
  aplicacion.use(limiteGlobal);

  // 6. Swagger UI + spec JSON (sin helmet para que cargue el CSS/JS de swagger-ui-dist)
  aplicacion.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(especificacionSwagger, { customSiteTitle: 'GaliciaWear API Docs' }),
  );
  aplicacion.get('/api/docs.json', (_peticion: Request, respuesta: Response) => {
    respuesta.json(especificacionSwagger);
  });

  // 7. Endpoints públicos
  aplicacion.get('/salud', (_peticion: Request, respuesta: Response) => {
    respuesta.status(200).json({
      estado: 'ok',
      servicio: 'galiciawear-backend',
      version: '0.6.0',
      entorno: entorno.NODE_ENV,
      marcaTiempo: new Date().toISOString(),
    });
  });

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

  // 8. Rutas de la API REST
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

  // 9. 404 controlado para cualquier ruta no definida
  aplicacion.use((_peticion: Request, respuesta: Response) => {
    respuesta.status(404).json({ error: 'Recurso no encontrado', codigo: 'NO_ENCONTRADO' });
  });

  // 10. Handler de errores global (DEBE ir el último)
  aplicacion.use(manejadorErrores);

  return aplicacion;
}
