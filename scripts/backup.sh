#!/usr/bin/env bash
# =============================================================================
# backup.sh — GaliciaWear: copia de seguridad MySQL + MongoDB
# Cumple requisito explícito "script backup" de la rúbrica DAM.
#
# Uso:    bash scripts/backup.sh
# Cron:   0 3 * * *  /ruta/proyecto/scripts/backup.sh >> /var/log/galiciawear.log 2>&1
#
# Dependencias del sistema: mysqldump (mysql-client), mongodump (mongodb-tools), tar
# Variables de entorno: DATABASE_URL, MONGO_URI (se cargan de backend/.env si existe)
# Formato DATABASE_URL esperado: mysql://usuario:contraseña@host:puerto/basededatos
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROYECTO_DIR="$(dirname "$SCRIPT_DIR")"
BACKUPS_DIR="${PROYECTO_DIR}/backups"
ENV_FILE="${PROYECTO_DIR}/backend/.env"

# Cargar .env si existe (entorno de desarrollo)
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$ENV_FILE"
  set +a
fi

DATABASE_URL="${DATABASE_URL:-}"
MONGO_URI="${MONGO_URI:-}"

if [ -z "$DATABASE_URL" ] || [ -z "$MONGO_URI" ]; then
  echo "[backup] ❌ Faltan DATABASE_URL o MONGO_URI." >&2
  exit 1
fi

FECHA=$(date +%Y%m%d_%H%M%S)
NOMBRE="galiciawear_${FECHA}"
DIR_TMP="${BACKUPS_DIR}/tmp_${FECHA}"
RETENCION_DIAS=30

mkdir -p "$DIR_TMP"

# ── MySQL ─────────────────────────────────────────────────────────────────────
echo "[backup] mysqldump MySQL..."
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
# Si no había puerto en la URI, MYSQL_PORT queda igual al host → usamos 3306 por defecto
[ "$MYSQL_PORT" = "$MYSQL_HOST" ] && MYSQL_PORT=3306

# --single-transaction → consistencia sin bloquear tablas (InnoDB)
# MYSQL_PWD evita pasar la contraseña por línea de comandos (visible en `ps aux`)
MYSQL_PWD="$MYSQL_PASS" mysqldump \
  --host="$MYSQL_HOST" --port="$MYSQL_PORT" --user="$MYSQL_USER" \
  --single-transaction --routines --triggers --events \
  "$MYSQL_DB" > "${DIR_TMP}/mysql.sql"
echo "[backup] ✓ MySQL ok"

# ── MongoDB ───────────────────────────────────────────────────────────────────
echo "[backup] mongodump MongoDB..."
mongodump --uri="$MONGO_URI" --out="${DIR_TMP}/mongo" --quiet
echo "[backup] ✓ MongoDB ok"

# ── Comprimir ─────────────────────────────────────────────────────────────────
tar -czf "${BACKUPS_DIR}/${NOMBRE}.tar.gz" -C "$BACKUPS_DIR" "tmp_${FECHA}"
rm -rf "$DIR_TMP"
TAMANO=$(du -sh "${BACKUPS_DIR}/${NOMBRE}.tar.gz" | cut -f1)
echo "[backup] ✅ ${BACKUPS_DIR}/${NOMBRE}.tar.gz (${TAMANO})"

# ── Retención: borrar copias con más de 30 días ───────────────────────────────
BORRADOS=$(find "$BACKUPS_DIR" -name "galiciawear_*.tar.gz" -mtime +${RETENCION_DIAS} -print -delete | wc -l)
echo "[backup] ✓ ${BORRADOS} backup(s) obsoletos eliminados (retención ${RETENCION_DIAS} días)"
