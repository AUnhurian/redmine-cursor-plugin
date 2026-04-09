type LogMeta = Record<string, string | number | boolean | null | undefined>;

function serializeMeta(meta?: LogMeta): string {
  if (!meta) {
    return "";
  }

  const entries = Object.entries(meta).filter(([, value]) => value !== undefined);
  if (entries.length === 0) {
    return "";
  }

  return ` ${entries.map(([key, value]) => `${key}=${String(value)}`).join(" ")}`;
}

export function logError(message: string, error?: unknown, meta?: LogMeta): void {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] ERROR ${message}${serializeMeta(meta)}`;
  const logLine =
    error instanceof Error
      ? `${base} errorName=${error.name} errorMessage=${error.message}`
      : base;

  process.stderr.write(`${logLine}\n`);
}
