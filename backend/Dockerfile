# JUSTIFICACIÓN: multi-stage. Etapa "builder" compila TS, "runtime" usa imagen alpine mínima.
# Imagen final pesa ~150 MB en lugar de ~1.2 GB con node:20 completo. Cumple "compatibilidad Linux".
FROM node:20-alpine AS builder
WORKDIR /app

# Aprovechar caché de Docker: copiar manifests antes que código
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---------- runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Solo dependencias de producción
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

COPY --from=builder /app/dist ./dist

# Usuario no-root (buena práctica de seguridad)
RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
