# Guía Interna De Release, Deploy Y Tags Para La IA

## Instrucción Para La IA

Este archivo existe para que la IA pueda revisar el proceso correcto de versionado, release, publicación y tags antes de intentar desplegar una nueva versión del paquete.

Cuando una conversación pida publicar, desplegar, versionar o empujar un tag, la IA debe leer este documento y validar que el flujo propuesto coincide con el estado real del repositorio.

## Objetivo

Definir un playbook operativo para:

1. revisar si los cambios corresponden a major, minor o patch
2. actualizar la versión del paquete con criterio semver
3. preparar el release
4. empujar el commit y el tag correctos
5. disparar el workflow de publicación del repositorio

## Recomendación Previa Obligatoria

Antes de automatizar releases desde GitHub, se recomienda tener ya configurado en GitHub el secreto NPM_TOKEN.

Este repositorio ya tiene un workflow de publicación que depende de ese secreto. Si NPM_TOKEN no existe o no tiene permisos válidos, el tag se puede empujar correctamente pero la publicación en npm fallará.

## Flujo Real Del Repositorio

El workflow actual publica en npm cuando se hace push de un tag con formato v\*.

Resumen del flujo real:

1. se activa con push de tags tipo v1.2.3
2. valida que el tag coincida exactamente con la versión en package.json
3. ejecuta npm ci
4. ejecuta build
5. ejecuta typecheck
6. ejecuta tests
7. comprueba si esa versión ya existe en npm
8. publica con npm publish --provenance usando NPM_TOKEN solo si la versión todavía no existe

## Regla Inicial Antes De Versionar

La IA no debe subir una nueva versión sin revisar primero el tipo de cambio.

Primero debe clasificar los cambios en una de estas categorías:

### Patch

Usar patch cuando hay:

- correcciones de bugs sin romper compatibilidad
- mejoras internas sin cambios en la API pública
- documentación o ajustes pequeños si también van acompañados de una corrección publicada
- fixes de build o testing que no cambian el contrato público

Ejemplo:

- 0.5.0 -> 0.5.1

### Minor

Usar minor cuando hay:

- nuevas funciones compatibles hacia atrás
- nuevos exports o nuevos helpers sin romper la API actual
- soporte adicional para otro entorno o framework sin cambiar contratos existentes
- mejoras relevantes del producto manteniendo compatibilidad

Ejemplo:

- 0.5.0 -> 0.6.0

### Major

Usar major cuando hay:

- cambios incompatibles con la API actual
- eliminación o renombre de funciones públicas
- cambios de comportamiento que puedan romper consumidores existentes
- cambios de runtime mínimo o de estrategia de imports que obliguen migración

Ejemplo:

- 0.5.0 -> 1.0.0

## Checklist De Evaluación Semver

Antes de decidir la nueva versión, la IA debe responder:

1. ¿La API pública cambió de forma incompatible?
2. ¿Se eliminó o renombró algún export?
3. ¿Se añadió funcionalidad nueva sin romper compatibilidad?
4. ¿Solo se corrigieron bugs o detalles internos?
5. ¿Cambió la versión mínima de Node o alguna dependencia crítica?
6. ¿Cambió el comportamiento por defecto de una función pública?
7. ¿La documentación describe una nueva capacidad o una ruptura?

Regla práctica:

1. Si hay ruptura, major.
2. Si no hay ruptura pero sí nueva capacidad, minor.
3. Si solo hay corrección o ajuste compatible, patch.

## Secuencia Recomendada De Release

### Paso 1: revisar el estado del repositorio

La IA debe comprobar:

1. rama actual
2. cambios sin commit
3. si el branch está alineado con origin
4. si hay tags locales o remotos pendientes de considerar

### Paso 2: revisar el alcance del cambio

La IA debe leer el diff o el resumen de cambios y clasificar el release como major, minor o patch.

No debe saltar directamente a npm version sin esa revisión.

### Paso 3: validar que el repositorio está listo

Antes de versionar, comprobar:

1. npm run build
2. npm run typecheck
3. npm test

Si alguno falla, no se debe crear versión ni tag.

### Paso 4: actualizar la versión

Usar una de estas rutas según el caso:

```bash
npm version patch
npm version minor
npm version major
```

Si se requiere controlar el mensaje de commit o separar pasos, la IA puede actualizar package.json manualmente y crear el tag después, pero el camino simple recomendado es usar npm version.

### Paso 5: verificar la versión resultante

Después de cambiar la versión, confirmar:

1. package.json actualizado
2. commit de versionado creado, si aplica
3. tag local creado con formato vX.Y.Z

### Paso 6: empujar commit y tag

Flujo recomendado:

```bash
git push origin main
git push origin vX.Y.Z
```

También puede usarse:

```bash
git push origin main --follow-tags
```

si el tag ya quedó asociado al commit local correcto.

### Paso 7: verificar publicación

Una vez empujado el tag, la IA debe confirmar:

1. que GitHub Actions se disparó
2. que el workflow validó el tag contra package.json
3. que build, typecheck y tests pasaron
4. que npm publish terminó sin error

## Relación Entre Tag Y package.json

Este repositorio tiene una validación explícita: el tag debe coincidir exactamente con la versión en package.json.

Ejemplo válido:

- package.json version: 0.5.1
- tag: v0.5.1

Ejemplos inválidos:

- package.json version: 0.5.1 y tag: v0.5.2
- package.json version: 0.5.1 y tag: 0.5.1

Si no coinciden, el workflow falla antes de publicar.

## Casos En Los Que No Debe Hacerse Release

La IA no debe crear versión nueva si ocurre alguno de estos casos:

1. solo hay cambios locales sin commit y no se pidió release real
2. el tipo de cambio todavía no está claro
3. build, typecheck o tests fallan
4. package.json no está alineado con el release propuesto
5. no existe NPM_TOKEN válido en GitHub y el objetivo es publicar automáticamente
6. el repositorio local no está en el commit correcto para etiquetar

## Comportamiento Cuando La Versión Ya Existe

Si la versión del tag ya fue publicada manualmente en npm antes de que corra GitHub Actions, el workflow no debe fallar por intentar republicarla.

Debe:

1. validar igualmente que tag y package.json coincidan
2. ejecutar npm ci, build, typecheck y tests
3. detectar que la versión ya existe en npm
4. omitir el paso de npm publish sin marcar error

Esto evita falsos negativos en releases donde la publicación manual y el tag ocurrieron en momentos distintos.

## Recomendación Para Controlar Mejor El Historial

Antes de cada release, la IA debería revisar si los cambios del periodo ameritan major, minor o patch para mantener un historial semántico confiable.

No conviene tratar todas las publicaciones como patch por costumbre. Eso degrada el valor del versionado y complica la expectativa del consumidor.

## Comandos De Referencia

### Revisar estado

```bash
git status --short --branch
git log --oneline --decorate -5
git tag --sort=-version:refname | head
```

### Validar proyecto antes de release

```bash
npm run build
npm run typecheck
npm test
```

### Versionar y publicar por tag

```bash
npm version patch
git push origin main
git push origin vX.Y.Z
```

Reemplazar patch por minor o major cuando corresponda.

## Regla Operativa Final Para La IA

Si una conversación futura pide publicar una nueva versión, la IA debe:

1. revisar este documento
2. clasificar el release como major, minor o patch
3. verificar build, typecheck y tests
4. confirmar que package.json y el tag coinciden
5. empujar commit y tag
6. asumir que la publicación depende del workflow y del secreto NPM_TOKEN en GitHub

No debe tratar release, tag y deploy como un solo paso ciego.
