# MCP Learning Project: News Brief MCP Server

## What You'll Build

An MCP (Model Context Protocol) server that wraps your existing News Brief Generator functionality, letting Claude Desktop summarize articles, format briefs, and draft WordPress posts — all through natural conversation instead of a web UI.

By the end of the project, you'll be able to open Claude Desktop, paste a few article URLs into the chat, and say *"Summarize these and draft a WordPress post"* — and Claude will use your MCP server's tools to do it.

## Why This Project

- **You already have the hard parts built.** Your summarizer, content extractor, and WordPress integration are working code. MCP just gives Claude a way to call them.
- **It teaches all three MCP primitives** — tools, resources, and prompts — in a context you understand.
- **TypeScript SDK.** You're already writing TypeScript. The official `@modelcontextprotocol/sdk` package works with Node.js.

---

## What is MCP?

MCP is a protocol that lets AI applications (like Claude Desktop) talk to external servers that provide **tools**, **resources**, and **prompts**. Think of it as a standardized plugin system for LLMs.

| Primitive    | What it does                                          | Your project example                                |
|-------------|-------------------------------------------------------|-----------------------------------------------------|
| **Tools**   | Functions Claude can call (like API endpoints)        | `summarize-article`, `publish-to-wordpress`         |
| **Resources**| Read-only data Claude can access                     | List of recent briefs, source name mappings         |
| **Prompts** | Reusable prompt templates                             | "Planet Detroit brief style" system prompt           |

---

## Project Plan (4 Phases)

### Phase 1: Hello World MCP Server

**Goal:** Get a minimal MCP server running and connected to Claude Desktop.

1. Initialize a new directory: `mcp-server/`
2. Install the SDK:
   ```bash
   npm init -y
   npm install @modelcontextprotocol/sdk
   npm install -D typescript @types/node
   ```
3. Create `mcp-server/src/index.ts` with a single tool:
   ```typescript
   import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
   import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
   import { z } from "zod";

   const server = new McpServer({
     name: "news-brief",
     version: "1.0.0",
   });

   // A simple tool that echoes back a message
   server.tool("hello", { name: z.string() }, async ({ name }) => ({
     content: [{ type: "text", text: `Hello, ${name}! The news brief server is working.` }],
   }));

   const transport = new StdioServerTransport();
   await server.connect(transport);
   ```
4. Configure Claude Desktop (`claude_desktop_config.json`):
   ```json
   {
     "mcpServers": {
       "news-brief": {
         "command": "npx",
         "args": ["tsx", "/absolute/path/to/mcp-server/src/index.ts"]
       }
     }
   }
   ```
5. Restart Claude Desktop and verify the hammer icon appears.

**You'll learn:** MCP server lifecycle, stdio transport, tool registration, Claude Desktop configuration.

---

### Phase 2: Add Real Tools

**Goal:** Expose your existing article fetching and summarization as MCP tools.

Add three tools that reuse your existing logic from `src/lib/services/`:

| Tool name             | Input                  | What it does                                    |
|-----------------------|------------------------|-------------------------------------------------|
| `fetch-article`      | `url: string`         | Fetches and extracts article content (reuse `article-fetcher.ts` + `content-extractor.ts`) |
| `summarize-article`  | `url: string`         | Fetches + summarizes via Claude API (reuse `summarizer.ts`) |
| `format-brief`       | `articles: Article[]` | Formats multiple summaries into Planet Detroit brief HTML (reuse `html-formatter.ts`) |

Implementation approach:
- Import your existing service functions directly, or call your Next.js API routes via `fetch("http://localhost:3000/api/...")`.
- Start with the simpler "call your own API" approach — it avoids dependency tangles and your Next.js dev server just needs to be running alongside the MCP server.

**You'll learn:** Defining tool schemas with Zod, handling tool errors, returning structured content.

---

### Phase 3: Add Resources and Prompts

**Goal:** Teach Claude about Planet Detroit's editorial style using MCP resources and prompts.

**Resources to add:**
```typescript
// Expose source name mappings so Claude knows your preferred outlet names
server.resource("source-names", "text://source-names", async () => ({
  contents: [{ uri: "text://source-names", text: JSON.stringify(SOURCE_NAMES) }],
}));
```

**Prompts to add:**
```typescript
// A reusable prompt template for brief-style summaries
server.prompt("brief-summary", { url: z.string() }, ({ url }) => ({
  messages: [
    {
      role: "user",
      content: {
        type: "text",
        text: `Summarize this article for a Planet Detroit news brief.
Use AP style. Keep it to 2-3 sentences. Focus on the Detroit/Michigan angle.
Article URL: ${url}`,
      },
    },
  ],
}));
```

**You'll learn:** The difference between tools (actions), resources (data), and prompts (templates). When to use each.

---

### Phase 4: WordPress Integration

**Goal:** Let Claude publish briefs directly from the conversation.

Add a `publish-to-wordpress` tool:

| Tool name               | Input                                    | What it does                              |
|--------------------------|------------------------------------------|-------------------------------------------|
| `publish-to-wordpress`  | `title: string, content: string`         | Creates a draft post via WP REST API      |
| `list-wp-authors`       | (none)                                   | Returns available WordPress authors       |

This is the payoff moment — you can have a conversation like:

> **You:** Here are today's articles: [url1], [url2], [url3]
> **Claude:** *uses summarize-article tool 3 times*
> **Claude:** Here are the summaries. Want me to format and publish?
> **You:** Yes, publish as a draft with the headline "What we're reading: Feb 13"
> **Claude:** *uses format-brief, then publish-to-wordpress*
> **Claude:** Done! Draft created: https://planetdetroit.org/wp-admin/post.php?post=1234

**You'll learn:** Chaining tools together, handling authentication securely (env vars), real-world MCP workflows.

---

## Directory Structure

```
news-brief-generator/
├── src/                    # (existing Next.js app)
├── mcp-server/             # (new — your MCP server)
│   ├── src/
│   │   ├── index.ts        # Server entry point
│   │   ├── tools/          # Tool definitions
│   │   │   ├── fetch.ts
│   │   │   ├── summarize.ts
│   │   │   ├── format.ts
│   │   │   └── wordpress.ts
│   │   ├── resources/      # Resource definitions
│   │   │   └── sources.ts
│   │   └── prompts/        # Prompt templates
│   │       └── brief.ts
│   ├── package.json
│   └── tsconfig.json
```

---

## Prerequisites

- **Claude Desktop app** installed (MCP does not work in the web interface)
- **Node.js 18+** (you already have this)
- **Your `.env.local`** with `ANTHROPIC_API_KEY` and WordPress credentials
- Your Next.js dev server running (`npm run dev`) if using the API-call approach

---

## Key Resources

- [Official MCP Quickstart](https://modelcontextprotocol.io/quickstart) — Build a weather server (good warm-up)
- [Build an MCP Server (official docs)](https://modelcontextprotocol.io/docs/develop/build-server) — Full reference
- [Anthropic's MCP Course](https://anthropic.skilljar.com/introduction-to-model-context-protocol) — Free video course covering tools, resources, and prompts
- [MCP TypeScript SDK on GitHub](https://github.com/modelcontextprotocol/typescript-sdk) — Source and examples
- [Codecademy MCP Guide](https://www.codecademy.com/article/how-to-use-model-context-protocol-mcp-with-claude-step-by-step-guide-with-examples) — Step-by-step walkthrough

---

## Tips

- **Start with Phase 1 and verify it works before moving on.** Most issues are config/path problems in `claude_desktop_config.json`.
- **Use `npx tsx` to run TypeScript directly** — no compile step needed during development.
- **Check Claude Desktop logs** if the server doesn't connect: `~/Library/Logs/Claude/mcp*.log` (macOS).
- **The MCP Inspector** (`npx @modelcontextprotocol/inspector`) lets you test your server without Claude Desktop.
- **Keep your Next.js app running** in a separate terminal so the MCP server can call its APIs.
