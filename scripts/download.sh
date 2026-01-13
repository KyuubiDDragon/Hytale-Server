#!/bin/bash
# ============================================================
# Hytale Server - Download Script
# Automatically downloads server files if not present
# ============================================================

set -e

SERVER_DIR="/opt/hytale/server"
SERVER_JAR="${SERVER_DIR}/HytaleServer.jar"
ASSETS_FILE="${SERVER_DIR}/Assets.zip"

log_info() { echo -e "\033[0;32m[INFO]\033[0m $1"; }
log_warn() { echo -e "\033[1;33m[WARN]\033[0m $1"; }
log_error() { echo -e "\033[0;31m[ERROR]\033[0m $1"; }

# ============================================================
# Check if files already exist
# ============================================================
if [ -f "$SERVER_JAR" ] && [ -f "$ASSETS_FILE" ]; then
    log_info "Server files already present - skipping download"
    exit 0
fi

log_info "Server files not found - starting download..."

# ============================================================
# Option 1: Download from direct URLs
# ============================================================
if [ -n "$SERVER_JAR_URL" ] && [ -n "$ASSETS_URL" ]; then
    log_info "Downloading from provided URLs..."
    
    if [ ! -f "$SERVER_JAR" ]; then
        log_info "Downloading HytaleServer.jar..."
        wget -q --show-progress -O "$SERVER_JAR" "$SERVER_JAR_URL"
    fi
    
    if [ ! -f "$ASSETS_FILE" ]; then
        log_info "Downloading Assets.zip..."
        wget -q --show-progress -O "$ASSETS_FILE" "$ASSETS_URL"
    fi
    
    log_info "Download complete!"
    exit 0
fi

# ============================================================
# Option 2: Use official Hytale Downloader
# ============================================================
if [ "$USE_HYTALE_DOWNLOADER" = "true" ]; then
    log_info "Using official Hytale Downloader..."
    
    DOWNLOADER_DIR="/opt/hytale/downloader"
    DOWNLOADER_ZIP="${DOWNLOADER_DIR}/hytale-downloader.zip"
    
    # Download the downloader if not present
    if [ ! -f "${DOWNLOADER_DIR}/hytale-downloader" ]; then
        log_info "Downloading Hytale Downloader..."
        wget -q -O "$DOWNLOADER_ZIP" "https://support.hytale.com/hc/article_attachments/hytale-downloader.zip" || {
            log_error "Could not download Hytale Downloader"
            log_error "Please set SERVER_JAR_URL and ASSETS_URL instead"
            exit 1
        }
        
        unzip -q -o "$DOWNLOADER_ZIP" -d "$DOWNLOADER_DIR"
        chmod +x "${DOWNLOADER_DIR}/hytale-downloader"*
    fi
    
    # Run downloader
    cd "$DOWNLOADER_DIR"
    
    # Detect OS
    if [ -f "./hytale-downloader" ]; then
        DOWNLOADER="./hytale-downloader"
    elif [ -f "./hytale-downloader-linux" ]; then
        DOWNLOADER="./hytale-downloader-linux"
    else
        log_error "Downloader executable not found"
        exit 1
    fi
    
    log_info "Running Hytale Downloader (patchline: ${HYTALE_PATCHLINE})..."
    log_warn "NOTE: This requires OAuth2 authentication!"
    log_warn "You may need to run this interactively first time."
    
    $DOWNLOADER -patchline "$HYTALE_PATCHLINE" -output "$SERVER_DIR" || {
        log_error "Downloader failed - you may need to authenticate"
        log_error "Run: docker exec -it <container> /opt/hytale/downloader/hytale-downloader"
        exit 1
    }
    
    exit 0
fi

# ============================================================
# No download method configured
# ============================================================
log_error "============================================================"
log_error "Server files not found and no download method configured!"
log_error "============================================================"
log_error ""
log_error "Please choose one of these options:"
log_error ""
log_error "Option 1: Provide download URLs in docker-compose.yml:"
log_error "  SERVER_JAR_URL=https://your-server.com/HytaleServer.jar"
log_error "  ASSETS_URL=https://your-server.com/Assets.zip"
log_error ""
log_error "Option 2: Enable official downloader (requires auth):"
log_error "  USE_HYTALE_DOWNLOADER=true"
log_error ""
log_error "Option 3: Manually copy files to the server volume:"
log_error "  docker cp HytaleServer.jar hytale:/opt/hytale/server/"
log_error "  docker cp Assets.zip hytale:/opt/hytale/server/"
log_error ""
log_error "Option 4: Mount local files via volume in docker-compose.yml"
log_error "============================================================"

exit 1
