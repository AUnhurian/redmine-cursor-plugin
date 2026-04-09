export type RedmineComment = {
  id: number;
  author: string | null;
  createdAt: string;
  text: string;
};

export type RedmineAttachment = {
  id: number;
  filename: string;
  filesize: number;
  contentType: string;
  contentUrl: string;
  description: string;
  author: string | null;
  createdAt: string;
};

export type RedmineIssueResult = {
  id: number;
  subject: string;
  description: string;
  url: string;
  status: string | null;
  project: string | null;
  tracker: string | null;
  priority: string | null;
  author: string | null;
  assignedTo: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  comments: RedmineComment[];
  attachments: RedmineAttachment[];
};

type RedmineNamedEntity = {
  name?: string;
};

export type RedmineIssueJournal = {
  id: number;
  notes?: string | null;
  created_on?: string;
  user?: RedmineNamedEntity;
};

export type RedmineAttachmentPayload = {
  id: number;
  filename?: string;
  filesize?: number;
  content_type?: string;
  content_url?: string;
  description?: string;
  author?: RedmineNamedEntity;
  created_on?: string;
};

export type RedmineIssuePayload = {
  id: number;
  subject?: string | null;
  description?: string | null;
  status?: RedmineNamedEntity;
  project?: RedmineNamedEntity;
  tracker?: RedmineNamedEntity;
  priority?: RedmineNamedEntity;
  author?: RedmineNamedEntity;
  assigned_to?: RedmineNamedEntity;
  created_on?: string | null;
  updated_on?: string | null;
  journals?: RedmineIssueJournal[];
  attachments?: RedmineAttachmentPayload[];
};

export type ImageContentBlock = {
  type: "image";
  data: string;
  mimeType: string;
};
