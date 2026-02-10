# =============================================================================
# hSenid Mobile Cloud Assignment Store - Production Dockerfile
# =============================================================================
# Multi-stage build for optimized image size
# Designed to be pushed to ECR and run on EC2 with:
#   - RDS (PostgreSQL/MySQL) for database
#   - S3 for product image uploads
#   - EFS mounted at /logs on EC2, bind-mounted into container
# =============================================================================

# ---- Build Stage ----
FROM public.ecr.aws/docker/library/node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then \
      npm ci --omit=dev; \
    else \
      npm install --omit=dev; \
    fi && npm cache clean --force

# ---- Production Stage ----
FROM public.ecr.aws/docker/library/node:20-alpine

LABEL maintainer="hSenid Mobile Solutions - DevOps Team"
LABEL description="hSenid Mobile Cloud Assignment Store"
LABEL version="1.0.0"

WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy app source
COPY --chown=appuser:appgroup . .

# Copy node_modules from builder
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules

# Create default logs dir inside container (fallback if EFS not mounted)
RUN mkdir -p /app/logs && chown appuser:appgroup /app/logs

# Switch to non-root user
USER appuser

EXPOSE 8080

ENV NODE_ENV=production
ENV PORT=8080

# Health check for ALB target group
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1))"

CMD ["node", "src/server.js"]
