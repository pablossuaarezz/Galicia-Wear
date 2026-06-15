// JUSTIFICACIÓN: genera la especificación OpenAPI (Swagger) a partir de comentarios
// `@openapi` distribuidos por los módulos de la API. Se usa en `aplicacion.ts` para
// servir la documentación interactiva en `/api/docs` y el JSON en `/api/docs.json`.
import swaggerJsdoc from 'swagger-jsdoc';
import path from 'node:path';

/**
 * Configuración de swagger-jsdoc: metadatos generales de la API (título, versión,
 * descripción, licencia), servidores disponibles, esquema de seguridad (JWT Bearer),
 * etiquetas (`tags`) usadas para agrupar los endpoints por dominio en la UI, y la
 * ruta de los archivos donde swagger-jsdoc debe buscar anotaciones `@openapi`.
 */
const opciones: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'GaliciaWear API',
      version: '0.5.0',
      description:
        'API REST del marketplace de moda sostenible gallega. ' +
        'Obtén un token en `POST /auth/login` y úsalo como Bearer en los endpoints protegidos.',
      license: { name: 'MIT' },
    },
    servers: [{ url: 'http://localhost:3000', description: 'Desarrollo local' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenido en /auth/login o /auth/registro',
        },
      },
    },
    tags: [
      { name: 'Autenticación', description: 'Login, registro, refresh y logout' },
      { name: 'Usuarios', description: 'Perfil, contraseña y preferencias eco' },
      { name: 'Diseñadores', description: 'Perfiles de marca y validación admin' },
      { name: 'Certificados', description: 'Catálogo de certificados sostenibles' },
      { name: 'Productos', description: 'Catálogo del marketplace con filtros eco' },
      { name: 'Variantes', description: 'Tallas, colores y stock por SKU' },
      { name: 'Imágenes', description: 'Imágenes de producto' },
      { name: 'Direcciones', description: 'Direcciones de envío del cliente' },
      { name: 'Carrito', description: 'Gestión del carrito de la compra' },
      { name: 'Pedidos', description: 'Checkout y seguimiento de pedidos' },
      { name: 'Envíos', description: 'Tracking y estados del envío' },
    ],
  },
  // swagger-jsdoc escanea los comentarios @openapi en todos los módulos
  apis: [path.join(__dirname, '..', 'modulos', '**', '*.ts')],
};

/**
 * Especificación OpenAPI generada en tiempo de carga del módulo, combinando las
 * `opciones` definidas arriba con todos los comentarios `@openapi` encontrados en
 * los archivos de rutas de cada módulo. Se sirve tal cual mediante Swagger UI y
 * como JSON en `/api/docs.json`.
 */
export const especificacionSwagger = swaggerJsdoc(opciones);
