#!/bin/sh
set -e

echo "📦 Running database migrations..."
pnpm drizzle:push -y

echo "🚀 Starting app..."
exec pnpm start
