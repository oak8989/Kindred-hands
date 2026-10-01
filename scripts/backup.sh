#!/bin/bash

# Kindred Hands Backup Script
# Usage: ./scripts/backup.sh [backup-directory]

set -e

BACKUP_DIR=${1:-"./backups"}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="kindred-hands-backup-${TIMESTAMP}.sql"

echo "Starting backup..."
echo "Backup directory: ${BACKUP_DIR}"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Backup database
echo "Backing up database..."
docker compose exec -T db pg_dump -U kindredhands kindredhands > "${BACKUP_DIR}/${BACKUP_FILE}"

# Compress backup
echo "Compressing backup..."
gzip "${BACKUP_DIR}/${BACKUP_FILE}"

echo "Backup completed: ${BACKUP_DIR}/${BACKUP_FILE}.gz"
echo "Backup size: $(du -h "${BACKUP_DIR}/${BACKUP_FILE}.gz" | cut -f1)"

# Keep only last 7 backups
echo "Cleaning up old backups (keeping last 7)..."
ls -t "${BACKUP_DIR}"/kindred-hands-backup-*.sql.gz | tail -n +8 | xargs -r rm

echo "Backup process completed successfully!"
