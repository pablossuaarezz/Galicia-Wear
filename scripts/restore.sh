#!/usr/bin/env bash
# JUSTIFICACIÓN: contraparte de backup.sh. Permite demo de "prueba de restauración"
# que pide la rúbrica DAM. Implementación real en Fase 3.
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Uso: $0 <ruta-al-backup.tar.gz>"
  exit 1
fi

echo "[restore] Fase 0 stub — restauración real en Fase 3 a partir de: $1"
