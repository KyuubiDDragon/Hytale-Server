#!/bin/bash
# ============================================================
# Hytale Server - Entrypoint
# ============================================================

set -e

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║       Hytale Dedicated Server - Docker Container         ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  Java:     $(java -version 2>&1 | head -1 | cut -d'"' -f2)                                   ║"
echo "║  RAM:      ${JAVA_MIN_RAM} - ${JAVA_MAX_RAM}                                ║"
echo "║  Port:     ${SERVER_PORT}/udp                                  ║"
echo "║  Timezone: ${TZ}                                  ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ============================================================
# Fix permissions
# ============================================================
echo "[INFO] Setting up directories..."
chown -R hytale:hytale /opt/hytale

# ============================================================
# Download server files if needed
# ============================================================
echo "[INFO] Checking server files..."
gosu hytale /opt/hytale/download.sh

# ============================================================
# Verify files exist
# ============================================================
if [ ! -f "/opt/hytale/server/HytaleServer.jar" ]; then
    echo "[ERROR] HytaleServer.jar not found!"
    exit 1
fi

if [ ! -f "/opt/hytale/server/Assets.zip" ]; then
    echo "[ERROR] Assets.zip not found!"
    exit 1
fi

# ============================================================
# Setup symlinks for persistence
# ============================================================
echo "[INFO] Setting up data directories..."

# Universe/worlds directory
mkdir -p /opt/hytale/data/worlds
if [ ! -L "/opt/hytale/server/universe" ]; then
    rm -rf /opt/hytale/server/universe 2>/dev/null || true
    ln -sfn /opt/hytale/data /opt/hytale/server/universe
fi

# Plugins
mkdir -p /opt/hytale/plugins
ln -sfn /opt/hytale/plugins /opt/hytale/server/plugins 2>/dev/null || true

# Mods
mkdir -p /opt/hytale/mods
ln -sfn /opt/hytale/mods /opt/hytale/server/mods 2>/dev/null || true

# Fix permissions again after symlinks
chown -R hytale:hytale /opt/hytale

# ============================================================
# Start server
# ============================================================
echo "[INFO] Starting Hytale Server..."
echo ""
exec gosu hytale /opt/hytale/start-server.sh
