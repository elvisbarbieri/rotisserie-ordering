#!/usr/bin/env bash
# Run web storefront + staff POS (see README.md)
set -euo pipefail

cd "$(dirname "$0")"

if [[ ! -f .env.local ]]; then
  cp .env.example .env.local
  echo "Created .env.local from .env.example"
fi

if [[ ! -d node_modules ]]; then
  npm install
fi

echo "Customer store: http://localhost:3000"
echo "Staff POS:      http://localhost:3000/staff"
npm run dev
