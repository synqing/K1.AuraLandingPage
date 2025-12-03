# mgrep Global Deployment for Claude Code

## What is mgrep?

**mgrep** is a semantic search CLI tool that enables natural language queries across your codebase, replacing traditional pattern-based grep.

Instead of:
```bash
grep -r "authentication" .
```

You can ask:
```bash
mgrep "where do we set up auth?"
```

It returns semantically relevant results using AI, not pattern matching.

**Key Benefits:**
- Natural language search across code, PDFs, images, text
- ~2x token reduction when used with Claude Code (fewer results to process)
- Cloud-backed indexing (shared across agents and teammates)
- Real-time file watching and automatic sync
- Works seamlessly with Claude Code via `install-claude-code`

---

## Installation & Setup

### Step 1: Install Globally (One-time)

```bash
npm install -g @mixedbread/mgrep
```

Verify installation:
```bash
mgrep --version
```

### Step 2: Authenticate

**Option A: Browser Login (Recommended)**
```bash
mgrep login
```
Opens a browser to authenticate and grant permissions.

**Option B: API Key (For CI/CD/Headless)**
```bash
export MXBAI_API_KEY="your-api-key-here"
```
Get your API key from: https://www.mixedbread.ai/dashboard

### Step 3: Install Claude Code Integration

```bash
mgrep install-claude-code
```

This command:
- Verifies authentication (prompts login if needed)
- Adds mgrep support to Claude Code
- Enables semantic search in your Claude Code agent

---

## Project Setup

### Per-Project Indexing

For each project you want to search:

```bash
cd /Users/spectrasynq/SpectraSynq.LandingPage
mgrep watch
```

This:
1. Performs initial indexing of the repository
2. Respects `.gitignore` rules (excludes node_modules, build/, etc.)
3. Watches for file changes and syncs automatically
4. Stores index in cloud (accessible to Claude Code and teammates)

### For Multiple Projects

Set up each project sequentially:

```bash
# Project 1
cd /Users/spectrasynq/SpectraSynq.LandingPage && mgrep watch &

# Project 2
cd /Users/spectrasynq/Workspace_Management/Software/K1.Sliders && mgrep watch &

# Project 3
# ... add more as needed
```

Or create a background indexing script (see below).

---

## Usage Examples

### Natural Language Search

```bash
# Find authentication setup
mgrep "where do we set up auth?"

# Find LED physics logic
mgrep "how does the LED motion work?"

# Search for TypeScript types
mgrep "what types do we use for visual parameters?"

# Find error handling
mgrep "how are errors handled?"
```

### With Limits

```bash
# Limit to 10 results
mgrep -m 10 "authentication setup"

# Get detailed context
mgrep "LED physics" --verbose
```

### Integration with Claude Code

Once `mgrep install-claude-code` is run, Claude Code automatically:
- Uses mgrep for semantic searches in your agent workspace
- Reduces token usage by returning focused, relevant results
- Works across all indexed projects

---

## Global Setup Script

Create `~/.local/bin/mgrep-init-all.sh` for one-command setup:

```bash
#!/bin/bash

# Authenticate once
echo "Authenticating mgrep..."
mgrep login

# Install Claude Code integration
echo "Installing Claude Code integration..."
mgrep install-claude-code

# Index all projects
echo "Indexing projects..."

# SpectraSynq.LandingPage
echo "Indexing SpectraSynq.LandingPage..."
(cd /Users/spectrasynq/SpectraSynq.LandingPage && mgrep watch > /tmp/mgrep-spectrasynq.log 2>&1 &)

# K1.Sliders
echo "Indexing K1.Sliders..."
(cd /Users/spectrasynq/Workspace_Management/Software/K1.Sliders && mgrep watch > /tmp/mgrep-k1sliders.log 2>&1 &)

echo "✓ mgrep setup complete!"
echo "Indexing running in background. Check:"
echo "  tail -f /tmp/mgrep-spectrasynq.log"
echo "  tail -f /tmp/mgrep-k1sliders.log"
```

Run once:
```bash
bash ~/.local/bin/mgrep-init-all.sh
```

---

## Verify Installation

```bash
# Check mgrep version
mgrep --version

# Check authentication status
mgrep status

# Test search (should return results from current project)
mgrep "function"

# Check Claude Code integration
mgrep info claude-code
```

---

## Environment Variables

**For Persistent Setup:**

Add to `~/.bashrc` or `~/.zshrc`:

```bash
# mgrep Configuration
export MXBAI_API_KEY="your-key-here"  # Optional, for CI/CD
```

---

## Important Notes

### .gitignore Integration

mgrep respects your `.gitignore`:
- Automatically skips `node_modules/`, `build/`, `.git/`, etc.
- Skips prototypes/ (added to SpectraSynq.LandingPage .gitignore)
- Only indexes source code and documentation

### Cloud Storage

- Indexes are stored in Mixedbread's cloud
- Shared across agents and teammates
- No private data exposure (only indexed code)
- Similar to how GitHub Copilot indexes repos

### Performance

- Initial indexing: ~1-2 minutes for typical monorepos
- Ongoing: Background sync is near-instantaneous
- Search: <1 second for natural language queries

---

## Integration with Claude Code Workflow

### Example: Using mgrep with Claude Code

**Before (slow):**
```
User: "Where do we handle authentication?"
Claude: Reads 20+ files manually, ~2000 tokens
```

**After (mgrep):**
```
User: "Where do we handle authentication?"
Claude: Uses mgrep to find exact file, ~200 tokens
```

### In Practice with Claude Code

1. **User starts Claude Code in a project:**
   ```bash
   cd /Users/spectrasynq/SpectraSynq.LandingPage
   # Open Claude Code
   ```

2. **mgrep watch is already running** (from background indexing)

3. **Claude Code automatically uses mgrep** when searching for context

4. **Result:** Faster, cheaper, more accurate agent responses

---

## Troubleshooting

### "mgrep not found"
```bash
npm install -g @mixedbread/mgrep
# Ensure ~/.npm/bin is in your PATH
```

### "Not authenticated"
```bash
mgrep login
# or set MXBAI_API_KEY environment variable
```

### "Claude Code integration missing"
```bash
mgrep install-claude-code
```

### Check logs
```bash
tail -f /tmp/mgrep-*.log
```

---

## Next Steps

1. **Install globally:**
   ```bash
   npm install -g @mixedbread/mgrep
   ```

2. **Authenticate:**
   ```bash
   mgrep login
   mgrep install-claude-code
   ```

3. **Start indexing:**
   ```bash
   cd /Users/spectrasynq/SpectraSynq.LandingPage
   mgrep watch &
   ```

4. **Test:**
   ```bash
   mgrep "K1 physics"
   ```

5. **Use in Claude Code** - it's automatic from here on!

---

## Resources

- **mgrep GitHub:** https://github.com/mixedbread-ai/mgrep
- **Mixedbread Dashboard:** https://www.mixedbread.ai/dashboard
- **API Documentation:** https://docs.mixedbread.ai/
- **Claude Code Integration:** Auto-enabled via `mgrep install-claude-code`
