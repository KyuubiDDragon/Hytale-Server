#!/bin/sh
# ============================================================
# Manager Container Entrypoint
# Fixes permissions on mounted volumes before starting the app
# ============================================================

set -e

# UID of the manager user
MANAGER_UID=1001
# GID 9999 = hytale group (shared with hytale container)
SHARED_GID=9999

# Directories that need write access (shared with hytale container)
DATA_DIRS="/opt/hytale/data /opt/hytale/server /opt/hytale/backups /opt/hytale/mods /opt/hytale/plugins /opt/hytale/assets"

echo "[Manager] Checking permissions..."

# Check if we're running as root (needed for permission fixing)
if [ "$(id -u)" = "0" ]; then
    # Fix permissions on all mounted directories
    # Use GID 9999 (hytale) so both containers can read/write
    # Set group write permission so both users can modify files
    for dir in $DATA_DIRS; do
        if [ -d "$dir" ]; then
            echo "[Manager] Fixing group ownership for $dir..."
            # Change group to hytale (9999) and add group write permissions
            chgrp -R $SHARED_GID "$dir" 2>/dev/null || true
            chmod -R g+rw "$dir" 2>/dev/null || true
            # Also make directories have setgid so new files inherit group
            find "$dir" -type d -exec chmod g+s {} \; 2>/dev/null || true
        fi
    done

    # Set umask to ensure new files are group-writable
    umask 002

    echo "[Manager] Switching to manager user (UID: $MANAGER_UID, GID: $SHARED_GID)..."
    exec su-exec $MANAGER_UID:$SHARED_GID "$@"
else
    # Already running as non-root, set umask and run
    umask 002
    exec "$@"
fi
