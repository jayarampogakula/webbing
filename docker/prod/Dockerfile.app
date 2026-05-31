FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY apps/worker/package*.json ./apps/worker/
COPY packages/db/package*.json ./packages/db/
COPY packages/ai/package*.json ./packages/ai/
RUN npm ci --ignore-engines

COPY . .
RUN npx prisma generate --schema=./packages/db/prisma/schema.prisma
RUN npm run build --workspace=packages/db
RUN npm run build --workspace=packages/ai
RUN DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres" NEXTAUTH_SECRET="dummy-secret-key-for-build" npm run build --workspace=apps/web

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
RUN npm install -g prisma@5.22.0
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy all build workspace files from base
COPY --from=base --chown=nextjs:nodejs /app ./

# Setup shebang entrypoint script
RUN sed -i 's/\r$//' ./docker/prod/entrypoint.sh && chmod +x ./docker/prod/entrypoint.sh
COPY --from=base --chown=nextjs:nodejs /app/docker/prod/entrypoint.sh ./entrypoint.sh
RUN sed -i 's/\r$//' ./entrypoint.sh && chmod +x ./entrypoint.sh

# Change WORKDIR to apps/web as requested
WORKDIR /app/apps/web

USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["/app/entrypoint.sh"]

