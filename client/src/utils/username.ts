export const NAME_RE = /^[A-Za-z0-9_]{3,16}$/;
export function isValidUsername(s: string): boolean {
  return NAME_RE.test(s.trim());
}
