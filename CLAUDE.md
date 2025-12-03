# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Development (from root)
npm install           # Install all workspace dependencies
npm run dev           # Start Next.js dev server (localhost:3000)

# Production
npm run build         # Build the application
npm run start         # Start production server

# Quality
npm run lint          # ESLint with max-warnings=0 (all warnings are errors)

# Visual Regression Testing
npm run test:visual   # Playwright-based screenshot capture (requires dev server on port 3100)
```

## Project Structure

This is a monorepo using npm workspaces:

```
apps/web-main/               # Main Next.js 14 application (App Router)
├── app/
│   ├── engine/              # K1 Visual Synthesis Engine
│   │   ├── K1Engine.tsx     # Main engine with Leva debug controls
│   │   ├── presets.ts       # Visual presets (K1_HERO_PRESET)
│   │   ├── useK1Physics.ts  # Physics simulation hook
│   │   ├── timeline/        # Timeline controller & sequences
│   │   ├── shaders/         # GLSL shaders (edge-lit, common)
│   │   └── components/      # Compositor, VisualLayer, Debug
│   ├── k1/core/             # Advanced optics & physics
│   ├── api/payments/        # Payment processing (Stripe/Square)
│   └── page.tsx             # Landing page
├── components/              # Reusable React components
├── lib/                     # Utilities (site-config, payments)
└── theme/tokens.ts          # K1_THEME design tokens
docs/specs/                  # Feature specifications (required before coding)
prototypes/                  # Experimental/throwaway code
tools/visual-regression/     # Visual testing scripts
```

## Architecture

**Hybrid Reactive/Imperative Pattern:**
- Reactive layer: React + Zustand for UI state and parameter management
- Imperative layer: Direct WebGL/Three.js calls for 60-120Hz render loop
- Visual Layer System (VLS): Each visual element renders to its own FBO for Photoshop-like composition

**Key Technologies:** Next.js 14, React 18, Three.js, React Three Fiber, Zustand, Leva (debug GUI), Tailwind CSS

**Path Alias:** `@/*` maps to `apps/web-main/`

---

## ⚠️ CENTER ORIGIN MANDATE (CRITICAL - READ BEFORE TOUCHING VISUALIZATION CODE)

**THIS IS NON-NEGOTIABLE. ANY CODE THAT VIOLATES THIS MANDATE IS A REGRESSION.**

### What is Center Origin?

The K1 visualization system MUST always inject light at the CENTER of the LED strip and propagate it SYMMETRICALLY outward. This is the signature visual identity of the K1 product.

```
CORRECT (Center Origin):
[.......●...........●.......]  ← Symmetric injection at center ± offset
        ↑           ↑
     posLeft     posRight

WRONG (Edge/Random Origin):
[●...........................●]  ← Light at edges = BROKEN
[●............................]  ← Light at one side = BROKEN
```

### Mandatory Implementation Pattern

**In ALL physics/visualization code, light injection MUST use this pattern:**

```typescript
// CENTER ORIGIN ENFORCED: Symmetric injection from center
const center = Math.floor(LED_COUNT / 2);  // center = 80 for 160 LEDs
const displacement = Math.abs(amplitude);
const offset = Math.floor(displacement * (center * 0.9));
const posLeft = Math.max(0, center - offset);
const posRight = Math.min(LED_COUNT - 1, center + offset);

// Inject at BOTH symmetric positions from center
addColor(field, posLeft, r, g, b, intensity);
addColor(field, posRight, r, g, b, intensity);
```

### Files That MUST Respect Center Origin

| File | What to Check |
|------|---------------|
| `app/k1/core/physics/useK1Physics.ts` | Snapwave AND Existing mode injection |
| `app/engine/timeline/sequence.ts` | ALL segments must have `motionMode: 'Center Origin'` |
| `app/k1/core/optics/presets.ts` | ALL presets must have `motionMode: 'Center Origin'` |
| `app/engine/K1Engine.tsx` | Default motionMode in Leva controls |

### Regression Checklist (BEFORE MERGING ANY VISUALIZATION CODE)

- [ ] Does the code inject light at TWO symmetric positions (posLeft AND posRight)?
- [ ] Is `motionMode` hardcoded or defaulted to `'Center Origin'`?
- [ ] Does the timeline sequence NEVER change motionMode to anything other than 'Center Origin'?
- [ ] Visual validation: Does the rendered output show symmetric light columns?

### What Causes Center Origin Violations

| Anti-Pattern | Why It's Wrong |
|--------------|----------------|
| Single `addColor()` call | Only one point = no symmetry |
| `motionMode: 'Left Origin'` | Light flows from edge, not center |
| `motionMode: 'Right Origin'` | Light flows from edge, not center |
| `pos = center + amp * range` (single) | Oscillates to edges, not symmetric |

### Visual Reference

- **CORRECT**: `/Users/spectrasynq/SpectraSynq.LandingPage/vis_lab_physical_shader_test.png`
- **CORRECT**: Light emanates from center, spreads symmetrically outward
- **WRONG**: Light blobs at edges or corners

**IF YOU ARE UNSURE, ASK. DO NOT GUESS. DO NOT SHIP CODE THAT VIOLATES CENTER ORIGIN.**

---

## Development Workflow

**Specification-Driven Development:**
1. Write spec first in `docs/specs/SPEC_XXX_FEATURE_NAME.md` (copy from `docs/templates/FEATURE_SPEC.md`)
2. Implement in `apps/web-main/`; use `prototypes/` for experiments
3. Commit format: `type(scope): description [SPEC-ID]`
   - Example: `feat(visual-engine): implement layer composition [SPEC-001]`

**Pre-commit Hooks:** Husky + lint-staged auto-formats TypeScript and runs Prettier

## Code Conventions

- **Components:** PascalCase (`MyComponent.tsx`), functional with React hooks
- **Hooks:** camelCase (`useMyHook.ts`)
- **Formatting:** Prettier (single quotes, trailing commas, 100 char width)
- **Linting:** ESLint with TypeScript strict mode; run `npm run lint` before committing

## Key Configuration

**Environment Variables (.env):**
- `NEXT_PUBLIC_PRICE`, `NEXT_PUBLIC_UNITS_TOTAL`, `NEXT_PUBLIC_SHIP_DATE` - Product config
- `STRIPE_SECRET_KEY`, `SQUARE_ACCESS_TOKEN` - Payment secrets (server-only)

**Design Tokens (theme/tokens.ts):**
- Brand gold: `#FFB84D`
- Background: `#000000`
- Fonts: Space Grotesk (display), Inter (body), Manrope (tech)

---

## Intelligent Workflow Integration

This section documents the AI-powered capabilities available for development workflows.

### Mandatory Workflow: Skills Before Code

Before ANY implementation task, check if a relevant skill applies:

```
1. Check skills → 2. Use brainstorming skill → 3. Write plan → 4. Implement with TDD → 5. Review
```

### Task Agents (Subagent Types)

Use the Task tool with these specialized agents:

| Agent | When to Use |
|-------|-------------|
| `Explore` | Codebase exploration, finding files, understanding architecture |
| `Plan` | Creating implementation plans for complex features |
| `code-reviewer` | After completing major implementation steps |
| `systematic-debugger` | Bugs, errors, unexpected behavior |
| `pragmatic-coder` | Practical coding solutions, bug fixes |
| `ui-visual-validator` | Verify UI changes achieved intended goals |
| `deep-technical-analyst` | Forensic-level analysis, performance profiling |
| `feature-dev:code-architect` | Design feature architectures |
| `feature-dev:code-explorer` | Trace execution paths, map architecture |
| `superpowers:code-reviewer` | Review against plan and coding standards |

### Core Skills (Use via Skill Tool)

**Development Workflow Skills:**
| Skill | Trigger |
|-------|---------|
| `superpowers:brainstorming` | Before writing ANY code - refines ideas into designs |
| `superpowers:test-driven-development` | When implementing features - write test first |
| `superpowers:systematic-debugging` | Any bug, test failure, unexpected behavior |
| `superpowers:verification-before-completion` | Before claiming work is done |
| `superpowers:writing-plans` | When design is complete, need implementation tasks |
| `superpowers:executing-plans` | Execute plan in controlled batches |

**Code Quality Skills:**
| Skill | Trigger |
|-------|---------|
| `code-review-excellence` | Reviewing PRs, establishing review standards |
| `e2e-testing-patterns` | Implementing E2E tests with Playwright |
| `error-handling-patterns` | Implementing error handling, API design |
| `debugging-strategies` | Investigating bugs, performance issues |

**This Codebase - Specific Skills:**
| Skill | Trigger |
|-------|---------|
| `react-modernization` | Upgrading React patterns, hooks migration |
| `modern-javascript-patterns` | ES6+ patterns, async/await optimization |
| `monorepo-management` | Workspace configuration, build optimization |

### Slash Commands

**Feature Development:**
```bash
/feature-dev:feature-dev [description]  # Guided feature development
/superpowers:brainstorm                  # Interactive design refinement
/superpowers:write-plan                  # Create implementation plan
/superpowers:execute-plan                # Execute plan with checkpoints
```

**Code Review:**
```bash
/code-review:code-review                 # Review a pull request
```

**Automation:**
```bash
/sugar:sugar-analyze                     # Analyze codebase for potential work
/sugar:sugar-task                        # Create comprehensive task
/sugar:sugar-run                         # Start autonomous execution
```

**Hooks & Behavior Prevention:**
```bash
/hookify:hookify [behavior]              # Create hooks to prevent unwanted behaviors
/hookify:list                            # List configured rules
```

**Documentation & Validation (NEW):**
```bash
/validate-consistency                    # Check website/GitHub/docs consistency
```

**API & Integration (NEW):**
```bash
/create-webhook-handler                  # Generate secure webhook endpoints
/webhook                                 # Shortcut for webhook creation
```

**Fullstack Development (NEW - if building web tools):**
```bash
/component-generator [description]       # Generate React components (/cg)
/express-api-scaffold [description]      # Express.js API boilerplate (/eas)
/fastapi-scaffold [description]          # FastAPI boilerplate (/fas)
/prisma-schema-gen [description]         # Prisma database schema (/psg)
/auth-setup [type]                       # JWT/OAuth setup (/as)
/project-scaffold [description]          # Full project structure (/ps)
```

### MCP Tools Available

**Episodic Memory (NEW - HIGH PRIORITY):**
- `mcp__plugin_episodic-memory_episodic-memory__search` - Search past conversations semantically
- `mcp__plugin_episodic-memory_episodic-memory__read` - Read full conversation context
- Use BEFORE implementing familiar features to avoid reinventing solutions
- Perfect for K1 Engine: shader patterns, optics tuning, physics decisions

**Browser Automation:**
- `mcp__plugin_superpowers-chrome_chrome__use_browser` - Chrome DevTools Protocol access for visual testing

**Blender 3D (if needed for visualizations):**
- `mcp__blender__*` - Full Blender scene control, Polyhaven assets, Hyper3D generation

**IDE Integration:**
- `mcp__ide__getDiagnostics` - Get TypeScript/ESLint diagnostics from VS Code
- `mcp__ide__executeCode` - Execute code in Jupyter kernel

### Workflow Decision Tree

**Note:** This workflow is optimized for web application development with React/Next.js.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        NEW TASK RECEIVED                             │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────────────┐
                    │ Search Episodic Memory first    │
                    │ "Have we done this before?"     │
                    └─────────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  Is this a bug/error?   │
                    └─────────────────────────┘
                         │              │
                        YES            NO
                         │              │
                         ▼              ▼
              Use: systematic-   ┌─────────────────────────┐
              debugging skill    │  Is this a new feature? │
                                 └─────────────────────────┘
                                      │              │
                                     YES            NO
                                      │              │
                                      ▼              ▼
                      ┌──────────────────────┐   Simple fix:
                      │ 1. /superpowers:     │   Use pragmatic-
                      │    brainstorm        │   coder agent
                      │ 2. Write SPEC doc    │
                      │ 3. /superpowers:     │
                      │    write-plan        │
                      │ 4. Use TDD skill     │
                      │ 5. Code review       │
                      └──────────────────────┘
```

### Visual Testing Workflow

For K1 Engine visual changes:
1. Make changes to shaders/components
2. Run `npm run test:visual` (requires dev server on port 3100)
3. Use `ui-visual-validator` agent to verify changes
4. Use `mcp__plugin_superpowers-chrome_chrome__use_browser` for automated screenshot comparison

### New Plugin Capabilities

**Episodic Memory (v1.0.13) - HIGH PRIORITY:**
- Semantic search across all past Claude Code conversations
- Find shader patterns, optics decisions, physics tuning approaches
- Avoid reinventing solutions to recurring K1 Engine challenges
- **First step in workflow:** Search before implementing anything familiar

**Content Consistency Validator (v1.0.0) - DOCUMENTATION:**
- Validates consistency between website, GitHub, and local docs
- Use before major releases to ensure version numbers align
- Generates prioritized fix reports with line numbers
- Command: `/validate-consistency`

**Superpowers Lab (v0.1.0) - EXPERIMENTAL:**
- `using-tmux-for-interactive-commands` skill
- Automate vim, interactive git rebase, REPLs programmatically
- Could help with REPL-based shader/physics testing

**Fullstack Starter Pack (v1.0.0) - FUTURE USE:**
- 8 AI agents + 7 commands for fullstack development
- Generate React components, APIs, schemas, auth flows
- Use if building K1 admin dashboards or control panels
- Not needed for core K1 Engine work

**Webhook Handler Creator (v1.0.0) - INTEGRATION:**
- Generate secure webhook endpoints (HMAC-SHA256, idempotency)
- Use for payment processing (Stripe) or hardware event integrations
- Command: `/create-webhook-handler` or `/webhook`

### Previously Recommended (Now Implemented)

**✅ Implemented:**
1. **Custom K1 Engine Skill** - `.claude/skills/k1-engine-development.md`
2. **Visual Regression Skill** - `.claude/skills/visual-regression-testing.md`
3. **Spec-Driven Development Skill** - `.claude/skills/spec-driven-development.md`

**Configuration Status:**
1. ~~Enable `taskmaster-ai` MCP for advanced task management~~ (disabled in settings)
2. ✅ **Episodic Memory Indexed** - 3,400 conversations indexed and searchable
3. ⚠️ **Recommended:** Add pre-commit hook to enforce skill usage on complex changes

**To re-index after new conversations:**
```bash
node ~/.claude/plugins/cache/episodic-memory/cli/episodic-memory.js sync
```

---

## Local Skills & Commands

This repository includes custom skills and commands in `.claude/`:

### Repository-Specific Skills (`.claude/skills/`)

| Skill | When to Use |
|-------|-------------|
| `k1-engine-development` | Modifying K1Engine, shaders, physics, optics |
| `visual-regression-testing` | Verifying visual changes, updating baselines |
| `spec-driven-development` | Before implementing ANY new feature |

### Custom Slash Commands (`.claude/commands/`)

```bash
/k1-visual-test              # Run visual regression testing
/new-feature [description]   # Start spec-driven feature development
```

### Skill Priority Order

When starting work, check skills in this order:
1. **Local skills** (`.claude/skills/`) - Repository-specific patterns
2. **Superpowers skills** - Core workflow (TDD, debugging, planning)
3. **User skills** (`~/.claude/skills/`) - General development patterns
