export function getAllowedOrigins(): string[] {
  return (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function pickAllowedOrigin(requestOrigin: string | undefined): string | null {
  const allowed = getAllowedOrigins();
  if (allowed.length === 0) return null;
  if (requestOrigin && allowed.includes(requestOrigin)) return requestOrigin;
  return allowed[0] ?? null;
}

export function corsHeaders(requestOrigin: string | undefined): Record<string, string> {
  const origin = pickAllowedOrigin(requestOrigin);
  if (!origin) return {};
  return {
    'access-control-allow-origin': origin,
    vary: 'Origin',
  };
}
