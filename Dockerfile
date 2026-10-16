# =================================================================
# STAGE 1: Frontend Vite Production Build
# =================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first for maximum Docker layer caching
COPY package*.json ./
RUN npm install

# Build production assets into /app/dist
COPY . .
RUN npm run build

# =================================================================
# STAGE 2: Lightweight Production Runtime
# =================================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copy built frontend SPA assets
COPY --from=builder /app/dist ./dist

# Copy backend application source
COPY --from=builder /app/backend ./backend

# Install only production backend dependencies
WORKDIR /app/backend
RUN npm install --omit=dev

# Create data directory for volume mounting
RUN mkdir -p /app/backend/data

EXPOSE 3001

# Health check to ensure zero-downtime reliability
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/api/health || exit 1

CMD ["node", "server.js"]
