#!/bin/bash

# Kindred Hands Restore Script
# Usage: ./scripts/restore.sh <backup-file>

set -e

if [ -z "$1" ]; then
    echo "Usage: ./scripts/restore.sh <backup-file>"
    echo "Example: ./scripts/restore.sh backups/kindred-hands-backup-20240101_120000.sql.gz"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "Error: Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

echo "WARNING: This will restore the database from backup."
echo "All current data will be lost!"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo "Starting restore from: ${BACKUP_FILE}"

# Decompress if needed
if [[ "${BACKUP_FILE}" == *.gz ]]; then
    echo "Decompressing backup..."
    gunzip -c "${BACKUP_FILE}" | docker compose exec -T db psql -U kindredhands kindredhands
else
    echo "Restoring database..."
    docker compose exec -T db psql -U kindredhands kindredhands < "${BACKUP_FILE}"
fi

echo "Restore completed successfully!"
echo "You may need to restart the application: docker compose restart app"
