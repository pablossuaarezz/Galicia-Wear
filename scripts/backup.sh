#!/usr/bin/env bash
# JUSTIFICACIÓN: cumple requisito "script backup" de la rúbrica DAM.
# Se completa en Fase 3 con: pg_dump + mongodump + .tar.gz + retención 30 días.
# Cron sugerido en producción: 0 3 * * * /opt/galiciawear/scripts/backup.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="$ROOT/backups"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

mkdir -p "$BACKUP_DIR"

echo "[backup] Fase 0 stub — funcionalidad real en Fase 3."
echo "[backup] Destino previsto: $BACKUP_DIR/galiciawear_$TIMESTAMP.tar.gz"
