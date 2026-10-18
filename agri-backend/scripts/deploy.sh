#!/usr/bin/env bash
set -euo pipefail

echo "Deploying AgriMart Backend..."
git pull origin main
npm ci --omit=dev
NODE_ENV=production npm start
