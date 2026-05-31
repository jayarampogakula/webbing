#!/bin/sh

echo "Webbing SaaS Entrypoint Active..."
echo "Waiting for PostgreSQL database to initialize..."

RETRIES=15
until prisma db push --schema=/app/packages/db/prisma/schema.prisma --accept-data-loss --skip-generate || [ $RETRIES -eq 0 ]; do
  echo "PostgreSQL is not ready yet. Retrying database push in 3 seconds... ($RETRIES retries left)"
  RETRIES=$((RETRIES-1))
  sleep 3
done

if [ $RETRIES -eq 0 ]; then
  echo "Warning: Database push failed or timed out. Attempting to start server anyway..."
else
  echo "Database schema synchronized successfully! 🚀"
  echo "Running database seed script..."
  node /app/packages/db/prisma/seed.js
fi

echo "Starting Next.js App Server..."
exec npx next start -p 3000
