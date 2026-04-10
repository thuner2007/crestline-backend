FROM node:22-alpine AS builder

WORKDIR /app

# Setup proper permissions
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

COPY package*.json ./

# Use mount cache for npm
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Accept build argument to control Prisma generation
ARG SKIP_PRISMA_GENERATE=false

COPY --chown=nestjs:nodejs . .

# Conditionally run Prisma generate based on the build arg and compile TS seed files
RUN if [ "$SKIP_PRISMA_GENERATE" = "true" ]; then \
      echo "Skipping Prisma generation, using pre-generated client"; \
    else \
      npx prisma generate; \
    fi && \
    npm run build && \
    # Verify the build output exists
    ls -la dist/

FROM node:22-alpine AS production

WORKDIR /app

# Copy user from builder
COPY --from=builder /etc/passwd /etc/passwd
COPY --from=builder /etc/group /etc/group

# Copy more necessary files for runtime
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nestjs:nodejs /app/entrypoint.sh ./entrypoint.sh

# Install only production dependencies and ensure proper permissions
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production && \
    npm install --no-save @types/bcrypt bcrypt ts-node typescript && \
    chmod +x ./entrypoint.sh && \
    mkdir -p node_modules/.prisma && \
    chown -R nestjs:nodejs node_modules/.prisma

USER nestjs

ENV NODE_ENV=production
EXPOSE 1111

# Use entrypoint script instead of directly running node
ENTRYPOINT ["./entrypoint.sh"]