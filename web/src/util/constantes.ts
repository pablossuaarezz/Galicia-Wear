// Constantes de dominio y traducción de enums (código → etiqueta de UI en castellano).
// Los códigos (ALGODON_ORGANICO, CORUNA, ...) son el contrato del backend; aquí solo se
// les da una representación legible y bonita para la interfaz.
import type {
  MaterialPrincipal,
  CiudadGallega,
  TallaPrenda,
  EstadoPedido,
  MetodoPago,
  Transportista,
  CodigoCertificado,
} from '@/api/tipos';

/** Coste de envío: gratis a partir de 50 €, si no 4,90 € (idéntico al backend). */
export const ENVIO_GRATUITO_DESDE = 50;
export const COSTE_ENVIO = 4.9;

/** Claves de almacenamiento local. */
export const CLAVE_TOKEN_REFRESCO = 'gw_token_refresco';

export const MATERIALES: Record<MaterialPrincipal, string> = {
  ALGODON_ORGANICO: 'Algodón orgánico',
  LANA_RECICLADA: 'Lana reciclada',
  LINO: 'Lino',
  TENCEL: 'Tencel',
  CANAMO: 'Cáñamo',
  POLIESTER_RECICLADO: 'Poliéster reciclado',
  SEDA: 'Seda',
  OTRO: 'Otro',
};

export const CIUDADES: Record<CiudadGallega, string> = {
  CORUNA: 'A Coruña',
  LUGO: 'Lugo',
  SANTIAGO: 'Santiago',
  VIGO: 'Vigo',
  PONTEVEDRA: 'Pontevedra',
  OURENSE: 'Ourense',
};

export const TALLAS: Record<TallaPrenda, string> = {
  XS: 'XS',
  S: 'S',
  M: 'M',
  L: 'L',
  XL: 'XL',
  XXL: 'XXL',
  TALLA_UNICA: 'Talla única',
};

export const ESTADOS_PEDIDO: Record<EstadoPedido, string> = {
  PENDIENTE_PAGO: 'Pendiente de pago',
  PAGADO: 'Pagado',
  ACEPTADO: 'Aceptado',
  ENVIADO: 'Enviado',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
  DEVUELTO: 'Devuelto',
};

/** Tono semántico de cada estado para la insignia. */
export const TONO_ESTADO_PEDIDO: Record<EstadoPedido, 'neutro' | 'info' | 'exito' | 'aviso' | 'peligro'> = {
  PENDIENTE_PAGO: 'aviso',
  PAGADO: 'info',
  ACEPTADO: 'info',
  ENVIADO: 'info',
  ENTREGADO: 'exito',
  CANCELADO: 'peligro',
  DEVUELTO: 'neutro',
};

export const METODOS_PAGO: Record<MetodoPago, string> = {
  TARJETA: 'Tarjeta',
  BIZUM: 'Bizum',
  TRANSFERENCIA: 'Transferencia',
};

export const TRANSPORTISTAS: Record<Transportista, string> = {
  CORREOS_VERDE: 'Correos Verde',
  CORREOS_EXPRESS: 'Correos Express',
  NACEX: 'Nacex',
  SEUR: 'SEUR',
};

export const CERTIFICADOS: Record<CodigoCertificado, string> = {
  GOTS: 'GOTS',
  OEKO_TEX: 'OEKO-TEX',
  FAIRTRADE: 'Fairtrade',
  GRS: 'GRS',
  BLUESIGN: 'Bluesign',
  ECOCERT: 'Ecocert',
};

/** Orden estable para selectores y chips. */
export const CODIGOS_MATERIAL = Object.keys(MATERIALES) as MaterialPrincipal[];
export const CODIGOS_CIUDAD = Object.keys(CIUDADES) as CiudadGallega[];
export const CODIGOS_TALLA = Object.keys(TALLAS) as TallaPrenda[];
export const CODIGOS_CERTIFICADO = Object.keys(CERTIFICADOS) as CodigoCertificado[];
export const CODIGOS_METODO_PAGO = Object.keys(METODOS_PAGO) as MetodoPago[];
export const CODIGOS_TRANSPORTISTA = Object.keys(TRANSPORTISTAS) as Transportista[];
