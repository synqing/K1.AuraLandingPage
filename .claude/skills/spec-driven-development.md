---
name: spec-driven-development
description: Enforce specification-driven development workflow for SpectraSynq. Use before implementing ANY new feature to ensure spec document exists first.
---

# Spec-Driven Development Skill

## MANDATORY: No Code Without a Spec

This repository follows **Specification-Driven Development (SDD)**. Before writing any feature code (larger than a bug fix), you MUST have a spec document.

## When to Use This Skill

Use this skill when:
- Starting a new feature implementation
- Adding significant functionality
- Making architectural changes
- Creating new components or systems

Do NOT need a spec for:
- Bug fixes with clear scope
- Typo corrections
- Minor refactoring
- Documentation updates

## Workflow

### Step 1: Check for Existing Spec

Before coding, search for existing spec:

```bash
# Search for related specs
ls docs/specs/
grep -r "keyword" docs/specs/
```

If spec exists, proceed to implementation. If not, continue to Step 2.

### Step 2: Create Spec Document

1. Copy template:
   ```bash
   cp docs/templates/FEATURE_SPEC.md docs/specs/SPEC_XXX_FEATURE_NAME.md
   ```

2. Fill in required sections:
   - **Summary**: One paragraph describing the feature
   - **Goals**: What success looks like
   - **Non-Goals**: What's explicitly out of scope
   - **Technical Design**: How it will be implemented
   - **Testing Strategy**: How it will be verified

### Step 3: Get Approval (Optional)

For significant changes, get team review of spec before coding.

### Step 4: Implement with Spec Reference

Reference the spec in commit messages:

```bash
git commit -m "feat(scope): description [SPEC-XXX]"
```

## Spec Template Structure

```markdown
# SPEC-XXX: Feature Name

**Version:** 1.0.0
**Status:** Draft | Approved | Implemented
**Author:** Name
**Date:** YYYY-MM-DD

## Summary
One paragraph describing what this feature does.

## Goals
- Specific, measurable outcomes
- What problems it solves

## Non-Goals
- What this feature explicitly does NOT do
- Scope boundaries

## Technical Design

### Architecture
How it fits into the existing system.

### Components
New components or modifications needed.

### Data Flow
How data moves through the system.

## Implementation Plan
1. Step-by-step tasks
2. Dependencies between steps
3. Estimated complexity

## Testing Strategy
- Unit tests
- Integration tests
- Visual regression tests

## Open Questions
- Unresolved decisions
- Items needing clarification
```

## Existing Specs Reference

| Spec ID | Name | Status |
|---------|------|--------|
| SPEC-001 | Visual Engine | Implemented |

## Commit Message Format

```
type(scope): description [SPEC-ID]

Types:
- feat: New feature
- fix: Bug fix
- refactor: Code change that neither fixes nor adds
- docs: Documentation only
- style: Formatting, missing semicolons, etc.
- test: Adding tests
- chore: Maintenance tasks

Example:
feat(visual-engine): implement layer composition [SPEC-001]
fix(physics): correct velocity calculation [SPEC-001]
```

## Checklist Before Implementation

- [ ] Searched for existing spec covering this work
- [ ] Created spec if none exists
- [ ] Spec includes all required sections
- [ ] Spec has been saved to `docs/specs/`
- [ ] Know the SPEC-ID for commit messages
- [ ] Understand the testing strategy from spec

## Common Mistakes

1. **Starting to code before writing spec** - Even "small" features grow
2. **Vague specs without technical design** - Leads to rework
3. **Skipping non-goals section** - Scope creep
4. **Not referencing spec in commits** - Loses traceability

## File Locations

| Path | Purpose |
|------|---------|
| `docs/templates/FEATURE_SPEC.md` | Spec template |
| `docs/specs/` | All spec documents |
| `docs/specs/SPEC_001_VISUAL_ENGINE.md` | Example spec |
| `docs/CONTRIBUTING.md` | Workflow documentation |
