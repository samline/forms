# Lessons

## Instrucción Para La IA

Este archivo guarda lecciones operativas del proyecto para evitar repetir errores y para mantener presentes las recomendaciones del usuario durante futuras tareas.

La IA debe revisarlo antes de ejecutar trabajo importante y actualizarlo cuando el usuario marque un comportamiento como incorrecto, mejorable o deseable.

## Qué Debe Guardarse Aquí

1. errores de la IA que el usuario indique como tales
2. comportamientos que no deben repetirse
3. preferencias explícitas del usuario
4. recomendaciones prácticas para futuras sesiones
5. aclaraciones sobre cómo interpretar instrucciones del proyecto

## Regla De Uso

Solo deben registrarse lecciones confirmadas por el usuario o aprendidas con claridad durante el trabajo en este proyecto.

No deben agregarse opiniones vagas ni reglas inventadas.

Si la IA guarda en memoria de sesión una lección, preferencia o corrección operativa que deba sobrevivir a la sesión, también debe escribirla aquí para mantener la continuidad del proyecto.

## Lecciones Actuales

### Persistencia de contexto operativo

- lección: la memoria de sesión del chat puede perderse y no debe ser la única ubicación para información operativa importante.
- implicación: si una nota de sesión corresponde a un pendiente, lección, regla interna o preferencia persistente, la IA debe duplicarla en el archivo adecuado de .local.

### Documentos internos para la IA

- lección: los archivos dentro de .local son instrucciones internas para la IA, no documentación pública del paquete.
- implicación: la IA debe tratarlos como notas de operación y referencia antes de actuar.

### AGENTS.md local

- lección: AGENTS.md en la raíz debe funcionar como instrucción local para la IA, pero no debe subirse al repositorio.
- implicación: la IA debe mantener AGENTS.md fuera de Git y no asumir que es un archivo destinado a versionarse.

### Honestidad sobre el estado de implementación

- lección: no afirmar que un cambio quedó escrito si no fue persistido realmente en el workspace.
- implicación: la IA debe reportar con precisión lo que sí quedó aplicado y lo que sigue pendiente.

### Pendientes explícitos

- lección: las tareas futuras deben quedar en todo.md solo si el usuario dijo explícitamente que quedan pendientes.
- implicación: la IA no debe promover ideas implícitas a backlog sin confirmación.

## Cómo Añadir Nuevas Lecciones

Usar bloques simples con:

- situación
- error o preferencia detectada
- regla a mantener en adelante
