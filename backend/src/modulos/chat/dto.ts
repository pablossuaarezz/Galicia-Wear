/**
 * DTOs (Data Transfer Objects) del módulo Chat.
 *
 * Define el esquema de validación con Zod para el payload del evento de
 * Socket.IO "enviar_mensaje" y el tipo TypeScript inferido. Se valida en el
 * propio manejador del socket antes de persistir el mensaje.
 */
import { z } from 'zod';

// Payload del evento Socket.IO "enviar_mensaje". El cliente Android nombra el campo
// `disenadorId`, pero representa al OTRO usuario de la conversación (peer): la tienda
// cuando escribe el cliente, o el cliente cuando responde la tienda. El servidor lo
// trata genéricamente como destinatario y nunca se fía de él para la identidad del emisor.
/**
 * Esquema de validación del mensaje entrante por socket.
 * - `disenadorId`: UUID del destinatario (peer de la conversación), a pesar del
 *   nombre histórico del campo no implica que el destinatario sea necesariamente
 *   un diseñador.
 * - `contenido`: texto del mensaje, recortado de espacios, no vacío y con un
 *   límite de 2000 caracteres para evitar abusos.
 */
export const dtoEnviarMensaje = z.object({
  disenadorId: z.string().uuid('Identificador de destinatario no válido'),
  contenido: z
    .string()
    .trim()
    .min(1, 'El mensaje no puede estar vacío')
    .max(2000, 'El mensaje es demasiado largo'),
});
/** Tipo inferido a partir de `dtoEnviarMensaje`. */
export type DatosEnviarMensaje = z.infer<typeof dtoEnviarMensaje>;
