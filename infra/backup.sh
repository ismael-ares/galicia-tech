#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
backup_dir=${1:?Usage: infra/backup.sh /private/path/outside-the-LXC}
umask 077
mkdir -p "$backup_dir"
backup_stamp=$(date -u +%Y%m%dT%H%M%SZ)
backup_file="$backup_dir/galicia-tech-$backup_stamp.dump"
docker compose exec -T db pg_dump -U galiciatech -d galiciatech --format=custom > "$backup_file.tmp"
mv "$backup_file.tmp" "$backup_file"
printf '%s\n' "Database backup created: $backup_file" 'Keep .env (including the MFA key) and configuration separately, encrypted and outside this server.'
