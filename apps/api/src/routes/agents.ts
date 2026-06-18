import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { aiService, AIProvider } from '../services/ai.js';
import { subscriptionService } from '../services/subscription.js';
import { middleware } from '../middleware/auth.js';

const agentRouter = Router();

const completeSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
    })
  ),
  provider: z.enum(['openai', 'anthropic', 'cohere']).optional().default('openai'),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(4000).optional(),
});

agentRouter.post(
  '/complete',
  middleware.auth,
  async (req: Request, res: Response) => {
    try {
      const body = completeSchema.parse(req.body);
      const availableProviders = aiService.getAvailableProviders();

      if (!availableProviders.includes(body.provider)) {
        return res.status(400).json({
          error: `Provider ${body.provider} not configured. Available: ${availableProviders.join(', ')}`,
        });
      }

      const response = await aiService.complete(body.messages, body.provider as AIProvider, {
        temperature: body.temperature,
        maxTokens: body.maxTokens,
      });

      res.json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request', details: error.errors });
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: message });
    }
  }
);

agentRouter.get('/providers', middleware.auth, (_req: Request, res: Response) => {
  const available = aiService.getAvailableProviders();
  res.json({
    available,
    configured: {
      openai: !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      cohere: !!process.env.COHERE_API_KEY,
    },
  });
});

export { agentRouter };
