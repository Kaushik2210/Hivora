import type { Request, Response, NextFunction } from 'express';
import type { ZodTypeAny } from 'zod';
import { fail } from '../utils/response.js';

type Target = 'body' | 'query' | 'params';

export function validate(schema: Partial<Record<Target, ZodTypeAny>>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      for (const target of ['body', 'query', 'params'] as Target[]) {
        const z = schema[target];
        if (!z) continue;
        const parsed = z.parse(req[target]);
        (req as unknown as Record<string, unknown>)[target] = parsed;
      }
      next();
    } catch (e) {
      const zodErr = e as { errors?: { path: unknown[]; message: string }[] };
      const message = zodErr.errors
        ? zodErr.errors.map((er) => `${er.path.join('.')}: ${er.message}`).join('; ')
        : 'Validation failed';
      res.status(400).json(fail('VALIDATION_ERROR', message));
    }
  };
}
