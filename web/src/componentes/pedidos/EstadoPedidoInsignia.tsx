// Insignia visual del estado de un pedido. A partir del código de estado del backend
// (PENDIENTE_PAGO, ENVIADO, ...) muestra una insignia con su etiqueta legible en castellano
// y el tono semántico (color) que le corresponde, ambos resueltos desde las tablas de
// traducción de `constantes`. Es un componente puramente presentacional, sin estado propio.
import { Insignia } from '@/componentes/ui';
import { ESTADOS_PEDIDO, TONO_ESTADO_PEDIDO } from '@/util/constantes';
import type { EstadoPedido } from '@/api/tipos';

/**
 * Insignia de estado de pedido con el tono semántico correspondiente.
 *
 * Traduce el código de estado recibido a su etiqueta legible (mediante `ESTADOS_PEDIDO`) y al
 * tono cromático asociado (mediante `TONO_ESTADO_PEDIDO`), delegando el renderizado en el
 * componente genérico `Insignia`.
 *
 * @param estado - Código de estado del pedido (enum del backend) a representar.
 * @returns Insignia con la etiqueta y el color del estado indicado.
 */
export function EstadoPedidoInsignia({ estado }: { estado: EstadoPedido }) {
  return <Insignia tono={TONO_ESTADO_PEDIDO[estado]}>{ESTADOS_PEDIDO[estado]}</Insignia>;
}
