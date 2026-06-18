export function ok<T>(data: T) {
  return { error: false as const, data };
}

export function fail(code: string, message: string) {
  return { error: true as const, code, message };
}

export function getClientIp(req: import('express').Request): string | undefined {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string') return fwd.split(',')[0].trim();
  if (Array.isArray(fwd)) return fwd[0];
  return req.ip;
}

export function getUserAgent(req: import('express').Request): string | undefined {
  const ua = req.headers['user-agent'];
  return typeof ua === 'string' ? ua : undefined;
}
