import { z } from 'zod';

// Payload del evento Socket.IO "enviar_mensaje". El cliente Android nombra el campo
// `disenadorId`, pero representa al OTRO usuario de la conversación (peer): la tienda
// cuando escribe el cliente, o el cliente cuando responde la tienda. El servidor lo
// trata genéricamente como destinatario y nunca se fía de él para la identidad del emisor.
export const dtoEnviarMensaje = z.object({
  disenadorId: z.string().uuid('Identificador de destinatario no válido'),
  contenido: z
    .string()
    .trim()
    .min(1, 'El mensaje no puede estar vacío')
    .max(2000, 'El mensaje es demasiado largo'),
});
export type DatosEnviarMensaje = z.infer<typeof dtoEnviarMensaje>;
