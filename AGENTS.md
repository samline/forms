# AGENTS

## Instrucción Principal

Antes de comenzar cualquier tarea en este repositorio, la IA debe leer primero .local/agent-index.md.

Ese archivo funciona como índice maestro de las instrucciones internas del proyecto y define qué otros documentos de .local deben revisarse según el tipo de trabajo.

## Regla De Lectura Obligatoria

Al iniciar una nueva conversación o una nueva tarea dentro de este repositorio, la IA debe seguir este orden:

1. Leer .local/agent-index.md.
2. Determinar el tipo de tarea.
3. Leer los documentos internos adicionales que .local/agent-index.md indique para ese contexto.

## Documentos Internos Disponibles

La IA debe usar .local/agent-index.md como punto de entrada para localizar y revisar, cuando corresponda:

1. .local/package-replication-guide.md
2. .local/deploy-and-release-guide.md
3. .local/todo.md
4. .local/lessons.md
5. .local/new-project.md

## Regla De Interpretación

Los archivos dentro de .local son instrucciones internas para la IA y no documentación pública del paquete.

La IA debe tratarlos como contexto operativo del proyecto.

Además, tanto .local como AGENTS.md deben permanecer fuera de Git y estar incluidos en .gitignore.

## Casos Mínimos

### Tarea general

Leer .local/agent-index.md y, si aplica, revisar .local/todo.md y .local/lessons.md.

### Nuevo paquete o nuevo scaffold

Leer .local/agent-index.md, .local/package-replication-guide.md, .local/new-project.md, .local/todo.md y .local/lessons.md.

### Release, deploy o publicación

Leer .local/agent-index.md, .local/deploy-and-release-guide.md, .local/todo.md y .local/lessons.md.

## Regla De Persistencia

Si el usuario agrega nuevas reglas internas, pendientes o lecciones, la IA debe mantener actualizados los documentos correspondientes dentro de .local.

Si durante una sesión la IA guarda contexto en memoria de sesión del chat y ese contenido corresponde a una regla interna, un pendiente, una lección o una preferencia operativa del proyecto, también debe persistirlo en el archivo adecuado de .local para no perder coherencia si la sesión se borra.

La IA también debe preservar la regla de que .local y AGENTS.md no se versionan.
