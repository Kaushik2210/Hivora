import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { aiService, AIProvider } from '../services/ai.js';
import { authRequired } from '../middleware/auth.js';

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
  userApiKey: z.string().optional(),
});

agentRouter.post(
  '/complete',
  authRequired,
  async (req: Request, res: Response) => {
    try {
      const body = completeSchema.parse(req.body);
      const userApiKey = body.userApiKey;

      // Skip server key check when user provides their own key
      if (!userApiKey) {
        const availableProviders = aiService.getAvailableProviders();
        if (!availableProviders.includes(body.provider)) {
          return res.status(400).json({
            error: `Provider ${body.provider} not configured on server. Pass userApiKey to use your own key.`,
          });
        }
      }

      const response = await aiService.complete(body.messages, body.provider as AIProvider, {
        temperature: body.temperature,
        maxTokens: body.maxTokens,
        userApiKey,
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

agentRouter.get('/providers', authRequired, (_req: Request, res: Response) => {
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

import { startAgentSimulation, stopAgentSimulation } from '../services/agent.service.js';

agentRouter.post('/simulation/start', authRequired, (_req: Request, res: Response) => {
  startAgentSimulation();
  res.json({ status: 'Simulation started' });
});

agentRouter.post('/simulation/stop', authRequired, (_req: Request, res: Response) => {
  stopAgentSimulation();
  res.json({ status: 'Simulation stopped' });
});

export { agentRouter };
