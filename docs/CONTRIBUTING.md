# Contributing to SpectraSynq

## 🛠 Development Workflow

We follow a **Specification-Driven Development** process to ensure quality and clarity.

### 1. Spec First
Before writing code for a new feature (larger than a bug fix):
1.  Copy the template: `docs/templates/FEATURE_SPEC.md`.
2.  Create a new file: `docs/specs/SPEC_XXX_FEATURE_NAME.md`.
3.  Fill in the details and get approval.

### 2. Implementation
- Work in the `apps/web-main` directory for production code.
- Use `prototypes/` for experiments.
- Follow the Coding Standards (TypeScript, Tailwind, Functional Components).

### 3. Commit Guidelines
- Format: `type(scope): description [SPEC-ID]`
- Example: `feat(visual-engine): implement layer composition [SPEC-001]`

## 🎨 Coding Standards
- **Linting:** Run `npm run lint` before committing.
- **Formatting:** Use Prettier.
- **Components:** Use PascalCase (`MyComponent.tsx`).
- **Hooks:** Use camelCase (`useMyHook.ts`).

## 📂 Directory Structure
- **apps/web-main:** The production application.
- **docs:** The source of truth for requirements.
- **prototypes:** Sandbox for testing ideas.
