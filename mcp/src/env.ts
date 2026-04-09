import { z } from "zod";

const envSchema = z.object({
  REDMINE_BASE_URL: z.string().url(),
  REDMINE_API_KEY: z.string().trim().min(1),
  REDMINE_TIMEOUT_MS: z.coerce.number().int().positive().default(10000)
});

export type EnvConfig = {
  redmineBaseUrl: string;
  redmineApiKey: string;
  redmineTimeoutMs: number;
};

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

export function readEnvConfig(): EnvConfig {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "env";
      return `${path}: ${issue.message}`;
    });
    throw new Error(`Invalid environment configuration:\n${details.join("\n")}`);
  }

  return {
    redmineBaseUrl: normalizeBaseUrl(parsed.data.REDMINE_BASE_URL),
    redmineApiKey: parsed.data.REDMINE_API_KEY,
    redmineTimeoutMs: parsed.data.REDMINE_TIMEOUT_MS
  };
}
