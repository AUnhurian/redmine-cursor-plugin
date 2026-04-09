import type { EnvConfig } from "./env.js";
import { logError } from "./logger.js";
import type { RedmineIssuePayload } from "./types.js";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type RedmineApiResponse = {
  issue?: RedmineIssuePayload;
};

export class RedmineIssueNotFoundError extends Error {
  public constructor() {
    super("Redmine issue not found.");
  }
}

export class RedmineAuthError extends Error {
  public constructor() {
    super("Redmine authentication failed or access denied.");
  }
}

export class RedmineUnavailableError extends Error {
  public constructor() {
    super("Failed to fetch issue from Redmine.");
  }
}

export async function fetchRedmineIssueById(
  issueId: number,
  config: EnvConfig
): Promise<RedmineIssuePayload> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.redmineTimeoutMs);

  try {
    const endpoint = new URL(`/issues/${issueId}.json`, config.redmineBaseUrl);
    endpoint.searchParams.set("include", "journals,attachments");

    const response = await fetch(endpoint, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "Accept": "application/json",
        "X-Redmine-API-Key": config.redmineApiKey
      }
    });

    if (response.status === 404) {
      throw new RedmineIssueNotFoundError();
    }

    if (response.status === 401 || response.status === 403) {
      throw new RedmineAuthError();
    }

    if (!response.ok) {
      throw new RedmineUnavailableError();
    }

    const data = (await response.json()) as RedmineApiResponse;
    if (!data.issue) {
      throw new RedmineUnavailableError();
    }

    return data.issue;
  } catch (error) {
    if (
      error instanceof RedmineIssueNotFoundError ||
      error instanceof RedmineAuthError ||
      error instanceof RedmineUnavailableError
    ) {
      logError("Redmine request failed with mapped error.", error, { issueId });
      throw error;
    }

    logError("Redmine request failed with unexpected error.", error, { issueId });
    throw new RedmineUnavailableError();
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchAttachmentAsBase64(
  contentUrl: string,
  filesize: number,
  config: EnvConfig
): Promise<string | null> {
  if (filesize > MAX_IMAGE_BYTES) {
    logError("Skipping oversized attachment.", undefined, {
      contentUrl,
      filesize,
      maxBytes: MAX_IMAGE_BYTES
    });
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.redmineTimeoutMs);

  try {
    const response = await fetch(contentUrl, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "X-Redmine-API-Key": config.redmineApiKey
      }
    });

    if (!response.ok) {
      logError("Attachment download failed.", undefined, {
        contentUrl,
        status: response.status
      });
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer.toString("base64");
  } catch (error) {
    logError("Attachment download error.", error, { contentUrl });
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
