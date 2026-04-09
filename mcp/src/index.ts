import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readEnvConfig } from "./env.js";
import { logError } from "./logger.js";
import {
  RedmineAuthError,
  RedmineIssueNotFoundError,
  RedmineUnavailableError
} from "./redmine.js";
import {
  getInvalidIssueIdError,
  getRedmineIssue,
  getRedmineIssueInputSchemaShape
} from "./tools/getRedmineIssue.js";

async function main(): Promise<void> {
  let config;
  try {
    config = readEnvConfig();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to read environment.";
    logError("Failed to initialize environment config.", error);
    process.stderr.write(`${message}\n`);
    process.exit(1);
    return;
  }

  const server = new McpServer({
    name: "redmine",
    version: "0.1.0"
  });

  server.tool(
    "get_redmine_issue",
    "Get a Redmine issue by ID, including title, description, link, metadata, text comments, and image attachments.",
    getRedmineIssueInputSchemaShape,
    async (input) => {
      try {
        const { result, images } = await getRedmineIssue(input, config);

        const content: ({ type: "text"; text: string } | { type: "image"; data: string; mimeType: string })[] = [
          { type: "text", text: JSON.stringify(result, null, 2) },
          ...images
        ];

        return { content, structuredContent: result };
      } catch (error) {
        if (
          error instanceof RedmineIssueNotFoundError ||
          error instanceof RedmineAuthError ||
          error instanceof RedmineUnavailableError ||
          (error instanceof Error && error.message === getInvalidIssueIdError().message)
        ) {
          logError("Tool execution failed with mapped error.", error, {
            tool: "get_redmine_issue"
          });
          return {
            isError: true,
            content: [
              {
                type: "text" as const,
                text: error.message
              }
            ]
          };
        }

        logError("Tool execution failed with unexpected error.", error, {
          tool: "get_redmine_issue"
        });
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: "Failed to fetch issue from Redmine."
            }
          ]
        };
      }
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

void main();
