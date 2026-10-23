#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
# Check the file and source identities before interrupting the working services.
docker compose run --rm --no-deps -T backend python -m config.app_configuration
docker compose run --rm --no-deps -T backend python manage.py sync_configuration --check
docker compose stop worker
docker compose up -d --no-deps --force-recreate --wait --wait-timeout 180 backend
docker compose up -d --no-deps --force-recreate --wait --wait-timeout 180 worker
printf '%s\n' 'YAML applied. Backend and worker now use the same configuration.'
