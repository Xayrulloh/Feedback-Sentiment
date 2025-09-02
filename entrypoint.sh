#!/bin/sh
set -e

echo "📦 Running database migrations..."
pnpm drizzle:push

echo "🚀 Starting app..."
exec pnpm start
