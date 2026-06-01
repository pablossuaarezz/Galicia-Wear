import swaggerJsdoc from 'swagger-jsdoc';
import path from 'node:path';

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

export const especificacionSwagger = swaggerJsdoc(opciones);
