// Contrato de tipos de la API REST de GaliciaWear (lado cliente).
// IMPORTANTE: los campos Decimal del backend (precioBase, ajustePrecio, subtotal, total…)
// se serializan como STRING en JSON ("49.90"). Se tipan como string y se convierten a número
// con aNumero()/formatoPrecio() en la capa de presentación.

// ---- Enums (réplica de los del backend; el cliente no importa Prisma) ----

export type Rol = 'CLIENTE' | 'DISENADOR' | 'ADMIN';
export type CiudadGallega = 'CORUNA' | 'LUGO' | 'SANTIAGO' | 'VIGO' | 'PONTEVEDRA' | 'OURENSE';
export type TallaPrenda = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'TALLA_UNICA';
export type MaterialPrincipal =
  | 'ALGODON_ORGANICO'
  | 'LANA_RECICLADA'
  | 'LINO'
  | 'TENCEL'
  | 'CANAMO'
  | 'POLIESTER_RECICLADO'
  | 'SEDA'
  | 'OTRO';
export type EstadoPedido =
  | 'PENDIENTE_PAGO'
  | 'PAGADO'
  | 'ACEPTADO'
  | 'ENVIADO'
  | 'ENTREGADO'
  | 'CANCELADO'
  | 'DEVUELTO';
export type MetodoPago = 'TARJETA' | 'BIZUM' | 'TRANSFERENCIA';
export type Transportista = 'CORREOS_VERDE' | 'CORREOS_EXPRESS' | 'NACEX' | 'SEUR';
export type CodigoCertificado = 'GOTS' | 'OEKO_TEX' | 'FAIRTRADE' | 'GRS' | 'BLUESIGN' | 'ECOCERT';
export type TipoNotificacion =
  | 'PEDIDO_CREADO'
  | 'PEDIDO_PAGADO'
  | 'PEDIDO_ACEPTADO'
  | 'PEDIDO_ENVIADO'
  | 'PEDIDO_ENTREGADO'
  | 'PEDIDO_CANCELADO'
  | 'MENSAJE_NUEVO'
  | 'RESENA_RECIBIDA';

// ---- Genéricos ----

export interface RespuestaPaginada<T> {
  datos: T[];
  total: number;
  pagina: number;
  limite: number;
}

// ---- Autenticación / usuario ----

export interface UsuarioSesion {
  id: string;
  correo: string;
  rol: Rol;
}

export interface RespuestaTokens {
  tokenAcceso: string;
  tokenRefresco: string;
  expiraEn: string;
  usuario: UsuarioSesion;
}

/** Respuesta de GET /auth/yo — perfil plano y ligero (lo usa también Android). */
export interface PerfilUsuario {
  id: string;
  correo: string;
  rol: Rol;
  nombre: string | null;
  apellidos: string | null;
  telefono: string | null;
  avatarUrl: string | null;
  fechaCreacion: string;
}

export interface PreferenciasSostenibilidad {
  certificados?: CodigoCertificado[];
  maxKm?: number;
  ciudad?: CiudadGallega;
}

export interface PerfilCliente {
  usuarioId: string;
  nombre: string;
  apellidos: string;
  telefono: string | null;
  fechaNacimiento: string | null;
  avatarUrl: string | null;
  preferenciasSostenibilidad: PreferenciasSostenibilidad;
  direccionPredeterminadaId: string | null;
}

export interface PerfilDisenadorAnidado {
  usuarioId: string;
  nombreMarca: string;
  biografia: string;
  ciudad: CiudadGallega;
  validado: boolean;
  fechaValidacion: string | null;
  urlLogo: string | null;
  urlWeb: string | null;
  fechaCreacion: string;
}

/** Respuesta de GET /usuarios/yo — perfil completo con cliente o diseñador anidado. */
export interface UsuarioConPerfil {
  id: string;
  correo: string;
  rol: Rol;
  correoVerificado: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  fechaEliminacion: string | null;
  cliente: PerfilCliente | null;
  disenador: PerfilDisenadorAnidado | null;
}

// ---- Diseñadores ----

export interface DisenadorPublico {
  usuarioId: string;
  nombreMarca: string;
  biografia: string;
  ciudad: CiudadGallega;
  validado: boolean;
  fechaValidacion: string | null;
  validadoPorId: string | null;
  urlLogo: string | null;
  urlWeb: string | null;
  fechaCreacion: string;
}

// ---- Catálogo ----

export interface DisenadorResumen {
  nombreMarca: string;
  ciudad: CiudadGallega;
  urlLogo: string | null;
}

export interface ImagenResumen {
  url: string;
  textoAlternativo: string | null;
}

export interface ImagenProducto {
  id: string;
  url: string;
  textoAlternativo: string | null;
  posicion: number;
  esPrincipal: boolean;
}

export interface Variante {
  id: string;
  talla: TallaPrenda;
  color: string;
  sku: string;
  stock: number;
  ajustePrecio: string;
}

export interface CertificadoResumen {
  certificado: { codigo: CodigoCertificado; nombre: string };
}

export interface CertificadoDetalle {
  numeroCertificado: string;
  fechaEmision: string;
  fechaExpiracion: string | null;
  certificado: { codigo: CodigoCertificado; nombre: string; urlEmisor: string };
}

export interface ProductoResumen {
  id: string;
  disenadorId: string;
  nombre: string;
  slug: string;
  precioBase: string;
  kmOrigen: number;
  materialPrincipal: MaterialPrincipal;
  activo: boolean;
  fechaCreacion: string;
  disenador: DisenadorResumen;
  imagenes: ImagenResumen[];
  certificados: CertificadoResumen[];
}

export interface ProductoDetalle extends Omit<ProductoResumen, 'disenador' | 'imagenes' | 'certificados'> {
  descripcion: string;
  fechaActualizacion: string;
  disenador: DisenadorResumen & { urlWeb: string | null };
  variantes: Variante[];
  imagenes: ImagenProducto[];
  certificados: CertificadoDetalle[];
}

export interface Certificado {
  id: string;
  codigo: CodigoCertificado;
  nombre: string;
  descripcion: string;
  urlEmisor: string;
}

// ---- Direcciones ----

export interface Direccion {
  id: string;
  usuarioId: string;
  alias: string;
  linea1: string;
  linea2: string | null;
  ciudad: string;
  codigoPostal: string;
  provincia: string;
  pais: string;
  esPrincipal: boolean;
}

// ---- Carrito ----

export interface ItemCarrito {
  id: string;
  cantidad: number;
  fechaAnadido: string;
  variante: {
    id: string;
    talla: TallaPrenda;
    color: string;
    sku: string;
    stock: number;
    ajustePrecio: string;
    producto: {
      id: string;
      disenadorId: string;
      nombre: string;
      slug: string;
      precioBase: string;
      activo: boolean;
      imagenes: ImagenResumen[];
      disenador: { nombreMarca: string };
    };
  };
}

export interface Carrito {
  id: string;
  clienteId: string;
  fechaActualizacion: string;
  items: ItemCarrito[];
}

// ---- Pedidos / envíos ----

export interface LineaPedido {
  id: string;
  cantidad: number;
  precioUnitario: string;
  estadoLinea: EstadoPedido;
  disenadorId: string;
  variante: {
    talla: TallaPrenda;
    color: string;
    sku: string;
    producto: { nombre: string; slug: string };
  };
  disenador: { nombreMarca: string };
}

export interface DireccionPedido {
  alias: string;
  linea1: string;
  linea2: string | null;
  ciudad: string;
  codigoPostal: string;
  provincia: string;
  pais: string;
}

export interface Envio {
  id: string;
  transportista: Transportista;
  envioEcologico: boolean;
  numeroSeguimiento: string | null;
  entregaEstimada: string | null;
  fechaEnvio: string | null;
  fechaEntrega: string | null;
  pedidoId?: string;
}

export interface Pedido {
  id: string;
  numeroPedido: string;
  clienteId: string;
  estado: EstadoPedido;
  subtotal: string;
  costeEnvio: string;
  total: string;
  metodoPago: MetodoPago;
  fechaCreacion: string;
  fechaPago: string | null;
  fechaAceptacion: string | null;
  notas: string | null;
  direccionEnvio: DireccionPedido;
  lineas: LineaPedido[];
  envio: Envio | null;
}

// ---- Chat (soporte cliente ↔ tienda) ----

export interface ConversacionChat {
  peerId: string;
  nombre: string;
  ultimoMensaje: string;
  fechaUltimo: string;
  noLeidos: number;
}

export interface MensajeChat {
  id: string;
  contenido: string;
  remitenteId: string;
  remitenteNombre: string;
  fechaCreacion: string;
  leido: boolean;
}

// ---- Notificaciones (DTO estable del backend, ver NotificacionDto) ----

export interface Notificacion {
  id: string;
  tipo: TipoNotificacion;
  titulo: string;
  cuerpo: string;
  datos?: Record<string, unknown>;
  leida: boolean;
  fechaCreacion: string;
}

// ---- Cuerpos de petición (mutaciones) ----

export interface EntradaRegistro {
  correo: string;
  contrasena: string;
  rol: 'CLIENTE' | 'DISENADOR';
  nombre?: string;
  apellidos?: string;
}

export interface EntradaLogin {
  correo: string;
  contrasena: string;
}

export interface FiltrosCatalogo {
  busqueda?: string;
  material?: MaterialPrincipal;
  ciudad?: CiudadGallega;
  maxKm?: number;
  certificado?: CodigoCertificado;
  pagina?: number;
  limite?: number;
}

export interface EntradaDireccion {
  alias: string;
  linea1: string;
  linea2?: string;
  ciudad: string;
  codigoPostal: string;
  provincia?: string;
  pais?: string;
}

export interface EntradaCrearPedido {
  direccionEnvioId: string;
  metodoPago: MetodoPago;
  notas?: string;
}

export interface EntradaProducto {
  nombre: string;
  descripcion: string;
  precioBase: number;
  kmOrigen: number;
  materialPrincipal: MaterialPrincipal;
}

export interface EntradaActualizarProducto extends Partial<EntradaProducto> {
  activo?: boolean;
}

export interface EntradaVariante {
  talla: TallaPrenda;
  color: string;
  sku: string;
  stock: number;
  ajustePrecio: number;
}

export interface EntradaImagen {
  url?: string;
  base64?: string;
  textoAlternativo?: string;
  posicion?: number;
  esPrincipal?: boolean;
}

export interface EntradaPerfilCliente {
  nombre?: string;
  apellidos?: string;
  telefono?: string | null;
  fechaNacimiento?: string | null;
  avatarUrl?: string | null;
}

export interface EntradaCambiarContrasena {
  contrasenaActual: string;
  contrasenaNueva: string;
}

export interface EntradaSolicitarDisenador {
  nombreMarca: string;
  biografia: string;
  ciudad: CiudadGallega;
  iban: string;
  urlLogo?: string;
  urlWeb?: string;
}

export interface EntradaActualizarDisenador {
  nombreMarca?: string;
  biografia?: string;
  ciudad?: CiudadGallega;
  iban?: string;
  urlLogo?: string;
  urlWeb?: string;
}

export interface EntradaActualizarEnvio {
  transportista?: Transportista;
  envioEcologico?: boolean;
  numeroSeguimiento?: string;
  entregaEstimada?: string;
  marcarComoEnviado?: boolean;
  marcarComoEntregado?: boolean;
}
