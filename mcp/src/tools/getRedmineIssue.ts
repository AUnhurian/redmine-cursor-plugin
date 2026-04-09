import { z } from "zod";
import type { EnvConfig } from "../env.js";
import { fetchAttachmentAsBase64, fetchRedmineIssueById } from "../redmine.js";
import type {
  ImageContentBlock,
  RedmineAttachment,
  RedmineAttachmentPayload,
  RedmineComment,
  RedmineIssueResult
} from "../types.js";

const MAX_IMAGE_DOWNLOADS = 10;
const IMAGE_MIME_PREFIX = "image/";

const inputSchema = z.object({
  issueId: z.number().int().positive(),
  includeImages: z.boolean().default(true)
});

export const getRedmineIssueInputSchemaShape = {
  issueId: z.number().int().positive().describe("Redmine issue ID"),
  includeImages: z.boolean().optional().describe("Download and embed image attachments (default: true)")
};

export type GetRedmineIssueToolResult = {
  result: RedmineIssueResult;
  images: ImageContentBlock[];
};

export function getInvalidIssueIdError(): Error {
  return new Error("Invalid issueId. Expected a positive integer.");
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function mapComments(journals: { id: number; notes?: string | null; created_on?: string; user?: { name?: string } }[]): RedmineComment[] {
  return journals
    .map((journal) => ({
      id: journal.id,
      author: journal.user?.name ?? null,
      createdAt: journal.created_on ?? "",
      text: normalizeText(journal.notes)
    }))
    .filter((journal) => journal.text.length > 0);
}

function mapAttachments(raw: RedmineAttachmentPayload[]): RedmineAttachment[] {
  return raw.map((a) => ({
    id: a.id,
    filename: a.filename ?? "",
    filesize: a.filesize ?? 0,
    contentType: a.content_type ?? "",
    contentUrl: a.content_url ?? "",
    description: normalizeText(a.description),
    author: a.author?.name ?? null,
    createdAt: a.created_on ?? ""
  }));
}

function isImageAttachment(attachment: RedmineAttachment): boolean {
  return attachment.contentType.startsWith(IMAGE_MIME_PREFIX) && attachment.contentUrl.length > 0;
}

async function downloadImages(
  attachments: RedmineAttachment[],
  config: EnvConfig
): Promise<ImageContentBlock[]> {
  const imageAttachments = attachments
    .filter(isImageAttachment)
    .slice(0, MAX_IMAGE_DOWNLOADS);

  const results = await Promise.allSettled(
    imageAttachments.map(async (a): Promise<ImageContentBlock | null> => {
      const data = await fetchAttachmentAsBase64(a.contentUrl, a.filesize, config);
      if (!data) return null;
      return { type: "image", data, mimeType: a.contentType };
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<ImageContentBlock | null> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((v): v is ImageContentBlock => v !== null);
}

export async function getRedmineIssue(
  rawInput: unknown,
  config: EnvConfig
): Promise<GetRedmineIssueToolResult> {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw getInvalidIssueIdError();
  }

  const issue = await fetchRedmineIssueById(parsed.data.issueId, config);
  const comments = mapComments(issue.journals ?? []);
  const attachments = mapAttachments(issue.attachments ?? []);

  const images = parsed.data.includeImages
    ? await downloadImages(attachments, config)
    : [];

  const result: RedmineIssueResult = {
    id: issue.id,
    subject: normalizeText(issue.subject),
    description: normalizeText(issue.description),
    url: `${config.redmineBaseUrl}/issues/${issue.id}`,
    status: issue.status?.name ?? null,
    project: issue.project?.name ?? null,
    tracker: issue.tracker?.name ?? null,
    priority: issue.priority?.name ?? null,
    author: issue.author?.name ?? null,
    assignedTo: issue.assigned_to?.name ?? null,
    createdAt: issue.created_on ?? null,
    updatedAt: issue.updated_on ?? null,
    comments,
    attachments
  };

  return { result, images };
}
