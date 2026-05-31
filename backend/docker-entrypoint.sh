#!/bin/sh
set -e

echo "Waiting for database..."
for i in $(seq 1 30); do
  if python -c "
import asyncio
from app.database import engine
from sqlalchemy import text

async def check():
    async with engine.connect() as conn:
        await conn.execute(text('SELECT 1'))

asyncio.run(check())
print('connected')
" 2>&1 | grep -q 'connected'; then
    echo "Database connected!"
    break
  fi
  echo "  attempt $i - database not ready, sleeping 2s..."
  sleep 2
done

echo "Seeding database..."
python -m app.seed

echo "Starting server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
