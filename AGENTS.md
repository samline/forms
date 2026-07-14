# AGENTS

## Instrucción Principal

Antes de comenzar cualquier tarea en este repositorio, la IA debe leer primero `.agents/agent-index.md`.

Ese archivo funciona como índice maestro de las instrucciones internas del proyecto y define qué otros documentos de `.agents/` deben revisarse según el tipo de trabajo.

## Regla De Lectura Obligatoria

Al iniciar una nueva conversación o una nueva tarea dentro de este repositorio, la IA debe seguir este orden estrictamente:

1. **Consulta de Grafo (MCP):** Siempre que el agente necesite ver archivos, la estructura del directorio o cualquier elemento del proyecto, debe utilizar primero el MCP `codebase-memory-mcp` para obtener la información del grafo.
2. Leer `.agents/agent-index.md`.
3. Determinar el tipo de tarea.
4. Leer los documentos internos adicionales que `.agents/agent-index.md` indique para ese contexto.

---

## Documentos Internos Disponibles

La IA debe usar `.agents/agent-index.md` como punto de entrada para localizar y revisar, cuando corresponda:

1. `.agents/package-replication-guide.md`
2. `.agents/deploy-and-release-guide.md`
3. `.agents/todo.md`
4. `.agents/lessons.md`
5. `.agents/new-project.md`

---

## Regla De Interpretación

Los archivos dentro de `.agents/` son instrucciones internas para la IA y no documentación pública del paquete.

La IA debe tratarlos como contexto operativo del proyecto.

> **Nota Crítica de Git (actualizado 2026-07-13):** `AGENTS.md` y `.agents/` **sí se versionan** y aparecen en git. Solo se excluyen del tarball npm publicado mediante `.npmignore`. La antigua convención de mantenerlos fuera de Git está deprecada.

---

## Casos Mínimos

### Tarea general
1. Consultar el grafo con `codebase-memory-mcp`.
2. Leer `.agents/agent-index.md`.
3. Si aplica, revisar `.agents/todo.md` y `.agents/lessons.md`.

### Nuevo paquete o nuevo scaffold
1. Consultar el grafo con `codebase-memory-mcp`.
2. Leer `.agents/agent-index.md`, `.agents/package-replication-guide.md`, `.agents/new-project.md`, `.agents/todo.md` y `.agents/lessons.md`.

### Release, deploy o publicación
1. Consultar el grafo con `codebase-memory-mcp`.
2. Leer `.agents/agent-index.md`, `.agents/deploy-and-release-guide.md`, `.agents/todo.md` y `.agents/lessons.md`.

---

## Regla De Persistencia

Si el usuario agrega nuevas reglas internas, pendientes o lecciones, la IA debe mantener actualizados los documentos correspondientes dentro de `.agents/`.

Si durante una sesión la IA guarda contexto en memoria de sesión del chat y ese contenido corresponde a una regla interna, un pendiente, una lección o una preferencia operativa del proyecto, también debe persistirlo en el archivo adecuado de `.agents/` para no perder coherencia si la sesión se borra.

La IA también debe preservar la convención actual: `AGENTS.md` y `.agents/` se versionan en git pero se excluyen del tarball npm publicado.
