import type { ParseResult } from '@/types';

const ROOM_SLUG = /^[a-z0-9_-]{2,32}$/;
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export const noArgs = (rest: string): ParseResult<null> =>
  rest.length === 0
    ? { ok: true, args: null }
    : { ok: false, error: 'this command takes no arguments' };

export const requireToken = (rest: string, label: string): ParseResult<string> => {
  if (rest.length === 0) return { ok: false, error: `missing argument: ${label}` };
  const first = rest.split(/\s+/)[0]!;
  return { ok: true, args: first };
};

export const requireRest = (rest: string, label: string): ParseResult<string> => {
  const trimmed = rest.trim();
  if (trimmed.length === 0) return { ok: false, error: `missing argument: ${label}` };
  return { ok: true, args: trimmed };
};

export const requireSlug = (rest: string, label: string): ParseResult<string> => {
  const token = requireToken(rest, label);
  if (!token.ok) return token;
  if (!ROOM_SLUG.test(token.args)) {
    return { ok: false, error: `${label} must match ${ROOM_SLUG.source}` };
  }
  return token;
};

export const requireHex = (rest: string, label: string): ParseResult<string> => {
  const token = requireToken(rest, label);
  if (!token.ok) return token;
  if (!HEX_COLOR.test(token.args)) {
    return { ok: false, error: `${label} must be #RRGGBB hex` };
  }
  return { ok: true, args: token.args.toLowerCase() };
};

export const requireText = (
  rest: string,
  label: string,
  maxLength: number,
): ParseResult<string> => {
  if (rest.length === 0) return { ok: false, error: `missing argument: ${label}` };
  if (rest.length > maxLength) {
    return { ok: false, error: `${label} is too long (max ${maxLength})` };
  }
  return { ok: true, args: rest };
};

export const optionalText = (
  rest: string,
  label: string,
  maxLength: number,
): ParseResult<string | null> => {
  if (rest.length === 0) return { ok: true, args: null };
  return requireText(rest, label, maxLength);
};

export const requireEnum = <T extends string>(
  rest: string,
  label: string,
  values: readonly T[],
): ParseResult<T> => {
  const token = requireToken(rest, label);
  if (!token.ok) return token;
  const match = values.find((v) => v === token.args);
  if (!match) {
    return { ok: false, error: `${label} must be one of: ${values.join(', ')}` };
  }
  return { ok: true, args: match };
};

export const splitFirstAndRest = (
  rest: string,
  label: string,
): ParseResult<{ first: string; rest: string }> => {
  if (rest.length === 0) return { ok: false, error: `missing argument: ${label}` };
  const m = rest.match(/^(\S+)\s*(.*)$/);
  if (!m) return { ok: false, error: `missing argument: ${label}` };
  return { ok: true, args: { first: m[1]!, rest: m[2] ?? '' } };
};
