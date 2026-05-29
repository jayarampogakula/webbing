FROM node:18-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/db/package*.json ./packages/db/
COPY packages/ai/package*.json ./packages/ai/
RUN npm ci

COPY . .
RUN npx prisma generate --schema=./packages/db/prisma/schema.prisma
RUN npm run build --workspace=packages/db
RUN npm run build --workspace=packages/ai
RUN DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres" NEXTAUTH_SECRET="dummy-secret-key-for-build" npm run build --workspace=apps/web

FROM node:18-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=base /app/apps/web/next.config.js ./
COPY --from=base /app/apps/web/public ./public
COPY --from=base --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=base --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static
COPY --from=base --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=base --chown=nextjs:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=base --chown=nextjs:nodejs /app/packages/db/prisma ./packages/db/prisma
COPY --from=base --chown=nextjs:nodejs /app/packages/db/dist ./packages/db/dist

# Copy shebang entrypoint script and clean Windows CRLF line endings to Linux LF
COPY --from=base /app/docker/prod/entrypoint.sh ./entrypoint.sh
RUN sed -i 's/\r$//' ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["./entrypoint.sh"]
