#!/bin/bash
# ============================================================
# Hytale Server - Start Script
# ============================================================

cd /opt/hytale/server

# Check for AOT cache
AOT_FLAG=""
if [ -f "HytaleServer.aot" ]; then
    echo "[INFO] AOT cache found - enabling fast startup"
    AOT_FLAG="-XX:AOTCache=HytaleServer.aot"
fi

# Java arguments (optimized for game servers)
JAVA_ARGS=(
    "-Xms${JAVA_MIN_RAM}"
    "-Xmx${JAVA_MAX_RAM}"
    "-XX:+UseG1GC"
    "-XX:+ParallelRefProcEnabled"
    "-XX:MaxGCPauseMillis=200"
    "-XX:+UnlockExperimentalVMOptions"
    "-XX:+DisableExplicitGC"
    "-XX:+AlwaysPreTouch"
    "-XX:G1NewSizePercent=30"
    "-XX:G1MaxNewSizePercent=40"
    "-XX:G1HeapRegionSize=8M"
    "-XX:G1ReservePercent=20"
    "-XX:G1HeapWastePercent=5"
    "-XX:G1MixedGCCountTarget=4"
    "-XX:InitiatingHeapOccupancyPercent=15"
    "-XX:G1MixedGCLiveThresholdPercent=90"
    "-XX:G1RSetUpdatingPauseTimePercent=5"
    "-XX:SurvivorRatio=32"
    "-XX:+PerfDisableSharedMem"
    "-XX:MaxTenuringThreshold=1"
    $AOT_FLAG
)

# Server arguments
SERVER_ARGS=(
    "--assets" "Assets.zip"
    "--bind" "${SERVER_BIND}:${SERVER_PORT}"
)

# Add backup if enabled
if [ "${ENABLE_BACKUP}" = "true" ]; then
    SERVER_ARGS+=(
        "--backup"
        "--backup-dir" "/opt/hytale/backups"
        "--backup-frequency" "${BACKUP_FREQUENCY}"
    )
fi

# Add auth mode if set
if [ -n "${AUTH_MODE}" ]; then
    SERVER_ARGS+=("--auth-mode" "${AUTH_MODE}")
fi

echo "============================================================"
echo "Starting with: java ${JAVA_ARGS[*]} -jar HytaleServer.jar ${SERVER_ARGS[*]}"
echo "============================================================"
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  WICHTIG: Nach dem ersten Start authentifizieren!        ║"
echo "║                                                          ║"
echo "║  Im Server-Terminal eingeben:  /auth login device        ║"
echo "║                                                          ║"
echo "║  Dann den angezeigten Link im Browser öffnen.            ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

exec java "${JAVA_ARGS[@]}" -jar HytaleServer.jar "${SERVER_ARGS[@]}"
