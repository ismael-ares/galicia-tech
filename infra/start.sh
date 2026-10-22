#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
if [ ! -f .env ]; then python3 tools/init_env.py; fi
docker compose config -q
# Build sequentially to contain peak RAM usage on the homelab.
docker compose build backend
docker compose build frontend
docker compose up -d --wait db redis
docker compose run --rm backend python manage.py migrate --noinput
docker compose run --rm backend python manage.py seed_sources
docker compose run --rm backend python manage.py configure_schedule
docker compose up -d --wait --wait-timeout 180
printf '%s\n' 'Ready. Provision your owner with: docker compose exec backend python manage.py create_owner --email you@example.org'
