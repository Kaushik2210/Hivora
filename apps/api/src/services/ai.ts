import { config } from '../config/index.js';

export type AIProvider = 'openai' | 'anthropic' | 'cohere';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  provider: AIProvider;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

class AIService {
  private openaiApiKey: string | undefined;
  private anthropicApiKey: string | undefined;
  private cohereApiKey: string | undefined;

  constructor() {
    this.openaiApiKey = config.ai.openai.apiKey;
    this.anthropicApiKey = config.ai.anthropic.apiKey;
    this.cohereApiKey = config.ai.cohere.apiKey;
  }

  async complete(
    messages: AIMessage[],
    provider: AIProvider = 'openai',
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<AIResponse> {
    switch (provider) {
      case 'openai':
        return this.completeOpenAI(messages, options);
      case 'anthropic':
        return this.completeAnthropic(messages, options);
      case 'cohere':
        return this.completeCohere(messages, options);
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  private async completeOpenAI(
    messages: AIMessage[],
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<AIResponse> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: config.ai.openai.model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = (await response.json()) as any;
    return {
      content: data.choices[0]?.message?.content || '',
      provider: 'openai',
      model: config.ai.openai.model,
      usage: {
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
      },
    };
  }

  private async completeAnthropic(
    messages: AIMessage[],
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<AIResponse> {
    if (!this.anthropicApiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.ai.anthropic.model,
        max_tokens: options?.maxTokens ?? 2000,
        temperature: options?.temperature ?? 0.7,
        messages: messages.filter((m) => m.role !== 'system'),
        system: messages.find((m) => m.role === 'system')?.content || '',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Anthropic API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = (await response.json()) as any;
    return {
      content: data.content[0]?.text || '',
      provider: 'anthropic',
      model: config.ai.anthropic.model,
      usage: {
        inputTokens: data.usage?.input_tokens || 0,
        outputTokens: data.usage?.output_tokens || 0,
      },
    };
  }

  private async completeCohere(
    messages: AIMessage[],
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<AIResponse> {
    if (!this.cohereApiKey) {
      throw new Error('Cohere API key not configured');
    }

    const userMessage = messages[messages.length - 1]?.content || '';

    const response = await fetch('https://api.cohere.ai/v1/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.cohereApiKey}`,
      },
      body: JSON.stringify({
        model: config.ai.cohere.model,
        message: userMessage,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Cohere API error: ${error.message || 'Unknown error'}`);
    }

    const data = (await response.json()) as any;
    return {
      content: data.text || '',
      provider: 'cohere',
      model: config.ai.cohere.model,
    };
  }

  getAvailableProviders(): AIProvider[] {
    return config.ai.providers.filter((p) => {
      if (p === 'openai') return !!this.openaiApiKey;
      if (p === 'anthropic') return !!this.anthropicApiKey;
      if (p === 'cohere') return !!this.cohereApiKey;
      return false;
    }) as AIProvider[];
  }
}

export const aiService = new AIService();
