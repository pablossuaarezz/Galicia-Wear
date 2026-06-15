/**
 * Rutas del módulo Carrito.
 *
 * Define el router de Express para los endpoints del carrito de la compra,
 * incluyendo la documentación OpenAPI/Swagger de cada ruta. Todos los
 * endpoints requieren que el usuario esté autenticado (middleware `verificarJwt`)
 * y la creación/actualización de ítems valida el cuerpo de la petición con
 * el DTO `dtoAgregarItem` mediante el middleware `validar`.
 */
import { Router } from 'express';
import { verificarJwt } from '../../middlewares/autenticacion';
import { validar } from '../../middlewares/validacion';
import { controladorCarrito } from './controlador';
import { dtoAgregarItem } from './dto';

export const rutasCarrito = Router();

// Todos los endpoints de /carrito requieren autenticación
rutasCarrito.use(verificarJwt);

/**
 * @openapi
 * /carrito:
 *   get:
 *     tags: [Carrito]
 *     summary: Devuelve el carrito del cliente autenticado con detalles de cada artículo
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Carrito con ítems }
 *       403: { description: Solo clientes tienen carrito }
 */
rutasCarrito.get('/', controladorCarrito.obtener);

/**
 * @openapi
 * /carrito/items:
 *   post:
 *     tags: [Carrito]
 *     summary: Añade o actualiza un artículo en el carrito (si ya existe, actualiza la cantidad)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Carrito actualizado }
 */
rutasCarrito.post('/items', validar(dtoAgregarItem), controladorCarrito.agregarItem);

/**
 * @openapi
 * /carrito/items/{varianteId}:
 *   delete:
 *     tags: [Carrito]
 *     summary: Elimina un artículo concreto del carrito
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Carrito sin el artículo eliminado }
 *       404: { description: Artículo no encontrado en el carrito }
 */
rutasCarrito.delete('/items/:varianteId', controladorCarrito.eliminarItem);

/**
 * @openapi
 * /carrito:
 *   delete:
 *     tags: [Carrito]
 *     summary: Vacía todos los artículos del carrito
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       204: { description: Carrito vaciado }
 */
rutasCarrito.delete('/', controladorCarrito.vaciar);
