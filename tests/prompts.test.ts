import { expect, test, describe, beforeEach, afterEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { ListPromptsResultSchema, GetPromptResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { asResponseSchema } from "./context-helper";

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("kubernetes prompts", () => {
  let transport: StdioClientTransport;
  let client: Client;

  beforeEach(async () => {
    try {
      transport = new StdioClientTransport({
        command: "bun",
        args: ["src/index.ts"],
        stderr: "pipe",
      });

      client = new Client(
        {
          name: "test-client",
          version: "1.0.0",
        },
        {
          capabilities: {},
        }
      );
      await client.connect(transport);
    } catch (e) {
      console.error("Error in beforeEach:", e);
      throw e;
    }
  });

  afterEach(async () => {
    try {
      await transport.close();
      await sleep(1000);
    } catch (e) {
      console.error("Error during cleanup:", e);
    }
  });

  test("list available prompts", async () => {
    console.log("Listing available prompts...");
    const promptsList = await client.request(
      {
        method: "prompts/list",
      },
      ListPromptsResultSchema
    );
    expect(promptsList.prompts).toBeDefined();
    expect(promptsList.prompts.length).toBeGreaterThan(0);
    expect(promptsList.prompts).toContainEqual({
      name: "k8s-diagnose",
      description: "Diagnose Kubernetes Resources.",
      arguments: [
        {
          name: "keyword",
          description: "A keyword to search pod/node names.",
          required: true,
        },
        {
          name: "namespace",
          description: "Optional: Specify a namespace to narrow down the search.",
          required: false,
          default: "all",
        },
      ],
    });
    
    expect(promptsList.prompts).toContainEqual({
      name: "load-eda-context",
      description: "Load comprehensive EDA context by reading all EDA-related resources, analyzing CRDs, and understanding their interdependencies to prime the client for EDA task execution.",
      arguments: [
        {
          name: "namespace",
          description: "Optional: Specific namespace to focus EDA context loading. If not provided, searches across all namespaces.",
          required: false,
        },
        {
          name: "include_templates",
          description: "Optional: Include EDA configuration templates in the context (default: true).",
          required: false,
          default: "true",
        },
      ],
    });
  });

  test("get load-eda-context prompt", async () => {
    const promptResult = await client.request({
      method: "prompts/get",
      params: {
        name: "load-eda-context",
        arguments: {
          namespace: "test-namespace",
          include_templates: "true"
        }
      },
    }, GetPromptResultSchema);

    expect(promptResult.messages).toBeDefined();
    expect(promptResult.messages.length).toBe(1);
    expect(promptResult.messages[0].role).toBe("user");
    expect(promptResult.messages[0].content.type).toBe("text");
    
    const messageText = promptResult.messages[0].content.text;
    expect(messageText).toContain("Load comprehensive Nokia EDA");
    expect(messageText).toContain("test-namespace");
    expect(messageText).toContain("including configuration templates");
    expect(messageText).toContain("EDA Context Loading Protocol");
    expect(messageText).toContain("Router"); // EDA resource types
    expect(messageText).toContain("BridgeDomain");
    expect(messageText).toContain("IRBInterface");
  });
}); 