# Blueprint Interno Para Replicar Este Paquete En Otro Dominio

## Instrucción Para La IA

Este archivo está escrito para que la IA que trabaje dentro de este repositorio lo revise antes de proponer o construir un paquete nuevo basado en esta misma arquitectura.

Si en una conversación futura se pide crear otro paquete siguiendo este modelo, la IA debe revisar primero este documento, identificar qué partes del scaffold actual sí aplican al nuevo dominio y pedir la información faltante antes de generar código.

## Objetivo

Este documento resume la arquitectura completa de este paquete y la traduce a un blueprint reutilizable para construir un paquete independiente con la misma calidad de implementación, por ejemplo un paquete para parsear, convertir y formatear fechas.

La meta no es clonar el dominio de visibilidad, sino reutilizar su estructura de producto:

- core compartido
- entrypoints por entorno o framework
- build multi-entrypoint
- documentación separada por variante
- pruebas por capa
- publicación npm con controles previos

## Qué Debo Pedirte Antes De Crear El Nuevo Paquete

Antes de empezar la implementación, necesito estos datos:

1. Nombre del paquete npm.
2. Descripción corta del paquete.
3. Objetivo funcional exacto.
4. Código fuente inicial del paquete o una especificación funcional suficientemente precisa.
5. API pública deseada.
6. Dependencias runtime obligatorias.
7. Peer dependencies opcionales, si aplica.
8. Frameworks que deben estar soportados desde la primera versión.
9. Si debe existir una variante browser o CDN sin build step.
10. Versión mínima de Node.js.
11. Licencia.
12. URL de repositorio, homepage e issues, si ya existen.
13. Ejemplos reales de uso esperados.
14. Restricciones de compatibilidad o rendimiento.
15. Estrategia de publicación: público o privado, alcance npm, prerelease o release estable.
16. Preferencias de testing, lint, formateo y cobertura.

Sin esos datos, el scaffold puede quedar técnicamente correcto pero mal alineado con el producto real.

### Regla por defecto de compatibilidad Node

Si el usuario no define otra restricción, los paquetes replicados desde este blueprint deben mantenerse compatibles con Node 20 o superior, incluyendo Node 24 y versiones posteriores que sigan siendo razonables para el stack elegido.

La IA no debe subir el requisito mínimo de Node por encima de 20 ni usar APIs que fuercen esa subida sin una solicitud explícita.

## Regla De Uso Para La IA

Antes de iniciar un scaffold nuevo dentro de este repositorio o en uno similar, la IA debe:

1. Revisar este archivo completo.
2. Confirmar si el nuevo dominio realmente necesita variantes React, Vue, Svelte o browser.
3. Pedir el código fuente o la especificación funcional si todavía no existe suficiente detalle.
4. No asumir que todos los entrypoints del paquete actual deben replicarse.
5. Mantener el resultado alineado con el alcance real y no con una plantilla inflada.

## Resumen Del Paquete Actual

Este proyecto sigue una arquitectura multi-entrypoint con TypeScript y ESM:

- un core compartido en src/core
- una API vanilla reutilizable
- un bundle browser global para uso sin bundler
- wrappers idiomáticos para React, Vue y Svelte
- documentación específica por entorno en docs/
- pruebas separadas por capa en test/

### Capacidades del scaffold actual

1. Exporta varias entradas desde un solo paquete npm.
2. Publica solo dist/.
3. Genera tipos TypeScript para cada subpath.
4. Mantiene peer dependencies opcionales para frameworks.
5. Ejecuta build, typecheck y tests antes de publicar.

## Archivos Que Sirven Como Plantilla

### Metadatos y build

- package.json: nombre del paquete, exports, peer dependencies, scripts, files publicados.
- package.json: nombre del paquete, exports, peer dependencies, scripts, files publicados y engines alineado con compatibilidad Node 20 o superior si no se indicó otra cosa.
- tsup.config.ts: build ESM por subpath y bundle IIFE para browser.
- tsconfig.json: configuración estricta TypeScript con NodeNext.
- .gitignore: exclusiones locales y de build.

### Código fuente

- src/core/observe.ts: patrón de núcleo compartido desacoplado del framework.
- src/index.ts: entrypoint principal del paquete.
- src/vanilla/index.ts: wrapper base para consumo DOM o librería directa.
- src/browser/global.ts: exposición a globalThis para uso sin bundler.
- src/react/\*: adaptación idiomática a React.
- src/vue/\*: adaptación idiomática a Vue.
- src/svelte/\*: adaptación idiomática a Svelte.

### Documentación

- README.md: usar una estructura práctica y navegable, evitando secciones promocionales genéricas como "Why This Package" salvo que el usuario las pida.
- README.md: la tabla de contenidos por defecto debe seguir este orden cuando aplique: Installation, CDN / Browser, Entrypoints, Quick Start, API, Supported Locales, Documentation, License.
- README.md: incluir instalación con npm, pnpm, yarn y bun, y añadir CDN / Browser cuando exista una variante sin bundler.
- README.md: si el paquete no depende de locales, la sección Supported Locales debe indicarlo explícitamente en vez de inventar compatibilidad localizada.
- docs/vanilla.md: contrato base compartido.
- docs/browser.md: uso sin compilación.
- docs/react.md: uso idiomático en React.
- docs/vue.md: uso idiomático en Vue.
- docs/svelte.md: uso idiomático en Svelte.

### Testing

- test/helpers/intersection-observer.ts: helper centralizado para mocks del entorno.
- test/index.test.ts: cobertura del core y wrapper base.
- test/browser/global.test.ts: validación del bundle browser.
- test/react/\*: pruebas de hook y componente.
- test/vue/\*: pruebas de composable y componente.
- test/svelte/\*: pruebas de helper, stores y action.

## Arquitectura Reutilizable

La parte reusable no es IntersectionObserver en sí, sino la separación de responsabilidades.

### Capa 1: Core compartido

El core debe contener la lógica del dominio sin dependencias de framework.

Ejemplos:

- visibilidad: observeVisibility
- fechas: parseDate, formatDate, convertTimezone, compareDates
- moneda: parseMoney, formatMoney, normalizeCurrency

Reglas:

1. No depender de React, Vue ni Svelte.
2. Exponer tipos reutilizables.
3. Resolver el comportamiento principal del dominio.
4. Ser la base de todas las variantes posteriores.

### Capa 2: API vanilla o shared

Esta capa expone el core con la interfaz más simple posible.

Debe existir incluso si luego se agregan wrappers por framework, porque:

- define el contrato base
- simplifica pruebas unitarias
- facilita el uso en scripts y librerías
- evita duplicar lógica en wrappers

### Capa 3: Variantes por framework

Solo deben existir si el framework gana una API idiomática real.

Ejemplos:

- React: hooks y componentes
- Vue: composables y componentes
- Svelte: stores y actions

No hay que forzar wrappers si el dominio no lo necesita. Si el paquete nuevo es puramente funcional, puede quedarse en core más vanilla.

### Capa 4: Variante browser o CDN

Esta capa solo tiene sentido si el paquete debe funcionar en entornos sin bundler, como:

- Shopify
- WordPress
- plantillas HTML tradicionales
- scripts embebidos

Si el paquete nuevo va a vivir solo en entornos con build step, esta capa puede omitirse.

## Árbol Recomendado Para Un Nuevo Paquete

```text
package-name/
├── .github/
│   └── workflows/
│       └── publish.yml
├── LICENSE
├── README.md
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── docs/
│   ├── browser.md
│   ├── vanilla.md
│   ├── react.md
│   ├── svelte.md
│   └── vue.md
├── src/
│   ├── index.ts
│   ├── browser/
│   │   └── global.ts
│   ├── core/
│   │   └── domain-core.ts
│   ├── react/
│   │   ├── index.ts
│   │   ├── use-domain.ts
│   │   └── domain-component.tsx
│   ├── svelte/
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── use-domain.ts
│   │   └── domain-action.ts
│   ├── vanilla/
│   │   └── index.ts
│   └── vue/
│       ├── index.ts
│       ├── use-domain.ts
│       └── domain-component.ts
└── test/
    ├── index.test.ts
    ├── browser/
    │   └── global.test.ts
    ├── helpers/
    │   └── environment-helper.ts
    ├── react/
    ├── svelte/
    └── vue/
```

Si el paquete no necesita frameworks o browser, ese árbol debe reducirse, no mantenerse por costumbre.

## Entry Points Que Debes Decidir

Este paquete actual publica:

- paquete raíz
- /vanilla
- /react
- /vue
- /svelte
- bundle browser externo en dist/browser

Para un nuevo paquete, decide explícitamente cuáles de estos subpaths existen desde el día uno.

### Regla de decisión

1. Mantén el entrypoint raíz.
2. Mantén vanilla si el paquete tiene una API utilitaria base.
3. Añade React, Vue y Svelte solo si habrá integración idiomática, no solo reexportación vacía.
4. Añade browser solo si el caso real sin bundler existe.

## Build Y Publicación

### Patrón actual que conviene replicar

1. TypeScript estricto.
2. Build con tsup.
3. Salida ESM por subpath.
4. Tipos generados para cada export.
5. prepublishOnly con clean, build, typecheck y test.
6. files en package.json limitado a dist.
8. Workflow de GitHub Actions para publicar por tag cuando el paquete deba desplegarse en npm.
9. Compatibilidad de engines y decisiones de implementación que no rompan soporte para Node 20 o superior salvo instrucción explícita.

### Scripts mínimos recomendados

```json
{
  "clean": "rm -rf dist",
  "build": "tsup --config tsup.config.ts",
  "dev": "tsup --config tsup.config.ts --watch",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "prepublishOnly": "npm run clean && npm run build && npm run typecheck && npm test"
}
```

### Decisiones que debes fijar al crear el nuevo paquete

1. Nombre de los subpaths exportados.
2. Si habrá peerDependencies opcionales.
3. Si habrá bundle IIFE global para browser.
4. Si el target seguirá siendo es2020 o cambiará.
5. Si la variante root será equivalente a vanilla o a otro agregado.

## Patrón De Documentación A Replicar

### README principal

Debe contener:

1. Descripción corta del paquete.
2. Tabla de contenidos obligatoria para navegar las secciones principales.
3. Instalación mínima con npm, pnpm, yarn y bun.
4. Casos de uso reales.
5. Tabla de entrypoints.
6. Quick start del entrypoint principal.
7. Índice hacia la documentación específica.
8. Resumen de la API compartida.
9. Notas de compatibilidad.
10. Licencia.

### Reglas mínimas del README de paquete

El README principal debe funcionar como puerta de entrada del paquete, no como reemplazo completo de la documentación por variante.

Reglas mínimas:

1. La tabla de contenidos no es opcional. Debe existir siempre que el README tenga varias secciones de producto o API.
2. La sección de instalación debe mostrar como mínimo comandos para npm, pnpm, yarn y bun.
3. Si el paquete publica una variante browser sin bundler, el README debe documentar también una opción CDN pública o una estrategia de consumo remoto equivalente.
4. La parte de CDN debe explicar de forma explícita cómo usar el paquete cuando el proyecto no puede compilar npm modules, por ejemplo en Shopify, WordPress o plantillas HTML sin bundler.
5. La tabla de entrypoints debe basarse en exports reales del paquete y, cuando sea útil, indicar el nombre principal del hook, helper, store o global expuesto.
6. El quick start debe mostrar el camino más simple para usar el paquete sin obligar al lector a abrir la documentación específica.
7. El README principal debe enlazar a las guías de docs por entorno en lugar de duplicar toda la explicación allí.
8. Si el paquete depende de otra librería base, conviene reconocerla y enlazarla cuando eso aclare el contexto técnico.
9. El README debe seguir siendo compacto: suficiente para orientar, instalar y arrancar, sin inflarse con casos secundarios.

### Regla condicional para CDN y browser build

Si existe browser build publicable, la documentación debe incluir:

1. una URL de ejemplo usable desde CDN o servicio equivalente
2. una recomendación de fijar versión en producción
3. el nombre real del objeto global o módulo expuesto
4. una nota breve de cuándo usar esa variante en lugar del paquete instalado por gestor
5. un ejemplo simple de uso directo en la página para proyectos sin bundler
6. lenguaje explícito para casos reales como Shopify, WordPress o plantillas sin compilación

### Regla de sincronización de versión para referencias CDN

Antes de crear un commit de release o empujar un tag nuevo, la IA debe revisar README y docs que contengan URLs CDN versionadas del paquete.

Reglas:

1. Si el tag cambia de versión, también deben cambiar las referencias CDN versionadas en la documentación antes del commit.
2. La documentación no debe quedarse apuntando a una versión anterior si el release que se va a publicar usa otra versión.
3. La revisión debe incluir como mínimo el README principal y cualquier guía browser o CDN en docs/.
4. Ejemplo: si el README usa `@samline/date@2.1.1` en CDN y se va a publicar `v2.2.2`, primero hay que actualizar esas referencias a `2.2.2` y después crear el commit y el tag.
5. Si todavía no existe una URL CDN estable para documentar, no debe inventarse; primero debe definirse la estrategia real de publicación.
6. Si el objetivo es soportar proyectos sin bundler y sin `type="module"`, el paquete debe generar también un bundle browser clásico compatible con `<script src="..."></script>` y la documentación debe usar ese archivo.

### Documentación por variante

Cada guía de docs/ debe seguir una estructura consistente:

1. Cuándo usar esa variante.
2. Cómo importar.
3. Ejemplo mínimo funcional.
4. API o contrato de retorno.
5. Opciones disponibles.
6. Ejemplos adicionales.
7. Enlace a la API compartida si aplica.

## Patrón De Testing A Replicar

### Nivel mínimo obligatorio

1. Tests del core compartido.
2. Tests del wrapper base o vanilla.
3. Tests del bundle browser si existe.
4. Tests por framework para la integración idiomática.
5. Helper compartido para mocks del entorno cuando el dominio lo requiera.

### Qué debe validar cada capa

#### Core

- comportamiento base
- opciones principales
- edge cases
- errores previsibles
- cleanup o teardown si existe

#### Vanilla

- contrato público
- parámetros
- retorno
- comportamiento observable para el consumidor

#### Browser

- exposición global correcta
- nombres globales esperados
- compatibilidad del bundle en entorno sin importaciones

#### Frameworks

- React: hooks, estado, refs, cleanup, componentes si existen
- Vue: composables, refs, lifecycle, componentes si existen
- Svelte: stores, actions, cleanup y actualizaciones

## Mapeo Del Dominio Actual A Un Paquete De Fechas

### Equivalencia conceptual

| Este paquete         | Paquete de fechas equivalente                         |
| -------------------- | ----------------------------------------------------- |
| core de visibilidad  | core de parsing, conversión y formateo                |
| wrapper vanilla      | funciones utilitarias directas                        |
| React hook           | hook para estado derivado o parsing reactivo          |
| Vue composable       | composable para fechas reactivas                      |
| Svelte helper/action | stores o helper reactivo para fechas                  |
| browser global       | funciones globales para usar sin bundler              |
| docs por framework   | guías de integración por entorno                      |
| tests de observer    | tests de parsing, zona horaria, formatos y edge cases |

### Ejemplo de estructura para fechas

#### Core

- parseDate
- formatDate
- convertDateTimezone
- isValidDateInput
- compareDates

#### Vanilla

- exportación directa de funciones
- helpers utilitarios de alto nivel

#### React

- useParsedDate
- useFormattedDate
- componente opcional si el caso lo justifica

#### Vue

- useParsedDate
- useFormattedDate
- componente opcional si el caso lo justifica

#### Svelte

- helper o stores derivados
- action solo si existe un caso real basado en DOM

#### Browser

- window.DateToolkit o nombre equivalente

## Lo Que Siempre Se Replica

1. Separación entre core y adaptadores.
2. Build reproducible con TypeScript estricto.
3. Exports claros por subpath.
4. Tipos generados.
5. README principal más docs específicas.
6. Tests por capa.
7. Release protegido por prepublishOnly.

## Lo Que Depende Del Dominio

1. La necesidad de wrappers por framework.
2. La necesidad del bundle browser.
3. La forma de la API pública.
4. Las dependencias runtime.
5. Los edge cases críticos.
6. Los ejemplos de documentación.
7. Los mocks y helpers de testing.

## Secuencia De Implementación Recomendada

1. Definir nombre, objetivo y API pública.
2. Definir qué entrypoints existirán realmente.
3. Crear package.json, tsconfig.json y tsup.config.ts.
4. Implementar el core compartido.
5. Implementar el wrapper vanilla o root.
6. Implementar wrappers de framework solo si agregan valor real.
7. Implementar bundle browser si aplica.
8. Escribir tests del core y luego de cada variante.
9. Redactar README y docs específicas.
10. Verificar build, typecheck y test.
11. Preparar publicación.
12. Crear el workflow correspondiente de release o publish en .github/workflows según la estrategia elegida.

## Checklist Final Antes De Considerar El Paquete Listo

1. El core resuelve el dominio sin dependencias de framework.
2. Cada subpath exportado tiene implementación, tipos y tests.
3. El README refleja exactamente los entrypoints reales.
4. No hay docs para variantes que no existen.
5. Los peer dependencies son opcionales solo cuando corresponde.
6. El bundle browser existe solo si fue realmente solicitado.
7. prepublishOnly pasa sin errores.
8. package.json publica solo lo necesario.
9. Existe el workflow de publicación correspondiente si el paquete debe liberarse por tags o CI.

## Instrucción Operativa Para Futuras Conversaciones

Si voy a crear un paquete nuevo usando este blueprint, primero debo pedirte:

- el código fuente o la especificación funcional del paquete
- el nombre del paquete
- las dependencias a utilizar
- los frameworks o entornos a soportar
- si quieres variante browser o CDN
- el alcance inicial exacto

Solo después de eso conviene generar el scaffold definitivo.
