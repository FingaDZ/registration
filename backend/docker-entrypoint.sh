#!/bin/sh
set -e

host="${DB_HOST:-database}"
port="${DB_PORT:-5432}"

echo "⏳ Waiting for database at $host:$port..."

# Wait until PostgreSQL is accepting connections
until pg_isready -h "$host" -p "$port" -U "${DB_USER:-postgres}" -q 2>/dev/null; do
  echo "   Database not ready yet, retrying in 3 seconds..."
  sleep 3
done

echo "✓ Database is ready!"
exec "$@"
