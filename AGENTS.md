# AGENTS

## Main Instruction

Before starting any task in this repository, the AI must first read `.agents/agent-index.md`.

That file acts as the master index of the project's internal instructions and defines which other documents in `.agents/` should be reviewed based on the type of work.

## Mandatory Reading Rule

When starting a new conversation or a new task inside this repository, the AI must follow this order strictly:

1. **Graph Query (MCP):** Whenever the agent needs to see files, the directory structure, or any element of the project, it must first use the `codebase-memory-mcp` MCP to get the information from the graph.
2. Read `.agents/agent-index.md`.
3. Determine the type of task.
4. Read the additional internal documents that `.agents/agent-index.md` points to for that context.

---

## Available Internal Documents

The AI must use `.agents/agent-index.md` as the entry point to locate and review, when applicable:

1. `.agents/package-replication-guide.md`
2. `.agents/deploy-and-release-guide.md`
3. `.agents/todo.md`
4. `.agents/lessons.md`
5. `.agents/new-project.md`

---

## Interpretation Rule

The files inside `.agents/` are internal instructions for the AI, not public documentation of the package.

The AI must treat them as operational context of the project.

> **Critical Git Note (updated 2026-07-13):** `AGENTS.md` and `.agents/` **are versioned** and appear in git. They are only excluded from the published npm tarball via `.npmignore`. The old convention of keeping them out of Git is deprecated.

---

## Minimum Cases

### General task
1. Query the graph with `codebase-memory-mcp`.
2. Read `.agents/agent-index.md`.
3. If applicable, review `.agents/todo.md` and `.agents/lessons.md`.

### New package or new scaffold
1. Query the graph with `codebase-memory-mcp`.
2. Read `.agents/agent-index.md`, `.agents/package-replication-guide.md`, `.agents/new-project.md`, `.agents/todo.md` and `.agents/lessons.md`.

### Release, deploy, or publish
1. Query the graph with `codebase-memory-mcp`.
2. Read `.agents/agent-index.md`, `.agents/deploy-and-release-guide.md`, `.agents/todo.md` and `.agents/lessons.md`.

---

## Persistence Rule

If the user adds new internal rules, todos, or lessons, the AI must keep the corresponding documents inside `.agents/` updated.

If during a session the AI saves context in the chat session memory and that content corresponds to an internal rule, a todo, a lesson, or an operational preference of the project, it must also persist it in the appropriate file in `.agents/` to keep coherence if the session is cleared.

The AI must also preserve the current convention: `AGENTS.md` and `.agents/` are versioned in git but excluded from the published npm tarball.

---

## Documentation must be in sync before pushing

Every code change that touches a public method, type, option, or peer-aware behaviour **must** come with up-to-date documentation before it is pushed to the repository. Out-of-date docs are a release-blocker, not a follow-up.

The package ships two documentation surfaces that must agree with the source code at all times:

1. **`docs/`** — the user-facing reference bundled with the npm tarball (`docs/api/`, `docs/options.md`, `docs/typescript.md`, `docs/recipes.md`, `docs/css-styling.md`, etc.).
2. **`example/src/content/docs/reference/`** — the Starlight site published to `https://samline.github.io/forms`.

Both surfaces must reflect the current public API in `src/index.ts` and `src/core/types.ts`. When a release adds, removes, or renames a method, type, option, or peer-dependent feature, the agent MUST update both surfaces in the same change. Do not split the docs work into a follow-up commit.

The full checklist (what to grep, what to open, what to look for) lives in `.agents/documentation.md` — read it before any release task.
