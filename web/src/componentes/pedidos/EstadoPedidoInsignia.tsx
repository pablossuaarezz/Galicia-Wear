// Insignia de estado de pedido con el tono semántico correspondiente.
import { Insignia } from '@/componentes/ui';
import { ESTADOS_PEDIDO, TONO_ESTADO_PEDIDO } from '@/util/constantes';
import type { EstadoPedido } from '@/api/tipos';

export function EstadoPedidoInsignia({ estado }: { estado: EstadoPedido }) {
  return <Insignia tono={TONO_ESTADO_PEDIDO[estado]}>{ESTADOS_PEDIDO[estado]}</Insignia>;
}
