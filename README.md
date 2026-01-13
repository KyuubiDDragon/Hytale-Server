# 🎮 Hytale Dedicated Server - Docker

Vollautomatisches Docker-Setup für Hytale Server. Einfach als Stack in Portainer deployen!

## 🚀 Quick Start mit Portainer

### 1. Stack hinzufügen
- Portainer → Stacks → **Add Stack**
- Name: `hytale`
- Build method: **Repository**
- Repository URL: `https://github.com/DEIN-USER/hytale-docker`
- Compose path: `docker-compose.yml`

### 2. Server-Dateien konfigurieren

Wähle **eine** der Optionen in den Environment Variables:

#### Option A: Eigene URLs (empfohlen)
Lade `HytaleServer.jar` und `Assets.zip` auf deinen NAS/Webserver und setze:
```yaml
SERVER_JAR_URL=https://dein-nas.local/hytale/HytaleServer.jar
ASSETS_URL=https://dein-nas.local/hytale/Assets.zip
```

#### Option B: Offizieller Downloader
```yaml
USE_HYTALE_DOWNLOADER=true
```
⚠️ Erfordert einmalige OAuth2-Authentifizierung nach dem Start!

#### Option C: Manuell kopieren
Nach dem Deploy:
```bash
docker cp HytaleServer.jar hytale:/opt/hytale/server/
docker cp Assets.zip hytale:/opt/hytale/server/
docker restart hytale
```

### 3. Deploy & Authentifizieren

Nach dem ersten Start **muss** der Server authentifiziert werden:

```bash
# In Portainer: Container → hytale → Console → Connect

# Oder via Terminal:
docker attach hytale

# Im Server eingeben:
/auth login device
```

Dann den angezeigten Link im Browser öffnen und einloggen.

---

## ⚙️ Konfiguration

| Variable | Standard | Beschreibung |
|----------|----------|--------------|
| `JAVA_MIN_RAM` | 3G | Minimaler RAM |
| `JAVA_MAX_RAM` | 4G | Maximaler RAM |
| `SERVER_PORT` | 5520 | UDP Port |
| `ENABLE_BACKUP` | true | Auto-Backups |
| `BACKUP_FREQUENCY` | 30 | Backup-Intervall (min) |
| `AUTH_MODE` | - | `offline` für LAN-only |

### RAM Empfehlungen

| Spieler | RAM |
|---------|-----|
| 1-5 | 4G |
| 5-10 | 6G |
| 10-20 | 8G |

---

## 🌐 Netzwerk

**WICHTIG:** Hytale nutzt **UDP** Port 5520 (QUIC), nicht TCP!

Router Port-Forwarding:
- Protokoll: **UDP**
- Port: 5520

---

## 📦 Volumes

| Volume | Inhalt |
|--------|--------|
| `hytale-server` | Server JAR + Assets |
| `hytale-data` | Welten, Configs |
| `hytale-backups` | Automatische Backups |
| `hytale-plugins` | Server Plugins |
| `hytale-mods` | Server Mods |

---

## 🔄 Updates

1. Neue Server-Dateien besorgen (aus Hytale Launcher oder Downloader)
2. In Portainer: Stack stoppen
3. Dateien ins Volume kopieren oder URLs aktualisieren
4. Stack neu starten

---

## 🛠️ Befehle

```bash
# Logs anschauen
docker logs -f hytale

# Console öffnen
docker attach hytale
# Verlassen: Ctrl+P, Ctrl+Q

# Manuelles Backup
docker exec hytale /opt/hytale/backup.sh

# Server neustarten
docker restart hytale
```

---

## 📝 Links

- [Hytale Server Manual](https://support.hytale.com/hc/en-us/articles/45326769420827-Hytale-Server-Manual)
- [Server Auth Guide](https://support.hytale.com/hc/en-us/articles/45328341414043-Server-Provider-Authentication-Guide)
