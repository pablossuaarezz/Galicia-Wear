import { Router } from 'express';
import { z } from 'zod';
import { CodigoCertificado } from '@prisma/client';
import { validar } from '../../middlewares/validacion';
import { controladorCertificados } from './controlador';

export const rutasCertificados = Router();

const dtoCodigoCertificado = z.object({
  codigo: z.nativeEnum(CodigoCertificado, { message: 'Código de certificado no válido' }),
});

/**
 * @openapi
 * /certificados:
 *   get:
 *     tags: [Certificados]
 *     summary: Lista todos los certificados de sostenibilidad disponibles
 *     responses:
 *       200: { description: Lista de certificados }
 */
rutasCertificados.get('/', controladorCertificados.listar);

/**
 * @openapi
 * /certificados/{codigo}:
 *   get:
 *     tags: [Certificados]
 *     summary: Detalle de un certificado por su código (GOTS, OEKO_TEX, etc.)
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema: { type: string, enum: [GOTS, OEKO_TEX, FAIRTRADE, GRS, BLUESIGN, ECOCERT] }
 *     responses:
 *       200: { description: Certificado encontrado }
 *       400: { description: Código no válido }
 *       404: { description: Certificado no encontrado }
 */
rutasCertificados.get(
  '/:codigo',
  validar(dtoCodigoCertificado, 'params'),
  controladorCertificados.obtener,
);
