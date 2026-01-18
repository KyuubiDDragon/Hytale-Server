/**
 * Demo Mode Middleware
 * Intercepts requests from demo users and returns simulated responses
 */

import { Response, NextFunction } from 'express';
import { isDemoModeEnabled, isDemoUser, shouldSimulateAction, createSimulatedResponse } from '../services/demo.js';
import { verifyToken } from '../services/auth.js';
import type { DemoAuthenticatedRequest } from '../types/demo.js';

// Map of routes to their corresponding action permissions
const ROUTE_ACTION_MAP: Record<string, Record<string, string>> = {
  // Server routes
  '/api/server/start': { POST: 'server.start' },
  '/api/server/stop': { POST: 'server.stop' },
  '/api/server/restart': { POST: 'server.restart' },
  '/api/server/quick-settings': { PUT: 'config.edit' },
  '/api/server/config': { PUT: 'config.edit' },
  '/api/server/patchline': { PUT: 'config.edit' },

  // Console routes
  '/api/console/command': { POST: 'console.execute' },

  // Player routes
  '/api/players': { POST: 'players.kick' },
  '/api/management/whitelist': { POST: 'players.whitelist', PUT: 'players.whitelist', DELETE: 'players.whitelist' },
  '/api/management/bans': { POST: 'players.ban', DELETE: 'players.unban' },
  '/api/management/permissions': { POST: 'players.permissions', PUT: 'players.permissions', DELETE: 'players.permissions' },

  // Backup routes
  '/api/backups': { POST: 'backups.create', DELETE: 'backups.delete' },
  '/api/backups/restore': { POST: 'backups.restore' },

  // Scheduler routes
  '/api/scheduler': { POST: 'scheduler.edit', PUT: 'scheduler.edit', DELETE: 'scheduler.edit' },
  '/api/scheduler/tasks': { POST: 'scheduler.edit', PUT: 'scheduler.edit', DELETE: 'scheduler.edit' },
  '/api/scheduler/config': { PUT: 'scheduler.edit' },
  '/api/scheduler/backup/run': { POST: 'backups.create' },
  '/api/scheduler/quick-commands': { POST: 'scheduler.edit' },
  '/api/scheduler/broadcast': { POST: 'scheduler.edit' },
  '/api/scheduler/restart/cancel': { POST: 'scheduler.edit' },

  // Assets routes
  '/api/assets/extract': { POST: 'assets.manage' },
  '/api/assets/cache': { DELETE: 'assets.manage' },

  // KyuubiSoft Plugin routes
  '/api/server/plugin/install': { POST: 'mods.install' },
  '/api/server/plugin/uninstall': { DELETE: 'mods.install' },

  // World routes
  '/api/management/worlds': { POST: 'worlds.manage', PUT: 'worlds.manage', DELETE: 'worlds.manage' },

  // Mod routes
  '/api/management/mods': { POST: 'mods.install', DELETE: 'mods.delete' },
  '/api/management/mods/upload': { POST: 'mods.install' },
  '/api/management/mods/toggle': { POST: 'mods.toggle' },
  '/api/management/mods/config': { PUT: 'mods.config' },

  // Plugin routes
  '/api/management/plugins': { POST: 'plugins.install', DELETE: 'plugins.delete' },
  '/api/management/plugins/upload': { POST: 'plugins.install' },
  '/api/management/plugins/toggle': { POST: 'plugins.toggle' },
  '/api/management/plugins/config': { PUT: 'plugins.config' },

  // User routes
  '/api/auth/users': { POST: 'users.create', PUT: 'users.edit', DELETE: 'users.delete' },

  // Role routes
  '/api/roles': { POST: 'roles.manage', PUT: 'roles.manage', DELETE: 'roles.manage' },

  // Settings routes
  '/api/management/settings': { PUT: 'settings.edit' },

  // Hytale auth routes
  '/api/auth/hytale/initiate': { POST: 'hytale_auth.manage' },
  '/api/auth/hytale/reset': { POST: 'hytale_auth.manage' },
  '/api/auth/hytale/persistence': { POST: 'hytale_auth.manage' },

  // Chat routes
  '/api/chat/send': { POST: 'chat.send' },

  // Activity routes
  '/api/management/activity': { DELETE: 'activity.clear' },
};

/**
 * Get the action for a given route and method
 */
function getRouteAction(path: string, method: string): string | null {
  // Check exact match first
  const routeMap = ROUTE_ACTION_MAP[path];
  if (routeMap && routeMap[method]) {
    return routeMap[method];
  }

  // Check pattern matches (for routes with parameters)
  for (const [routePattern, methodMap] of Object.entries(ROUTE_ACTION_MAP)) {
    // Convert route pattern to regex (e.g., /api/players/:name/kick -> /api/players/[^/]+/kick)
    const regexPattern = routePattern.replace(/:[^/]+/g, '[^/]+');
    const regex = new RegExp(`^${regexPattern}$`);

    if (regex.test(path) && methodMap[method]) {
      return methodMap[method];
    }
  }

  // Check for dynamic route patterns - Player actions
  if (path.match(/^\/api\/players\/[^/]+\/kick$/) && method === 'POST') return 'players.kick';
  if (path.match(/^\/api\/players\/[^/]+\/ban$/) && method === 'POST') return 'players.ban';
  if (path.match(/^\/api\/players\/[^/]+\/ban$/) && method === 'DELETE') return 'players.unban';
  if (path.match(/^\/api\/players\/[^/]+\/teleport$/) && method === 'POST') return 'players.teleport';
  if (path.match(/^\/api\/players\/[^/]+\/teleport\/death$/) && method === 'POST') return 'players.teleport';
  if (path.match(/^\/api\/players\/[^/]+\/kill$/) && method === 'POST') return 'players.kill';
  if (path.match(/^\/api\/players\/[^/]+\/heal$/) && method === 'POST') return 'players.heal';
  if (path.match(/^\/api\/players\/[^/]+\/gamemode$/) && method === 'POST') return 'players.gamemode';
  if (path.match(/^\/api\/players\/[^/]+\/give$/) && method === 'POST') return 'players.give';
  if (path.match(/^\/api\/players\/[^/]+\/effect$/) && method === 'POST') return 'players.effects';
  if (path.match(/^\/api\/players\/[^/]+\/inventory\/clear$/) && method === 'POST') return 'players.clear_inventory';
  if (path.match(/^\/api\/players\/[^/]+\/message$/) && method === 'POST') return 'players.message';
  if (path.match(/^\/api\/players\/[^/]+\/whitelist$/) && method === 'POST') return 'players.whitelist';
  if (path.match(/^\/api\/players\/[^/]+\/whitelist$/) && method === 'DELETE') return 'players.whitelist';
  if (path.match(/^\/api\/players\/[^/]+\/op$/) && method === 'POST') return 'players.op';
  if (path.match(/^\/api\/players\/[^/]+\/op$/) && method === 'DELETE') return 'players.op';
  if (path.match(/^\/api\/players\/[^/]+\/respawn$/) && method === 'POST') return 'players.respawn';
  if (path.match(/^\/api\/players\/[^/]+\/deaths$/) && method === 'POST') return 'players.edit';

  // User management
  if (path.match(/^\/api\/auth\/users\/[^/]+$/) && method === 'PUT') return 'users.edit';
  if (path.match(/^\/api\/auth\/users\/[^/]+$/) && method === 'DELETE') return 'users.delete';

  // Roles
  if (path.match(/^\/api\/roles\/[^/]+$/) && method === 'PUT') return 'roles.manage';
  if (path.match(/^\/api\/roles\/[^/]+$/) && method === 'DELETE') return 'roles.manage';

  // Backups
  if (path.match(/^\/api\/backups\/[^/]+$/) && method === 'DELETE') return 'backups.delete';
  if (path.match(/^\/api\/backups\/[^/]+\/restore$/) && method === 'POST') return 'backups.restore';

  // Scheduler
  if (path.match(/^\/api\/scheduler\/tasks\/[^/]+$/) && method === 'PUT') return 'scheduler.edit';
  if (path.match(/^\/api\/scheduler\/tasks\/[^/]+$/) && method === 'DELETE') return 'scheduler.edit';
  if (path.match(/^\/api\/scheduler\/quick-commands\/[^/]+$/) && method === 'PUT') return 'scheduler.edit';
  if (path.match(/^\/api\/scheduler\/quick-commands\/[^/]+$/) && method === 'DELETE') return 'scheduler.edit';
  if (path.match(/^\/api\/scheduler\/quick-commands\/[^/]+\/execute$/) && method === 'POST') return 'scheduler.edit';

  // Whitelist & Bans management
  if (path.match(/^\/api\/management\/whitelist\/[^/]+$/) && method === 'DELETE') return 'players.whitelist';
  if (path.match(/^\/api\/management\/bans\/[^/]+$/) && method === 'DELETE') return 'players.unban';

  // Permissions management
  if (path.match(/^\/api\/management\/permissions\/users\/[^/]+$/) && method === 'DELETE') return 'players.permissions';
  if (path.match(/^\/api\/management\/permissions\/groups\/[^/]+$/) && method === 'DELETE') return 'players.permissions';

  // Config files
  if (path.match(/^\/api\/server\/config\/[^/]+$/) && method === 'PUT') return 'config.edit';

  // Mods & Plugins
  if (path.match(/^\/api\/management\/mods\/[^/]+$/) && method === 'DELETE') return 'mods.delete';
  if (path.match(/^\/api\/management\/plugins\/[^/]+$/) && method === 'DELETE') return 'plugins.delete';

  return null;
}

/**
 * Extract username from token without blocking
 * Returns null if no valid token
 */
function extractUserFromToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const result = verifyToken(token, 'access');

  return result?.username || null;
}

/**
 * Demo middleware - intercepts requests from demo users for simulated actions
 * This middleware checks the token itself to work globally before route handlers
 */
export function demoMiddleware(
  req: DemoAuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  // Skip if demo mode is not enabled
  if (!isDemoModeEnabled()) {
    return next();
  }

  // Extract user from token (don't block if no token)
  const username = req.user || extractUserFromToken(req.headers.authorization) || undefined;

  // Skip if not a demo user
  if (!isDemoUser(username)) {
    return next();
  }

  // Mark request as demo
  req.isDemo = true;
  req.user = username as string;

  // Get the action for this route
  const action = getRouteAction(req.path, req.method);

  // If no action mapped or action shouldn't be simulated, continue
  if (!action || !shouldSimulateAction(action)) {
    return next();
  }

  // Return simulated response
  const response = createSimulatedResponse(action);
  res.json(response);
}

/**
 * Check if a request is from a demo user
 */
export function checkDemoUser(req: DemoAuthenticatedRequest): boolean {
  return isDemoModeEnabled() && isDemoUser(req.user);
}
