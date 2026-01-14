import { Router, Request, Response } from 'express';
import { readdir, readFile, writeFile, stat } from 'fs/promises';
import path from 'path';
import { authMiddleware } from '../middleware/auth.js';
import * as dockerService from '../services/docker.js';
import { config } from '../config.js';

const router = Router();

// Allowed config file extensions
const CONFIG_EXTENSIONS = ['.json', '.properties', '.yml', '.yaml', '.toml', '.cfg', '.conf', '.ini'];

// GET /api/server/status
router.get('/status', authMiddleware, async (_req: Request, res: Response) => {
  const status = await dockerService.getStatus();
  res.json(status);
});

// GET /api/server/stats
router.get('/stats', authMiddleware, async (_req: Request, res: Response) => {
  const stats = await dockerService.getStats();
  res.json(stats);
});

// POST /api/server/start
router.post('/start', authMiddleware, async (_req: Request, res: Response) => {
  const result = await dockerService.startContainer();
  if (!result.success) {
    res.status(500).json(result);
    return;
  }
  res.json(result);
});

// POST /api/server/stop
router.post('/stop', authMiddleware, async (_req: Request, res: Response) => {
  const result = await dockerService.stopContainer();
  if (!result.success) {
    res.status(500).json(result);
    return;
  }
  res.json(result);
});

// POST /api/server/restart
router.post('/restart', authMiddleware, async (_req: Request, res: Response) => {
  const result = await dockerService.restartContainer();
  if (!result.success) {
    res.status(500).json(result);
    return;
  }
  res.json(result);
});

// GET /api/server/config/files - List config files
router.get('/config/files', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const files = await readdir(config.serverPath);
    const configFiles = files.filter(f =>
      CONFIG_EXTENSIONS.some(ext => f.toLowerCase().endsWith(ext))
    );

    const fileInfos = await Promise.all(configFiles.map(async (filename) => {
      try {
        const filePath = path.join(config.serverPath, filename);
        const stats = await stat(filePath);
        return {
          name: filename,
          size: stats.size,
          modified: stats.mtime.toISOString(),
        };
      } catch {
        return { name: filename, size: 0, modified: null };
      }
    }));

    res.json({ files: fileInfos });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to list config files',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/server/config/:filename - Read config file
router.get('/config/:filename', authMiddleware, async (req: Request, res: Response) => {
  const { filename } = req.params;

  // Security: prevent path traversal
  if (filename.includes('..') || filename.includes('/')) {
    res.status(400).json({ error: 'Invalid filename' });
    return;
  }

  // Check extension
  if (!CONFIG_EXTENSIONS.some(ext => filename.toLowerCase().endsWith(ext))) {
    res.status(400).json({ error: 'File type not allowed' });
    return;
  }

  try {
    const filePath = path.join(config.serverPath, filename);
    const content = await readFile(filePath, 'utf-8');
    res.json({ filename, content });
  } catch (error) {
    res.status(404).json({
      error: 'File not found',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/server/config/:filename - Write config file
router.put('/config/:filename', authMiddleware, async (req: Request, res: Response) => {
  const { filename } = req.params;
  const { content } = req.body;

  // Security: prevent path traversal
  if (filename.includes('..') || filename.includes('/')) {
    res.status(400).json({ error: 'Invalid filename' });
    return;
  }

  // Check extension
  if (!CONFIG_EXTENSIONS.some(ext => filename.toLowerCase().endsWith(ext))) {
    res.status(400).json({ error: 'File type not allowed' });
    return;
  }

  if (typeof content !== 'string') {
    res.status(400).json({ error: 'Content must be a string' });
    return;
  }

  try {
    const filePath = path.join(config.serverPath, filename);
    await writeFile(filePath, content, 'utf-8');
    res.json({ success: true, message: 'Config saved' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to save config',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
