#!/usr/bin/env bash
# =============================================================================
# restore.sh — GaliciaWear: restauración desde copia de seguridad
# Cumple requisito "prueba de restauración" de la rúbrica DAM.
#
# Uso:  bash scripts/restore.sh <ruta/al/galiciawear_YYYYMMDD_HHMMSS.tar.gz>
#
# ⚠️  ADVERTENCIA: este script REEMPLAZA los datos actuales de MySQL y MongoDB.
# =============================================================================
set -euo pipefail

BACKUP_ARCHIVO="${1:?Uso: $0 <archivo_backup.tar.gz>}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROYECTO_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${PROYECTO_DIR}/backend/.env"

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$ENV_FILE"
  set +a
fi

DATABASE_URL="${DATABASE_URL:-}"
MONGO_URI="${MONGO_URI:-}"

if [ -z "$DATABASE_URL" ] || [ -z "$MONGO_URI" ]; then
  echo "[restore] ❌ Faltan DATABASE_URL o MONGO_URI." >&2
  exit 1
fi

if [ ! -f "$BACKUP_ARCHIVO" ]; then
  echo "[restore] ❌ Archivo no encontrado: $BACKUP_ARCHIVO" >&2
  exit 1
fi

DIR_TMP=$(mktemp -d)
trap 'rm -rf "$DIR_TMP"' EXIT

echo "[restore] Extrayendo ${BACKUP_ARCHIVO} ..."
tar -xzf "$BACKUP_ARCHIVO" -C "$DIR_TMP"

# El tar contiene una carpeta tmp_YYYYMMDD_HHMMSS/
CONTENIDO=$(ls "$DIR_TMP")
DIR_DATOS="${DIR_TMP}/${CONTENIDO}"

# ── MySQL ─────────────────────────────────────────────────────────────────────
DUMP_MYSQL="${DIR_DATOS}/mysql.sql"
if [ -f "$DUMP_MYSQL" ]; then
  echo "[restore] Restaurando MySQL..."
  # Parseo de la URI mysql://usuario:contraseña@host:puerto/basededatos
  URL_SIN_ESQUEMA="${DATABASE_URL#mysql://}"
  URL_SIN_QUERY="${URL_SIN_ESQUEMA%%\?*}"
  CREDENCIALES="${URL_SIN_QUERY%%@*}"
  RESTO="${URL_SIN_QUERY#*@}"
  MYSQL_USER="${CREDENCIALES%%:*}"
  MYSQL_PASS="${CREDENCIALES#*:}"
  HOST_PUERTO="${RESTO%%/*}"
  MYSQL_DB="${RESTO#*/}"
  MYSQL_HOST="${HOST_PUERTO%%:*}"
  MYSQL_PORT="${HOST_PUERTO#*:}"
  [ "$MYSQL_PORT" = "$MYSQL_HOST" ] && MYSQL_PORT=3306
  # Restauración: recreamos la BBDD para empezar limpio. MYSQL_PWD oculta la contraseña de `ps`.
  MYSQL_PWD="$MYSQL_PASS" mysql --host="$MYSQL_HOST" --port="$MYSQL_PORT" --user="$MYSQL_USER" \
    -e "DROP DATABASE IF EXISTS \`${MYSQL_DB}\`; CREATE DATABASE \`${MYSQL_DB}\`;"
  MYSQL_PWD="$MYSQL_PASS" mysql --host="$MYSQL_HOST" --port="$MYSQL_PORT" --user="$MYSQL_USER" \
    "$MYSQL_DB" < "$DUMP_MYSQL"
  echo "[restore] ✓ MySQL restaurado"
else
  echo "[restore] ⚠ No se encontró mysql.sql en el backup"
fi

# ── MongoDB ───────────────────────────────────────────────────────────────────
DIR_MONGO="${DIR_DATOS}/mongo"
if [ -d "$DIR_MONGO" ]; then
  echo "[restore] Restaurando MongoDB (--drop borra colecciones existentes)..."
  mongorestore --uri="$MONGO_URI" --drop "$DIR_MONGO" --quiet
  echo "[restore] ✓ MongoDB restaurado"
else
  echo "[restore] ⚠ No se encontró directorio mongo/ en el backup"
fi

echo "[restore] ✅ Restauración completada desde ${BACKUP_ARCHIVO}"
