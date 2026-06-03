#!/usr/bin/env bash
# ============================================================================
# Empaqueta el Panel Admin de GaliciaWear en un instalador nativo con jpackage.
#
#   - macOS  -> .dmg
#   - Linux  -> .deb   (para .AppImage, usar --type app-image + appimagetool)
#   - Windows-> .exe
#
# Requisitos: JDK 17+ con la herramienta `jpackage` (incluida en el JDK 24 local).
# Genera primero el fat-JAR (mvn package) y luego invoca jpackage sobre él.
# ============================================================================
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

VERSION="0.5.0"
JAR="panel-admin-${VERSION}.jar"
NOMBRE="GaliciaWearAdmin"
CLASE_PRINCIPAL="gal.galiciawear.paneladmin.Lanzador"

echo "==> Construyendo el fat-JAR..."
mvn -q -DskipTests package

if ! command -v jpackage >/dev/null 2>&1; then
  echo "ERROR: no se encontró 'jpackage'. Necesitas un JDK 17+ con jpackage en el PATH." >&2
  exit 1
fi

# Tipo de instalador según el sistema operativo
case "$(uname -s)" in
  Darwin) TIPO="dmg" ;;
  Linux)  TIPO="deb" ;;   # alternativa portable: TIPO="app-image"
  *)      TIPO="app-image" ;;
esac

mkdir -p dist
rm -rf "dist/${NOMBRE}"* 2>/dev/null || true

echo "==> Generando instalador nativo (tipo: ${TIPO})..."
jpackage \
  --name "${NOMBRE}" \
  --app-version "${VERSION}" \
  --input target \
  --main-jar "${JAR}" \
  --main-class "${CLASE_PRINCIPAL}" \
  --dest dist \
  --type "${TIPO}" \
  --vendor "GaliciaWear" \
  --description "Panel de administración GaliciaWear"

echo "==> Listo. Artefactos en: ${DIR}/dist"
ls -la dist
