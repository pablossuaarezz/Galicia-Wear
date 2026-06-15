// Contrato de tipos de la API REST de GaliciaWear (lado cliente).
// IMPORTANTE: los campos Decimal del backend (precioBase, ajustePrecio, subtotal, total…)
// se serializan como STRING en JSON ("49.90"). Se tipan como string y se convierten a número
// con aNumero()/formatoPrecio() en la capa de presentación.

// ---- Enums (réplica de los del backend; el cliente no importa Prisma) ----
// Se redefinen aquí como uniones de literales en lugar de importarse de Prisma para no
// acoplar el cliente web a las dependencias del backend. Deben mantenerse sincronizados
// manualmente con los enums del schema de Prisma.

/** Rol del usuario en el sistema, que determina sus permisos (RBAC). */
export type Rol = 'CLIENTE' | 'DISENADOR' | 'ADMIN';
/** Ciudades gallegas admitidas para diseñadores y filtros de proximidad. */
export type CiudadGallega = 'CORUNA' | 'LUGO' | 'SANTIAGO' | 'VIGO' | 'PONTEVEDRA' | 'OURENSE';
/** Tallas posibles de una prenda (o talla única para accesorios). */
export type TallaPrenda = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'TALLA_UNICA';
/** Material principal de la prenda; clave para los filtros de sostenibilidad. */
export type MaterialPrincipal =
  | 'ALGODON_ORGANICO'
  | 'LANA_RECICLADA'
  | 'LINO'
  | 'TENCEL'
  | 'CANAMO'
  | 'POLIESTER_RECICLADO'
  | 'SEDA'
  | 'OTRO';
/** Estados por los que pasa un pedido a lo largo de su ciclo de vida. */
export type EstadoPedido =
  | 'PENDIENTE_PAGO'
  | 'PAGADO'
  | 'ACEPTADO'
  | 'ENVIADO'
  | 'ENTREGADO'
  | 'CANCELADO'
  | 'DEVUELTO';
/** Métodos de pago admitidos en el checkout. */
export type MetodoPago = 'TARJETA' | 'BIZUM' | 'TRANSFERENCIA';
/** Transportistas disponibles; CORREOS_VERDE es la opción de logística ecológica. */
export type Transportista = 'CORREOS_VERDE' | 'CORREOS_EXPRESS' | 'NACEX' | 'SEUR';
/** Códigos de los certificados de sostenibilidad verificables (GOTS, OEKO-TEX, etc.). */
export type CodigoCertificado = 'GOTS' | 'OEKO_TEX' | 'FAIRTRADE' | 'GRS' | 'BLUESIGN' | 'ECOCERT';
/** Tipos de notificación que el backend puede emitir hacia los clientes. */
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

/**
 * Envoltorio genérico de respuestas paginadas del backend.
 * @template T Tipo de cada elemento de la página.
 */
export interface RespuestaPaginada<T> {
  /** Elementos de la página actual. */
  datos: T[];
  /** Número total de elementos disponibles (en todas las páginas). */
  total: number;
  /** Número de la página devuelta (1-indexado). */
  pagina: number;
  /** Tamaño de página solicitado. */
  limite: number;
}

// ---- Autenticación / usuario ----

/** Datos mínimos del usuario incluidos en la respuesta de login (identidad y rol). */
export interface UsuarioSesion {
  id: string;
  correo: string;
  rol: Rol;
}

/** Respuesta de los endpoints de autenticación: par de tokens JWT más datos de sesión. */
export interface RespuestaTokens {
  /** JWT de acceso de corta duración (se guarda en memoria). */
  tokenAcceso: string;
  /** Token de refresco de larga duración (se persiste en localStorage). */
  tokenRefresco: string;
  /** Marca temporal de caducidad del token de acceso. */
  expiraEn: string;
  /** Identidad y rol del usuario autenticado. */
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

/** Preferencias eco del cliente, usadas para personalizar el catálogo y recomendaciones. */
export interface PreferenciasSostenibilidad {
  /** Certificados que el cliente prioriza. */
  certificados?: CodigoCertificado[];
  /** Distancia máxima de origen aceptada (km), para favorecer producto cercano. */
  maxKm?: number;
  /** Ciudad de referencia del cliente. */
  ciudad?: CiudadGallega;
}

/** Perfil de un usuario con rol CLIENTE (datos personales y preferencias). */
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

/** Perfil de diseñador tal y como viene anidado dentro de UsuarioConPerfil. */
export interface PerfilDisenadorAnidado {
  usuarioId: string;
  nombreMarca: string;
  biografia: string;
  ciudad: CiudadGallega;
  /** Indica si un administrador ya ha validado la marca (requisito para publicar). */
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

/** Perfil público de un diseñador, tal como se expone en el catálogo y su ficha. */
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

/** Datos mínimos del diseñador para mostrar junto a un producto en el catálogo. */
export interface DisenadorResumen {
  nombreMarca: string;
  ciudad: CiudadGallega;
  urlLogo: string | null;
}

/** Imagen en forma reducida (solo URL y texto alternativo para accesibilidad). */
export interface ImagenResumen {
  url: string;
  /** Texto alternativo para lectores de pantalla (atributo alt). */
  textoAlternativo: string | null;
}

/** Imagen completa de un producto, con su posición y marca de imagen principal. */
export interface ImagenProducto {
  id: string;
  url: string;
  textoAlternativo: string | null;
  /** Orden de la imagen en la galería. */
  posicion: number;
  /** Indica si es la imagen de portada del producto. */
  esPrincipal: boolean;
}

/** Variante vendible de un producto: combinación de talla/color con stock y SKU propios. */
export interface Variante {
  id: string;
  talla: TallaPrenda;
  color: string;
  /** Código único de inventario de la variante. */
  sku: string;
  stock: number;
  /** Ajuste de precio sobre el precio base (string por ser Decimal en el backend). */
  ajustePrecio: string;
}

/** Certificado de sostenibilidad en forma reducida (código y nombre). */
export interface CertificadoResumen {
  certificado: { codigo: CodigoCertificado; nombre: string };
}

/** Certificado de sostenibilidad con todos sus datos de verificación. */
export interface CertificadoDetalle {
  numeroCertificado: string;
  fechaEmision: string;
  fechaExpiracion: string | null;
  certificado: { codigo: CodigoCertificado; nombre: string; urlEmisor: string };
}

/** Producto en forma resumida, tal como aparece en las rejillas del catálogo. */
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

/**
 * Detalle completo de un producto (ficha): amplía ProductoResumen con descripción,
 * variantes, galería completa y certificados detallados.
 */
export interface ProductoDetalle extends Omit<ProductoResumen, 'disenador' | 'imagenes' | 'certificados'> {
  descripcion: string;
  fechaActualizacion: string;
  disenador: DisenadorResumen & { urlWeb: string | null };
  variantes: Variante[];
  imagenes: ImagenProducto[];
  certificados: CertificadoDetalle[];
}

/** Catálogo maestro de un certificado de sostenibilidad (lista de apoyo). */
export interface Certificado {
  id: string;
  codigo: CodigoCertificado;
  nombre: string;
  descripcion: string;
  urlEmisor: string;
}

// ---- Direcciones ----

/** Dirección de envío del usuario. */
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

/** Línea del carrito: una variante concreta con su cantidad y datos del producto anidados. */
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

/** Carrito de la compra del cliente con sus líneas. */
export interface Carrito {
  id: string;
  clienteId: string;
  fechaActualizacion: string;
  items: ItemCarrito[];
}

// ---- Pedidos / envíos ----

/** Línea de un pedido: cada línea agrupa el producto de un mismo diseñador. */
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

/** Copia de la dirección de envío congelada en el momento del pedido. */
export interface DireccionPedido {
  alias: string;
  linea1: string;
  linea2: string | null;
  ciudad: string;
  codigoPostal: string;
  provincia: string;
  pais: string;
}

/** Envío asociado a un pedido (transportista, seguimiento y fechas). */
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

/** Pedido completo con sus líneas, dirección y envío. */
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

/** Resumen de una conversación de chat (vista de lista de conversaciones). */
export interface ConversacionChat {
  peerId: string;
  nombre: string;
  ultimoMensaje: string;
  fechaUltimo: string;
  noLeidos: number;
}

/** Mensaje individual dentro de un hilo de chat. */
export interface MensajeChat {
  id: string;
  contenido: string;
  remitenteId: string;
  remitenteNombre: string;
  fechaCreacion: string;
  leido: boolean;
}

// ---- Notificaciones (DTO estable del backend, ver NotificacionDto) ----

/** Notificación in-app del usuario. */
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

/** Cuerpo de POST /auth/registro. */
export interface EntradaRegistro {
  correo: string;
  contrasena: string;
  rol: 'CLIENTE' | 'DISENADOR';
  nombre?: string;
  apellidos?: string;
}

/** Cuerpo de POST /auth/login. */
export interface EntradaLogin {
  correo: string;
  contrasena: string;
}

/** Filtros y paginación admitidos por el listado de catálogo. */
export interface FiltrosCatalogo {
  busqueda?: string;
  material?: MaterialPrincipal;
  ciudad?: CiudadGallega;
  maxKm?: number;
  certificado?: CodigoCertificado;
  pagina?: number;
  limite?: number;
}

/** Cuerpo para crear/actualizar una dirección de envío. */
export interface EntradaDireccion {
  alias: string;
  linea1: string;
  linea2?: string;
  ciudad: string;
  codigoPostal: string;
  provincia?: string;
  pais?: string;
}

/** Cuerpo de POST /pedidos (datos del checkout). */
export interface EntradaCrearPedido {
  direccionEnvioId: string;
  metodoPago: MetodoPago;
  notas?: string;
}

/** Cuerpo para crear un producto (precioBase en número; el backend lo guarda como Decimal). */
export interface EntradaProducto {
  nombre: string;
  descripcion: string;
  precioBase: number;
  kmOrigen: number;
  materialPrincipal: MaterialPrincipal;
}

/** Cuerpo para actualizar un producto: campos parciales más el flag de activo. */
export interface EntradaActualizarProducto extends Partial<EntradaProducto> {
  activo?: boolean;
}

/** Cuerpo para crear/actualizar una variante. */
export interface EntradaVariante {
  talla: TallaPrenda;
  color: string;
  sku: string;
  stock: number;
  ajustePrecio: number;
}

/** Cuerpo para añadir una imagen: admite URL directa o data URI base64. */
export interface EntradaImagen {
  url?: string;
  base64?: string;
  textoAlternativo?: string;
  posicion?: number;
  esPrincipal?: boolean;
}

/** Cuerpo para actualizar el perfil de cliente (todos los campos opcionales). */
export interface EntradaPerfilCliente {
  nombre?: string;
  apellidos?: string;
  telefono?: string | null;
  fechaNacimiento?: string | null;
  avatarUrl?: string | null;
}

/** Cuerpo de PATCH /usuarios/yo/contrasena. */
export interface EntradaCambiarContrasena {
  contrasenaActual: string;
  contrasenaNueva: string;
}

/** Cuerpo de la solicitud de alta como diseñador (el IBAN se cifra en el backend). */
export interface EntradaSolicitarDisenador {
  nombreMarca: string;
  biografia: string;
  ciudad: CiudadGallega;
  iban: string;
  urlLogo?: string;
  urlWeb?: string;
}

/** Cuerpo para actualizar el perfil de diseñador (todos los campos opcionales). */
export interface EntradaActualizarDisenador {
  nombreMarca?: string;
  biografia?: string;
  ciudad?: CiudadGallega;
  iban?: string;
  urlLogo?: string;
  urlWeb?: string;
}

/** Cuerpo para actualizar el envío de un pedido (acción del diseñador). */
export interface EntradaActualizarEnvio {
  transportista?: Transportista;
  envioEcologico?: boolean;
  numeroSeguimiento?: string;
  entregaEstimada?: string;
  marcarComoEnviado?: boolean;
  marcarComoEntregado?: boolean;
}
