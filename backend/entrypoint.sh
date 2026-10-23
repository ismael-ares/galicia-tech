#!/bin/sh
set -eu
# Run once before the web master starts, never for workers, migrations or tests.
if [ "${1:-}" = "gunicorn" ]; then
    python manage.py sync_configuration
    python manage.py prepare_local_environment
fi
exec "$@"
