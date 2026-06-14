// Seed de desarrollo para GaliciaWear.
// Ejecutar: cd backend && npm run seed
// Limpia toda la BD y recrea: 6 certificados · 1 admin · 3 clientes · 5 tiendas validadas + 1 pendiente
// · 16 productos con 4-6 fotos cada uno (estilo fondo blanco, tipo Zara/Unsplash)
import { PrismaClient, Rol, CiudadGallega, CodigoCertificado } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'node:crypto';

const prisma = new PrismaClient();

function cifrarIbanSeed(iban: string): string {
  const clave = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex');
  const iv = crypto.randomBytes(12);
  const cifrador = crypto.createCipheriv('aes-256-gcm', clave, iv);
  const cifrado = Buffer.concat([cifrador.update(iban, 'utf8'), cifrador.final()]);
  const tag = cifrador.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${cifrado.toString('hex')}`;
}

// Genera URLs de Unsplash con fondo limpio estilo producto
function img(id: string, w = 800, h = 1000): string {
  return `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=85&auto=format`;
}

async function crearImagenesProducto(
  productoId: string,
  fotos: Array<{ prefijo: string; url: string; alt: string }>,
) {
  for (let i = 0; i < fotos.length; i++) {
    const f = fotos[i];
    await prisma.imagenProducto.upsert({
      where: { id: `img-${f.prefijo}-${i}` },
      update: { url: f.url, textoAlternativo: f.alt },
      create: {
        id: `img-${f.prefijo}-${i}`,
        productoId,
        url: f.url,
        textoAlternativo: f.alt,
        posicion: i,
        esPrincipal: i === 0,
      },
    });
  }
}

async function main() {
  // eslint-disable-next-line no-console
  console.info('[seed] 🧹 Limpiando base de datos…');

  // Borrar en orden para respetar FK (sin cascada completa desde usuario en todos los casos)
  await prisma.resena.deleteMany({});
  await prisma.envio.deleteMany({});
  await prisma.lineaPedido.deleteMany({});
  await prisma.pedido.deleteMany({});
  await prisma.itemCarrito.deleteMany({});
  await prisma.carrito.deleteMany({});
  await prisma.certificadoDeProducto.deleteMany({});
  await prisma.imagenProducto.deleteMany({});
  await prisma.variante.deleteMany({});
  await prisma.mensaje.deleteMany({});
  await prisma.producto.deleteMany({});
  await prisma.tokenRefresco.deleteMany({});
  await prisma.disenador.deleteMany({});
  await prisma.cliente.deleteMany({});
  await prisma.direccion.deleteMany({});
  await prisma.usuario.deleteMany({});

  // eslint-disable-next-line no-console
  console.info('[seed] ✓ BD vaciada');

  // ================================================================
  // CERTIFICADOS DE SOSTENIBILIDAD
  // ================================================================
  const certificados = [
    {
      codigo: CodigoCertificado.GOTS,
      nombre: 'Global Organic Textile Standard',
      descripcion:
        'Estándar internacional para textiles fabricados con fibras orgánicas. Cubre toda la cadena de producción desde el campo hasta la etiqueta.',
      urlEmisor: 'https://global-standard.org',
    },
    {
      codigo: CodigoCertificado.OEKO_TEX,
      nombre: 'OEKO-TEX Standard 100',
      descripcion:
        'Certifica que cada componente del artículo textil ha sido analizado y verificado para detectar sustancias perjudiciales.',
      urlEmisor: 'https://www.oeko-tex.com',
    },
    {
      codigo: CodigoCertificado.FAIRTRADE,
      nombre: 'Fairtrade',
      descripcion:
        'Garantiza condiciones laborales justas y precios equitativos para los agricultores y trabajadores de países en desarrollo.',
      urlEmisor: 'https://www.fairtrade.net',
    },
    {
      codigo: CodigoCertificado.GRS,
      nombre: 'Global Recycled Standard',
      descripcion:
        'Verifica el contenido reciclado de un producto y garantiza prácticas sociales, ambientales y químicas responsables.',
      urlEmisor: 'https://apparelcoalition.org/the-grs-standard',
    },
    {
      codigo: CodigoCertificado.BLUESIGN,
      nombre: 'bluesign',
      descripcion:
        'Estándar de la industria textil que garantiza el uso eficiente de los recursos y la producción de tejidos seguros.',
      urlEmisor: 'https://www.bluesign.com',
    },
    {
      codigo: CodigoCertificado.ECOCERT,
      nombre: 'Ecocert',
      descripcion:
        'Organismo de certificación para productos ecológicos y orgánicos; cubre tanto la materia prima como el proceso de fabricación.',
      urlEmisor: 'https://www.ecocert.com',
    },
  ];

  for (const cert of certificados) {
    await prisma.certificadoSostenibilidad.upsert({
      where: { codigo: cert.codigo },
      update: { nombre: cert.nombre, descripcion: cert.descripcion, urlEmisor: cert.urlEmisor },
      create: cert,
    });
  }
  // eslint-disable-next-line no-console
  console.info('[seed] ✓ 6 certificados de sostenibilidad');

  // ================================================================
  // CONTRASEÑA COMPARTIDA
  // ================================================================
  const hashPrueba = await bcrypt.hash('Prueba123', 10);

  // ================================================================
  // ADMIN
  // ================================================================
  await prisma.usuario.create({
    data: {
      correo: 'admin@galiciawear.gal',
      hashContrasena: hashPrueba,
      rol: Rol.ADMIN,
      correoVerificado: true,
    },
  });
  // eslint-disable-next-line no-console
  console.info('[seed] ✓ Admin (admin@galiciawear.gal / Prueba123)');

  // ================================================================
  // CLIENTES
  // ================================================================
  await prisma.usuario.create({
    data: {
      correo: 'ana@galiciawear.gal',
      hashContrasena: hashPrueba,
      rol: Rol.CLIENTE,
      correoVerificado: true,
      cliente: {
        create: {
          nombre: 'Ana',
          apellidos: 'López García',
          preferenciasSostenibilidad: { certificados: ['GOTS', 'OEKO_TEX'], maxKm: 200, ciudad: 'CORUNA' },
        },
      },
    },
  });

  await prisma.usuario.create({
    data: {
      correo: 'carlos@galiciawear.gal',
      hashContrasena: hashPrueba,
      rol: Rol.CLIENTE,
      correoVerificado: true,
      cliente: {
        create: {
          nombre: 'Carlos',
          apellidos: 'Méndez Fernández',
          preferenciasSostenibilidad: {},
        },
      },
    },
  });

  await prisma.usuario.create({
    data: {
      correo: 'lucia@galiciawear.gal',
      hashContrasena: hashPrueba,
      rol: Rol.CLIENTE,
      correoVerificado: true,
      cliente: {
        create: {
          nombre: 'Lucía',
          apellidos: 'Vázquez Rodríguez',
          preferenciasSostenibilidad: { certificados: ['GRS', 'FAIRTRADE'], maxKm: 150, ciudad: 'VIGO' },
        },
      },
    },
  });
  // eslint-disable-next-line no-console
  console.info('[seed] ✓ 3 clientes (ana@, carlos@, lucia@)');

  // ================================================================
  // TIENDA 1: LIÑARES MODA — A Coruña · lino y algodón orgánico
  // ================================================================
  const uLin = await prisma.usuario.create({
    data: {
      correo: 'linares@galiciawear.gal',
      hashContrasena: hashPrueba,
      rol: Rol.DISENADOR,
      correoVerificado: true,
    },
  });
  await prisma.disenador.create({
    data: {
      usuarioId: uLin.id,
      nombreMarca: 'Liñares Moda',
      biografia:
        'Diseñadora gallega especializada en prendas de lino y algodón orgánico cultivado en las Rías Baixas. ' +
        'Toda la producción se realiza en A Coruña con materiales de kilómetro cero y tintes naturales.',
      ciudad: CiudadGallega.CORUNA,
      ibanCifrado: cifrarIbanSeed('ES9121000418450200051332'),
      validado: true,
      fechaValidacion: new Date('2025-09-10'),
      urlLogo: img('1441986300917-64674bd600d8', 400, 400),
      urlWeb: 'https://linares-moda.gal',
    },
  });

  // ================================================================
  // TIENDA 2: VENTO ATLÁNTICO — Santiago · lana reciclada
  // ================================================================
  const uVen = await prisma.usuario.create({
    data: {
      correo: 'vento@galiciawear.gal',
      hashContrasena: hashPrueba,
      rol: Rol.DISENADOR,
      correoVerificado: true,
    },
  });
  await prisma.disenador.create({
    data: {
      usuarioId: uVen.id,
      nombreMarca: 'Vento Atlántico',
      biografia:
        'Colectivo de diseñadores compostelanos inspirados en la cultura y paisajes de Galicia. ' +
        'Usamos exclusivamente lana reciclada certificada GRS y BLUESIGN, apostando por la economía circular.',
      ciudad: CiudadGallega.SANTIAGO,
      ibanCifrado: cifrarIbanSeed('ES7620770024003102575766'),
      validado: true,
      fechaValidacion: new Date('2025-10-02'),
      urlLogo: img('1481437156560-3205f6a55735', 400, 400),
      urlWeb: 'https://ventoatlantico.gal',
    },
  });

  // ================================================================
  // TIENDA 3: TERRA GALEGA — Vigo · algodón orgánico tonos tierra
  // ================================================================
  const uTer = await prisma.usuario.create({
    data: {
      correo: 'terra@galiciawear.gal',
      hashContrasena: hashPrueba,
      rol: Rol.DISENADOR,
      correoVerificado: true,
    },
  });
  await prisma.disenador.create({
    data: {
      usuarioId: uTer.id,
      nombreMarca: 'Terra Galega',
      biografia:
        'Marca viguesa de moda básica esencial. Apostamos por prendas cápsula de alta durabilidad en algodón ' +
        'orgánico certificado GOTS. Paleta de colores inspirada en la tierra, el granito y los bosques gallegos.',
      ciudad: CiudadGallega.VIGO,
      ibanCifrado: cifrarIbanSeed('ES2114650100722030876293'),
      validado: true,
      fechaValidacion: new Date('2025-11-15'),
      urlLogo: img('1558618666-fcd25c85cd64', 400, 400),
      urlWeb: 'https://terragalega.gal',
    },
  });

  // ================================================================
  // TIENDA 4: MAREAS STUDIO — Pontevedra · Tencel y verano
  // ================================================================
  const uMar = await prisma.usuario.create({
    data: {
      correo: 'mareas@galiciawear.gal',
      hashContrasena: hashPrueba,
      rol: Rol.DISENADOR,
      correoVerificado: true,
    },
  });
  await prisma.disenador.create({
    data: {
      usuarioId: uMar.id,
      nombreMarca: 'Mareas Studio',
      biografia:
        'Estudio de diseño pontevedrés especializado en prendas ligeras y fluidas para el clima atlántico. ' +
        'Trabajamos con Tencel Lyocell certificado Ecocert, un tejido de madera de eucalipto de cultivo responsable.',
      ciudad: CiudadGallega.PONTEVEDRA,
      ibanCifrado: cifrarIbanSeed('ES5521751817140112345672'),
      validado: true,
      fechaValidacion: new Date('2025-12-01'),
      urlLogo: img('1445205170230-053b83016050', 400, 400),
      urlWeb: 'https://mareasstudio.gal',
    },
  });

  // ================================================================
  // TIENDA 5: BOSQUE VERDE — Lugo · cáñamo y activewear reciclado (pendiente)
  // ================================================================
  const uBos = await prisma.usuario.create({
    data: {
      correo: 'bosque@galiciawear.gal',
      hashContrasena: hashPrueba,
      rol: Rol.DISENADOR,
      correoVerificado: true,
    },
  });
  await prisma.disenador.create({
    data: {
      usuarioId: uBos.id,
      nombreMarca: 'Bosque Verde',
      biografia:
        'Marca lucense de ropa activa y outdoor fabricada con cáñamo y poliéster reciclado de botellas PET. ' +
        'Pendiente de validación administrativa. Solicitud enviada en enero 2026.',
      ciudad: CiudadGallega.LUGO,
      ibanCifrado: cifrarIbanSeed('ES6000491500051234567892'),
      validado: false,
      urlLogo: img('1506905925346-21bda4d32df4', 400, 400),
    },
  });
  // eslint-disable-next-line no-console
  console.info('[seed] ✓ 5 tiendas creadas (4 validadas + 1 pendiente)');

  // ================================================================
  // REFERENCIAS A DISEÑADORES Y CERTIFICADOS
  // ================================================================
  const dLin = await prisma.disenador.findUniqueOrThrow({ where: { usuarioId: uLin.id } });
  const dVen = await prisma.disenador.findUniqueOrThrow({ where: { usuarioId: uVen.id } });
  const dTer = await prisma.disenador.findUniqueOrThrow({ where: { usuarioId: uTer.id } });
  const dMar = await prisma.disenador.findUniqueOrThrow({ where: { usuarioId: uMar.id } });
  const dBos = await prisma.disenador.findUniqueOrThrow({ where: { usuarioId: uBos.id } });

  const cGOTS    = await prisma.certificadoSostenibilidad.findUniqueOrThrow({ where: { codigo: 'GOTS' } });
  const cOEKO    = await prisma.certificadoSostenibilidad.findUniqueOrThrow({ where: { codigo: 'OEKO_TEX' } });
  const cGRS     = await prisma.certificadoSostenibilidad.findUniqueOrThrow({ where: { codigo: 'GRS' } });
  const cBLUE    = await prisma.certificadoSostenibilidad.findUniqueOrThrow({ where: { codigo: 'BLUESIGN' } });
  const cECO     = await prisma.certificadoSostenibilidad.findUniqueOrThrow({ where: { codigo: 'ECOCERT' } });
  const cFAIR    = await prisma.certificadoSostenibilidad.findUniqueOrThrow({ where: { codigo: 'FAIRTRADE' } });

  // ================================================================
  // ── LIÑARES MODA ─ 4 productos
  // ================================================================

  // LIN-1: Camiseta de Lino Gallego
  const pLin1 = await prisma.producto.create({
    data: {
      disenadorId: dLin.usuarioId,
      nombre: 'Camiseta de Lino Gallego',
      slug: 'camiseta-lino-gallego',
      descripcion:
        'Camiseta de manga corta confeccionada con lino 100% gallego cultivado en las Rías Baixas. ' +
        'Sin tintes artificiales ni tratamientos químicos. Tejido fresco y transpirable ideal para el verano atlántico. ' +
        'Corte recto, cuello redondo y bajo enrollado a mano.',
      precioBase: 34.90,
      kmOrigen: 15,
      materialPrincipal: 'LINO',
    },
  });
  for (const [talla, color, sku, stock] of [
    ['S', 'Natural Crudo', 'LIN1-S-NC', 10], ['M', 'Natural Crudo', 'LIN1-M-NC', 14],
    ['L', 'Natural Crudo', 'LIN1-L-NC', 8],  ['XL', 'Natural Crudo', 'LIN1-XL-NC', 5],
    ['S', 'Blanco Roto',   'LIN1-S-BR', 6],  ['M', 'Blanco Roto',   'LIN1-M-BR', 9],
    ['L', 'Blanco Roto',   'LIN1-L-BR', 4],
  ] as const) {
    await prisma.variante.create({ data: { productoId: pLin1.id, talla, color, sku, stock } });
  }
  await crearImagenesProducto(pLin1.id, [
    { prefijo: 'lin1', url: img('1521572163474-6864f9cf17ab'), alt: 'Camiseta lino gallego color natural crudo — vista frontal' },
    { prefijo: 'lin1', url: img('1562157873-818bc0726f68'),   alt: 'Camiseta lino gallego — vista trasera' },
    { prefijo: 'lin1', url: img('1527719327859-a0a611fbe978'), alt: 'Camiseta lino gallego — detalle tejido y textura' },
    { prefijo: 'lin1', url: img('1596755094514-f87e34085b2c'), alt: 'Camiseta lino gallego — plano detalle cuello' },
    { prefijo: 'lin1', url: img('1583743814966-8936f5b7be1a'), alt: 'Camiseta lino gallego — color blanco roto' },
  ]);
  await prisma.certificadoDeProducto.create({
    data: {
      productoId: pLin1.id, certificadoId: cGOTS.id,
      numeroCertificado: 'GOTS-2025-LIN-001',
      fechaEmision: new Date('2025-03-01'), fechaExpiracion: new Date('2026-03-01'),
    },
  });

  // LIN-2: Vestido Midi Lino
  const pLin2 = await prisma.producto.create({
    data: {
      disenadorId: dLin.usuarioId,
      nombre: 'Vestido Midi Lino',
      slug: 'vestido-midi-lino',
      descripcion:
        'Vestido midi de lino orgánico con escote V y manga larga enrollada. Corte amplio y fluido que favorece ' +
        'cualquier silueta. Largo hasta la pantorrilla. Costura local en A Coruña, tintes naturales con cúrcuma y índigo.',
      precioBase: 89.90,
      kmOrigen: 15,
      materialPrincipal: 'LINO',
    },
  });
  for (const [talla, color, sku, stock] of [
    ['XS', 'Beige Arena', 'LIN2-XS-BA', 4], ['S', 'Beige Arena', 'LIN2-S-BA', 8],
    ['M',  'Beige Arena', 'LIN2-M-BA',  9], ['L', 'Beige Arena', 'LIN2-L-BA', 5],
    ['S',  'Blanco',      'LIN2-S-BL',  6], ['M', 'Blanco',      'LIN2-M-BL', 7],
    ['L',  'Blanco',      'LIN2-L-BL',  3],
  ] as const) {
    await prisma.variante.create({ data: { productoId: pLin2.id, talla, color, sku, stock } });
  }
  await crearImagenesProducto(pLin2.id, [
    { prefijo: 'lin2', url: img('1572804013427-4d7ca7268217'), alt: 'Vestido midi lino beige arena — vista frontal' },
    { prefijo: 'lin2', url: img('1496217590455-aa63a8b91d42'), alt: 'Vestido midi lino — vista lateral' },
    { prefijo: 'lin2', url: img('1515372039744-b8f02a3ae446'), alt: 'Vestido midi lino — detalle escote y manga' },
    { prefijo: 'lin2', url: img('1595777457583-95e059d581b8'), alt: 'Vestido midi lino — color blanco, vista trasera' },
    { prefijo: 'lin2', url: img('1580651315530-69c8e0026377'), alt: 'Vestido midi lino — plano detalle tejido' },
  ]);
  await prisma.certificadoDeProducto.create({
    data: { productoId: pLin2.id, certificadoId: cGOTS.id, numeroCertificado: 'GOTS-2025-LIN-002', fechaEmision: new Date('2025-03-01'), fechaExpiracion: new Date('2026-03-01') },
  });
  await prisma.certificadoDeProducto.create({
    data: { productoId: pLin2.id, certificadoId: cOEKO.id, numeroCertificado: 'OEKO-2025-LIN-002', fechaEmision: new Date('2025-03-01'), fechaExpiracion: new Date('2026-03-01') },
  });

  // LIN-3: Pantalón Recto Orgánico
  const pLin3 = await prisma.producto.create({
    data: {
      disenadorId: dLin.usuarioId,
      nombre: 'Pantalón Recto Orgánico',
      slug: 'pantalon-recto-organico-linares',
      descripcion:
        'Pantalón de corte recto confeccionado en algodón orgánico certificado OEKO-TEX. ' +
        'Pinzas delanteras, bolsillos laterales y trabillas para cinturón. ' +
        'Ideal como prenda cápsula: de la oficina a la calle sin perder comodidad.',
      precioBase: 64.90,
      kmOrigen: 20,
      materialPrincipal: 'ALGODON_ORGANICO',
    },
  });
  for (const [talla, color, sku, stock] of [
    ['XS', 'Crema',  'LIN3-XS-CR', 3], ['S', 'Crema',  'LIN3-S-CR', 7],
    ['M',  'Crema',  'LIN3-M-CR',  9], ['L', 'Crema',  'LIN3-L-CR', 5], ['XL', 'Crema', 'LIN3-XL-CR', 2],
    ['S',  'Negro',  'LIN3-S-NG',  6], ['M', 'Negro',  'LIN3-M-NG',  8], ['L',  'Negro', 'LIN3-L-NG',  4],
  ] as const) {
    await prisma.variante.create({ data: { productoId: pLin3.id, talla, color, sku, stock } });
  }
  await crearImagenesProducto(pLin3.id, [
    { prefijo: 'lin3', url: img('1624378439575-d8705ad7ae80'), alt: 'Pantalón recto orgánico crema — vista frontal' },
    { prefijo: 'lin3', url: img('1542272454315-4c01d7abdf4a'), alt: 'Pantalón recto orgánico — vista lateral' },
    { prefijo: 'lin3', url: img('1631729371254-42c2892f0e6e'), alt: 'Pantalón recto orgánico — detalle pinzas y bolsillos' },
    { prefijo: 'lin3', url: img('1541099649105-f69ad21f3246'), alt: 'Pantalón recto orgánico negro — vista trasera' },
  ]);
  await prisma.certificadoDeProducto.create({
    data: { productoId: pLin3.id, certificadoId: cOEKO.id, numeroCertificado: 'OEKO-2025-LIN-003', fechaEmision: new Date('2025-04-01'), fechaExpiracion: new Date('2026-04-01') },
  });

  // LIN-4: Blusa Manga Larga
  const pLin4 = await prisma.producto.create({
    data: {
      disenadorId: dLin.usuarioId,
      nombre: 'Blusa de Lino Manga Larga',
      slug: 'blusa-lino-manga-larga',
      descripcion:
        'Blusa de lino con cuello mao y botones de nácar natural. Manga larga ligeramente abullonada en el puño. ' +
        'Tejido semitransparente con acabado suave al tacto. Producida íntegramente en talleres coruñeses.',
      precioBase: 49.90,
      kmOrigen: 15,
      materialPrincipal: 'LINO',
    },
  });
  for (const [talla, color, sku, stock] of [
    ['S', 'Marfil',      'LIN4-S-MA', 8],  ['M', 'Marfil',      'LIN4-M-MA', 10], ['L', 'Marfil',      'LIN4-L-MA', 5],
    ['S', 'Azul Claro',  'LIN4-S-AC', 6],  ['M', 'Azul Claro',  'LIN4-M-AC', 7],  ['L', 'Azul Claro',  'LIN4-L-AC', 3],
  ] as const) {
    await prisma.variante.create({ data: { productoId: pLin4.id, talla, color, sku, stock } });
  }
  await crearImagenesProducto(pLin4.id, [
    { prefijo: 'lin4', url: img('1564584217132-2271feaeb3c5'), alt: 'Blusa lino manga larga marfil — vista frontal' },
    { prefijo: 'lin4', url: img('1586790170083-2f9ceadc732d'), alt: 'Blusa lino manga larga — vista lateral' },
    { prefijo: 'lin4', url: img('1618354691373-d851c5c3a990'), alt: 'Blusa lino manga larga — detalle cuello mao y botones' },
    { prefijo: 'lin4', url: img('1607345366928-199ea26cfe3e'), alt: 'Blusa lino manga larga azul claro — vista frontal' },
  ]);
  await prisma.certificadoDeProducto.create({
    data: { productoId: pLin4.id, certificadoId: cGOTS.id, numeroCertificado: 'GOTS-2025-LIN-004', fechaEmision: new Date('2025-03-01'), fechaExpiracion: new Date('2026-03-01') },
  });
  // eslint-disable-next-line no-console
  console.info('[seed] ✓ 4 productos Liñares Moda');

  // ================================================================
  // ── VENTO ATLÁNTICO ─ 3 productos
  // ================================================================

  // VEN-1: Jersey Marinero Lana Reciclada
  const pVen1 = await prisma.producto.create({
    data: {
      disenadorId: dVen.usuarioId,
      nombre: 'Jersey Marinero Lana Reciclada',
      slug: 'jersey-marinero-lana-reciclada',
      descripcion:
        'Jersey de punto grueso inspirado en los clásicos jerseys marineros de los pescadores gallegos. ' +
        'Confeccionado con lana 100% reciclada certificada GRS. Cuello redondo, costuras reforzadas y corte ' +
        'unisex. Producción cero residuos en Santiago de Compostela.',
      precioBase: 79.90,
      kmOrigen: 45,
      materialPrincipal: 'LANA_RECICLADA',
    },
  });
  for (const [talla, color, sku, stock] of [
    ['S',  'Azul Marino',   'VEN1-S-AM',  6],  ['M', 'Azul Marino',   'VEN1-M-AM',  10],
    ['L',  'Azul Marino',   'VEN1-L-AM',  7],  ['XL', 'Azul Marino',  'VEN1-XL-AM',  4],
    ['S',  'Gris Granito',  'VEN1-S-GG',  5],  ['M', 'Gris Granito',  'VEN1-M-GG',  8],
    ['L',  'Gris Granito',  'VEN1-L-GG',  4],
  ] as const) {
    await prisma.variante.create({ data: { productoId: pVen1.id, talla, color, sku, stock } });
  }
  await crearImagenesProducto(pVen1.id, [
    { prefijo: 'ven1', url: img('1576566588028-4147f3842f27'), alt: 'Jersey marinero lana reciclada azul marino — vista frontal' },
    { prefijo: 'ven1', url: img('1516762689617-e1cffcef479d'), alt: 'Jersey marinero — detalle punto y textura lana' },
    { prefijo: 'ven1', url: img('1609803384069-19f3f21032c0'), alt: 'Jersey marinero — vista lateral gris granito' },
    { prefijo: 'ven1', url: img('1624958723474-a1d3d75f6f9c'), alt: 'Jersey marinero — detalle costuras y cuello' },
    { prefijo: 'ven1', url: img('1598880142538-1a3f9af6a7ac'), alt: 'Jersey marinero — doblez tejido punto grueso' },
  ]);
  await prisma.certificadoDeProducto.create({
    data: { productoId: pVen1.id, certificadoId: cGRS.id, numeroCertificado: 'GRS-2025-VEN-001', fechaEmision: new Date('2025-01-15'), fechaExpiracion: new Date('2026-01-15') },
  });

  // VEN-2: Cárdigan Punto Grueso
  const pVen2 = await prisma.producto.create({
    data: {
      disenadorId: dVen.usuarioId,
      nombre: 'Cárdigan de Punto Grueso',
      slug: 'cardigan-punto-grueso',
      descripcion:
        'Cárdigan oversize de punto trenzado con cierre de botones de madera reciclada. ' +
        'Lana reciclada GRS con acabado suave antiborrillas. Bolsillos laterales con ribete de punto liso. ' +
        'La prenda perfecta para los otoños e inviernos atlánticos.',
      precioBase: 94.90,
      kmOrigen: 45,
      materialPrincipal: 'LANA_RECICLADA',
    },
  });
  for (const [talla, color, sku, stock] of [
    ['XS', 'Beige Tostado', 'VEN2-XS-BT', 3], ['S', 'Beige Tostado', 'VEN2-S-BT', 7],
    ['M',  'Beige Tostado', 'VEN2-M-BT',  9], ['L', 'Beige Tostado', 'VEN2-L-BT', 5],
    ['S',  'Verde Salvia',  'VEN2-S-VS',  5], ['M', 'Verde Salvia',  'VEN2-M-VS', 7],
    ['L',  'Verde Salvia',  'VEN2-L-VS',  3],
  ] as const) {
    await prisma.variante.create({ data: { productoId: pVen2.id, talla, color, sku, stock } });
  }
  await crearImagenesProducto(pVen2.id, [
    { prefijo: 'ven2', url: img('1624958723474-a1d3d75f6f9c'), alt: 'Cárdigan punto grueso beige tostado — vista frontal abierto' },
    { prefijo: 'ven2', url: img('1576566588028-4147f3842f27'), alt: 'Cárdigan punto grueso — detalle trama y botones madera' },
    { prefijo: 'ven2', url: img('1598880142538-1a3f9af6a7ac'), alt: 'Cárdigan punto grueso verde salvia — vista cerrado' },
    { prefijo: 'ven2', url: img('1609803384069-19f3f21032c0'), alt: 'Cárdigan punto grueso — detalle bolsillos' },
  ]);
  await prisma.certificadoDeProducto.create({
    data: { productoId: pVen2.id, certificadoId: cGRS.id, numeroCertificado: 'GRS-2025-VEN-002', fechaEmision: new Date('2025-01-15'), fechaExpiracion: new Date('2026-01-15') },
  });
  await prisma.certificadoDeProducto.create({
    data: { productoId: pVen2.id, certificadoId: cBLUE.id, numeroCertificado: 'BLUE-2025-VEN-002', fechaEmision: new Date('2025-02-01'), fechaExpiracion: new Date('2026-02-01') },
  });

  // VEN-3: Chaleco Acolchado Reciclado
  const pVen3 = await prisma.producto.create({
    data: {
      disenadorId: dVen.usuarioId,
      nombre: 'Chaleco Acolchado Reciclado',
      slug: 'chaleco-acolchado-reciclado',
      descripcion:
        'Chaleco sin mangas con relleno de fibra hueca reciclada (R-PET). Exterior en ripstop de poliéster reciclado ' +
        'certificado BLUESIGN. Cierre YKK reciclado, dos bolsillos con cremallera. Ligero, cálido y muy compresible.',
      precioBase: 69.90,
      kmOrigen: 50,
      materialPrincipal: 'POLIESTER_RECICLADO',
    },
  });
  for (const [talla, color, sku, stock] of [
    ['XS', 'Negro',        'VEN3-XS-NG',  4], ['S', 'Negro',        'VEN3-S-NG',  8],
    ['M',  'Negro',        'VEN3-M-NG',  10], ['L', 'Negro',        'VEN3-L-NG',  6], ['XL', 'Negro',       'VEN3-XL-NG',  3],
    ['S',  'Verde Bosque', 'VEN3-S-VB',   5], ['M', 'Verde Bosque', 'VEN3-M-VB',  7], ['L',  'Verde Bosque','VEN3-L-VB',   4],
  ] as const) {
    await prisma.variante.create({ data: { productoId: pVen3.id, talla, color, sku, stock } });
  }
  await crearImagenesProducto(pVen3.id, [
    { prefijo: 'ven3', url: img('1551028719-00167b16eac5'), alt: 'Chaleco acolchado reciclado negro — vista frontal' },
    { prefijo: 'ven3', url: img('1539109136881-3be0616acf4b'), alt: 'Chaleco acolchado reciclado — vista posterior' },
    { prefijo: 'ven3', url: img('1544022613-e87ca875120d'), alt: 'Chaleco acolchado verde bosque — vista frontal' },
    { prefijo: 'ven3', url: img('1591047139829-d91aecb6caea'), alt: 'Chaleco acolchado — detalle bolsillos y cremallera' },
  ]);
  await prisma.certificadoDeProducto.create({
    data: { productoId: pVen3.id, certificadoId: cGRS.id, numeroCertificado: 'GRS-2025-VEN-003', fechaEmision: new Date('2025-01-15'), fechaExpiracion: new Date('2026-01-15') },
  });
  await prisma.certificadoDeProducto.create({
    data: { productoId: pVen3.id, certificadoId: cBLUE.id, numeroCertificado: 'BLUE-2025-VEN-003', fechaEmision: new Date('2025-02-01'), fechaExpiracion: new Date('2026-02-01') },
  });
  // eslint-disable-next-line no-console
  console.info('[seed] ✓ 3 productos Vento Atlántico');

  // ================================================================
  // ── TERRA GALEGA ─ 4 productos
  // ================================================================

  // TER-1: Camiseta Básica Algodón Orgánico
  const pTer1 = await prisma.producto.create({
    data: {
      disenadorId: dTer.usuarioId,
      nombre: 'Camiseta Básica Algodón Orgánico',
      slug: 'camiseta-basica-algodon-organico',
      descripcion:
        'Camiseta esencial de algodón orgánico peinado, gramaje 180 g/m² para mayor duración. ' +
        'Cuello redondo reforzado, costuras ribeteadas y corte semifitted. Disponible en tres colores ' +
        'tierra inspirados en los paisajes gallegos. Certificado OEKO-TEX Nivel 1.',
      precioBase: 29.90,
      kmOrigen: 30,
      materialPrincipal: 'ALGODON_ORGANICO',
    },
  });
  for (const [talla, color, sku, stock] of [
    ['XS', 'Blanco',       'TER1-XS-BL', 8],  ['S', 'Blanco',       'TER1-S-BL', 12], ['M', 'Blanco',       'TER1-M-BL', 15], ['L', 'Blanco',       'TER1-L-BL', 10], ['XL', 'Blanco',      'TER1-XL-BL', 6],
    ['XS', 'Negro',        'TER1-XS-NG', 6],  ['S', 'Negro',        'TER1-S-NG', 10], ['M', 'Negro',        'TER1-M-NG', 12], ['L', 'Negro',        'TER1-L-NG',  8], ['XL', 'Negro',       'TER1-XL-NG', 4],
    ['S',  'Marrón Tierra','TER1-S-MT',  5],  ['M', 'Marrón Tierra','TER1-M-MT',  8], ['L', 'Marrón Tierra','TER1-L-MT',  6],
  ] as const) {
    await prisma.variante.create({ data: { productoId: pTer1.id, talla, color, sku, stock } });
  }
  await crearImagenesProducto(pTer1.id, [
    { prefijo: 'ter1', url: img('1583743814966-8936f5b7be1a'), alt: 'Camiseta básica algodón orgánico blanco — vista frontal' },
    { prefijo: 'ter1', url: img('1521572163474-6864f9cf17ab'), alt: 'Camiseta básica algodón orgánico — flat lay fondo blanco' },
    { prefijo: 'ter1', url: img('1562157873-818bc0726f68'),   alt: 'Camiseta básica algodón orgánico negro — vista frontal' },
    { prefijo: 'ter1', url: img('1527719327859-a0a611fbe978'), alt: 'Camiseta básica algodón orgánico marrón tierra — vista lateral' },
    { prefijo: 'ter1', url: img('1618354691373-d851c5c3a990'), alt: 'Camiseta básica algodón orgánico — detalle costuras y etiqueta' },
  ]);
  await prisma.certificadoDeProducto.create({
    data: { productoId: pTer1.id, certificadoId: cOEKO.id, numeroCertificado: 'OEKO-2025-TER-001', fechaEmision: new Date('2025-05-01'), fechaExpiracion: new Date('2026-05-01') },
  });

  // TER-2: Falda Midi Algodón Orgánico
  const pTer2 = await prisma.producto.create({
    data: {
      disenadorId: dTer.usuarioId,
      nombre: 'Falda Midi Algodón Orgánico',
      slug: 'falda-midi-algodon-organico-terra',
      descripcion:
        'Falda midi de corte evasé con cinturilla elástica ancha y bolsillo lateral oculto. ' +
        'Algodón orgánico doble cara certificado GOTS y OEKO-TEX. ' +
        'Sin tratamientos químicos postproducción. Largo hasta la media pierna.',
      precioBase: 54.90,
      kmOrigen: 25,
      materialPrincipal: 'ALGODON_ORGANICO',
    },
  });
  for (const [talla, color, sku, stock] of [
    ['XS', 'Verde Musgo', 'TER2-XS-VM', 3], ['S', 'Verde Musgo', 'TER2-S-VM', 7],
    ['M',  'Verde Musgo', 'TER2-M-VM',  9], ['L', 'Verde Musgo', 'TER2-L-VM', 5],
    ['XS', 'Terra',       'TER2-XS-TE', 4], ['S', 'Terra',       'TER2-S-TE', 8],
    ['M',  'Terra',       'TER2-M-TE',  9], ['L', 'Terra',       'TER2-L-TE', 4],
    ['S',  'Crema',       'TER2-S-CR',  6], ['M', 'Crema',       'TER2-M-CR', 7],
  ] as const) {
    await prisma.variante.create({ data: { productoId: pTer2.id, talla, color, sku, stock } });
  }
  await crearImagenesProducto(pTer2.id, [
    { prefijo: 'ter2', url: img('1583496661160-fb5886a0aaaa'), alt: 'Falda midi algodón orgánico verde musgo — vista frontal' },
    { prefijo: 'ter2', url: img('1570976447640-ac859083963f'), alt: 'Falda midi algodón orgánico — detalle cinturilla elástica' },
    { prefijo: 'ter2', url: img('1594938298603-c8148c4dae35'), alt: 'Falda midi algodón orgánico terra — vista lateral' },
    { prefijo: 'ter2', url: img('1583496661160-fb5886a0aaaa'), alt: 'Falda midi algodón orgánico crema — vista posterior' },
  ]);
  await prisma.certificadoDeProducto.create({
    data: { productoId: pTer2.id, certificadoId: cGOTS.id, numeroCertificado: 'GOTS-2025-TER-002', fechaEmision: new Date('2025-05-01'), fechaExpiracion: new Date('2026-05-01') },
  });
  await prisma.certificadoDeProducto.create({
    data: { productoId: pTer2.id, certificadoId: cOEKO.id, numeroCertificado: 'OEKO-2025-TER-002', fechaEmision: new Date('2025-05-01'), fechaExpiracion: new Date('2026-05-01') },
  });

  // TER-3: Vestido Casual Manga Larga
  const pTer3 = await prisma.producto.create({
    data: {
      disenadorId: dTer.usuarioId,
      nombre: 'Vestido Casual Manga Larga',
      slug: 'vestido-casual-manga-larga',
      descripcion:
        'Vestido de punto jersey en algodón orgánico peinado. Manga larga, cuello redondo y largo hasta la rodilla. ' +
        'Corte bodycon suave con tejido con elastano (5%) para mejor movimiento. ' +
        'Prenda versátil que funciona tanto en jornada laboral como en plan casual.',
      precioBase: 74.90,
      kmOrigen: 30,
      materialPrincipal: 'ALGODON_ORGANICO',
    },
  });
  for (const [talla, color, sku, stock] of [
    ['XS', 'Tostado Camel', 'TER3-XS-TC', 3], ['S', 'Tostado Camel', 'TER3-S-TC', 6],
    ['M',  'Tostado Camel', 'TER3-M-TC',  8], ['L', 'Tostado Camel', 'TER3-L-TC', 5],
    ['XS', 'Gris Perla',    'TER3-XS-GP', 4], ['S', 'Gris Perla',    'TER3-S-GP', 7],
    ['M',  'Gris Perla',    'TER3-M-GP',  8], ['L', 'Gris Perla',    'TER3-L-GP', 4],
  ] as const) {
    await prisma.variante.create({ data: { productoId: pTer3.id, talla, color, sku, stock } });
  }
  await crearImagenesProducto(pTer3.id, [
    { prefijo: 'ter3', url: img('1572804013427-4d7ca7268217'), alt: 'Vestido casual manga larga tostado camel — vista frontal' },
    { prefijo: 'ter3', url: img('1515372039744-b8f02a3ae446'), alt: 'Vestido casual manga larga — vista lateral' },
    { prefijo: 'ter3', url: img('1496217590455-aa63a8b91d42'), alt: 'Vestido casual manga larga gris perla — vista frontal' },
    { prefijo: 'ter3', url: img('1595777457583-95e059d581b8'), alt: 'Vestido casual manga larga — detalle cuello y manga' },
    { prefijo: 'ter3', url: img('1580651315530-69c8e0026377'), alt: 'Vestido casual manga larga — vista trasera' },
  ]);
  await prisma.certificadoDeProducto.create({
    data: { productoId: pTer3.id, certificadoId: cGOTS.id, numeroCertificado: 'GOTS-2025-TER-003', fechaEmision: new Date('2025-05-01'), fechaExpiracion: new Date('2026-05-01') },
  });

  // TER-4: Sudadera Cepillada Orgánica
  const pTer4 = await prisma.producto.create({
    data: {
      disenadorId: dTer.usuarioId,
      nombre: 'Sudadera Cepillada Orgánica',
      slug: 'sudadera-cepillada-organica',
      descripcion:
        'Sudadera de algodón orgánico cepillado interior (french terry) 320 g/m². Cuello redondo, ' +
        'puños y bajo con canalé. Ribete de costura en contraste. Sin capucha ni bolsillos frontales ' +
        'para mantener la estética limpia. Lavado a 30° sin perder suavidad.',
      precioBase: 59.90,
      kmOrigen: 28,
      materialPrincipal: 'ALGODON_ORGANICO',
    },
  });
  for (const [talla, color, sku, stock] of [
    ['S', 'Arena',      'TER4-S-AR',  7], ['M', 'Arena',      'TER4-M-AR', 10], ['L', 'Arena',      'TER4-L-AR',  6], ['XL', 'Arena',     'TER4-XL-AR',  3],
    ['S', 'Azul Marino','TER4-S-AM',  5], ['M', 'Azul Marino','TER4-M-AM',  8], ['L', 'Azul Marino','TER4-L-AM',  5], ['XL', 'Azul Marino','TER4-XL-AM', 2],
  ] as const) {
    await prisma.variante.create({ data: { productoId: pTer4.id, talla, color, sku, stock } });
  }
  await crearImagenesProducto(pTer4.id, [
    { prefijo: 'ter4', url: img('1556821840-3a63f8a3900c'), alt: 'Sudadera cepillada orgánica arena — vista frontal' },
    { prefijo: 'ter4', url: img('1578328819058-d69f009d349f'), alt: 'Sudadera cepillada orgánica — detalle cuello y canalé' },
    { prefijo: 'ter4', url: img('1542291026-7eec264c27ff'), alt: 'Sudadera cepillada orgánica azul marino — vista frontal' },
    { prefijo: 'ter4', url: img('1556821840-3a63f8a3900c'), alt: 'Sudadera cepillada orgánica — vista trasera' },
  ]);
  await prisma.certificadoDeProducto.create({
    data: { productoId: pTer4.id, certificadoId: cOEKO.id, numeroCertificado: 'OEKO-2025-TER-004', fechaEmision: new Date('2025-05-01'), fechaExpiracion: new Date('2026-05-01') },
  });
  // eslint-disable-next-line no-console
  console.info('[seed] ✓ 4 productos Terra Galega');

  // ================================================================
  // ── MAREAS STUDIO ─ 3 productos
  // ================================================================

  // MAR-1: Vestido Ligero Tencel
  const pMar1 = await prisma.producto.create({
    data: {
      disenadorId: dMar.usuarioId,
      nombre: 'Vestido Ligero Tencel',
      slug: 'vestido-ligero-tencel',
      descripcion:
        'Vestido fluido de Tencel Lyocell certificado Ecocert. Escote V, tirantes finos y espalda con nudo. ' +
        'El tejido de madera de eucalipto es excepcionalmente suave, termorregulador y biodegradable. ' +
        'Largo midi, corte evasé que cae con gracia. Ideal para los meses cálidos del Atlántico.',
      precioBase: 64.90,
      kmOrigen: 10,
      materialPrincipal: 'TENCEL',
    },
  });
  for (const [talla, color, sku, stock] of [
    ['XS', 'Blanco Nácar', 'MAR1-XS-BN', 4], ['S', 'Blanco Nácar', 'MAR1-S-BN', 7],
    ['M',  'Blanco Nácar', 'MAR1-M-BN',  8], ['L', 'Blanco Nácar', 'MAR1-L-BN', 4],
    ['XS', 'Coral Suave',  'MAR1-XS-CS', 3], ['S', 'Coral Suave',  'MAR1-S-CS', 6],
    ['M',  'Coral Suave',  'MAR1-M-CS',  7], ['L', 'Coral Suave',  'MAR1-L-CS', 3],
  ] as const) {
    await prisma.variante.create({ data: { productoId: pMar1.id, talla, color, sku, stock } });
  }
  await crearImagenesProducto(pMar1.id, [
    { prefijo: 'mar1', url: img('1580651315530-69c8e0026377'), alt: 'Vestido ligero Tencel blanco nácar — vista frontal' },
    { prefijo: 'mar1', url: img('1595777457583-95e059d581b8'), alt: 'Vestido ligero Tencel — vista lateral con escote V' },
    { prefijo: 'mar1', url: img('1572804013427-4d7ca7268217'), alt: 'Vestido ligero Tencel coral suave — frontal' },
    { prefijo: 'mar1', url: img('1515372039744-b8f02a3ae446'), alt: 'Vestido ligero Tencel — detalle nudo espalda' },
    { prefijo: 'mar1', url: img('1496217590455-aa63a8b91d42'), alt: 'Vestido ligero Tencel — caída del tejido' },
  ]);
  await prisma.certificadoDeProducto.create({
    data: { productoId: pMar1.id, certificadoId: cECO.id, numeroCertificado: 'ECO-2025-MAR-001', fechaEmision: new Date('2025-06-01'), fechaExpiracion: new Date('2026-06-01') },
  });

  // MAR-2: Camiseta Oversize Tencel
  const pMar2 = await prisma.producto.create({
    data: {
      disenadorId: dMar.usuarioId,
      nombre: 'Camiseta Oversize Tencel',
      slug: 'camiseta-oversize-tencel',
      descripcion:
        'Camiseta de corte oversize en Tencel Lyocell con caída sedosa. Cuello redondo, manga corta con caída ' +
        'natural. Especialmente cómoda en climas húmedos por su capacidad de termorregulación. ' +
        'Tejido suave al tacto que mejora con cada lavado. Certificada Ecocert.',
      precioBase: 34.90,
      kmOrigen: 10,
      materialPrincipal: 'TENCEL',
    },
  });
  for (const [talla, color, sku, stock] of [
    ['XS', 'Blanco',     'MAR2-XS-BL',  5], ['S', 'Blanco',     'MAR2-S-BL', 9],
    ['M',  'Blanco',     'MAR2-M-BL',  11], ['L', 'Blanco',     'MAR2-L-BL', 7], ['XL', 'Blanco',    'MAR2-XL-BL', 4],
    ['S',  'Gris Bruma', 'MAR2-S-GB',   7], ['M', 'Gris Bruma', 'MAR2-M-GB',  9], ['L',  'Gris Bruma','MAR2-L-GB',  5],
    ['S',  'Arena',      'MAR2-S-AR',   6], ['M', 'Arena',      'MAR2-M-AR',  8], ['L',  'Arena',     'MAR2-L-AR',  4],
  ] as const) {
    await prisma.variante.create({ data: { productoId: pMar2.id, talla, color, sku, stock } });
  }
  await crearImagenesProducto(pMar2.id, [
    { prefijo: 'mar2', url: img('1521572163474-6864f9cf17ab'), alt: 'Camiseta oversize Tencel blanco — vista frontal' },
    { prefijo: 'mar2', url: img('1562157873-818bc0726f68'),   alt: 'Camiseta oversize Tencel — vista posterior' },
    { prefijo: 'mar2', url: img('1596755094514-f87e34085b2c'), alt: 'Camiseta oversize Tencel gris bruma — frontal' },
    { prefijo: 'mar2', url: img('1583743814966-8936f5b7be1a'), alt: 'Camiseta oversize Tencel arena — detalle tejido' },
    { prefijo: 'mar2', url: img('1618354691373-d851c5c3a990'), alt: 'Camiseta oversize Tencel — flat lay fondo blanco' },
  ]);
  await prisma.certificadoDeProducto.create({
    data: { productoId: pMar2.id, certificadoId: cECO.id, numeroCertificado: 'ECO-2025-MAR-002', fechaEmision: new Date('2025-06-01'), fechaExpiracion: new Date('2026-06-01') },
  });

  // MAR-3: Short Casual Algodón
  const pMar3 = await prisma.producto.create({
    data: {
      disenadorId: dMar.usuarioId,
      nombre: 'Short Casual Algodón Orgánico',
      slug: 'short-casual-algodon-organico',
      descripcion:
        'Short de tiro medio con cinturilla elástica y cordón ajustable. Bolsillos laterales y trasero con parche. ' +
        'Algodón orgánico ligero (160 g/m²) perfecto para los días de verano atlántico. ' +
        'Largo hasta mediados del muslo. Certificado OEKO-TEX.',
      precioBase: 39.90,
      kmOrigen: 15,
      materialPrincipal: 'ALGODON_ORGANICO',
    },
  });
  for (const [talla, color, sku, stock] of [
    ['XS', 'Crudo Natural',  'MAR3-XS-CN', 4], ['S', 'Crudo Natural',  'MAR3-S-CN', 8],
    ['M',  'Crudo Natural',  'MAR3-M-CN',  9], ['L', 'Crudo Natural',  'MAR3-L-CN', 6],
    ['XS', 'Azul Celeste',   'MAR3-XS-AC', 3], ['S', 'Azul Celeste',   'MAR3-S-AC', 7],
    ['M',  'Azul Celeste',   'MAR3-M-AC',  8], ['L', 'Azul Celeste',   'MAR3-L-AC', 4],
  ] as const) {
    await prisma.variante.create({ data: { productoId: pMar3.id, talla, color, sku, stock } });
  }
  await crearImagenesProducto(pMar3.id, [
    { prefijo: 'mar3', url: img('1624378439575-d8705ad7ae80'), alt: 'Short casual algodón crudo natural — vista frontal' },
    { prefijo: 'mar3', url: img('1542272454315-4c01d7abdf4a'), alt: 'Short casual algodón — detalle cinturilla y bolsillos' },
    { prefijo: 'mar3', url: img('1541099649105-f69ad21f3246'), alt: 'Short casual algodón azul celeste — vista frontal' },
    { prefijo: 'mar3', url: img('1631729371254-42c2892f0e6e'), alt: 'Short casual algodón — vista posterior' },
  ]);
  await prisma.certificadoDeProducto.create({
    data: { productoId: pMar3.id, certificadoId: cOEKO.id, numeroCertificado: 'OEKO-2025-MAR-003', fechaEmision: new Date('2025-06-01'), fechaExpiracion: new Date('2026-06-01') },
  });
  // eslint-disable-next-line no-console
  console.info('[seed] ✓ 3 productos Mareas Studio');

  // ================================================================
  // ── BOSQUE VERDE ─ 2 productos (tienda pendiente de validación)
  // ================================================================

  // BOS-1: Sudadera de Cáñamo Natural
  const pBos1 = await prisma.producto.create({
    data: {
      disenadorId: dBos.usuarioId,
      nombre: 'Sudadera de Cáñamo Natural',
      slug: 'sudadera-canamo-natural',
      descripcion:
        'Sudadera confeccionada en mezcla de cáñamo (55%) y algodón orgánico (45%). El cáñamo requiere un ' +
        '50% menos de agua que el algodón convencional y no precisa pesticidas. Capucha con cordón, bolsillo ' +
        'canguro y puños con canalé. Certificada Ecocert. Tejido que mejora con el uso.',
      precioBase: 79.90,
      kmOrigen: 100,
      materialPrincipal: 'CANAMO',
    },
  });
  for (const [talla, color, sku, stock] of [
    ['S', 'Verde Kaki',    'BOS1-S-VK',  6], ['M', 'Verde Kaki',    'BOS1-M-VK',  8], ['L', 'Verde Kaki',    'BOS1-L-VK',  5], ['XL', 'Verde Kaki',   'BOS1-XL-VK',  3],
    ['S', 'Gris Pizarra',  'BOS1-S-GP',  5], ['M', 'Gris Pizarra',  'BOS1-M-GP',  7], ['L', 'Gris Pizarra',  'BOS1-L-GP',  4], ['XL', 'Gris Pizarra', 'BOS1-XL-GP',  2],
  ] as const) {
    await prisma.variante.create({ data: { productoId: pBos1.id, talla, color, sku, stock } });
  }
  await crearImagenesProducto(pBos1.id, [
    { prefijo: 'bos1', url: img('1556821840-3a63f8a3900c'), alt: 'Sudadera cáñamo natural verde kaki — vista frontal' },
    { prefijo: 'bos1', url: img('1542291026-7eec264c27ff'), alt: 'Sudadera cáñamo natural — detalle capucha y cordón' },
    { prefijo: 'bos1', url: img('1578328819058-d69f009d349f'), alt: 'Sudadera cáñamo natural gris pizarra — vista frontal' },
    { prefijo: 'bos1', url: img('1556821840-3a63f8a3900c'), alt: 'Sudadera cáñamo natural — detalle tejido y bolsillo' },
  ]);
  await prisma.certificadoDeProducto.create({
    data: { productoId: pBos1.id, certificadoId: cECO.id, numeroCertificado: 'ECO-2025-BOS-001', fechaEmision: new Date('2025-10-01'), fechaExpiracion: new Date('2026-10-01') },
  });

  // BOS-2: Leggings Poliéster Reciclado
  const pBos2 = await prisma.producto.create({
    data: {
      disenadorId: dBos.usuarioId,
      nombre: 'Leggings Poliéster Reciclado',
      slug: 'leggings-poliester-reciclado',
      descripcion:
        'Leggings de alto rendimiento confeccionados con poliéster reciclado de botellas PET (78%) y elastano (22%). ' +
        'Cinturilla alta con bolsillo lateral interno para móvil. Tejido de compresión media, secado rápido y ' +
        'resistente al cloro. Certificados GRS y BLUESIGN. Costura plana anti-rozaduras.',
      precioBase: 54.90,
      kmOrigen: 80,
      materialPrincipal: 'POLIESTER_RECICLADO',
    },
  });
  for (const [talla, color, sku, stock] of [
    ['XS', 'Negro',       'BOS2-XS-NG',  5], ['S', 'Negro',       'BOS2-S-NG', 9],
    ['M',  'Negro',       'BOS2-M-NG',  11], ['L', 'Negro',       'BOS2-L-NG', 7], ['XL', 'Negro',      'BOS2-XL-NG', 4],
    ['XS', 'Azul Oscuro', 'BOS2-XS-AO',  4], ['S', 'Azul Oscuro', 'BOS2-S-AO', 7],
    ['M',  'Azul Oscuro', 'BOS2-M-AO',   8], ['L', 'Azul Oscuro', 'BOS2-L-AO', 5],
  ] as const) {
    await prisma.variante.create({ data: { productoId: pBos2.id, talla, color, sku, stock } });
  }
  await crearImagenesProducto(pBos2.id, [
    { prefijo: 'bos2', url: img('1624378439575-d8705ad7ae80'), alt: 'Leggings poliéster reciclado negro — vista frontal' },
    { prefijo: 'bos2', url: img('1541099649105-f69ad21f3246'), alt: 'Leggings poliéster reciclado — detalle cinturilla y bolsillo' },
    { prefijo: 'bos2', url: img('1631729371254-42c2892f0e6e'), alt: 'Leggings poliéster reciclado azul oscuro — vista frontal' },
    { prefijo: 'bos2', url: img('1542272454315-4c01d7abdf4a'), alt: 'Leggings poliéster reciclado — vista posterior' },
  ]);
  await prisma.certificadoDeProducto.create({
    data: { productoId: pBos2.id, certificadoId: cGRS.id, numeroCertificado: 'GRS-2025-BOS-002', fechaEmision: new Date('2025-10-01'), fechaExpiracion: new Date('2026-10-01') },
  });
  await prisma.certificadoDeProducto.create({
    data: { productoId: pBos2.id, certificadoId: cBLUE.id, numeroCertificado: 'BLUE-2025-BOS-002', fechaEmision: new Date('2025-10-01'), fechaExpiracion: new Date('2026-10-01') },
  });
  // eslint-disable-next-line no-console
  console.info('[seed] ✓ 2 productos Bosque Verde');

  // ================================================================
  // ── TIENDA 6: RÍA DE AROSA — Pontevedra · lino + algodón orgánico
  // ================================================================
  const uRia = await prisma.usuario.create({
    data: {
      correo: 'riaarosa@galiciawear.gal',
      hashContrasena: hashPrueba,
      rol: Rol.DISENADOR,
      correoVerificado: true,
    },
  });
  await prisma.disenador.create({
    data: {
      usuarioId: uRia.id,
      nombreMarca: 'Ría de Arosa Textil',
      biografia:
        'Taller familiar en Vilagarcía de Arousa especializado en prendas de lino y algodón orgánico. ' +
        'Cada pieza se cose a mano con telas cultivadas a menos de 50 km. Inspiración directa en las ' +
        'embarcaciones tradicionales y las marismas de la ría.',
      ciudad: CiudadGallega.PONTEVEDRA,
      ibanCifrado: cifrarIbanSeed('ES6000491500051234599901'),
      validado: true,
      fechaValidacion: new Date('2025-11-20'),
      urlLogo: img('1441986300917-64674bd600d8', 400, 400),
    },
  });
  const dRia = await prisma.disenador.findUniqueOrThrow({ where: { usuarioId: uRia.id } });

  const pRia1 = await prisma.producto.create({
    data: {
      disenadorId: dRia.usuarioId,
      nombre: 'Blazer de Lino Estructurado',
      slug: 'blazer-lino-estructurado',
      descripcion:
        'Blazer de corte italiano confeccionado en lino 100% gallego. Solapa de muesca, dos botones de nácar, ' +
        'bolsillos de parche delanteros y forro ligero de algodón. Tejido con cuerpo pero transpirable. ' +
        'Ideal para el verano atlántico con pantalón o sobre vestido.',
      precioBase: 119.90,
      kmOrigen: 40,
      materialPrincipal: 'LINO',
    },
  });
  for (const [talla, color, sku, stock] of [
    ['XS', 'Crema',       'RIA1-XS-CR', 3], ['S', 'Crema',       'RIA1-S-CR', 6],
    ['M',  'Crema',       'RIA1-M-CR',  8], ['L', 'Crema',       'RIA1-L-CR', 4],
    ['S',  'Gris Arena',  'RIA1-S-GA',  5], ['M', 'Gris Arena',  'RIA1-M-GA', 6], ['L', 'Gris Arena',  'RIA1-L-GA', 3],
  ] as const) {
    await prisma.variante.create({ data: { productoId: pRia1.id, talla, color, sku, stock } });
  }
  await crearImagenesProducto(pRia1.id, [
    { prefijo: 'ria1', url: img('1544022613-e87ca875120d'), alt: 'Blazer lino crema — vista frontal' },
    { prefijo: 'ria1', url: img('1539109136881-3be0616acf4b'), alt: 'Blazer lino — vista lateral' },
    { prefijo: 'ria1', url: img('1551028719-00167b16eac5'), alt: 'Blazer lino gris arena — detalle solapa' },
    { prefijo: 'ria1', url: img('1591047139829-d91aecb6caea'), alt: 'Blazer lino — vista posterior' },
  ]);
  await prisma.certificadoDeProducto.create({
    data: { productoId: pRia1.id, certificadoId: cGOTS.id, numeroCertificado: 'GOTS-2025-RIA-001', fechaEmision: new Date('2025-04-01'), fechaExpiracion: new Date('2026-04-01') },
  });

  const pRia2 = await prisma.producto.create({
    data: {
      disenadorId: dRia.usuarioId,
      nombre: 'Camisa Orgánica de Cuadros',
      slug: 'camisa-organica-cuadros',
      descripcion:
        'Camisa de manga larga en algodón orgánico con estampado de cuadros de colores naturales conseguidos ' +
        'con tintes vegetales. Cuello clásico, botones de coco y dobladillo redondeado. ' +
        'Tejido suave de 140 g/m², cómoda como segunda piel.',
      precioBase: 59.90,
      kmOrigen: 40,
      materialPrincipal: 'ALGODON_ORGANICO',
    },
  });
  for (const [talla, color, sku, stock] of [
    ['S', 'Cuadros Verdes', 'RIA2-S-CV', 7], ['M', 'Cuadros Verdes', 'RIA2-M-CV', 9],
    ['L', 'Cuadros Verdes', 'RIA2-L-CV', 5], ['XL','Cuadros Verdes', 'RIA2-XL-CV',3],
    ['S', 'Cuadros Azules', 'RIA2-S-CA', 6], ['M', 'Cuadros Azules', 'RIA2-M-CA', 8],
    ['L', 'Cuadros Azules', 'RIA2-L-CA', 4],
  ] as const) {
    await prisma.variante.create({ data: { productoId: pRia2.id, talla, color, sku, stock } });
  }
  await crearImagenesProducto(pRia2.id, [
    { prefijo: 'ria2', url: img('1618354691373-d851c5c3a990'), alt: 'Camisa orgánica cuadros verdes — vista frontal' },
    { prefijo: 'ria2', url: img('1586790170083-2f9ceadc732d'), alt: 'Camisa orgánica — detalle cuello y botones' },
    { prefijo: 'ria2', url: img('1564584217132-2271feaeb3c5'), alt: 'Camisa orgánica cuadros azules — frontal' },
    { prefijo: 'ria2', url: img('1607345366928-199ea26cfe3e'), alt: 'Camisa orgánica — vista lateral' },
  ]);
  await prisma.certificadoDeProducto.create({
    data: { productoId: pRia2.id, certificadoId: cOEKO.id, numeroCertificado: 'OEKO-2025-RIA-002', fechaEmision: new Date('2025-04-01'), fechaExpiracion: new Date('2026-04-01') },
  });
  await prisma.certificadoDeProducto.create({
    data: { productoId: pRia2.id, certificadoId: cFAIR.id, numeroCertificado: 'FAIR-2025-RIA-002', fechaEmision: new Date('2025-04-01'), fechaExpiracion: new Date('2026-04-01') },
  });
  // eslint-disable-next-line no-console
  console.info('[seed] ✓ 2 productos Ría de Arosa Textil');

  // ================================================================
  // ── TIENDA 7: NEBOEIRO STUDIO — Ourense · lana y Tencel
  // ================================================================
  const uNeb = await prisma.usuario.create({
    data: {
      correo: 'neboeiro@galiciawear.gal',
      hashContrasena: hashPrueba,
      rol: Rol.DISENADOR,
      correoVerificado: true,
    },
  });
  await prisma.disenador.create({
    data: {
      usuarioId: uNeb.id,
      nombreMarca: 'Neboeiro Studio',
      biografia:
        'Estudio ourensano que toma el nombre de la niebla (neboeiro) que envuelve la provincia en invierno. ' +
        'Prendas de punto artesanal y tejidos fluidos Tencel para las cuatro estaciones. ' +
        'Talleres locales, cero intermediarios y empaque 100% compostable.',
      ciudad: CiudadGallega.OURENSE,
      ibanCifrado: cifrarIbanSeed('ES4901825960810220016983'),
      validado: true,
      fechaValidacion: new Date('2025-12-10'),
      urlLogo: img('1481437156560-3205f6a55735', 400, 400),
    },
  });
  const dNeb = await prisma.disenador.findUniqueOrThrow({ where: { usuarioId: uNeb.id } });

  const pNeb1 = await prisma.producto.create({
    data: {
      disenadorId: dNeb.usuarioId,
      nombre: 'Jersey Cuello Cisne Lana Reciclada',
      slug: 'jersey-cuello-cisne-lana-reciclada',
      descripcion:
        'Jersey de cuello cisne en lana reciclada certificada GRS, tejido de punto bobo que abriga ' +
        'sin sobrecargar. Corte regular, largura de cadera. La calidez de los inviernos ourensanos ' +
        'en una prenda sostenible. Lavado a mano o programa delicado.',
      precioBase: 84.90,
      kmOrigen: 60,
      materialPrincipal: 'LANA_RECICLADA',
    },
  });
  for (const [talla, color, sku, stock] of [
    ['XS', 'Marfil',      'NEB1-XS-MA', 3], ['S', 'Marfil',      'NEB1-S-MA', 7],
    ['M',  'Marfil',      'NEB1-M-MA',  9], ['L', 'Marfil',      'NEB1-L-MA', 5],
    ['S',  'Chocolate',   'NEB1-S-CH',  5], ['M', 'Chocolate',   'NEB1-M-CH', 7], ['L', 'Chocolate',   'NEB1-L-CH', 3],
  ] as const) {
    await prisma.variante.create({ data: { productoId: pNeb1.id, talla, color, sku, stock } });
  }
  await crearImagenesProducto(pNeb1.id, [
    { prefijo: 'neb1', url: img('1609803384069-19f3f21032c0'), alt: 'Jersey cuello cisne marfil — vista frontal' },
    { prefijo: 'neb1', url: img('1576566588028-4147f3842f27'), alt: 'Jersey cuello cisne — detalle punto bobo' },
    { prefijo: 'neb1', url: img('1624958723474-a1d3d75f6f9c'), alt: 'Jersey cuello cisne chocolate — frontal' },
    { prefijo: 'neb1', url: img('1598880142538-1a3f9af6a7ac'), alt: 'Jersey cuello cisne — vista lateral' },
  ]);
  await prisma.certificadoDeProducto.create({
    data: { productoId: pNeb1.id, certificadoId: cGRS.id, numeroCertificado: 'GRS-2025-NEB-001', fechaEmision: new Date('2025-09-01'), fechaExpiracion: new Date('2026-09-01') },
  });

  const pNeb2 = await prisma.producto.create({
    data: {
      disenadorId: dNeb.usuarioId,
      nombre: 'Falda Plisada Tencel',
      slug: 'falda-plisada-tencel',
      descripcion:
        'Falda midi de pliegues en Tencel Lyocell de caída suave. Cinturilla elástica con cremallera lateral. ' +
        'El plisado crea volumen sin añadir peso. Tejido biodegradable certificado Ecocert, lavable a máquina ' +
        'con programa suave. Largo hasta la pantorrilla.',
      precioBase: 69.90,
      kmOrigen: 60,
      materialPrincipal: 'TENCEL',
    },
  });
  for (const [talla, color, sku, stock] of [
    ['XS', 'Negro',        'NEB2-XS-NG', 4], ['S', 'Negro',        'NEB2-S-NG', 8],
    ['M',  'Negro',        'NEB2-M-NG',  9], ['L', 'Negro',        'NEB2-L-NG', 5],
    ['XS', 'Burdeos',      'NEB2-XS-BU', 3], ['S', 'Burdeos',      'NEB2-S-BU', 6],
    ['M',  'Burdeos',      'NEB2-M-BU',  7], ['L', 'Burdeos',      'NEB2-L-BU', 3],
  ] as const) {
    await prisma.variante.create({ data: { productoId: pNeb2.id, talla, color, sku, stock } });
  }
  await crearImagenesProducto(pNeb2.id, [
    { prefijo: 'neb2', url: img('1583496661160-fb5886a0aaaa'), alt: 'Falda plisada Tencel negro — vista frontal' },
    { prefijo: 'neb2', url: img('1570976447640-ac859083963f'), alt: 'Falda plisada Tencel — detalle pliegues' },
    { prefijo: 'neb2', url: img('1594938298603-c8148c4dae35'), alt: 'Falda plisada Tencel burdeos — frontal' },
    { prefijo: 'neb2', url: img('1583496661160-fb5886a0aaaa'), alt: 'Falda plisada Tencel — vista posterior' },
  ]);
  await prisma.certificadoDeProducto.create({
    data: { productoId: pNeb2.id, certificadoId: cECO.id, numeroCertificado: 'ECO-2025-NEB-002', fechaEmision: new Date('2025-09-01'), fechaExpiracion: new Date('2026-09-01') },
  });
  // eslint-disable-next-line no-console
  console.info('[seed] ✓ 2 productos Neboeiro Studio');

  // ================================================================
  // ── TIENDA 8: COSTA DA MORTE — A Coruña · lana natural + cáñamo
  // ================================================================
  const uCos = await prisma.usuario.create({
    data: {
      correo: 'costamort@galiciawear.gal',
      hashContrasena: hashPrueba,
      rol: Rol.DISENADOR,
      correoVerificado: true,
    },
  });
  await prisma.disenador.create({
    data: {
      usuarioId: uCos.id,
      nombreMarca: 'Costa da Morte',
      biografia:
        'Marca de A Coruña inspirada en el paisaje agreste y marino de la Costa da Morte. ' +
        'Prendas de abrigo confeccionadas con lana natural de oveja galega autóctona y mezclas de cáñamo. ' +
        'Colaboración directa con ganaderos locales para garantizar bienestar animal.',
      ciudad: CiudadGallega.CORUNA,
      ibanCifrado: cifrarIbanSeed('ES7601822200150201504289'),
      validado: true,
      fechaValidacion: new Date('2026-01-08'),
      urlLogo: img('1558618666-fcd25c85cd64', 400, 400),
    },
  });
  const dCos = await prisma.disenador.findUniqueOrThrow({ where: { usuarioId: uCos.id } });

  const pCos1 = await prisma.producto.create({
    data: {
      disenadorId: dCos.usuarioId,
      nombre: 'Abrigo Lana Natural Galega',
      slug: 'abrigo-lana-natural-galega',
      descripcion:
        'Abrigo de largo midi en lana cardada 100% de oveja galega. Corte recto, solapa de pico, ' +
        'dos bolsillos laterales y forro de algodón orgánico. Sin mezcla de sintéticos, 100% biodegradable. ' +
        'La prenda más caliente que producimos, para los temporales atlánticos.',
      precioBase: 189.90,
      kmOrigen: 25,
      materialPrincipal: 'LANA_RECICLADA',
    },
  });
  for (const [talla, color, sku, stock] of [
    ['XS', 'Gris Perla',   'COS1-XS-GP', 2], ['S', 'Gris Perla',   'COS1-S-GP', 5],
    ['M',  'Gris Perla',   'COS1-M-GP',  6], ['L', 'Gris Perla',   'COS1-L-GP', 3],
    ['S',  'Camel',        'COS1-S-CA',  4], ['M', 'Camel',        'COS1-M-CA', 5], ['L', 'Camel',        'COS1-L-CA', 2],
  ] as const) {
    await prisma.variante.create({ data: { productoId: pCos1.id, talla, color, sku, stock } });
  }
  await crearImagenesProducto(pCos1.id, [
    { prefijo: 'cos1', url: img('1539109136881-3be0616acf4b'), alt: 'Abrigo lana natural gris perla — vista frontal' },
    { prefijo: 'cos1', url: img('1544022613-e87ca875120d'), alt: 'Abrigo lana natural — detalle solapa y botones' },
    { prefijo: 'cos1', url: img('1551028719-00167b16eac5'), alt: 'Abrigo lana natural camel — frontal' },
    { prefijo: 'cos1', url: img('1591047139829-d91aecb6caea'), alt: 'Abrigo lana natural — vista posterior' },
  ]);
  await prisma.certificadoDeProducto.create({
    data: { productoId: pCos1.id, certificadoId: cGRS.id, numeroCertificado: 'GRS-2025-COS-001', fechaEmision: new Date('2025-10-01'), fechaExpiracion: new Date('2026-10-01') },
  });

  const pCos2 = await prisma.producto.create({
    data: {
      disenadorId: dCos.usuarioId,
      nombre: 'Pantalón Wide Leg de Cáñamo',
      slug: 'pantalon-wide-leg-canamo',
      descripcion:
        'Pantalón de pierna ancha confeccionado en mezcla de cáñamo (60%) y algodón orgánico (40%). ' +
        'El cáñamo le da dureza y cuerpo mientras el algodón aporta suavidad. Cinturilla con elástico ' +
        'y cordón ajustable. Bolsillos de fuelle laterales. Pierna de corte palazzo.',
      precioBase: 74.90,
      kmOrigen: 30,
      materialPrincipal: 'CANAMO',
    },
  });
  for (const [talla, color, sku, stock] of [
    ['XS', 'Caqui',   'COS2-XS-CA', 4], ['S', 'Caqui',   'COS2-S-CA', 7],
    ['M',  'Caqui',   'COS2-M-CA',  8], ['L', 'Caqui',   'COS2-L-CA', 5],
    ['S',  'Negro',   'COS2-S-NG',  6], ['M', 'Negro',   'COS2-M-NG', 8], ['L', 'Negro',   'COS2-L-NG', 4],
  ] as const) {
    await prisma.variante.create({ data: { productoId: pCos2.id, talla, color, sku, stock } });
  }
  await crearImagenesProducto(pCos2.id, [
    { prefijo: 'cos2', url: img('1631729371254-42c2892f0e6e'), alt: 'Pantalón wide leg cáñamo caqui — vista frontal' },
    { prefijo: 'cos2', url: img('1624378439575-d8705ad7ae80'), alt: 'Pantalón wide leg cáñamo — detalle cinturilla' },
    { prefijo: 'cos2', url: img('1542272454315-4c01d7abdf4a'), alt: 'Pantalón wide leg cáñamo negro — frontal' },
    { prefijo: 'cos2', url: img('1541099649105-f69ad21f3246'), alt: 'Pantalón wide leg cáñamo — vista lateral' },
  ]);
  await prisma.certificadoDeProducto.create({
    data: { productoId: pCos2.id, certificadoId: cECO.id, numeroCertificado: 'ECO-2025-COS-002', fechaEmision: new Date('2025-10-01'), fechaExpiracion: new Date('2026-10-01') },
  });
  // eslint-disable-next-line no-console
  console.info('[seed] ✓ 2 productos Costa da Morte');

  // ================================================================
  // ── TIENDA 9: SERRAS DO COUREL — Lugo · lana reciclada
  // ================================================================
  const uSer = await prisma.usuario.create({
    data: {
      correo: 'serras@galiciawear.gal',
      hashContrasena: hashPrueba,
      rol: Rol.DISENADOR,
      correoVerificado: true,
    },
  });
  await prisma.disenador.create({
    data: {
      usuarioId: uSer.id,
      nombreMarca: 'Serras do Courel',
      biografia:
        'Proyecto textil de la sierra lucense Os Ancares-Courel. Recuperamos técnicas de tejido tradicional ' +
        'galego usando lana reciclada de granjas locales. Cada pieza es única y lleva bordado a mano ' +
        'el topónimo de la aldea donde se confeccionó.',
      ciudad: CiudadGallega.LUGO,
      ibanCifrado: cifrarIbanSeed('ES4200491882061234567001'),
      validado: true,
      fechaValidacion: new Date('2026-02-01'),
      urlLogo: img('1445205170230-053b83016050', 400, 400),
    },
  });
  const dSer = await prisma.disenador.findUniqueOrThrow({ where: { usuarioId: uSer.id } });

  const pSer1 = await prisma.producto.create({
    data: {
      disenadorId: dSer.usuarioId,
      nombre: 'Chaleco Lana Reciclada Artesanal',
      slug: 'chaleco-lana-reciclada-artesanal',
      descripcion:
        'Chaleco sin mangas de lana reciclada certificada GRS y BLUESIGN. Tejido en punto trenzado con ' +
        'bordado a mano en el pecho. Cierre de botones de madera autóctona. ' +
        'Prenda de edición limitada: máximo 30 unidades por colorway.',
      precioBase: 89.90,
      kmOrigen: 55,
      materialPrincipal: 'LANA_RECICLADA',
    },
  });
  for (const [talla, color, sku, stock] of [
    ['S', 'Gris Oscuro',   'SER1-S-GO',  5], ['M', 'Gris Oscuro',   'SER1-M-GO',  8], ['L', 'Gris Oscuro',   'SER1-L-GO',  4],
    ['S', 'Tostado',       'SER1-S-TO',  4], ['M', 'Tostado',       'SER1-M-TO',  7], ['L', 'Tostado',       'SER1-L-TO',  3],
  ] as const) {
    await prisma.variante.create({ data: { productoId: pSer1.id, talla, color, sku, stock } });
  }
  await crearImagenesProducto(pSer1.id, [
    { prefijo: 'ser1', url: img('1576566588028-4147f3842f27'), alt: 'Chaleco lana reciclada artesanal gris — frontal' },
    { prefijo: 'ser1', url: img('1516762689617-e1cffcef479d'), alt: 'Chaleco lana — detalle bordado artesanal' },
    { prefijo: 'ser1', url: img('1598880142538-1a3f9af6a7ac'), alt: 'Chaleco lana tostado — frontal' },
    { prefijo: 'ser1', url: img('1609803384069-19f3f21032c0'), alt: 'Chaleco lana — vista posterior' },
  ]);
  await prisma.certificadoDeProducto.create({
    data: { productoId: pSer1.id, certificadoId: cGRS.id, numeroCertificado: 'GRS-2025-SER-001', fechaEmision: new Date('2025-11-01'), fechaExpiracion: new Date('2026-11-01') },
  });
  await prisma.certificadoDeProducto.create({
    data: { productoId: pSer1.id, certificadoId: cBLUE.id, numeroCertificado: 'BLUE-2025-SER-001', fechaEmision: new Date('2025-11-01'), fechaExpiracion: new Date('2026-11-01') },
  });

  const pSer2 = await prisma.producto.create({
    data: {
      disenadorId: dSer.usuarioId,
      nombre: 'Cárdigan Abierto Lana Gruesa',
      slug: 'cardigan-abierto-lana-gruesa',
      descripcion:
        'Cárdigan largo abierto sin cierre, confeccionado en lana gruesa reciclada. Bolsillos laterales ' +
        'de parche, manga larga y bajo recto. Peso del tejido 400 g/m² para máximo abrigo. ' +
        'Ideal para las noches frescas de la montaña lucense o el invierno gallego en general.',
      precioBase: 109.90,
      kmOrigen: 55,
      materialPrincipal: 'LANA_RECICLADA',
    },
  });
  for (const [talla, color, sku, stock] of [
    ['XS', 'Beige Avena',  'SER2-XS-BA', 3], ['S', 'Beige Avena',  'SER2-S-BA', 5],
    ['M',  'Beige Avena',  'SER2-M-BA',  7], ['L', 'Beige Avena',  'SER2-L-BA', 4],
    ['S',  'Gris Carbón',  'SER2-S-GC',  4], ['M', 'Gris Carbón',  'SER2-M-GC', 6], ['L', 'Gris Carbón',  'SER2-L-GC', 3],
  ] as const) {
    await prisma.variante.create({ data: { productoId: pSer2.id, talla, color, sku, stock } });
  }
  await crearImagenesProducto(pSer2.id, [
    { prefijo: 'ser2', url: img('1624958723474-a1d3d75f6f9c'), alt: 'Cárdigan abierto lana gruesa beige — frontal' },
    { prefijo: 'ser2', url: img('1576566588028-4147f3842f27'), alt: 'Cárdigan abierto lana — detalle bolsillos' },
    { prefijo: 'ser2', url: img('1516762689617-e1cffcef479d'), alt: 'Cárdigan abierto gris carbón — frontal' },
    { prefijo: 'ser2', url: img('1598880142538-1a3f9af6a7ac'), alt: 'Cárdigan abierto — detalle tejido y caída' },
  ]);
  await prisma.certificadoDeProducto.create({
    data: { productoId: pSer2.id, certificadoId: cGRS.id, numeroCertificado: 'GRS-2025-SER-002', fechaEmision: new Date('2025-11-01'), fechaExpiracion: new Date('2026-11-01') },
  });
  // eslint-disable-next-line no-console
  console.info('[seed] ✓ 2 productos Serras do Courel');

  // ================================================================
  // ── TIENDA 10: AROUSA ECO — Pontevedra · algodón orgánico básicos
  // ================================================================
  const uAro = await prisma.usuario.create({
    data: {
      correo: 'arousaeco@galiciawear.gal',
      hashContrasena: hashPrueba,
      rol: Rol.DISENADOR,
      correoVerificado: true,
    },
  });
  await prisma.disenador.create({
    data: {
      usuarioId: uAro.id,
      nombreMarca: 'Arousa Eco',
      biografia:
        'Marca pontevedresa de básicos esenciales confeccionados en algodón orgánico certificado GOTS y ' +
        'Fairtrade. Colecciones cápsula de máximo 12 prendas por temporada para evitar la sobreproducción. ' +
        'El 5% de cada venta va destinado a proyectos de reforestación en Galicia.',
      ciudad: CiudadGallega.PONTEVEDRA,
      ibanCifrado: cifrarIbanSeed('ES8000491500051111111102'),
      validado: true,
      fechaValidacion: new Date('2026-02-15'),
      urlLogo: img('1506905925346-21bda4d32df4', 400, 400),
    },
  });
  const dAro = await prisma.disenador.findUniqueOrThrow({ where: { usuarioId: uAro.id } });

  const pAro1 = await prisma.producto.create({
    data: {
      disenadorId: dAro.usuarioId,
      nombre: 'Vestido Lencero de Verano',
      slug: 'vestido-lencero-verano',
      descripcion:
        'Vestido de corte lencero en algodón orgánico tratado con acabado satinado suave. Tirantes finos, ' +
        'escote recto y largo midi. Ligero como pluma, ideal para los días calurosos de la ría. ' +
        'Acompáñalo con una chaqueta o úsalo solo en las noches de agosto.',
      precioBase: 69.90,
      kmOrigen: 20,
      materialPrincipal: 'ALGODON_ORGANICO',
    },
  });
  for (const [talla, color, sku, stock] of [
    ['XS', 'Blanco Óptico', 'ARO1-XS-BO', 4], ['S', 'Blanco Óptico', 'ARO1-S-BO', 8],
    ['M',  'Blanco Óptico', 'ARO1-M-BO',  9], ['L', 'Blanco Óptico', 'ARO1-L-BO', 5],
    ['XS', 'Rosa Palo',     'ARO1-XS-RP', 3], ['S', 'Rosa Palo',     'ARO1-S-RP', 6],
    ['M',  'Rosa Palo',     'ARO1-M-RP',  7], ['L', 'Rosa Palo',     'ARO1-L-RP', 3],
  ] as const) {
    await prisma.variante.create({ data: { productoId: pAro1.id, talla, color, sku, stock } });
  }
  await crearImagenesProducto(pAro1.id, [
    { prefijo: 'aro1', url: img('1595777457583-95e059d581b8'), alt: 'Vestido lencero verano blanco — frontal' },
    { prefijo: 'aro1', url: img('1580651315530-69c8e0026377'), alt: 'Vestido lencero — detalle escote y tirantes' },
    { prefijo: 'aro1', url: img('1515372039744-b8f02a3ae446'), alt: 'Vestido lencero rosa palo — frontal' },
    { prefijo: 'aro1', url: img('1572804013427-4d7ca7268217'), alt: 'Vestido lencero — caída del tejido' },
  ]);
  await prisma.certificadoDeProducto.create({
    data: { productoId: pAro1.id, certificadoId: cGOTS.id, numeroCertificado: 'GOTS-2025-ARO-001', fechaEmision: new Date('2025-12-01'), fechaExpiracion: new Date('2026-12-01') },
  });
  await prisma.certificadoDeProducto.create({
    data: { productoId: pAro1.id, certificadoId: cFAIR.id, numeroCertificado: 'FAIR-2025-ARO-001', fechaEmision: new Date('2025-12-01'), fechaExpiracion: new Date('2026-12-01') },
  });

  const pAro2 = await prisma.producto.create({
    data: {
      disenadorId: dAro.usuarioId,
      nombre: 'Camisa Oversized Orgánica',
      slug: 'camisa-oversized-organica',
      descripcion:
        'Camisa de corte oversized en algodón orgánico de gramaje medio (160 g/m²). Cuello clásico, ' +
        'puños dobles y dobladillo más largo en la parte trasera. Perfecta para llevar por fuera del pantalón ' +
        'o anudada en la cintura. Botones de coco natural.',
      precioBase: 54.90,
      kmOrigen: 20,
      materialPrincipal: 'ALGODON_ORGANICO',
    },
  });
  for (const [talla, color, sku, stock] of [
    ['XS', 'Blanco',       'ARO2-XS-BL', 5], ['S', 'Blanco',       'ARO2-S-BL', 9],
    ['M',  'Blanco',       'ARO2-M-BL', 11], ['L', 'Blanco',       'ARO2-L-BL', 6], ['XL','Blanco',       'ARO2-XL-BL', 3],
    ['S',  'Azul Lavanda', 'ARO2-S-AL',  6], ['M', 'Azul Lavanda', 'ARO2-M-AL',  8], ['L', 'Azul Lavanda', 'ARO2-L-AL',  4],
  ] as const) {
    await prisma.variante.create({ data: { productoId: pAro2.id, talla, color, sku, stock } });
  }
  await crearImagenesProducto(pAro2.id, [
    { prefijo: 'aro2', url: img('1618354691373-d851c5c3a990'), alt: 'Camisa oversized orgánica blanco — frontal' },
    { prefijo: 'aro2', url: img('1596755094514-f87e34085b2c'), alt: 'Camisa oversized — detalle puños dobles' },
    { prefijo: 'aro2', url: img('1564584217132-2271feaeb3c5'), alt: 'Camisa oversized azul lavanda — frontal' },
    { prefijo: 'aro2', url: img('1586790170083-2f9ceadc732d'), alt: 'Camisa oversized — anudada en cintura' },
  ]);
  await prisma.certificadoDeProducto.create({
    data: { productoId: pAro2.id, certificadoId: cGOTS.id, numeroCertificado: 'GOTS-2025-ARO-002', fechaEmision: new Date('2025-12-01'), fechaExpiracion: new Date('2026-12-01') },
  });
  // eslint-disable-next-line no-console
  console.info('[seed] ✓ 2 productos Arousa Eco');

  // ================================================================
  // ── TIENDA 11: RÍAS ALTAS — Lugo · Tencel fluido (pendiente)
  // ================================================================
  const uRal = await prisma.usuario.create({
    data: {
      correo: 'riasaltas@galiciawear.gal',
      hashContrasena: hashPrueba,
      rol: Rol.DISENADOR,
      correoVerificado: true,
    },
  });
  await prisma.disenador.create({
    data: {
      usuarioId: uRal.id,
      nombreMarca: 'Rías Altas',
      biografia:
        'Proyecto de Viveiro (Lugo) nacido en 2025. Prendas fluidas de Tencel inspiradas en los ' +
        'colores del Cantábrico: azules profundos, blancos de espuma y verdes de las rías altas. ' +
        'Solicitud de validación enviada, pendiente de revisión por el equipo GaliciaWear.',
      ciudad: CiudadGallega.LUGO,
      ibanCifrado: cifrarIbanSeed('ES9100491500051234500099'),
      validado: false,
      urlLogo: img('1445205170230-053b83016050', 400, 400),
    },
  });
  const dRal = await prisma.disenador.findUniqueOrThrow({ where: { usuarioId: uRal.id } });

  const pRal1 = await prisma.producto.create({
    data: {
      disenadorId: dRal.usuarioId,
      nombre: 'Pantalón Fluido Tencel',
      slug: 'pantalon-fluido-tencel',
      descripcion:
        'Pantalón de pierna ancha y caída fluida en Tencel Lyocell 100%. Cinturilla alta elástica, ' +
        'pliegues delanteros que aportan volumen natural. La caída sedosa hace que el movimiento ' +
        'sea completamente libre. Certificado Ecocert. Lavable a máquina 30°.',
      precioBase: 72.90,
      kmOrigen: 80,
      materialPrincipal: 'TENCEL',
    },
  });
  for (const [talla, color, sku, stock] of [
    ['XS', 'Azul Cantábrico', 'RAL1-XS-AC', 3], ['S', 'Azul Cantábrico', 'RAL1-S-AC', 6],
    ['M',  'Azul Cantábrico', 'RAL1-M-AC',  7], ['L', 'Azul Cantábrico', 'RAL1-L-AC', 4],
    ['S',  'Blanco Espuma',   'RAL1-S-BE',  5], ['M', 'Blanco Espuma',   'RAL1-M-BE', 6], ['L', 'Blanco Espuma',   'RAL1-L-BE', 3],
  ] as const) {
    await prisma.variante.create({ data: { productoId: pRal1.id, talla, color, sku, stock } });
  }
  await crearImagenesProducto(pRal1.id, [
    { prefijo: 'ral1', url: img('1631729371254-42c2892f0e6e'), alt: 'Pantalón fluido Tencel azul cantábrico — frontal' },
    { prefijo: 'ral1', url: img('1542272454315-4c01d7abdf4a'), alt: 'Pantalón fluido Tencel — detalle cinturilla' },
    { prefijo: 'ral1', url: img('1624378439575-d8705ad7ae80'), alt: 'Pantalón fluido Tencel blanco — frontal' },
    { prefijo: 'ral1', url: img('1541099649105-f69ad21f3246'), alt: 'Pantalón fluido Tencel — caída lateral' },
  ]);
  await prisma.certificadoDeProducto.create({
    data: { productoId: pRal1.id, certificadoId: cECO.id, numeroCertificado: 'ECO-2025-RAL-001', fechaEmision: new Date('2025-12-15'), fechaExpiracion: new Date('2026-12-15') },
  });

  const pRal2 = await prisma.producto.create({
    data: {
      disenadorId: dRal.usuarioId,
      nombre: 'Top Asimétrico Tencel',
      slug: 'top-asimetrico-tencel',
      descripcion:
        'Top de corte asimétrico en Tencel Lyocell. Un hombro descubierto, tirante cruzado en la espalda ' +
        'y bajo en pico. Tejido de 130 g/m² con caída perfecta. Combina con pantalón de tiro alto ' +
        'o falda midi. Ecocert, biodegradable y confeccionado sin PFC.',
      precioBase: 39.90,
      kmOrigen: 80,
      materialPrincipal: 'TENCEL',
    },
  });
  for (const [talla, color, sku, stock] of [
    ['XS', 'Verde Atlántico', 'RAL2-XS-VA', 5], ['S', 'Verde Atlántico', 'RAL2-S-VA', 8],
    ['M',  'Verde Atlántico', 'RAL2-M-VA',  9], ['L', 'Verde Atlántico', 'RAL2-L-VA', 4],
    ['XS', 'Negro',           'RAL2-XS-NG', 4], ['S', 'Negro',           'RAL2-S-NG', 7],
    ['M',  'Negro',           'RAL2-M-NG',  8], ['L', 'Negro',           'RAL2-L-NG', 3],
  ] as const) {
    await prisma.variante.create({ data: { productoId: pRal2.id, talla, color, sku, stock } });
  }
  await crearImagenesProducto(pRal2.id, [
    { prefijo: 'ral2', url: img('1562157873-818bc0726f68'),   alt: 'Top asimétrico Tencel verde atlántico — frontal' },
    { prefijo: 'ral2', url: img('1521572163474-6864f9cf17ab'), alt: 'Top asimétrico Tencel — detalle hombro' },
    { prefijo: 'ral2', url: img('1583743814966-8936f5b7be1a'), alt: 'Top asimétrico Tencel negro — frontal' },
    { prefijo: 'ral2', url: img('1596755094514-f87e34085b2c'), alt: 'Top asimétrico Tencel — vista posterior' },
  ]);
  await prisma.certificadoDeProducto.create({
    data: { productoId: pRal2.id, certificadoId: cECO.id, numeroCertificado: 'ECO-2025-RAL-002', fechaEmision: new Date('2025-12-15'), fechaExpiracion: new Date('2026-12-15') },
  });
  // eslint-disable-next-line no-console
  console.info('[seed] ✓ 2 productos Rías Altas (pendiente validación)');

  // ================================================================
  // ── TIENDA 12: MIÑO SLOW FASHION — Ourense · lino + algodón capsule
  // ================================================================
  const uMin = await prisma.usuario.create({
    data: {
      correo: 'mino@galiciawear.gal',
      hashContrasena: hashPrueba,
      rol: Rol.DISENADOR,
      correoVerificado: true,
    },
  });
  await prisma.disenador.create({
    data: {
      usuarioId: uMin.id,
      nombreMarca: 'Miño Slow Fashion',
      biografia:
        'Colección cápsula ourensana inspirada en el río Miño y los valles que atraviesa. ' +
        'Prendas atemporales de lino y algodón orgánico que duran décadas. ' +
        'Slow fashion en su máxima expresión: producimos bajo pedido para no generar stock sobrante.',
      ciudad: CiudadGallega.OURENSE,
      ibanCifrado: cifrarIbanSeed('ES3800491500050099887766'),
      validado: true,
      fechaValidacion: new Date('2026-03-01'),
      urlLogo: img('1441986300917-64674bd600d8', 400, 400),
    },
  });
  const dMin = await prisma.disenador.findUniqueOrThrow({ where: { usuarioId: uMin.id } });

  const pMin1 = await prisma.producto.create({
    data: {
      disenadorId: dMin.usuarioId,
      nombre: 'Mono Casual de Algodón Orgánico',
      slug: 'mono-casual-algodon-organico',
      descripcion:
        'Mono de manga corta y pierna ancha en algodón orgánico 100% certificado GOTS. ' +
        'Escote cuadrado, cinturón de tela integrado y cremallera invisible en el lateral. ' +
        'Una sola pieza para todo el día: fresca en verano, cálida en primavera-otoño con jersey debajo.',
      precioBase: 94.90,
      kmOrigen: 70,
      materialPrincipal: 'ALGODON_ORGANICO',
    },
  });
  for (const [talla, color, sku, stock] of [
    ['XS', 'Verde Botella', 'MIN1-XS-VB', 3], ['S', 'Verde Botella', 'MIN1-S-VB', 5],
    ['M',  'Verde Botella', 'MIN1-M-VB',  7], ['L', 'Verde Botella', 'MIN1-L-VB', 4],
    ['XS', 'Terracota',     'MIN1-XS-TC', 2], ['S', 'Terracota',     'MIN1-S-TC', 5],
    ['M',  'Terracota',     'MIN1-M-TC',  6], ['L', 'Terracota',     'MIN1-L-TC', 3],
  ] as const) {
    await prisma.variante.create({ data: { productoId: pMin1.id, talla, color, sku, stock } });
  }
  await crearImagenesProducto(pMin1.id, [
    { prefijo: 'min1', url: img('1572804013427-4d7ca7268217'), alt: 'Mono casual algodón verde botella — frontal' },
    { prefijo: 'min1', url: img('1496217590455-aa63a8b91d42'), alt: 'Mono casual — detalle escote cuadrado y cinturón' },
    { prefijo: 'min1', url: img('1515372039744-b8f02a3ae446'), alt: 'Mono casual terracota — frontal' },
    { prefijo: 'min1', url: img('1580651315530-69c8e0026377'), alt: 'Mono casual — vista lateral y caída pierna' },
  ]);
  await prisma.certificadoDeProducto.create({
    data: { productoId: pMin1.id, certificadoId: cGOTS.id, numeroCertificado: 'GOTS-2025-MIN-001', fechaEmision: new Date('2026-01-01'), fechaExpiracion: new Date('2027-01-01') },
  });
  await prisma.certificadoDeProducto.create({
    data: { productoId: pMin1.id, certificadoId: cOEKO.id, numeroCertificado: 'OEKO-2025-MIN-001', fechaEmision: new Date('2026-01-01'), fechaExpiracion: new Date('2027-01-01') },
  });

  const pMin2 = await prisma.producto.create({
    data: {
      disenadorId: dMin.usuarioId,
      nombre: 'Bermuda de Lino Orgánico',
      slug: 'bermuda-lino-organico',
      descripcion:
        'Bermuda de lino orgánico con corte recto hasta la rodilla. Cinturilla con elástico parcial, ' +
        'bolsillos laterales con fuelle y trasero de ribete. Tejido de gramaje medio que no arruga ' +
        'en exceso. Bajo con dobladillo enrollado. Ligera, fresca y muy duradera.',
      precioBase: 44.90,
      kmOrigen: 70,
      materialPrincipal: 'LINO',
    },
  });
  for (const [talla, color, sku, stock] of [
    ['XS', 'Crudo',      'MIN2-XS-CR', 5], ['S', 'Crudo',      'MIN2-S-CR', 8],
    ['M',  'Crudo',      'MIN2-M-CR',  9], ['L', 'Crudo',      'MIN2-L-CR', 6], ['XL','Crudo',      'MIN2-XL-CR', 3],
    ['S',  'Azul Vela',  'MIN2-S-AV',  6], ['M', 'Azul Vela',  'MIN2-M-AV', 8], ['L',  'Azul Vela', 'MIN2-L-AV', 4],
  ] as const) {
    await prisma.variante.create({ data: { productoId: pMin2.id, talla, color, sku, stock } });
  }
  await crearImagenesProducto(pMin2.id, [
    { prefijo: 'min2', url: img('1624378439575-d8705ad7ae80'), alt: 'Bermuda lino orgánico crudo — frontal' },
    { prefijo: 'min2', url: img('1541099649105-f69ad21f3246'), alt: 'Bermuda lino — detalle bolsillos y dobladillo' },
    { prefijo: 'min2', url: img('1631729371254-42c2892f0e6e'), alt: 'Bermuda lino azul vela — frontal' },
    { prefijo: 'min2', url: img('1542272454315-4c01d7abdf4a'), alt: 'Bermuda lino — vista lateral' },
  ]);
  await prisma.certificadoDeProducto.create({
    data: { productoId: pMin2.id, certificadoId: cGOTS.id, numeroCertificado: 'GOTS-2025-MIN-002', fechaEmision: new Date('2026-01-01'), fechaExpiracion: new Date('2027-01-01') },
  });
  // eslint-disable-next-line no-console
  console.info('[seed] ✓ 2 productos Miño Slow Fashion');

  // ================================================================
  // ── TIENDA 13: PONTEVEDRA THREADS — Pontevedra · poliéster reciclado técnico
  // ================================================================
  const uPth = await prisma.usuario.create({
    data: {
      correo: 'ponthreads@galiciawear.gal',
      hashContrasena: hashPrueba,
      rol: Rol.DISENADOR,
      correoVerificado: true,
    },
  });
  await prisma.disenador.create({
    data: {
      usuarioId: uPth.id,
      nombreMarca: 'Pontevedra Threads',
      biografia:
        'Marca técnica y urbana afincada en Pontevedra. Especializados en prendas funcionales de poliéster ' +
        'reciclado certificado GRS para el estilo de vida activo. Impermeables, cortavientos y prendas ' +
        'de media montaña pensadas para el clima oceánico gallego.',
      ciudad: CiudadGallega.PONTEVEDRA,
      ibanCifrado: cifrarIbanSeed('ES9900491500051298765432'),
      validado: true,
      fechaValidacion: new Date('2026-03-20'),
      urlLogo: img('1558618666-fcd25c85cd64', 400, 400),
    },
  });
  const dPth = await prisma.disenador.findUniqueOrThrow({ where: { usuarioId: uPth.id } });

  const pPth1 = await prisma.producto.create({
    data: {
      disenadorId: dPth.usuarioId,
      nombre: 'Chubasquero Ligero Reciclado',
      slug: 'chubasquero-ligero-reciclado',
      descripcion:
        'Chubasquero empaquetable confeccionado en ripstop de poliéster reciclado (100% PET). ' +
        'Tratamiento DWR sin fluorocarbonos, costuras termoselladas, capucha plegable y bolsillo ' +
        'pectoral que hace de funda. Ideal para las lluvias imprevistas del Atlántico. Certificado GRS y BLUESIGN.',
      precioBase: 99.90,
      kmOrigen: 90,
      materialPrincipal: 'POLIESTER_RECICLADO',
    },
  });
  for (const [talla, color, sku, stock] of [
    ['XS', 'Amarillo Lluvia', 'PTH1-XS-AL', 3], ['S', 'Amarillo Lluvia', 'PTH1-S-AL', 6],
    ['M',  'Amarillo Lluvia', 'PTH1-M-AL',  8], ['L', 'Amarillo Lluvia', 'PTH1-L-AL', 5], ['XL','Amarillo Lluvia','PTH1-XL-AL',3],
    ['S',  'Azul Marino',     'PTH1-S-AM',  5], ['M', 'Azul Marino',     'PTH1-M-AM', 7], ['L',  'Azul Marino',  'PTH1-L-AM', 4],
    ['S',  'Negro',           'PTH1-S-NG',  6], ['M', 'Negro',           'PTH1-M-NG', 8], ['L',  'Negro',        'PTH1-L-NG', 4],
  ] as const) {
    await prisma.variante.create({ data: { productoId: pPth1.id, talla, color, sku, stock } });
  }
  await crearImagenesProducto(pPth1.id, [
    { prefijo: 'pth1', url: img('1551028719-00167b16eac5'), alt: 'Chubasquero ligero reciclado amarillo — frontal' },
    { prefijo: 'pth1', url: img('1539109136881-3be0616acf4b'), alt: 'Chubasquero ligero — detalle capucha plegable' },
    { prefijo: 'pth1', url: img('1544022613-e87ca875120d'), alt: 'Chubasquero ligero azul marino — frontal' },
    { prefijo: 'pth1', url: img('1591047139829-d91aecb6caea'), alt: 'Chubasquero ligero negro — empaquetado en bolsillo' },
  ]);
  await prisma.certificadoDeProducto.create({
    data: { productoId: pPth1.id, certificadoId: cGRS.id, numeroCertificado: 'GRS-2025-PTH-001', fechaEmision: new Date('2026-01-15'), fechaExpiracion: new Date('2027-01-15') },
  });
  await prisma.certificadoDeProducto.create({
    data: { productoId: pPth1.id, certificadoId: cBLUE.id, numeroCertificado: 'BLUE-2025-PTH-001', fechaEmision: new Date('2026-01-15'), fechaExpiracion: new Date('2027-01-15') },
  });

  const pPth2 = await prisma.producto.create({
    data: {
      disenadorId: dPth.usuarioId,
      nombre: 'Camiseta Técnica Manga Larga',
      slug: 'camiseta-tecnica-manga-larga',
      descripcion:
        'Camiseta de manga larga en tejido técnico de poliéster reciclado (88%) y elastano reciclado (12%). ' +
        'Tecnología de gestión de humedad (moisture wicking), costuras planas anti-rozaduras y panel ' +
        'de malla en axilas para mayor ventilación. Para trail, senderismo o uso urbano activo.',
      precioBase: 49.90,
      kmOrigen: 90,
      materialPrincipal: 'POLIESTER_RECICLADO',
    },
  });
  for (const [talla, color, sku, stock] of [
    ['XS', 'Verde Kaki',   'PTH2-XS-VK', 5], ['S', 'Verde Kaki',   'PTH2-S-VK', 9],
    ['M',  'Verde Kaki',   'PTH2-M-VK', 10], ['L', 'Verde Kaki',   'PTH2-L-VK', 6], ['XL','Verde Kaki',   'PTH2-XL-VK',3],
    ['S',  'Gris Grafito', 'PTH2-S-GG',  7], ['M', 'Gris Grafito', 'PTH2-M-GG',  9], ['L',  'Gris Grafito','PTH2-L-GG', 5],
  ] as const) {
    await prisma.variante.create({ data: { productoId: pPth2.id, talla, color, sku, stock } });
  }
  await crearImagenesProducto(pPth2.id, [
    { prefijo: 'pth2', url: img('1556821840-3a63f8a3900c'), alt: 'Camiseta técnica manga larga verde kaki — frontal' },
    { prefijo: 'pth2', url: img('1542291026-7eec264c27ff'), alt: 'Camiseta técnica — detalle panel malla axilas' },
    { prefijo: 'pth2', url: img('1578328819058-d69f009d349f'), alt: 'Camiseta técnica gris grafito — frontal' },
    { prefijo: 'pth2', url: img('1521572163474-6864f9cf17ab'), alt: 'Camiseta técnica — vista posterior' },
  ]);
  await prisma.certificadoDeProducto.create({
    data: { productoId: pPth2.id, certificadoId: cGRS.id, numeroCertificado: 'GRS-2025-PTH-002', fechaEmision: new Date('2026-01-15'), fechaExpiracion: new Date('2027-01-15') },
  });
  await prisma.certificadoDeProducto.create({
    data: { productoId: pPth2.id, certificadoId: cBLUE.id, numeroCertificado: 'BLUE-2025-PTH-002', fechaEmision: new Date('2026-01-15'), fechaExpiracion: new Date('2027-01-15') },
  });
  // eslint-disable-next-line no-console
  console.info('[seed] ✓ 2 productos Pontevedra Threads');

  // ================================================================
  // RESUMEN FINAL
  // ================================================================
  const totalProductos = await prisma.producto.count();
  const totalVariantes = await prisma.variante.count();
  const totalImagenes  = await prisma.imagenProducto.count();
  // eslint-disable-next-line no-console
  console.info(
    `[seed] ✅ Seed completado — ${totalProductos} productos · ${totalVariantes} variantes · ${totalImagenes} imágenes`,
  );
  // eslint-disable-next-line no-console
  console.info('[seed] 🔑 Contraseña de todas las cuentas: Prueba123');
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[seed] Error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
