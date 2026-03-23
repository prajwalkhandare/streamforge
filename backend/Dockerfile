# backend/Dockerfile
# Multi-stage build for StreamForge Backend

# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY . .

# Run tests and linting (optional, can be done in CI)
RUN npm run lint || true
RUN npm test || true

# Stage 2: Production
FROM node:20-alpine

# Install tini for proper signal handling
RUN apk add --no-cache tini curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/src ./src

# Create required directories
RUN mkdir -p /app/logs /app/uploads && \
    chown -R nodejs:nodejs /app/logs /app/uploads

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Expose port
EXPOSE 5000

# Use tini as init process
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["node", "src/app.js"]

# Labels for metadata
LABEL org.opencontainers.image.title="StreamForge Backend" \
      org.opencontainers.image.description="Backend API for Netflix-like OTT Platform" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.created="2024-01-01" \
      org.opencontainers.image.authors="Prajwal Khandare" \
      org.opencontainers.image.url="https://github.com/prajwalkhandare/streamforge"
      