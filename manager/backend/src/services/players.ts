import { getLogs } from './docker.js';
import type { PlayerInfo } from '../types/index.js';

// Player tracking state
const onlinePlayers: Map<string, Date> = new Map();

// Patterns for player events - supports various game server log formats
// Player names can contain letters, numbers, underscores (Minecraft/Hytale style)
const JOIN_PATTERNS = [
  // Hytale / Generic formats
  /Player\s+(\w+)\s+joined/i,
  /Player\s+(\w+)\s+connected/i,
  /(\w+)\s+joined the game/i,
  /(\w+)\s+joined the server/i,
  /(\w+)\s+has joined/i,
  /(\w+)\s+has connected/i,
  /(\w+)\s+connected/i,
  /(\w+)\s+logged in/i,
  /(\w+)\s+entered the game/i,
  // UUID-based formats (Minecraft-style)
  /UUID of player (\w+) is/i,
  /\[Server\].*?(\w+).*?joined/i,
  /\[INFO\].*?(\w+).*?joined/i,
  // Connection messages
  /Connection from.*?name=(\w+)/i,
  /Client (\w+) connected/i,
];

const LEAVE_PATTERNS = [
  // Hytale / Generic formats
  /Player\s+(\w+)\s+left/i,
  /Player\s+(\w+)\s+disconnected/i,
  /(\w+)\s+left the game/i,
  /(\w+)\s+left the server/i,
  /(\w+)\s+has left/i,
  /(\w+)\s+has disconnected/i,
  /(\w+)\s+disconnected/i,
  /(\w+)\s+logged out/i,
  /(\w+)\s+quit/i,
  /(\w+)\s+timed out/i,
  /(\w+)\s+lost connection/i,
  // Server messages
  /\[Server\].*?(\w+).*?left/i,
  /\[INFO\].*?(\w+).*?left/i,
  /Client (\w+) disconnected/i,
];

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export async function scanLogs(): Promise<void> {
  const logs = await getLogs(500);
  if (!logs) return;

  const lines = logs.split('\n');

  for (const line of lines) {
    // Check for join
    for (const pattern of JOIN_PATTERNS) {
      const match = pattern.exec(line);
      if (match) {
        const player = match[1];
        if (!onlinePlayers.has(player)) {
          onlinePlayers.set(player, new Date());
        }
        break;
      }
    }

    // Check for leave
    for (const pattern of LEAVE_PATTERNS) {
      const match = pattern.exec(line);
      if (match) {
        const player = match[1];
        onlinePlayers.delete(player);
        break;
      }
    }
  }
}

export async function getOnlinePlayers(): Promise<PlayerInfo[]> {
  await scanLogs();

  const now = new Date();
  const players: PlayerInfo[] = [];

  for (const [name, joinedAt] of onlinePlayers) {
    const durationMs = now.getTime() - joinedAt.getTime();
    players.push({
      name,
      joined_at: joinedAt.toISOString(),
      session_duration_seconds: Math.floor(durationMs / 1000),
      session_duration: formatDuration(durationMs),
    });
  }

  return players;
}

export async function getPlayerCount(): Promise<number> {
  await scanLogs();
  return onlinePlayers.size;
}

export function removePlayer(name: string): void {
  onlinePlayers.delete(name);
}

export function processLogLine(line: string): { event: 'join' | 'leave'; player: string } | null {
  // Check for join
  for (const pattern of JOIN_PATTERNS) {
    const match = pattern.exec(line);
    if (match) {
      const player = match[1];
      onlinePlayers.set(player, new Date());
      return { event: 'join', player };
    }
  }

  // Check for leave
  for (const pattern of LEAVE_PATTERNS) {
    const match = pattern.exec(line);
    if (match) {
      const player = match[1];
      onlinePlayers.delete(player);
      return { event: 'leave', player };
    }
  }

  return null;
}
