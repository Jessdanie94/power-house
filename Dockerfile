# ══════════════════════════════════════════════════
# Cooking Mate / Power House - Production Container
# Jesse's Digital Ventures
# ══════════════════════════════════════════════════

FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx vite build

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/server.js ./
COPY --from=builder /app/config ./config
COPY --from=builder /app/models ./models
COPY --from=builder /app/routes ./routes
COPY --from=builder /app/services ./services
COPY --from=builder /app/workers ./workers
COPY --from=builder /app/nodes ./nodes
COPY --from=builder /app/middlewares ./middlewares
COPY --from=builder /app/693300f4dac1ac6b9babb468 ./693300f4dac1ac6b9babb468

EXPOSE 8001
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8001/api/telemetry || exit 1

CMD ["node", "server.js"]
