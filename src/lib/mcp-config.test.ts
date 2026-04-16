import { describe, it, expect } from 'vitest';
import { buildMcpConfig, MCP_SSE_URL } from './mcp-config';

describe('buildMcpConfig', () => {
  it('returns the rag-chatbot SSE configuration required by Plan 05', () => {
    expect(buildMcpConfig()).toEqual({
      mcpServers: {
        'rag-chatbot': {
          type: 'sse',
          url: MCP_SSE_URL,
        },
      },
    });
  });

  it('exports the hard-coded SSE URL from Plan 05', () => {
    expect(MCP_SSE_URL).toBe('https://rag-chatbot-v3-mcp.fly.dev/sse');
  });

  it('produces JSON that round-trips cleanly', () => {
    const json = JSON.stringify(buildMcpConfig(), null, 2);
    const parsed = JSON.parse(json);
    expect(parsed.mcpServers['rag-chatbot'].type).toBe('sse');
  });
});
