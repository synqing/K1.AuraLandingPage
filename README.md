# SpectraSynq Landing Page

**A Next.js application for the SpectraSynq / K1 Aura product.**

## 📂 Workspace Structure

This repository follows a monorepo-style organization to separate concerns between the main application, experimental prototypes, and documentation.

| Directory | Description |
| :--- | :--- |
| **[`apps/web-main`](./apps/web-main)** | The primary Next.js application (formerly K1.LandingPage.Aura). |
| **[`docs/`](./docs)** | Centralized documentation, including Specs, Architecture, and Analysis. |
| **[`prototypes/`](./prototypes)** | Experimental code, HTML mocks, shaders, and "throw-away" concepts. |
| **[`tools/`](./tools)** | Utility scripts (Python, etc.) for tasks like asset processing. |
| **[`assets/`](./assets)** | Raw design assets and media files. |

## 🚀 Getting Started

### Main Application
```bash
cd apps/web-main
npm install
npm run dev
```

### Development Workflow
We follow a **Specification-Driven Development (SDD)** workflow.
1.  **No code without a Spec.** Create a file in `docs/specs/` using the [template](./docs/templates/FEATURE_SPEC.md) before writing code.
2.  **Linting & Formatting.** All code must pass ESLint and Prettier checks.
3.  **Prototypes.** Use the `prototypes/` folder for experiments; do not pollute `apps/` with temporary code.

## 📚 Key Documentation
- [Visual Engine Specification](./docs/specs/SPEC_001_VISUAL_ENGINE.md)
- [Shiny Button Analysis](./docs/analysis/shiny-button/ANALYSIS_SUMMARY.md)
- [Architecture Diagram](./docs/architecture/ARCHITECTURE_DIAGRAM.txt)
