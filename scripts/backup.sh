#!/bin/bash
# ============================================================
# Hytale Server - Manual Backup
# ============================================================

BACKUP_DIR="/opt/hytale/backups"
DATA_DIR="/opt/hytale/data"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="hytale_manual_${TIMESTAMP}.tar.gz"

echo "[INFO] Creating backup: ${BACKUP_NAME}"

tar -czf "${BACKUP_DIR}/${BACKUP_NAME}" -C "${DATA_DIR}" . 2>/dev/null

if [ $? -eq 0 ]; then
    echo "[OK] Backup created: ${BACKUP_DIR}/${BACKUP_NAME}"
    
    # Keep only last 10 manual backups
    cd "${BACKUP_DIR}"
    ls -t hytale_manual_*.tar.gz 2>/dev/null | tail -n +11 | xargs -r rm
    echo "[OK] Cleanup complete"
else
    echo "[ERROR] Backup failed!"
    exit 1
fi
