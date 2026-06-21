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

// ── Streaming endpoint (SSE) ──────────────────────────────────────────────────

const streamSchema = z.object({
  messages: z.array(z.object({ role: z.enum(['user', 'assistant', 'system']), content: z.string() })),
  provider: z.string(),
  model: z.string(),
  userApiKey: z.string().min(1),
});

agentRouter.post('/stream', authRequired, async (req: Request, res: Response) => {
  try {
    const body = streamSchema.parse(req.body);
    const { messages, provider, model, userApiKey } = body;

    const baseUrls: Record<string, string> = {
      openai:   'https://api.openai.com/v1',
      groq:     'https://api.groq.com/openai/v1',
      mistral:  'https://api.mistral.ai/v1',
      deepseek: 'https://api.deepseek.com/v1',
      xai:      'https://api.x.ai/v1',
      together: 'https://api.together.xyz/v1',
      cohere:   'https://api.cohere.ai/compatibility/v1',
    };

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    let upstreamRes: globalThis.Response;

    if (provider === 'anthropic') {
      upstreamRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': userApiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model, max_tokens: 8096, stream: true,
          messages: messages.filter(m => m.role !== 'system'),
          system: messages.find(m => m.role === 'system')?.content || '',
        }),
      });
    } else if (provider === 'gemini') {
      upstreamRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${userApiKey}&alt=sse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: messages.filter(m => m.role !== 'system').map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
        }),
      });
    } else {
      const base = baseUrls[provider] || baseUrls.openai;
      upstreamRes = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userApiKey}` },
        body: JSON.stringify({ model, messages, stream: true, max_tokens: 8096 }),
      });
    }

    if (!upstreamRes.ok) {
      const err = await upstreamRes.text();
      res.write(`data: ${JSON.stringify({ error: err })}\n\n`);
      res.end();
      return;
    }

    const reader = upstreamRes.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const pump = async (): Promise<void> => {
      const { done, value } = await reader.read();
      if (done) { res.write('data: [DONE]\n\n'); res.end(); return; }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') continue;
        try {
          const parsed = JSON.parse(raw);
          let chunk = '';
          if (provider === 'anthropic') chunk = parsed.delta?.text ?? '';
          else if (provider === 'gemini') chunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
          else chunk = parsed.choices?.[0]?.delta?.content ?? '';
          if (chunk) res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        } catch { /* malformed */ }
      }
      return pump();
    };

    req.on('close', () => { reader.cancel(); });
    await pump();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.write(`data: ${JSON.stringify({ error: 'Invalid request' })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({ error: String(error) })}\n\n`);
    }
    res.end();
  }
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
