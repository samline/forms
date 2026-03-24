# Agent Index

## Instrucción Para La IA

Este es el índice interno que la IA debe leer después de pasar por AGENTS.md en la raíz del repositorio.

La función de este archivo es actuar como índice maestro de los documentos internos en .local y orientar qué archivos revisar según el tipo de tarea.

## Regla Principal

Antes de comenzar cualquier tarea en este repositorio, la IA debe leer este archivo y usarlo para decidir qué otros documentos internos necesita revisar.

La memoria de sesión del chat no debe considerarse la fuente única de verdad para reglas, pendientes, lecciones o preferencias del proyecto. Si la IA guarda algo relevante allí, también debe llevarlo al documento persistente correspondiente dentro de .local.

## Nota Sobre AGENTS.md

AGENTS.md en la raíz funciona como bootstrap local para dirigir a la IA hacia este índice interno.

Ese archivo no debe versionarse ni subirse al repositorio. Debe tratarse como una instrucción local de arranque para la IA.

## Índice De Archivos Internos

### Siempre revisar según el contexto

1. package-replication-guide.md
   Usar cuando se vaya a replicar este scaffold para otro paquete o producto similar.

2. deploy-and-release-guide.md
   Usar cuando la tarea implique versionado, release, deploy, publicación npm, tags o GitHub Actions de publicación.

3. todo.md
   Usar para revisar tareas pendientes, mejoras futuras, bugs por corregir y trabajo que el usuario dejó explícitamente pendiente.

4. lessons.md
   Usar para revisar errores, correcciones, sugerencias y preferencias del usuario que la IA no debe olvidar ni repetir.

5. new-project.md
   Usar cuando el usuario pida iniciar un proyecto nuevo o definir el arranque de una nueva base de código.

## Orden Recomendado De Lectura

### Si la tarea es general

1. agent-index.md
2. todo.md
3. lessons.md

### Si la tarea es crear un paquete o scaffold nuevo

1. agent-index.md
2. package-replication-guide.md
3. new-project.md
4. todo.md
5. lessons.md

### Si la tarea es publicar o hacer release

1. agent-index.md
2. deploy-and-release-guide.md
3. todo.md
4. lessons.md

## Alcance Actual

Por ahora este archivo solo funciona como índice de entrada para la IA.

En el futuro puede ampliarse con más instrucciones operativas, prioridades, reglas de lectura o flujos especializados.
