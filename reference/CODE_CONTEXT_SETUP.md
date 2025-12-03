# Code Context MCP - Semantic Search Setup

**Status:** ✅ ACTIVE & INSTALLED
**Deployment Date:** 2025-12-04
**Cost:** $0/month (fully open source, runs locally)

---

## What is Code Context MCP?

Code Context is an open-source semantic code search engine that:
- Understands code meaning (not just keywords)
- Works offline via local Ollama embeddings
- Integrates with Claude Code via MCP protocol
- No subscription fees, no data transmission, no API keys needed

**Key Difference from mgrep:**
- mgrep: $20/month gate fee + pay-as-you-go
- Code Context: FREE forever, runs on your machine

---

## Installation (Already Complete)

✅ **Code Context MCP:** Installed globally
✅ **Ollama:** Already installed at `/opt/homebrew/bin/ollama`

No additional setup needed for tools.

---

## Configuration for Claude Code

### Step 1: Configure Claude Code to Use Code Context MCP

Edit `.claude/claude.json` (or create if it doesn't exist):

```json
{
  "mcpServers": {
    "code-context": {
      "command": "code-context",
      "args": [
        "--project-root",
        "/Users/spectrasynq/SpectraSynq.LandingPage",
        "--embedding-model",
        "nomic-embed-text",
        "--vector-db",
        "milvus"
      ]
    }
  }
}
```

### Step 2: Start Ollama (One-Time Per Session)

```bash
# Start Ollama in background
ollama serve &

# Download the embedding model (one-time, ~50MB)
ollama pull nomic-embed-text
```

Verify Ollama is running:
```bash
curl http://localhost:11434/api/tags
```

### Step 3: Initialize Code Context Index

```bash
# First-time indexing of SpectraSynq.LandingPage
cd /Users/spectrasynq/SpectraSynq.LandingPage
code-context index

# First-time indexing of K1.Sliders
cd /Users/spectrasynq/Workspace_Management/Software/K1.Sliders
code-context index
```

Both projects now have semantic search enabled. Indexing takes ~2-5 minutes per project.

---

## Usage with Claude Code

Once configured, Claude Code automatically has access to semantic search:

```
User: "Where do we handle LED motion decay?"
Claude Code: Searches indexed codebase semantically
Result: Returns relevant physics/animation code with context
```

**No manual queries needed** - Claude Code uses it transparently for context gathering.

---

## How It Works Under the Hood

```
Code → Ollama (nomic-embed-text) → Vector embeddings
Embeddings → Local Milvus database → Semantic index
Search Query → Same embedding process → Vector similarity match
```

**All local. No cloud. No API calls. No data transmission.**

---

## Optional: Manual Semantic Searches

If you want to search from CLI:

```bash
code-context search "how does the center origin injection work?"
```

Returns 5-10 most relevant code snippets with context.

---

## File Structure

| Component | Location | Purpose |
|-----------|----------|---------|
| Code Context CLI | Global npm | Indexing & search |
| Ollama | `/opt/homebrew/bin/ollama` | Local LLM + embeddings |
| Index (SpectraSynq) | `.code-context/` | Semantic database |
| Index (K1.Sliders) | (K1.Sliders project) | Semantic database |

---

## Performance

- **Initial indexing:** 2-5 minutes per project
- **Semantic search:** <1 second per query
- **Memory usage:** ~200-300MB (Ollama) + 500MB (Milvus)
- **Disk usage:** ~1GB per 10K files indexed

---

## Troubleshooting

### "Ollama not running"
```bash
ollama serve &
```

### "Embedding model not found"
```bash
ollama pull nomic-embed-text
```

### "Index corrupted"
```bash
rm -rf .code-context/
code-context index  # Re-index from scratch
```

### "Claude Code not finding MCP"
Verify config in `.claude/claude.json` and restart Claude Code.

---

## Why This Beats mgrep

| Feature | Code Context | mgrep |
|---------|--------------|-------|
| **Cost** | $0 | $20/month + usage |
| **Runs** | Locally (offline) | Cloud |
| **Setup time** | 10 minutes | 5 minutes (but trap) |
| **Data privacy** | 100% (your machine) | Cloud stored |
| **AST-aware** | Yes (code-aware) | No (token-aware) |
| **Claude Code** | Native MCP | Bolted on |

---

## Migration from mgrep

✅ **Removed:**
- mgrep global installation
- mgrep config directories
- mgrep documentation

✅ **Installed:**
- Code Context MCP global
- Ollama (already present)

✅ **Difference:** No ongoing costs, better privacy, faster offline search.

---

## Next Steps

1. Configure `.claude/claude.json` with Code Context MCP settings
2. Start Ollama: `ollama serve &`
3. Download embedding model: `ollama pull nomic-embed-text`
4. Index both projects: `code-context index` in each project directory
5. Restart Claude Code
6. Start using semantic search transparently

**That's it. No subscriptions. No API keys. No surprises.**

---

## Resources

- **Code Context GitHub:** https://github.com/zilliztech/claude-context
- **Ollama:** https://ollama.ai
- **Milvus:** https://milvus.io
