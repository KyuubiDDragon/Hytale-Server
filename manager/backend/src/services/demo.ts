/**
 * Demo Mode Service
 * Handles demo user sessions, auto-reset, and simulated responses
 */

import { config } from '../config.js';
import { createAccessToken, createRefreshToken } from './auth.js';
import type { DemoSession, DemoResetState, DemoLoginResponse } from '../types/demo.js';
import type { PermissionEntry } from '../types/permissions.js';

// Demo user constants
const DEMO_USERNAME = '__demo__';
const DEMO_ROLE_ID = 'demo';

// In-memory demo sessions (cleared on reset)
const demoSessions = new Map<string, DemoSession>();

// Reset state
let resetState: DemoResetState = {
  lastReset: null,
  nextReset: null,
  resetIntervalHours: config.demoMode.resetIntervalHours,
};

// Demo permissions - read-only access to everything
const DEMO_PERMISSIONS: PermissionEntry[] = [
  // Dashboard
  'dashboard.view',
  'dashboard.stats',
  // Server (view only)
  'server.view_status',
  'server.start', // Will be simulated
  'server.stop', // Will be simulated
  'server.restart', // Will be simulated
  'server.quick_settings',
  // Console
  'console.view',
  'console.execute', // Will be simulated
  // Performance
  'performance.view',
  // Players (all actions simulated)
  'players.view',
  'players.edit',
  'players.kick',
  'players.ban',
  'players.unban',
  'players.whitelist',
  'players.op',
  'players.permissions',
  'players.teleport',
  'players.kill',
  'players.respawn',
  'players.gamemode',
  'players.give',
  'players.heal',
  'players.effects',
  'players.clear_inventory',
  'players.message',
  // Chat
  'chat.view',
  'chat.send', // Will be simulated
  // Backups
  'backups.view',
  'backups.create', // Will be simulated
  'backups.restore', // Will be simulated
  'backups.delete', // Will be simulated
  'backups.download',
  // Scheduler
  'scheduler.view',
  'scheduler.edit', // Will be simulated
  // Worlds
  'worlds.view',
  'worlds.manage', // Will be simulated
  // Mods
  'mods.view',
  'mods.install', // Will be simulated
  'mods.delete', // Will be simulated
  'mods.config', // Will be simulated
  'mods.toggle', // Will be simulated
  // Plugins
  'plugins.view',
  'plugins.install', // Will be simulated
  'plugins.delete', // Will be simulated
  'plugins.config', // Will be simulated
  'plugins.toggle', // Will be simulated
  // Config
  'config.view',
  'config.edit', // Will be simulated
  // Assets
  'assets.view',
  'assets.manage', // Will be simulated
  // Users (view only)
  'users.view',
  // Roles (view only)
  'roles.view',
  // Activity
  'activity.view',
  // Settings (view only)
  'settings.view',
];

/**
 * Check if demo mode is enabled
 */
export function isDemoModeEnabled(): boolean {
  return config.demoMode.enabled;
}

/**
 * Check if a user is a demo user
 */
export function isDemoUser(username: string | undefined): boolean {
  return username === DEMO_USERNAME;
}

/**
 * Check if an action should be simulated for demo users
 */
export function shouldSimulateAction(action: string): boolean {
  return config.demoMode.simulatedActions.includes(action);
}

/**
 * Get demo permissions
 */
export function getDemoPermissions(): PermissionEntry[] {
  return DEMO_PERMISSIONS;
}

/**
 * Create a demo login session
 */
export async function createDemoLogin(): Promise<DemoLoginResponse> {
  const sessionId = generateSessionId();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

  const session: DemoSession = {
    username: DEMO_USERNAME,
    createdAt: now,
    expiresAt,
    sessionId,
  };

  demoSessions.set(sessionId, session);

  const accessToken = await createAccessToken(DEMO_USERNAME);
  const refreshToken = createRefreshToken(DEMO_USERNAME);

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: 'bearer',
    role: DEMO_ROLE_ID,
    permissions: DEMO_PERMISSIONS as string[],
    isDemo: true,
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Get demo reset state
 */
export function getResetState(): DemoResetState {
  return { ...resetState };
}

/**
 * Initialize demo mode auto-reset timer
 */
export function initializeDemoReset(): void {
  if (!config.demoMode.enabled) {
    return;
  }

  console.log(`Demo mode enabled with ${config.demoMode.resetIntervalHours}h reset interval`);

  // Set initial reset state
  const now = new Date();
  resetState.lastReset = now;
  resetState.nextReset = new Date(now.getTime() + config.demoMode.resetIntervalHours * 60 * 60 * 1000);

  // Schedule periodic reset
  setInterval(() => {
    performDemoReset();
  }, config.demoMode.resetIntervalHours * 60 * 60 * 1000);

  console.log(`Next demo reset scheduled for: ${resetState.nextReset.toISOString()}`);
}

/**
 * Perform demo reset - clear all demo sessions
 */
export function performDemoReset(): void {
  console.log('Performing demo reset...');

  // Clear all demo sessions
  demoSessions.clear();

  // Update reset state
  const now = new Date();
  resetState.lastReset = now;
  resetState.nextReset = new Date(now.getTime() + config.demoMode.resetIntervalHours * 60 * 60 * 1000);

  console.log(`Demo reset complete. Next reset: ${resetState.nextReset.toISOString()}`);
}

/**
 * Generate simulated success response
 */
export function createSimulatedResponse(action: string, customMessage?: string): { success: boolean; message: string; simulated: true } {
  const messages: Record<string, string> = {
    'server.start': 'Server wird gestartet... (Demo)',
    'server.stop': 'Server wird gestoppt... (Demo)',
    'server.restart': 'Server wird neugestartet... (Demo)',
    'console.execute': 'Befehl ausgeführt (Demo)',
    'players.kick': 'Spieler wurde gekickt (Demo)',
    'players.ban': 'Spieler wurde gebannt (Demo)',
    'players.unban': 'Spieler wurde entbannt (Demo)',
    'players.whitelist': 'Whitelist aktualisiert (Demo)',
    'players.op': 'Operator-Status geändert (Demo)',
    'players.permissions': 'Berechtigungen aktualisiert (Demo)',
    'players.teleport': 'Spieler wurde teleportiert (Demo)',
    'players.kill': 'Spieler wurde getötet (Demo)',
    'players.respawn': 'Spieler wird respawnt (Demo)',
    'players.heal': 'Spieler wurde geheilt (Demo)',
    'players.gamemode': 'Spielmodus geändert (Demo)',
    'players.give': 'Item gegeben (Demo)',
    'players.effects': 'Effekt angewendet (Demo)',
    'players.clear_inventory': 'Inventar geleert (Demo)',
    'players.message': 'Nachricht gesendet (Demo)',
    'players.edit': 'Spielerdaten aktualisiert (Demo)',
    'backups.create': 'Backup wird erstellt... (Demo)',
    'backups.restore': 'Backup wird wiederhergestellt... (Demo)',
    'backups.delete': 'Backup gelöscht (Demo)',
    'scheduler.edit': 'Zeitplan aktualisiert (Demo)',
    'worlds.manage': 'Welt-Einstellungen gespeichert (Demo)',
    'mods.install': 'Mod installiert (Demo)',
    'mods.delete': 'Mod gelöscht (Demo)',
    'mods.config': 'Mod-Konfiguration gespeichert (Demo)',
    'mods.toggle': 'Mod Status geändert (Demo)',
    'plugins.install': 'Plugin installiert (Demo)',
    'plugins.delete': 'Plugin gelöscht (Demo)',
    'plugins.config': 'Plugin-Konfiguration gespeichert (Demo)',
    'plugins.toggle': 'Plugin Status geändert (Demo)',
    'config.edit': 'Konfiguration gespeichert (Demo)',
    'assets.manage': 'Assets aktualisiert (Demo)',
    'users.create': 'Benutzer erstellt (Demo)',
    'users.edit': 'Benutzer aktualisiert (Demo)',
    'users.delete': 'Benutzer gelöscht (Demo)',
    'roles.manage': 'Rolle aktualisiert (Demo)',
    'settings.edit': 'Einstellungen gespeichert (Demo)',
    'hytale_auth.manage': 'Authentifizierung aktualisiert (Demo)',
    'chat.send': 'Nachricht gesendet (Demo)',
  };

  return {
    success: true,
    message: customMessage || messages[action] || 'Aktion ausgeführt (Demo)',
    simulated: true,
  };
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get active demo session count (for stats)
 */
export function getActiveDemoSessionCount(): number {
  // Clean up expired sessions first
  const now = new Date();
  for (const [id, session] of demoSessions.entries()) {
    if (session.expiresAt < now) {
      demoSessions.delete(id);
    }
  }
  return demoSessions.size;
}
