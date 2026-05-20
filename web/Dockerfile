# JUSTIFICACIÓN: multi-stage. Etapa "builder" genera el bundle estático con Vite;
# "runtime" sirve los assets con Nginx (≈ 25 MB final). Cumple compatibilidad Linux + perf.
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build

# ---------- runtime ----------
FROM nginx:1.27-alpine AS runtime
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s CMD wget --spider -q http://localhost/ || exit 1
