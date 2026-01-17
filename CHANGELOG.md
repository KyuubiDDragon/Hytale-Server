# Changelog

All notable changes to the Hytale Server Manager will be documented in this file.

## [Unreleased]

### Added

- **Patchline Toggle**: Added UI toggle in Settings to switch between "release" and "pre-release" patchlines without editing the .env file
  - Panel stores patchline preference in `/opt/hytale/data/panel-config.json`
  - When patchline changes, server files (HytaleServer.jar, Assets.zip, .hytale-version) are automatically deleted to trigger redownload on next container restart
  - Shows restart banner when patchline is changed

- **Dashboard Patchline Badge**: Added colored badge in Dashboard Server Info card showing current patchline
  - Green badge for "release"
  - Orange badge for "pre-release"
  - Falls back to panel setting when server info unavailable

- **Mod Store Localization**: Added multi-language support for mod descriptions and hints
  - Mod entries now support localized descriptions (DE, EN, PT-BR)
  - Added hints field for additional mod-specific information (e.g., port configuration notes)
  - EasyWebMap includes hint about configuring WEBMAP_PORT in .env

- **Translations**: Added German, English, and Brazilian Portuguese translations for:
  - Patchline settings and labels
  - Restart notifications
  - Mod store hints

### Fixed

- **Manager Container Healthcheck**: Fixed container showing "unhealthy" status
  - Increased healthcheck start-period from 5s to 30s
  - Added wget to alpine image for healthcheck command
  - Healthcheck now properly waits for application startup

- **Update Check Patchline**: Fixed hardcoded 'release' patchline in update check endpoint to use configured patchline setting
