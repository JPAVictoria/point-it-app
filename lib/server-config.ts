import "server-only";

/** A required environment variable is missing — shown to the user so setup problems are obvious. */
export class NotConfiguredError extends Error {
  constructor(variable: string) {
    super(`${variable} is not set. Copy .env.local.example to .env.local (and add it in Vercel), then restart.`);
    this.name = "NotConfiguredError";
  }
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new NotConfiguredError(name);
  return value;
}
