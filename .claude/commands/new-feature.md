# New Feature Development

Start a new feature with proper spec-driven workflow.

## Arguments
- `$ARGUMENTS` - Description of the feature to implement

## Workflow

1. **Load Skill**
   Use the `spec-driven-development` skill to ensure proper workflow

2. **Check for Existing Spec**
   Search `docs/specs/` for any existing specification covering this feature

3. **Brainstorm (if new feature)**
   If no spec exists, use `/superpowers:brainstorm` to refine the idea

4. **Create Spec Document**
   Create spec in `docs/specs/SPEC_XXX_FEATURE_NAME.md`

5. **Write Implementation Plan**
   Use `/superpowers:write-plan` to create detailed implementation tasks

6. **Implement with TDD**
   Use `superpowers:test-driven-development` skill for implementation

7. **Visual Testing**
   If feature has visual components, run `/k1-visual-test`

8. **Code Review**
   Use `/code-review:code-review` or the `superpowers:code-reviewer` agent

## Feature: $ARGUMENTS

Let me start by checking if there's an existing spec for this feature and loading the appropriate skills.
