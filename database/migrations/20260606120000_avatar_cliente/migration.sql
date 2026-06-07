-- Foto de perfil del cliente almacenada como data URI base64 en SQL.
-- MEDIUMTEXT permite hasta 16 MB (la app reduce la imagen antes de enviarla).
ALTER TABLE `cliente` ADD COLUMN `avatar_url` MEDIUMTEXT NULL;
