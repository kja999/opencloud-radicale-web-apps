# AGENTS.md - AI Coding Agent Guidelines

**This file governs all AI coding agents (Claude, Cursor, Opencode etc.) working on this project.**

## Initialization / New Project Setup (Run Once)

When starting a **new project** or when prompted with `"set up the project"` / `"initialize rules"`:

1. **Detect or Ask for Primary Language**
   - Confirm the main language/stack if not obvious (e.g., TypeScript/React, Python/FastAPI, etc.).
2. **Run Language-Specific Setup Commands**
   Generate and execute the appropriate setup block below:

   ### TypeScript / JavaScript (React, Node, etc.)
   ```bash
   npm create vite@latest . -- --template react-ts # or next, etc.
   npm install -D eslint prettier @typescript-eslint/eslint-plugin eslint-plugin-react-hooks eslint-plugin-react
   npm install -D husky lint-staged vitest @testing-library/react
   npx husky init
   # Add to package.json scripts: lint, lint:fix, typecheck, test
 
 
Python
uv init # or poetry, etc.
uv add --dev ruff pytest pytest-cov
# Create pyproject.toml with Ruff config
 
 
Other Languages (Java, Go, Rust, C#, etc.)

   Use best-in-class tools (e.g., gofmt + revive for Go, clippy for Rust) and ask for exact commands.

     Core Tooling Setup (Always Do This)
        Linter + Formatter: Configure and enable (ESLint + Prettier / Ruff + Black, etc.).
        Pre-commit Hooks: Set up Husky + lint-staged (or pre-commit framework for Python).
        Testing: Unit + Contract tests (Vitest/Jest + React Testing Library / pytest + Pact or schemathesis).
        Quality Gates: Integrate SonarQube/SonarCloud or GitHub CodeQL + coverage.
        Create .github/workflows/ci.yml with full quality gates.
        Confirm setup by running the full quality check command.

Universal Development Rules


You MUST adhere to the following on every change:

    Follow language-specific linter rules strictly. Never commit code that fails linting or type-checking.
    Keep components/functions small and focused:
        React/TS components: Aim for <400 lines (flag anything larger).
        Python modules: Keep cognitive complexity low.
    Write tests alongside code:
        Unit tests for logic.
        Contract tests for interfaces/props/APIs (Pact-style where applicable).
    Run local quality checks before considering a task complete:
        TypeScript: npm run typecheck && npm run lint
        Python: ruff check . && ruff format --check . && pytest
    Use Clean as You Code: New code must meet high standards, even if legacy code has issues.

🛡️ Quality Gates (Hard Requirements)

Before any commit or PR, verify:

    ✅ Linting + formatting passes (0 errors).
    ✅ All tests pass (including new contract tests).
    ✅ Type checking / static analysis passes.
    ✅ Test coverage on new/changed code per targets below:
        Coverage targets:
        Area	Recommended target
        Core business logic	80–95%
        API/service layer	70–85%
        UI/frontend	40–70%
        Glue code / trivial wrappers	Minimal
        End-to-end critical paths	Strong coverage regardless of %
    ✅ No critical security issues or high-complexity warnings.

🔄 Workflow

     Understand the task.
     Plan changes (small, incremental steps preferred).
     Generate code + tests.
     Run linter, type checker, and tests locally.
     Fix all issues iteratively until gates pass.
     Summarize changes and remaining work.

🏗️ Architecture & Anti-Patterns

    Avoid God components/files. Split early.
    Prefer composition over inheritance.
    Maintain clear module boundaries (enforce via imports where possible).
    Document public interfaces/contracts clearly.

💻 Common Commands

    Lint: npm run lint / ruff check
    Fix: npm run lint:fix / ruff format
    Test: npm test / pytest
    Full CI check: Gites is used as a repo, build applicable rules here.

Local PC:
    This PC is Fedora Immutable OS. For execution, use podman exec on the toolbox container.

    
🤖 Agent Self-Reminder

I am an AI coding agent. My goal is to produce maintainable, high-quality code that passes all automated gates without manual cleanup. When in doubt, run the tools and fix issues before proceeding.
