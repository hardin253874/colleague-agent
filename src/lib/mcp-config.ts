export const MCP_SSE_URL = 'https://rag-chatbot-v3-mcp.fly.dev/sse';

export interface McpConfig {
  mcpServers: Record<string, { type: 'sse'; url: string }>;
}

/**
 * Produces the `.mcp.json` body that ships inside the Agent Package, per
 * Plan 05 § .mcp.json format. Hard-coded — no per-colleague variation in v1.
 */
export function buildMcpConfig(): McpConfig {
  return {
    mcpServers: {
      'rag-chatbot': {
        type: 'sse',
        url: MCP_SSE_URL,
      },
    },
  };
}
