import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { fail } from '../utils/response.js';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json(fail('NOT_FOUND', `Route not found: ${req.method} ${req.path}`));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    const message = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    res.status(400).json(fail('VALIDATION_ERROR', message));
    return;
  }
  const e = err as { status?: number; message?: string };
  const status = e.status ?? 500;
  console.error('[Error]', e.message ?? err);
  res.status(status).json(fail('INTERNAL_ERROR', e.message ?? 'Internal server error'));
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
