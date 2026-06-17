export type ParseResult<TArgs> =
  | { ok: true; args: TArgs }
  | { ok: false; error: string };
