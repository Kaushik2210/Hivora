export type UserRole = 'owner' | 'admin' | 'member';

export type AgentType = 'ai' | 'human';
export type AgentStatus = 'idle' | 'working' | 'offline';

export type TaskStatus = 'todo' | 'doing' | 'review_pending' | 'done' | 'conflict';
export type TaskPriority = 'low' | 'medium' | 'high';

export type SubscriptionTier = 'free' | 'pro' | 'team' | 'enterprise';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';

export interface User {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface Membership {
  id: string;
  userId: string;
  organizationId: string;
  role: UserRole;
  createdAt: string;
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  path: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  projectId: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  provider: string | null;
  currentTask: string | null;
  createdAt: string;
}

export interface Lock {
  id: string;
  projectId: string;
  file: string;
  symbol: string;
  agentId: string;
  lockedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser extends User {
  role?: UserRole;
  organizationId?: string;
}

export interface ApiError {
  error: true;
  code: string;
  message: string;
}

export interface ApiOk<T> {
  error: false;
  data: T;
}

export type ApiResponse<T> = ApiOk<T> | ApiError;

export interface RealtimeEvent {
  type: 'lock:acquired' | 'lock:released' | 'task:created' | 'task:updated' | 'task:moved' | 'agent:updated' | 'project:updated' | 'agent:log' | 'agent:healing';
  payload: unknown;
  organizationId: string;
  projectId?: string;
}

export interface TierLimits {
  maxAgents: number;
  maxProjects: number;
  maxMembers: number;
  storageMb: number;
  cloudSync: boolean;
  realtimeBoard: boolean;
  auditLog: boolean;
  sso: boolean;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    maxAgents: 3,
    maxProjects: 1,
    maxMembers: 1,
    storageMb: 0,
    cloudSync: false,
    realtimeBoard: false,
    auditLog: false,
    sso: false,
  },
  pro: {
    maxAgents: Infinity,
    maxProjects: 5,
    maxMembers: 1,
    storageMb: 1024,
    cloudSync: true,
    realtimeBoard: true,
    auditLog: true,
    sso: false,
  },
  team: {
    maxAgents: Infinity,
    maxProjects: 20,
    maxMembers: 50,
    storageMb: 10240,
    cloudSync: true,
    realtimeBoard: true,
    auditLog: true,
    sso: true,
  },
  enterprise: {
    maxAgents: Infinity,
    maxProjects: Infinity,
    maxMembers: Infinity,
    storageMb: Infinity,
    cloudSync: true,
    realtimeBoard: true,
    auditLog: true,
    sso: true,
  },
};
