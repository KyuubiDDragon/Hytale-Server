/**
 * Demo Mode Type Definitions
 * Types for the demo system that allows testing without affecting the real server
 */

import { Request } from 'express';

// Extended authenticated request with demo flag
export interface DemoAuthenticatedRequest extends Request {
  user?: string;
  isDemo?: boolean;
}

// Demo user session info
export interface DemoSession {
  username: string;
  createdAt: Date;
  expiresAt: Date;
  sessionId: string;
}

// Demo reset state
export interface DemoResetState {
  lastReset: Date | null;
  nextReset: Date | null;
  resetIntervalHours: number;
}

// Simulated action response
export interface SimulatedResponse {
  success: boolean;
  message: string;
  simulated: true;
}

// Demo login response
export interface DemoLoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  role: string;
  permissions: string[];
  isDemo: true;
  expiresAt: string;
}

// Demo status response
export interface DemoStatusResponse {
  enabled: boolean;
  isDemo: boolean;
  resetInfo?: {
    lastReset: string | null;
    nextReset: string | null;
    resetIntervalHours: number;
  };
}
