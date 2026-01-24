/**
 * Migration Service
 *
 * Automatically detects and migrates existing installations so users
 * don't have to go through the setup wizard after an update.
 *
 * Reads data from:
 * - Environment variables (.env)
 * - server/config.json (Hytale server config)
 * - panel-config.json (if exists)
 * - users.json (if exists)
 *
 * Creates:
 * - config.json (main config)
 * - setup-config.json (setup state)
 * - panel-config.json (panel settings)
 * - users.json (if MANAGER_USERNAME/PASSWORD in env)
 */

import { readFile, writeFile, mkdir, access, constants } from 'fs/promises';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { config, reloadConfigFromFile } from '../config.js';

// Paths
const DATA_DIR = config.dataPath;
const CONFIG_JSON_FILE = path.join(DATA_DIR, 'config.json');
const SETUP_CONFIG_FILE = path.join(DATA_DIR, 'setup-config.json');
const PANEL_CONFIG_FILE = path.join(DATA_DIR, 'panel-config.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SERVER_CONFIG_FILE = path.join(config.serverPath, 'config.json');

// Environment variable mapping
interface EnvConfig {
  // Authentication
  jwtSecret?: string;
  managerUsername?: string;
  managerPassword?: string;

  // Server settings
  patchline?: string;
  autoUpdate?: boolean;

  // Network
  corsOrigins?: string;
  trustProxy?: boolean;

  // Integrations
  modtaleApiKey?: string;

  // Backup settings
  enableBackup?: boolean;
  backupFrequency?: number;

  // Performance
  javaMinRam?: string;
  javaMaxRam?: string;
}

// Server config.json structure
interface ServerConfig {
  ServerName?: string;
  MOTD?: string;
  MaxPlayers?: number;
  Password?: string;
  Whitelist?: boolean;
  AllowOp?: boolean;
  Defaults?: {
    GameMode?: string;
  };
}

// Panel config structure
interface PanelConfig {
  patchline?: string;
  acceptEarlyPlugins?: boolean;
  disableSentry?: boolean;
  allowOp?: boolean;
}

/**
 * Check if this is an existing installation that needs migration
 */
export async function isExistingInstallation(): Promise<boolean> {
  // Check multiple indicators of an existing installation
  const indicators = {
    hasUsersFile: false,
    hasJwtSecret: false,
    hasManagerCredentials: false,
    hasServerFiles: false,
    hasPanelConfig: false,
  };

  // Check if users.json exists
  try {
    await access(USERS_FILE, constants.R_OK);
    indicators.hasUsersFile = true;
  } catch {
    // File doesn't exist
  }

  // Check if JWT_SECRET is set in env
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32) {
    indicators.hasJwtSecret = true;
  }

  // Check if MANAGER_USERNAME and MANAGER_PASSWORD are set
  if (process.env.MANAGER_USERNAME && process.env.MANAGER_PASSWORD) {
    indicators.hasManagerCredentials = true;
  }

  // Check if server files exist
  try {
    await access(path.join(config.serverPath, 'HytaleServer.jar'), constants.R_OK);
    indicators.hasServerFiles = true;
  } catch {
    // File doesn't exist
  }

  // Check if panel-config.json exists
  try {
    await access(PANEL_CONFIG_FILE, constants.R_OK);
    indicators.hasPanelConfig = true;
  } catch {
    // File doesn't exist
  }

  // Consider it an existing installation if:
  // - users.json exists OR
  // - JWT_SECRET + Manager credentials are set OR
  // - Server files exist with panel config
  const isExisting =
    indicators.hasUsersFile ||
    (indicators.hasJwtSecret && indicators.hasManagerCredentials) ||
    (indicators.hasServerFiles && indicators.hasPanelConfig);

  if (isExisting) {
    console.log('[Migration] Detected existing installation:', indicators);
  }

  return isExisting;
}

/**
 * Read environment variables for migration
 */
function readEnvConfig(): EnvConfig {
  return {
    jwtSecret: process.env.JWT_SECRET,
    managerUsername: process.env.MANAGER_USERNAME,
    managerPassword: process.env.MANAGER_PASSWORD,
    patchline: process.env.HYTALE_PATCHLINE,
    autoUpdate: process.env.AUTO_UPDATE === 'true',
    corsOrigins: process.env.CORS_ORIGINS,
    trustProxy: process.env.TRUST_PROXY === 'true' || process.env.TRUST_PROXY === '1',
    modtaleApiKey: process.env.MODTALE_API_KEY,
    enableBackup: process.env.ENABLE_BACKUP === 'true',
    backupFrequency: process.env.BACKUP_FREQUENCY ? parseInt(process.env.BACKUP_FREQUENCY, 10) : undefined,
    javaMinRam: process.env.JAVA_MIN_RAM,
    javaMaxRam: process.env.JAVA_MAX_RAM,
  };
}

/**
 * Read server config.json if it exists
 */
async function readServerConfig(): Promise<ServerConfig | null> {
  try {
    const content = await readFile(SERVER_CONFIG_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Read existing panel-config.json if it exists
 */
async function readPanelConfig(): Promise<PanelConfig | null> {
  try {
    const content = await readFile(PANEL_CONFIG_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Check if users.json already has an admin user
 */
async function hasExistingAdmin(): Promise<boolean> {
  try {
    const content = await readFile(USERS_FILE, 'utf-8');
    const usersData = JSON.parse(content);
    return usersData.users && usersData.users.length > 0;
  } catch {
    return false;
  }
}

/**
 * Convert backup frequency (minutes) to interval string
 */
function backupFrequencyToInterval(minutes: number): string {
  if (minutes <= 60) return '1h';
  if (minutes <= 180) return '3h';
  if (minutes <= 360) return '6h';
  if (minutes <= 720) return '12h';
  return '24h';
}

/**
 * Determine access mode from CORS origins
 */
function determineAccessMode(corsOrigins: string): 'local' | 'lan' | 'domain' {
  if (!corsOrigins) return 'local';

  const origins = corsOrigins.toLowerCase();

  // Check for domain-based access
  if (origins.includes('https://') && !origins.includes('localhost')) {
    return 'domain';
  }

  // Check for LAN access
  if (origins.includes('192.168.') || origins.includes('10.') || origins.includes('172.')) {
    return 'lan';
  }

  return 'local';
}

/**
 * Extract domain from CORS origins
 */
function extractDomain(corsOrigins: string): string | undefined {
  if (!corsOrigins) return undefined;

  // Try to extract the first https domain
  const match = corsOrigins.match(/https?:\/\/([^,\s]+)/);
  if (match) {
    return match[0];
  }

  return undefined;
}

/**
 * Run the migration process
 */
export async function runMigration(): Promise<boolean> {
  console.log('[Migration] Starting migration of existing installation...');

  try {
    // Ensure data directory exists
    await mkdir(DATA_DIR, { recursive: true });

    // Read all source data
    const envConfig = readEnvConfig();
    const serverConfig = await readServerConfig();
    const existingPanelConfig = await readPanelConfig();
    const hasAdmin = await hasExistingAdmin();

    console.log('[Migration] Environment config:', {
      hasJwtSecret: !!envConfig.jwtSecret,
      hasManagerCredentials: !!(envConfig.managerUsername && envConfig.managerPassword),
      patchline: envConfig.patchline,
      autoUpdate: envConfig.autoUpdate,
      hasCorsOrigins: !!envConfig.corsOrigins,
      trustProxy: envConfig.trustProxy,
      hasModtaleApiKey: !!envConfig.modtaleApiKey,
      enableBackup: envConfig.enableBackup,
      backupFrequency: envConfig.backupFrequency,
      javaMinRam: envConfig.javaMinRam,
      javaMaxRam: envConfig.javaMaxRam,
    });

    if (serverConfig) {
      console.log('[Migration] Found server config:', {
        serverName: serverConfig.ServerName,
        maxPlayers: serverConfig.MaxPlayers,
        hasPassword: !!serverConfig.Password,
        whitelist: serverConfig.Whitelist,
        allowOp: serverConfig.AllowOp,
        gameMode: serverConfig.Defaults?.GameMode,
      });
    }

    if (existingPanelConfig) {
      console.log('[Migration] Found existing panel config:', existingPanelConfig);
    }

    // 1. Create users.json if needed
    if (!hasAdmin && envConfig.managerUsername && envConfig.managerPassword) {
      console.log('[Migration] Creating admin user from MANAGER_USERNAME/MANAGER_PASSWORD...');

      const passwordHash = await bcrypt.hash(envConfig.managerPassword, 10);
      const usersData = {
        users: [{
          username: envConfig.managerUsername,
          passwordHash: passwordHash,
          roleId: 'admin',
          createdAt: new Date().toISOString(),
          tokenVersion: 1,
        }]
      };

      await writeFile(USERS_FILE, JSON.stringify(usersData, null, 2), 'utf-8');
      console.log('[Migration] Admin user created:', envConfig.managerUsername);
    } else if (hasAdmin) {
      console.log('[Migration] Admin user already exists, skipping user creation');
    }

    // 2. Create panel-config.json
    const panelConfig: PanelConfig = {
      patchline: existingPanelConfig?.patchline || envConfig.patchline || 'release',
      acceptEarlyPlugins: existingPanelConfig?.acceptEarlyPlugins ?? false,
      disableSentry: existingPanelConfig?.disableSentry ?? false,
      allowOp: existingPanelConfig?.allowOp ?? serverConfig?.AllowOp ?? true,
    };

    await writeFile(PANEL_CONFIG_FILE, JSON.stringify(panelConfig, null, 2), 'utf-8');
    console.log('[Migration] Panel config created:', panelConfig);

    // 3. Create setup-config.json
    const accessMode = determineAccessMode(envConfig.corsOrigins || '');
    const domain = extractDomain(envConfig.corsOrigins || '');

    const setupConfig = {
      setupComplete: true,
      setupCompletedAt: new Date().toISOString(),
      migratedAt: new Date().toISOString(),
      migratedFrom: 'env',
      language: 'de', // Default, can be changed later
      admin: {
        username: envConfig.managerUsername || 'admin',
      },
      server: {
        name: serverConfig?.ServerName || 'Hytale Server',
        motd: serverConfig?.MOTD || 'Welcome to Hytale!',
        maxPlayers: serverConfig?.MaxPlayers || 20,
        gameMode: serverConfig?.Defaults?.GameMode || 'Adventure',
        password: serverConfig?.Password || '',
        whitelist: serverConfig?.Whitelist ?? false,
        allowOp: serverConfig?.AllowOp ?? true,
      },
      performance: {
        minRam: envConfig.javaMinRam || '3G',
        maxRam: envConfig.javaMaxRam || '4G',
        viewRadius: 16, // Default
      },
      automation: {
        backups: {
          enabled: envConfig.enableBackup ?? false,
          interval: envConfig.backupFrequency
            ? backupFrequencyToInterval(envConfig.backupFrequency)
            : '6h',
          retention: 7,
        },
        restart: {
          enabled: false,
          schedule: '0 4 * * *',
          warnMinutes: 5,
        },
      },
      integrations: {
        modtaleApiKey: envConfig.modtaleApiKey || '',
        stackmartApiKey: '',
        webmap: config.webMapPort ? true : false,
      },
      network: {
        accessMode: accessMode,
        domain: domain,
        trustProxy: envConfig.trustProxy ?? false,
      },
      plugin: {
        kyuubiApiInstalled: false,
      },
      downloadMethod: 'official' as const,
      autoUpdate: envConfig.autoUpdate ?? true,
      patchline: (envConfig.patchline as 'release' | 'pre-release') || 'release',
      acceptEarlyPlugins: existingPanelConfig?.acceptEarlyPlugins ?? false,
      disableSentry: existingPanelConfig?.disableSentry ?? false,
    };

    await writeFile(SETUP_CONFIG_FILE, JSON.stringify(setupConfig, null, 2), 'utf-8');
    console.log('[Migration] Setup config created');

    // 4. Create config.json (main config)
    const mainConfig = {
      setupComplete: true,
      jwtSecret: envConfig.jwtSecret || '',
      corsOrigins: envConfig.corsOrigins ? envConfig.corsOrigins.split(',').map(o => o.trim()) : [],
      network: {
        trustProxy: envConfig.trustProxy ?? false,
        accessMode: accessMode,
        domain: domain || null,
      },
      integrations: {
        modtaleApiKey: envConfig.modtaleApiKey || '',
        stackmartApiKey: '',
        webmap: config.webMapPort ? true : false,
      },
      automation: setupConfig.automation,
      plugin: {
        kyuubiApiInstalled: false,
      },
    };

    await writeFile(CONFIG_JSON_FILE, JSON.stringify(mainConfig, null, 2), 'utf-8');
    console.log('[Migration] Main config created');

    console.log('[Migration] Migration completed successfully!');
    console.log('[Migration] The server will now start normally without requiring setup.');

    // Reload config in memory so the rest of the application sees the new values
    reloadConfigFromFile();

    return true;
  } catch (error) {
    console.error('[Migration] Migration failed:', error);
    return false;
  }
}

/**
 * Check if migration is needed and run it if so
 *
 * This should be called early in server startup, before the setup check.
 *
 * Returns true if migration was run successfully or not needed.
 * Returns false if migration failed (server should continue but may need setup).
 */
export async function checkAndRunMigration(): Promise<boolean> {
  // Check if config.json already exists (setup already complete)
  if (fs.existsSync(CONFIG_JSON_FILE)) {
    try {
      const content = fs.readFileSync(CONFIG_JSON_FILE, 'utf-8');
      const configData = JSON.parse(content);
      if (configData.setupComplete) {
        console.log('[Migration] Setup already complete, no migration needed');
        return true;
      }
    } catch {
      // Config exists but couldn't be read, continue to check
    }
  }

  // Check if this is an existing installation
  const isExisting = await isExistingInstallation();

  if (!isExisting) {
    console.log('[Migration] No existing installation detected, setup wizard will be shown');
    return true;
  }

  // Run migration
  return await runMigration();
}

export default {
  isExistingInstallation,
  runMigration,
  checkAndRunMigration,
};
