-- CreateTable
CREATE TABLE `usuario` (
    `id` VARCHAR(191) NOT NULL,
    `correo` VARCHAR(191) NOT NULL,
    `hash_contrasena` VARCHAR(191) NOT NULL,
    `rol` ENUM('CLIENTE', 'DISENADOR', 'ADMIN') NOT NULL DEFAULT 'CLIENTE',
    `correo_verificado` BOOLEAN NOT NULL DEFAULT false,
    `fecha_creacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fecha_actualizacion` DATETIME(3) NOT NULL,
    `fecha_eliminacion` DATETIME(3) NULL,

    UNIQUE INDEX `usuario_correo_key`(`correo`),
    INDEX `usuario_correo_idx`(`correo`),
    INDEX `usuario_rol_idx`(`rol`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cliente` (
    `usuario_id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `apellidos` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NULL,
    `fecha_nacimiento` DATETIME(3) NULL,
    `preferencias_sostenibilidad` JSON NOT NULL,
    `direccion_predeterminada_id` VARCHAR(191) NULL,

    PRIMARY KEY (`usuario_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `disenador` (
    `usuario_id` VARCHAR(191) NOT NULL,
    `nombre_marca` VARCHAR(191) NOT NULL,
    `biografia` TEXT NOT NULL,
    `ciudad` ENUM('CORUNA', 'LUGO', 'SANTIAGO', 'VIGO', 'PONTEVEDRA', 'OURENSE') NOT NULL,
    `iban_cifrado` VARCHAR(191) NOT NULL,
    `validado` BOOLEAN NOT NULL DEFAULT false,
    `fecha_validacion` DATETIME(3) NULL,
    `validado_por_id` VARCHAR(191) NULL,
    `url_logo` VARCHAR(191) NULL,
    `url_web` VARCHAR(191) NULL,
    `fecha_creacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `disenador_nombre_marca_key`(`nombre_marca`),
    INDEX `disenador_ciudad_idx`(`ciudad`),
    INDEX `disenador_validado_idx`(`validado`),
    PRIMARY KEY (`usuario_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `direccion` (
    `id` VARCHAR(191) NOT NULL,
    `usuario_id` VARCHAR(191) NOT NULL,
    `alias` VARCHAR(191) NOT NULL,
    `linea1` VARCHAR(191) NOT NULL,
    `linea2` VARCHAR(191) NULL,
    `ciudad` VARCHAR(191) NOT NULL,
    `codigo_postal` VARCHAR(191) NOT NULL,
    `provincia` VARCHAR(191) NOT NULL DEFAULT 'A Coruña',
    `pais` CHAR(2) NOT NULL DEFAULT 'ES',
    `es_principal` BOOLEAN NOT NULL DEFAULT false,

    INDEX `direccion_usuario_id_idx`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `token_refresco` (
    `id` VARCHAR(191) NOT NULL,
    `usuario_id` VARCHAR(191) NOT NULL,
    `hash_token` VARCHAR(191) NOT NULL,
    `fecha_creacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fecha_expiracion` DATETIME(3) NOT NULL,
    `fecha_revocacion` DATETIME(3) NULL,
    `agente_usuario` VARCHAR(191) NULL,
    `ip_origen` VARCHAR(191) NULL,

    UNIQUE INDEX `token_refresco_hash_token_key`(`hash_token`),
    INDEX `token_refresco_usuario_id_idx`(`usuario_id`),
    INDEX `token_refresco_fecha_expiracion_idx`(`fecha_expiracion`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `producto` (
    `id` VARCHAR(191) NOT NULL,
    `disenador_id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `descripcion` TEXT NOT NULL,
    `precio_base` DECIMAL(10, 2) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `km_origen` INTEGER NOT NULL DEFAULT 0,
    `material_principal` ENUM('ALGODON_ORGANICO', 'LANA_RECICLADA', 'LINO', 'TENCEL', 'CANAMO', 'POLIESTER_RECICLADO', 'SEDA', 'OTRO') NOT NULL,
    `fecha_creacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fecha_actualizacion` DATETIME(3) NOT NULL,

    UNIQUE INDEX `producto_slug_key`(`slug`),
    INDEX `producto_disenador_id_idx`(`disenador_id`),
    INDEX `producto_activo_idx`(`activo`),
    INDEX `producto_material_principal_idx`(`material_principal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `variante` (
    `id` VARCHAR(191) NOT NULL,
    `producto_id` VARCHAR(191) NOT NULL,
    `talla` ENUM('XS', 'S', 'M', 'L', 'XL', 'XXL', 'TALLA_UNICA') NOT NULL,
    `color` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(191) NOT NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `ajuste_precio` DECIMAL(10, 2) NOT NULL DEFAULT 0,

    UNIQUE INDEX `variante_sku_key`(`sku`),
    INDEX `variante_producto_id_idx`(`producto_id`),
    UNIQUE INDEX `variante_producto_id_talla_color_key`(`producto_id`, `talla`, `color`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `imagen_producto` (
    `id` VARCHAR(191) NOT NULL,
    `producto_id` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `texto_alternativo` VARCHAR(191) NULL,
    `posicion` INTEGER NOT NULL DEFAULT 0,
    `es_principal` BOOLEAN NOT NULL DEFAULT false,

    INDEX `imagen_producto_producto_id_idx`(`producto_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `certificado_sostenibilidad` (
    `id` VARCHAR(191) NOT NULL,
    `codigo` ENUM('GOTS', 'OEKO_TEX', 'FAIRTRADE', 'GRS', 'BLUESIGN', 'ECOCERT') NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` TEXT NOT NULL,
    `url_emisor` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `certificado_sostenibilidad_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `certificado_de_producto` (
    `producto_id` VARCHAR(191) NOT NULL,
    `certificado_id` VARCHAR(191) NOT NULL,
    `numero_certificado` VARCHAR(191) NOT NULL,
    `fecha_emision` DATETIME(3) NOT NULL,
    `fecha_expiracion` DATETIME(3) NULL,

    PRIMARY KEY (`producto_id`, `certificado_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `carrito` (
    `id` VARCHAR(191) NOT NULL,
    `cliente_id` VARCHAR(191) NOT NULL,
    `fecha_actualizacion` DATETIME(3) NOT NULL,

    UNIQUE INDEX `carrito_cliente_id_key`(`cliente_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item_carrito` (
    `id` VARCHAR(191) NOT NULL,
    `carrito_id` VARCHAR(191) NOT NULL,
    `variante_id` VARCHAR(191) NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `fecha_anadido` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `item_carrito_carrito_id_idx`(`carrito_id`),
    UNIQUE INDEX `item_carrito_carrito_id_variante_id_key`(`carrito_id`, `variante_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pedido` (
    `id` VARCHAR(191) NOT NULL,
    `numero_pedido` VARCHAR(191) NOT NULL,
    `cliente_id` VARCHAR(191) NOT NULL,
    `estado` ENUM('PENDIENTE_PAGO', 'PAGADO', 'ACEPTADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO', 'DEVUELTO') NOT NULL DEFAULT 'PENDIENTE_PAGO',
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `coste_envio` DECIMAL(10, 2) NOT NULL,
    `total` DECIMAL(10, 2) NOT NULL,
    `direccion_envio_id` VARCHAR(191) NOT NULL,
    `metodo_pago` ENUM('TARJETA', 'BIZUM', 'TRANSFERENCIA') NOT NULL,
    `fecha_creacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fecha_pago` DATETIME(3) NULL,
    `fecha_aceptacion` DATETIME(3) NULL,
    `notas` TEXT NULL,

    UNIQUE INDEX `pedido_numero_pedido_key`(`numero_pedido`),
    INDEX `pedido_cliente_id_idx`(`cliente_id`),
    INDEX `pedido_estado_idx`(`estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `linea_pedido` (
    `id` VARCHAR(191) NOT NULL,
    `pedido_id` VARCHAR(191) NOT NULL,
    `variante_id` VARCHAR(191) NOT NULL,
    `disenador_id` VARCHAR(191) NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `precio_unitario` DECIMAL(10, 2) NOT NULL,
    `estado_linea` ENUM('PENDIENTE_PAGO', 'PAGADO', 'ACEPTADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO', 'DEVUELTO') NOT NULL DEFAULT 'PENDIENTE_PAGO',

    INDEX `linea_pedido_pedido_id_idx`(`pedido_id`),
    INDEX `linea_pedido_disenador_id_idx`(`disenador_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `envio` (
    `id` VARCHAR(191) NOT NULL,
    `pedido_id` VARCHAR(191) NOT NULL,
    `transportista` ENUM('CORREOS_VERDE', 'CORREOS_EXPRESS', 'NACEX', 'SEUR') NOT NULL,
    `envio_ecologico` BOOLEAN NOT NULL DEFAULT false,
    `numero_seguimiento` VARCHAR(191) NULL,
    `entrega_estimada` DATETIME(3) NULL,
    `fecha_envio` DATETIME(3) NULL,
    `fecha_entrega` DATETIME(3) NULL,

    UNIQUE INDEX `envio_pedido_id_key`(`pedido_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resena` (
    `id` VARCHAR(191) NOT NULL,
    `linea_pedido_id` VARCHAR(191) NOT NULL,
    `cliente_id` VARCHAR(191) NOT NULL,
    `producto_id` VARCHAR(191) NOT NULL,
    `valoracion` INTEGER NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `cuerpo` TEXT NOT NULL,
    `tiene_multimedia` BOOLEAN NOT NULL DEFAULT false,
    `estado_moderacion` ENUM('PENDIENTE', 'APROBADA', 'RECHAZADA') NOT NULL DEFAULT 'PENDIENTE',
    `fecha_creacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `resena_linea_pedido_id_key`(`linea_pedido_id`),
    INDEX `resena_producto_id_idx`(`producto_id`),
    INDEX `resena_cliente_id_idx`(`cliente_id`),
    INDEX `resena_estado_moderacion_idx`(`estado_moderacion`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mensaje` (
    `id` VARCHAR(191) NOT NULL,
    `remitente_id` VARCHAR(191) NOT NULL,
    `destinatario_id` VARCHAR(191) NOT NULL,
    `producto_id` VARCHAR(191) NULL,
    `cuerpo` TEXT NOT NULL,
    `fecha_envio` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fecha_lectura` DATETIME(3) NULL,

    INDEX `mensaje_remitente_id_idx`(`remitente_id`),
    INDEX `mensaje_destinatario_id_idx`(`destinatario_id`),
    INDEX `mensaje_producto_id_idx`(`producto_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `cliente` ADD CONSTRAINT `cliente_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `disenador` ADD CONSTRAINT `disenador_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `disenador` ADD CONSTRAINT `disenador_validado_por_id_fkey` FOREIGN KEY (`validado_por_id`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `direccion` ADD CONSTRAINT `direccion_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `token_refresco` ADD CONSTRAINT `token_refresco_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `producto` ADD CONSTRAINT `producto_disenador_id_fkey` FOREIGN KEY (`disenador_id`) REFERENCES `disenador`(`usuario_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `variante` ADD CONSTRAINT `variante_producto_id_fkey` FOREIGN KEY (`producto_id`) REFERENCES `producto`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `imagen_producto` ADD CONSTRAINT `imagen_producto_producto_id_fkey` FOREIGN KEY (`producto_id`) REFERENCES `producto`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificado_de_producto` ADD CONSTRAINT `certificado_de_producto_producto_id_fkey` FOREIGN KEY (`producto_id`) REFERENCES `producto`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificado_de_producto` ADD CONSTRAINT `certificado_de_producto_certificado_id_fkey` FOREIGN KEY (`certificado_id`) REFERENCES `certificado_sostenibilidad`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `carrito` ADD CONSTRAINT `carrito_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `cliente`(`usuario_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_carrito` ADD CONSTRAINT `item_carrito_carrito_id_fkey` FOREIGN KEY (`carrito_id`) REFERENCES `carrito`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_carrito` ADD CONSTRAINT `item_carrito_variante_id_fkey` FOREIGN KEY (`variante_id`) REFERENCES `variante`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedido` ADD CONSTRAINT `pedido_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `cliente`(`usuario_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedido` ADD CONSTRAINT `pedido_direccion_envio_id_fkey` FOREIGN KEY (`direccion_envio_id`) REFERENCES `direccion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `linea_pedido` ADD CONSTRAINT `linea_pedido_pedido_id_fkey` FOREIGN KEY (`pedido_id`) REFERENCES `pedido`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `linea_pedido` ADD CONSTRAINT `linea_pedido_variante_id_fkey` FOREIGN KEY (`variante_id`) REFERENCES `variante`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `linea_pedido` ADD CONSTRAINT `linea_pedido_disenador_id_fkey` FOREIGN KEY (`disenador_id`) REFERENCES `disenador`(`usuario_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `envio` ADD CONSTRAINT `envio_pedido_id_fkey` FOREIGN KEY (`pedido_id`) REFERENCES `pedido`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resena` ADD CONSTRAINT `resena_linea_pedido_id_fkey` FOREIGN KEY (`linea_pedido_id`) REFERENCES `linea_pedido`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resena` ADD CONSTRAINT `resena_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `cliente`(`usuario_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resena` ADD CONSTRAINT `resena_producto_id_fkey` FOREIGN KEY (`producto_id`) REFERENCES `producto`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mensaje` ADD CONSTRAINT `mensaje_remitente_id_fkey` FOREIGN KEY (`remitente_id`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mensaje` ADD CONSTRAINT `mensaje_destinatario_id_fkey` FOREIGN KEY (`destinatario_id`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mensaje` ADD CONSTRAINT `mensaje_producto_id_fkey` FOREIGN KEY (`producto_id`) REFERENCES `producto`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
