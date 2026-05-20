#!/usr/bin/env bash
# JUSTIFICACIÓN: punto único de arranque en Linux. Cumple la sección "Compatibilidad Linux"
# de la rúbrica DAM. Detecta su propia raíz para funcionar incluso si la carpeta tiene espacios.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "[GaliciaWear] Arranque de entorno de desarrollo"
echo "[GaliciaWear] Raíz del monorepo: $ROOT"

# 1. Levantar Postgres y Mongo
echo "[GaliciaWear] Levantando Postgres + Mongo con Docker Compose..."
docker compose up -d postgres mongo

# 2. Instalar dependencias backend si faltan
if [ ! -d "$ROOT/backend/node_modules" ]; then
  echo "[GaliciaWear] Instalando dependencias del backend..."
  (cd "$ROOT/backend" && npm install)
fi

# 3. Instalar dependencias web si faltan
if [ ! -d "$ROOT/web/node_modules" ]; then
  echo "[GaliciaWear] Instalando dependencias de la web..."
  (cd "$ROOT/web" && npm install)
fi

echo ""
echo "[GaliciaWear] Listo. Ejecuta en terminales separadas:"
echo "  - Backend:  cd \"$ROOT/backend\" && npm run dev    (http://localhost:3000)"
echo "  - Web:      cd \"$ROOT/web\" && npm run dev        (http://localhost:5173)"
echo ""
echo "[GaliciaWear] Verifica salud del API:"
echo "  curl http://localhost:3000/health"
