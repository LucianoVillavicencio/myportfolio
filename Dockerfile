# syntax=docker/dockerfile:1

# --- Stage 1: build the React frontend ---
FROM node:22-slim AS frontend
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- Stage 2: build the NestJS backend and keep only production deps ---
FROM node:22-slim AS backend
WORKDIR /build/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build && npm prune --omit=dev

# --- Stage 3: runtime (runs as root: Railway volumes are root-owned) ---
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production \
    STATIC_DIR=/app/public
COPY --from=backend /build/backend/node_modules ./node_modules
COPY --from=backend /build/backend/dist ./dist
COPY --from=frontend /build/frontend/dist ./public
CMD ["node", "dist/main"]
