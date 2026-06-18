import { z } from 'zod';

export const registerSchema = {
  body: z.object({
    email: z.string().email().max(254),
    password: z.string().min(8).max(128),
    name: z.string().min(1).max(100).optional(),
  }),
};

export const loginSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
};

export const emailVerificationSchema = {
  query: z.object({
    token: z.string().min(1),
  }),
};

export const forgotPasswordSchema = {
  body: z.object({
    email: z.string().email(),
  }),
};

export const resetPasswordSchema = {
  body: z.object({
    token: z.string().min(1),
    password: z.string().min(8).max(128),
  }),
};

export const refreshSchema = {
  body: z.object({
    refreshToken: z.string().min(1),
  }),
};

export const createOrganizationSchema = {
  body: z.object({
    name: z.string().min(1).max(100),
    slug: z
      .string()
      .min(2)
      .max(40)
      .regex(/^[a-z0-9-]+$/, 'Lowercase, hyphens, digits only'),
  }),
};

export const inviteMemberSchema = {
  body: z.object({
    email: z.string().email(),
    role: z.enum(['owner', 'admin', 'member']).default('member'),
  }),
};

export const createProjectSchema = {
  body: z.object({
    name: z.string().min(1).max(120),
    path: z.string().min(1).max(512).optional(),
    description: z.string().max(2000).optional(),
  }),
};

export const createTaskSchema = {
  body: z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(5000).optional(),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
    assigneeId: z.string().optional(),
    status: z.enum(['todo', 'doing', 'done', 'conflict']).default('todo'),
  }),
};

export const updateTaskSchema = {
  body: z
    .object({
      title: z.string().min(1).max(200).optional(),
      description: z.string().max(5000).optional(),
      priority: z.enum(['low', 'medium', 'high']).optional(),
      status: z.enum(['todo', 'doing', 'done', 'conflict']).optional(),
      assigneeId: z.string().nullable().optional(),
    })
    .refine((v) => Object.keys(v).length > 0, { message: 'At least one field required' }),
  params: z.object({
    id: z.string().min(1),
  }),
};

export const lockSymbolSchema = {
  body: z.object({
    file: z.string().min(1).max(512),
    symbol: z.string().min(1).max(200),
    agentId: z.string().min(1).max(100),
  }),
};

export const unlockSymbolSchema = {
  body: z.object({
    file: z.string().min(1).max(512),
    symbol: z.string().min(1).max(200),
    agentId: z.string().min(1).max(100),
  }),
};

export const createAgentSchema = {
  body: z.object({
    name: z.string().min(1).max(100),
    type: z.enum(['ai', 'human']),
    provider: z.string().max(50).optional(),
  }),
};
