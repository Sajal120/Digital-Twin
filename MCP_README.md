# Digital Twin MCP Server

Your portfolio now includes a Digital Twin MCP (Model Context Protocol) server that allows Claude Desktop to ask questions about your professional background using your existing RAG chatbot.

## How It Works

The MCP server at `/api/mcp` acts as a bridge between Claude Desktop and your existing `/api/chat` endpoint:

1. **Claude** → MCP Tool Call → **MCP Server** (`/api/mcp`)
2. **MCP Server** → HTTP Request → **Your Chat API** (`/api/chat`) 
3. **Chat API** → RAG Processing → **Upstash Vector + Groq**
4. **Response** ← MCP Protocol ← **MCP Server** ← **Chat API**

## Available Tools

- **`ask_digital_twin`**: Ask questions about professional background, skills, experience, and projects

## Configuration

Your MCP server is configured in `.vscode/mcp.json`:

```json
{
  "servers": {
    "digital-twin": {
      "url": "http://localhost:3000/api/mcp",
      "type": "http"
    }
  }
}
```

## Usage

1. **Restart Claude Desktop** for the MCP configuration to take effect
2. **Ask questions** like:
   - "What can you tell me about my professional background?"
   - "What technologies do I specialize in?"
   - "Tell me about my recent projects"
   - "What is my work experience?"

## Testing

Test the MCP server directly:

```bash
# Test server status
curl http://localhost:3000/api/mcp

# Test initialize
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}'

# Test tool call
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"ask_digital_twin","arguments":{"question":"Tell me about your skills"}}}'
```

## Files Added

- `src/app/api/mcp/route.ts` - MCP protocol implementation
- Updated `.vscode/mcp.json` - Claude Desktop configuration

The MCP server leverages your existing infrastructure:
- ✅ Upstash Vector database
- ✅ Groq LLM integration  
- ✅ RAG search pipeline
- ✅ Professional content database
- ✅ No additional dependencies required