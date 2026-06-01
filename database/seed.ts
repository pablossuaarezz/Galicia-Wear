// Seed de desarrollo para GaliciaWear.
// Ejecutar: cd backend && npm run seed
// Crea: 6 certificados · 1 admin · 2 clientes · 2 diseñadores (1 validado, 1 pendiente)
import { PrismaClient, Rol, CiudadGallega, CodigoCertificado } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'node:crypto';

const prisma = new PrismaClient();

// Cifrado inline con la clave de desarrollo por defecto (no usar en producción)
function cifrarIbanSeed(iban: string): string {
  const clave = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex');
  const iv = crypto.randomBytes(12);
  const cifrador = crypto.createCipheriv('aes-256-gcm', clave, iv);
  const cifrado = Buffer.concat([cifrador.update(iban, 'utf8'), cifrador.final()]);
  const tag = cifrador.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${cifrado.toString('hex')}`;
}

async function main() {
  // eslint-disable-next-line no-console
  console.info('[seed] Iniciando seed de GaliciaWear…');

  // --- Certificados de sostenibilidad ---
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

  // --- Contraseña compartida de prueba (Prueba123) ---
  const hashPrueba = await bcrypt.hash('Prueba123', 10);

  // --- Admin ---
  await prisma.usuario.upsert({
    where: { correo: 'admin@galiciawear.gal' },
    update: {},
    create: {
      correo: 'admin@galiciawear.gal',
      hashContrasena: hashPrueba,
      rol: Rol.ADMIN,
      correoVerificado: true,
    },
  });
  // eslint-disable-next-line no-console
  console.info('[seed] ✓ Admin creado (admin@galiciawear.gal)');

  // --- Cliente: Ana López (buyer persona) ---
  await prisma.usuario.upsert({
    where: { correo: 'ana@galiciawear.gal' },
    update: {},
    create: {
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

  // --- Cliente: Carlos Méndez ---
  await prisma.usuario.upsert({
    where: { correo: 'carlos@galiciawear.gal' },
    update: {},
    create: {
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
  // eslint-disable-next-line no-console
  console.info('[seed] ✓ 2 clientes creados (ana@, carlos@)');

  // --- Diseñador 1: Liñares Moda (A Coruña, validado) ---
  const usuarioDisenador1 = await prisma.usuario.upsert({
    where: { correo: 'linares@galiciawear.gal' },
    update: {},
    create: {
      correo: 'linares@galiciawear.gal',
      hashContrasena: hashPrueba,
      rol: Rol.DISENADOR,
      correoVerificado: true,
    },
  });

  await prisma.disenador.upsert({
    where: { usuarioId: usuarioDisenador1.id },
    update: {},
    create: {
      usuarioId: usuarioDisenador1.id,
      nombreMarca: 'Liñares Moda',
      biografia:
        'Diseñadora gallega especializada en prendas de lino y algodón orgánico. ' +
        'Toda la producción se realiza en A Coruña con materiales de km 0.',
      ciudad: CiudadGallega.CORUNA,
      ibanCifrado: cifrarIbanSeed('ES9121000418450200051332'),
      validado: true,
      fechaValidacion: new Date('2026-01-15'),
    },
  });

  // --- Diseñador 2: Vento Atlántico (Santiago, pendiente de validación) ---
  const usuarioDisenador2 = await prisma.usuario.upsert({
    where: { correo: 'vento@galiciawear.gal' },
    update: {},
    create: {
      correo: 'vento@galiciawear.gal',
      hashContrasena: hashPrueba,
      rol: Rol.DISENADOR,
      correoVerificado: true,
    },
  });

  await prisma.disenador.upsert({
    where: { usuarioId: usuarioDisenador2.id },
    update: {},
    create: {
      usuarioId: usuarioDisenador2.id,
      nombreMarca: 'Vento Atlántico',
      biografia:
        'Colectivo de diseñadores compostelanos inspirados en la cultura y paisajes de Galicia. ' +
        'Usamos exclusivamente lana reciclada certificada GRS.',
      ciudad: CiudadGallega.SANTIAGO,
      ibanCifrado: cifrarIbanSeed('ES7620770024003102575766'),
      validado: false,
    },
  });
  // eslint-disable-next-line no-console
  console.info('[seed] ✓ 2 diseñadores creados (linares@ validado, vento@ pendiente)');

  // ---- Obtener IDs para relaciones ----
  const certGOTS = await prisma.certificadoSostenibilidad.findUnique({ where: { codigo: 'GOTS' } });
  const certOEKO = await prisma.certificadoSostenibilidad.findUnique({ where: { codigo: 'OEKO_TEX' } });
  const certGRS = await prisma.certificadoSostenibilidad.findUnique({ where: { codigo: 'GRS' } });

  const disenadorLinares = await prisma.disenador.findUnique({ where: { usuarioId: usuarioDisenador1.id } });

  if (disenadorLinares && certGOTS && certOEKO && certGRS) {
    // --- Producto 1: Camiseta Lino Gallego ---
    const prod1 = await prisma.producto.upsert({
      where: { slug: 'camiseta-lino-gallego-seed' },
      update: {},
      create: {
        disenadorId: disenadorLinares.usuarioId,
        nombre: 'Camiseta Lino Gallego',
        slug: 'camiseta-lino-gallego-seed',
        descripcion:
          'Camiseta de manga corta confeccionada con lino 100% gallego cultivado en las Rías Baixas. ' +
          'Sin tintes artificiales ni tratamientos químicos. Tejido transpirable ideal para el verano atlántico.',
        precioBase: 34.90,
        kmOrigen: 15,
        materialPrincipal: 'LINO',
      },
    });

    await prisma.variante.upsert({
      where: { sku: 'CLI-LINO-S-NC' },
      update: { stock: 8 },
      create: { productoId: prod1.id, talla: 'S', color: 'Natural Crudo', sku: 'CLI-LINO-S-NC', stock: 8 },
    });
    await prisma.variante.upsert({
      where: { sku: 'CLI-LINO-M-NC' },
      update: { stock: 12 },
      create: { productoId: prod1.id, talla: 'M', color: 'Natural Crudo', sku: 'CLI-LINO-M-NC', stock: 12 },
    });
    await prisma.variante.upsert({
      where: { sku: 'CLI-LINO-L-NC' },
      update: { stock: 6 },
      create: { productoId: prod1.id, talla: 'L', color: 'Natural Crudo', sku: 'CLI-LINO-L-NC', stock: 6 },
    });

    await prisma.imagenProducto.upsert({
      where: { id: 'img-cami-lino-1' },
      update: {},
      create: {
        id: 'img-cami-lino-1',
        productoId: prod1.id,
        url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
        textoAlternativo: 'Camiseta de lino gallego color natural',
        posicion: 0,
        esPrincipal: true,
      },
    });

    await prisma.certificadoDeProducto.upsert({
      where: { productoId_certificadoId: { productoId: prod1.id, certificadoId: certGOTS.id } },
      update: {},
      create: {
        productoId: prod1.id,
        certificadoId: certGOTS.id,
        numeroCertificado: 'GOTS-2024-LIN-001',
        fechaEmision: new Date('2024-03-01'),
        fechaExpiracion: new Date('2025-03-01'),
      },
    });

    // --- Producto 2: Jersey Lana Atlántica ---
    const prod2 = await prisma.producto.upsert({
      where: { slug: 'jersey-lana-atlantica-seed' },
      update: {},
      create: {
        disenadorId: disenadorLinares.usuarioId,
        nombre: 'Jersey Lana Atlántica',
        slug: 'jersey-lana-atlantica-seed',
        descripcion:
          'Jersey de punto grueso fabricado con lana reciclada certificada GRS. Inspirado en los ' +
          'patrones marineros de A Coruña. Ideal para los inviernos atlánticos. ' +
          'Producción local, cero microplásticos añadidos.',
        precioBase: 79.90,
        kmOrigen: 45,
        materialPrincipal: 'LANA_RECICLADA',
      },
    });

    await prisma.variante.upsert({
      where: { sku: 'JER-LANA-S-AZ' },
      update: { stock: 5 },
      create: { productoId: prod2.id, talla: 'S', color: 'Azul Marino', sku: 'JER-LANA-S-AZ', stock: 5 },
    });
    await prisma.variante.upsert({
      where: { sku: 'JER-LANA-M-AZ' },
      update: { stock: 9 },
      create: { productoId: prod2.id, talla: 'M', color: 'Azul Marino', sku: 'JER-LANA-M-AZ', stock: 9 },
    });
    await prisma.variante.upsert({
      where: { sku: 'JER-LANA-L-GR' },
      update: { stock: 4 },
      create: { productoId: prod2.id, talla: 'L', color: 'Gris Granito', sku: 'JER-LANA-L-GR', stock: 4 },
    });

    await prisma.imagenProducto.upsert({
      where: { id: 'img-jersey-1' },
      update: {},
      create: {
        id: 'img-jersey-1',
        productoId: prod2.id,
        url: 'https://images.unsplash.com/photo-1605763240000-7e93b172d754?w=800',
        textoAlternativo: 'Jersey lana reciclada azul marino',
        posicion: 0,
        esPrincipal: true,
      },
    });

    await prisma.certificadoDeProducto.upsert({
      where: { productoId_certificadoId: { productoId: prod2.id, certificadoId: certGRS.id } },
      update: {},
      create: {
        productoId: prod2.id,
        certificadoId: certGRS.id,
        numeroCertificado: 'GRS-2024-LAN-007',
        fechaEmision: new Date('2024-01-15'),
        fechaExpiracion: new Date('2025-01-15'),
      },
    });

    // --- Producto 3: Falda Algodón Orgánico ---
    const prod3 = await prisma.producto.upsert({
      where: { slug: 'falda-algodon-organico-seed' },
      update: {},
      create: {
        disenadorId: disenadorLinares.usuarioId,
        nombre: 'Falda Algodón Orgánico',
        slug: 'falda-algodon-organico-seed',
        descripcion:
          'Falda midi de algodón orgánico certificado GOTS y OEKO-TEX. Corte evasé ' +
          'con cinturilla elástica. Costura local en A Coruña. Sin tratamientos químicos postproducción.',
        precioBase: 54.90,
        kmOrigen: 20,
        materialPrincipal: 'ALGODON_ORGANICO',
      },
    });

    await prisma.variante.upsert({
      where: { sku: 'FAL-ALG-XS-VE' },
      update: { stock: 3 },
      create: { productoId: prod3.id, talla: 'XS', color: 'Verde Musgo', sku: 'FAL-ALG-XS-VE', stock: 3 },
    });
    await prisma.variante.upsert({
      where: { sku: 'FAL-ALG-S-VE' },
      update: { stock: 7 },
      create: { productoId: prod3.id, talla: 'S', color: 'Verde Musgo', sku: 'FAL-ALG-S-VE', stock: 7 },
    });
    await prisma.variante.upsert({
      where: { sku: 'FAL-ALG-M-TE' },
      update: { stock: 10 },
      create: { productoId: prod3.id, talla: 'M', color: 'Terra', sku: 'FAL-ALG-M-TE', stock: 10 },
    });

    await prisma.imagenProducto.upsert({
      where: { id: 'img-falda-1' },
      update: {},
      create: {
        id: 'img-falda-1',
        productoId: prod3.id,
        url: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800',
        textoAlternativo: 'Falda de algodón orgánico color verde musgo',
        posicion: 0,
        esPrincipal: true,
      },
    });

    await prisma.certificadoDeProducto.upsert({
      where: { productoId_certificadoId: { productoId: prod3.id, certificadoId: certGOTS.id } },
      update: {},
      create: {
        productoId: prod3.id,
        certificadoId: certGOTS.id,
        numeroCertificado: 'GOTS-2024-ALG-003',
        fechaEmision: new Date('2024-06-01'),
        fechaExpiracion: new Date('2025-06-01'),
      },
    });

    await prisma.certificadoDeProducto.upsert({
      where: { productoId_certificadoId: { productoId: prod3.id, certificadoId: certOEKO.id } },
      update: {},
      create: {
        productoId: prod3.id,
        certificadoId: certOEKO.id,
        numeroCertificado: 'OEKO-2024-ALG-019',
        fechaEmision: new Date('2024-06-01'),
        fechaExpiracion: new Date('2025-06-01'),
      },
    });

    // eslint-disable-next-line no-console
    console.info('[seed] ✓ 3 productos con variantes, imágenes y certificados (Liñares Moda)');
  }

  // eslint-disable-next-line no-console
  console.info('[seed] ✅ Seed completado.');
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[seed] Error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
