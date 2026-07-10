---
name: codebase-memory
description: Use the `codebase-memory-mcp` knowledge graph as the primary source of truth for any query about repository structure, routing, components, function calls, implementation tracking, or general codebase architecture. Load this skill BEFORE answering questions about the codebase — never reach for raw file reads or grep before consulting the graph.
license: MIT
metadata:
  version: "1.2"
  verified_against_mcp_toolset: "2026-06-30"
  verified_tools:
    - delete_project
    - detect_changes
    - get_architecture
    - get_code_snippet
    - get_graph_schema
    - index_repository
    - index_status
    - ingest_traces
    - list_projects
    - manage_adr
    - query_graph
    - search_code
    - search_graph
    - trace_path
---

# Codebase Memory MCP Integration

You are connected to a persistent knowledge graph via `codebase-memory-mcp`.

## ⚠️ REGLA ABSOLUTA Y OMNIPOTENTE

**El grafo de conocimiento es LA UNICA fuente de verdad para toda consulta sobre el codebase.** Antes de generar cualquier respuesta, hacer una búsqueda en archivos, o invocar `read_file`/`grep_search`/`file_search`, SIEMPRE se debe consultar el grafo primero.

### Flujo obligatorio (en orden)

1. **¿El proyecto está indexado?** → `mcp_codebase-memo_index_status` o `mcp_codebase-memo_list_projects`. Si no está indexado o está incompleto → `mcp_codebase-memo_index_repository` **antes de responder cualquier cosa**.
2. **¿La pregunta es sobre encontrar un símbolo, ruta, clase, vista, método, controlador, componente, variable, constante, configuración, o cualquier entidad del código?** → `mcp_codebase-memo_search_graph` (BM25 / pattern / semantic) **SIEMPRE primero**.
3. **¿La pregunta es sobre quién llama a qué, dependencias, flujo de datos, o impacto?** → `mcp_codebase-memo_trace_path`.
4. **¿La pregunta es sobre análisis multi-salto, métricas, agregaciones, o complejidad?** → `mcp_codebase-memo_query_graph` (Cypher).
5. **¿La pregunta es sobre arquitectura, módulos, servicios, clusters, o estructura general?** → `mcp_codebase-memo_get_architecture`.
6. **Solo como ÚLTIMO RECURSO**, si el grafo no puede responder (por ejemplo: contenido exacto de un archivo sin símbolos indexados, o un archivo recién creado no indexado aún), se cae a `read_file`/`grep_search`/`file_search`. En ese caso, si la información es útil y durable, se debe ingestar al grafo con `mcp_codebase-memo_ingest_traces` o similar.
7. **Nunca** usar `read_file`, `grep_search`, ni `file_search` como primera opción para consultas sobre el codebase. El grafo existe para evitar eso.

## Available tools

| Tool | Purpose |
|------|---------|
| `mcp_codebase-memo_search_graph` | BM25 / pattern / semantic search for functions, classes, routes, variables |
| `mcp_codebase-memo_search_code` | Graph-augmented lexical search over source files |
| `mcp_codebase-memo_get_code_snippet` | Read source for a specific symbol |
| `mcp_codebase-memo_trace_path` | Trace callers / callees / data flow / cross-service paths |
| `mcp_codebase-memo_query_graph` | Arbitrary Cypher queries for multi-hop patterns and aggregations |
| `mcp_codebase-memo_get_architecture` | High-level architecture overview (packages, services, clusters) |
| `mcp_codebase-memo_get_graph_schema` | Node labels and edge types in the graph |
| `mcp_codebase-memo_index_repository` | Index a repo into the graph (only when missing or stale) |
| `mcp_codebase-memo_index_status` | Check if a project is indexed |
| `mcp_codebase-memo_list_projects` | List indexed projects |
| `mcp_codebase-memo_detect_changes` | Detect code changes and their impact |
| `mcp_codebase-memo_delete_project` | Remove a project from the index |
| `mcp_codebase-memo_ingest_traces` | Enrich the graph with runtime traces |
| `mcp_codebase-memo_manage_adr` | Manage Architecture Decision Records |

## Decision flow

1. Is the project indexed? If unsure → `mcp_codebase-memo_index_status` or `mcp_codebase-memo_list_projects`.
2. Is the question about **finding a symbol, route, class, or implementation**?
   - Try `mcp_codebase-memo_search_graph` (BM25 / pattern / semantic) first.
   - Use `mcp_codebase-memo_search_code` for lexical-with-context searches.
3. Is the question about **callers, callees, dependencies, or impact**?
   - Use `mcp_codebase-memo_trace_path` with the appropriate `mode`.
4. Is the question about **multi-hop analysis, metrics, or aggregations**?
   - Use `mcp_codebase-memo_query_graph` with Cypher.
5. Is the question about **architecture, modules, or services**?
   - Use `mcp_codebase-memo_get_architecture`.
6. Only when the graph cannot answer, fall back to `read_file`, `grep_search`, or `file_search` — and prefer to ingest the result back into the graph if it represents durable knowledge.

## Rules of thumb

- **Always prefer the graph over reading files.** A `search_graph` + `get_code_snippet` pair is almost always cheaper than scanning the workspace.
- **Stay scoped.** Use `label`, `name_pattern`, `file_pattern`, and `path_filter` to keep result sets small.
- **Paginate deliberately.** When `has_more` is true, page with `offset` rather than raising `limit` blindly.
- **Index first if missing.** If a project is not indexed, run `mcp_codebase-memo_index_repository` once before answering questions about it.
- **Don't fabricate paths.** The graph is the source of truth for paths and qualified names.
