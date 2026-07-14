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

### Documentación pública en inglés

- lección: la documentación pública del paquete debe escribirse en inglés.
- implicación: README y docs/ no deben mezclar español en futuras iteraciones.

### TypeScript strict + dynamic import + optional peer

- lección: declarar un peer opcional y hacer `await import('@scope/pkg')` exige un shim de tipos (`declare module '@scope/pkg'`) en `src/types/`, porque tsc falla con TS2307 cuando el peer no está instalado.
- implicación: cualquier peer opcional nuevo debe acompañarse de un shim `.d.ts` mínimo para que `tsc --noEmit` siga pasando sin la dependencia presente.

### Cursor tracking estilo cleave

- lección: el `oldValue` que recibe `getNextCursorPosition` debe ser el **raw input** que tipeó el usuario, no el formatted anterior. Usar el formatted anterior pierde información cuando se edita en medio (deletion adyacente a delimitador).
- implicación: en handlers que reescriben el valor del input, capturar `selectionStart` y `field.value` antes de la sobrescritura y pasar esos a la rutina de cursor.

### Test harness para optional peer con dynamic import

- lección: `vi.doMock` no intercepta dynamic imports de forma estable entre escenarios "instalado" y "no instalado" en jsdom.
- implicación: exponer `__setFormatterModuleForTests(module | null)` (junto con `__resetFormatterLoaderForTests`) en el módulo del loader, de modo que los tests inyectan el módulo directamente y la lógica de cacheo + warnOnce sigue ejecutándose real.

### Singleton closure + flag `warned`

- lección: usar un IIFE `(() => { let warned = false; return () => { if (warned) return; warned = true; console.error(...) } })()` congela el flag en module-load y los tests no pueden resetearlo entre escenarios.
- implicación: para mensajes one-shot que necesitan ser reseteables por tests, exponer una variable `let warned = false` a nivel módulo y un helper `__resetWarningsForTests` (o consolidar el reset dentro del helper principal del loader).

### Versiones del CDN en releases

- lección: cuando se cambia la versión publicada del paquete, también deben actualizarse las URLs versionadas del CDN en la documentación pública.
- implicación: antes de crear commit, tag o release, la IA debe revisar README y docs/browser.md para confirmar que las referencias a unpkg usan la misma versión que package.json.

### Side-effect-free vanilla + `globalThis`

- lección: el `package.json` declara `"sideEffects": false` para el entrypoint vanilla. Cualquier factory o helper exportado desde `src/index.ts` debe respetar ese contrato: nada de auto-instalar globales (`window.x = …`, `globalThis.x = …`), ni side-effects en module top-level.
- implicación: la factory `browser()` solo construye y devuelve un objeto; quien quiera exponer `window.Form` lo hace manualmente con `window.Form = { ...browser(), regex }`. El bundle IIFE (`src/browser/global.ts`) sí toca `globalThis.Forms` porque su contrato es explícitamente side-effect.

### Refactor IIFE para consumir una factory vanilla

- lección: cuando un bundle IIFE (`src/browser/global.ts`) y un entrypoint vanilla comparten la misma forma pública (`form` + `newForm` + `destroyForm` + `available`), conviene mover el cuerpo a una factory única y que ambos la consuman.
- implicación: `src/browser/factory.ts` es la única definición de `newForm`/`destroyForm`/`available` y de los tipos `FormsApi`, `NewFormInput`, `FormsAvailable`. `src/browser/global.ts` solo llama `browser()` y asigna el resultado a `globalThis.Forms`. Cualquier cambio futuro (e.g. logging) se aplica en un solo lugar.

### Factory vs singleton para `browser()`

- lección: el IIFE bundle es singleton por restricción (no hay module system). En vanilla ESM, una **factory** `browser()` que devuelve un objeto nuevo por llamada es preferible a un singleton module-level: permite registros paralelos, tests aislados, y elimina estado mutable compartido entre consumidores.
- implicación: el export `browser` desde `@samline/forms` es `() => FormsApi`, no `FormsApi` plano. Quien quiera comportamiento singleton hace `const Forms = browser()` una vez y reusa el resultado.

### Spread `{ ...browser(), regex }` mantiene referencia a `available`

- lección: el spread es shallow, así que `{ ...browser(), regex }` copia la referencia a `available`. Modificar `window.Form.available` desde fuera muta el mismo objeto que ve la factory original.
- implicación: en los tests, limpiar entre casos con un helper `cleanupRegistry(available)` que itera y llama `destroy()` por cada controlador y luego `delete` por cada key — más robusto que `vi.resetModules()` porque mantiene vivos los handlers si el caller lo necesita.

### Singleton ganó sobre factory para `browser` (decisión del usuario)

- lección: la primera implementación exportó `browser` como factory `() => FormsApi` para conseguir isolation por defecto. El usuario lo revirtió a singleton `FormsApi` (objeto module-level) porque su caso de uso real es un solo punto de entrada por página y quería `{ ...browser, regex }` sin ceremonia previa de `const Forms = browser()`.
- implicación: el archivo pasó de llamarse `src/browser/factory.ts` a `src/browser/registry.ts` para reflejar el singleton; el test pasó de `test/browser/factory.test.ts` a `test/browser/registry.test.ts`. Los tests resetean `browser.available` en `beforeEach`/`afterEach` para mantener isolation ahora que es estado de módulo. Cuando el usuario explicita su caso de uso al inicio, preguntar antes de elegir factory vs singleton — la respuesta cambia la forma del API.

### Parallel registries con singleton: no es spread, es factory explícita

- lección: con `browser` como singleton, `{ ...browser, available: {} }` **no** crea un registry paralelo — las funciones `newForm`/`destroyForm` capturan el `available` original en su closure, así que escribir a `authForms.available` redirige al mapa del singleton.
- implicación: documentar honestamente la limitación en `docs/getting-started.md` ("browser is designed for the common case of one registry per page") y apuntar a `form()` directo + map propio para registries paralelos. NO mostrar `{ ...browser, available: {} }` como ejemplo funcional — se rompe en silencio. Alternativa futura si la piden: exponer `createRegistry()` factory además del singleton.

### Starlight heading anchors para métodos con `(params)`

- situación: al agregar `#### browser.newForm({ id, options })` en `reference/api.md`, Starlight generó el anchor `id="browsernewform-id-options-"` (trailing hyphen porque `?` se convierte a `-`) pero el TOC auto-generado apunta a `href="#browsernewform-id-options"` (sin trailing). Resultado: TOC links rotos en la misma página.
- error o preferencia detectada: el slugifier de Starlight conserva `(`, `)`, `,`, `?` como guiones cuando aparecen al final del heading. `browser.destroyForm(id)` → `browserdestroyformid` (los parens se eliminan en vez de convertirse a `-`), `validateValues(values, schema)` → `validatevaluesvalues-schema` (cada `, ` se traga y queda sin separador).
- regla a mantener en adelante: en Starlight headings de método, usar la forma corta sin parámetros entre paréntesis. Por ejemplo, `#### browser.newForm` en vez de `#### browser.newForm({ id, options })`. Mantener la firma completa en el código, pero el heading lleva solo el nombre. Confirmar tras cada build con `grep -oE '<h[1-6][^>]*id="[^"]*"' dist/reference/api/index.html` que cada `href` del auto-TOC tenga su `id` correspondiente.

### Starlight internal links: prefijo `/forms/` siempre

- lección: los links Markdown/MDX en contenido de Starlight no son auto-prefijados con el `base` configurado (`/forms`). Hay que escribir el prefijo manualmente.
- implicación: al cross-referenciar entre páginas del paquete, usar `/forms/reference/typescript/#formsapi` (no `/reference/typescript/#formsapi`). Para verificar tras un build, `grep -rhoE 'href="/[a-z][^"]*"' dist/ | grep -vE 'href="/forms/' | grep -vE 'href="/_'` debe estar vacío (excepto por links externos a otros sitios).

### Starlight CDN version pins deben coincidir con package.json

- lección: el ejemplo de "Browser global (no bundler)" en `getting-started.mdx` tenía `unpkg.com/@samline/forms@2.0.0` mientras `package.json` ya estaba en `2.1.0`.
- implicación: tras bumpear `package.json`, revisar también `example/src/content/docs/getting-started.mdx` y `example/src/content/docs/reference/browser.md` para alinear los `@X.Y.Z` del CDN. Confirmar con `grep -rn 'unpkg.com/@samline/forms@' example/src/`.

### Singleton `browser` requiere docs en dos lugares

- lección: tras implementar el singleton, hay que reflejarlo tanto en `docs/` (markdown plano del repo) como en `example/src/content/docs/` (Starlight site).
- implicación: al agregar/renombrar exports, mantener ambos árboles sincronizados. Las páginas que típicamente cambian: `getting-started.mdx` (sección "Browser registry helpers"), `reference/browser.md` (cross-reference bundler), `reference/typescript.md` (import list + tipos), `reference/api.md` (Registry helpers section en TOC + descripciones).

### Todos los paquetes dentro de `Packages/` deben usar bun como package manager (decisión 2026-07-13)

- situación: el usuario decidió (2026-07-13) que **este proyecto y todos los demás proyectos dentro de la carpeta padre `Packages/`** deben usar **bun** como package manager.
- regla a mantener en adelante:
  1. **Lockfile canónico:** `bun.lock` (texto, git-friendly, default desde bun 1.2). **NO** commitear `bun.lockb` (binario legacy de bun ≤ 1.1), `package-lock.json` (npm), `yarn.lock` (yarn) ni `pnpm-lock.yaml` (pnpm).
  2. **Comando de install:** `bun install` (no `npm install`/`yarn`/`pnpm i`).
  3. **`.gitignore`:** ignorar `bun.lockb` (legacy binario) y `node_modules/`. **NO** ignorar `bun.lock` (texto) — ese SÍ se commitea. Tampoco ignorar `AGENTS.md` ni `.agents/`.
  4. **`.npmignore`:** excluir TODOS los lockfiles Y `AGENTS.md` Y `.agents/` para que el tarball publicado no incluya ninguno de estos.
  5. **Scripts:** pueden invocarse con `bun run X` o `npm run X` — ambos funcionan. Para ser explícito sobre la toolchain, usar `bun run`.
  6. **Publish:** `bun publish` o `npm publish` — ambos producen el mismo tarball. La elección es del usuario; el `prepublishOnly` se ejecuta igual.
  7. **Conversión limpia:** al convertir un paquete, borrar el lockfile viejo **del working tree y del commit de conversión** — no dejarlo como untracked.

### `AGENTS.md` y `.agents/` se versionan; `.local/` está deprecado (decisión 2026-07-13)

- situación: la convención anterior (todo en `.local/`, fuera de git, incluyendo `AGENTS.md`) fue reemplazada el 2026-07-13. La nueva convención es: `AGENTS.md` y `.agents/` se commitean (versionados) pero se excluyen del tarball npm. `.local/` ya no se usa.
- regla a mantener en adelante:
  1. `.local/` no debe existir en este paquete. Si vuelve a aparecer, hay que moverlo a `.agents/`.
  2. `AGENTS.md` es la puerta de entrada a las instrucciones para la IA; debe ser corto y enlazar a `.agents/agent-index.md`.
  3. `.agents/` contiene los documentos internos detallados (`agent-index.md`, `lessons.md`, `deploy-and-release-guide.md`, etc.). Todos versionados.
  4. `.gitignore` debe ignorar `node_modules/`, `bun.lockb`, `dist/`, etc. — pero **NO** `AGENTS.md` ni `.agents/`.
  5. `.npmignore` debe incluir `AGENTS.md` y `.agents/` para que no entren al tarball.

## Cómo Añadir Nuevas Lecciones

Usar bloques simples con:

- situación
- error o preferencia detectada
- regla a mantener en adelante

### Slugs de `index.md` en Starlight (template de docs)

- situación: al poblar el template Starlight con sidebar explícita en `site.config.mjs`, el build falla con `The slug "reference/index" specified in the Starlight sidebar config does not exist`.
- error o preferencia detectada: Starlight colapla `src/content/docs/reference/index.md` al slug `reference` (no `reference/index`). El archivo se convierte en la página índice del directorio `/reference/`.
- regla a mantener en adelante: en la sidebar explícita de Starlight, usar `{ slug: 'reference' }` para `reference/index.md`, no `{ slug: 'reference/index' }`. Para conocer el slug real de cualquier archivo, leer el manifest `node_modules/.astro/data-store.json` (los items que apuntan a `filePath: 16` muestran `id`/`slug` reales).

### Anchors de headings en Starlight (template de docs)

- situación: al enlazar desde otras páginas con `#autosubmit`, `#clearerrors`, `#setvalue`, etc., los enlaces no funcionan porque el anchor no existe en la página destino.
- error o preferencia detectada: Starlight genera anchors a partir del heading completo, conservando paréntesis, comas y otros caracteres no-alfanuméricos como guiones. `### autoSubmit(options?)` produce `#autosubmitoptions`, no `#autosubmit`. `### setValue(name, value)` produce `#setvaluename-value`.
- regla a mantener en adelante: tras poblar el template, extraer los anchors reales con `grep -oE '<h4[^>]*id="[^"]*"' dist/reference/api/index.html` y corregir las referencias cruzadas en todas las páginas. Considerar headings más cortos (por ejemplo `### autoSubmit` en vez de `### autoSubmit(options?)`) si los anchors cortos son preferibles.

### Links internos no auto-prefijan con `base` (template de docs)

- situación: tras poblar el template, los enlaces del sidebar funcionan correctamente (`href="/forms/reference/examples/"`), pero los enlaces dentro del contenido Markdown/MDX producen 404 (`href="/reference/examples/"`). En dev esto se ve como `http://localhost:4321/reference/examples/` (404) cuando la URL correcta es `http://localhost:4321/forms/reference/examples/`.
- error o preferencia detectada: ni Astro ni Starlight reescriben automáticamente los enlaces del contenido Markdown para prefijarlos con el `base` configurado. Solo los enlaces generados por Starlight (sidebar, prev/next, table of contents) respetan el `base`. El `link` del frontmatter `hero.actions` tampoco se prefija.
- regla a mantener en adelante: en el contenido Markdown/MDX y en el frontmatter `hero.actions.link`, escribir siempre las rutas internas con el prefijo explícito `base` (p.ej. `(/forms/reference/api/)` en vez de `(/reference/api/)`). Para verificar, hacer `grep -rhoE 'href="/[a-z][^"]*"' dist/ | grep -vE 'href="/forms/' | grep -vE 'href="/_'` — el resultado debe estar vacío. Alternativa futura: añadir un plugin rehype que prefije `base` a todos los enlaces internos automáticamente; mientras no exista, usar el prefijo explícito en todos los `.md`/`.mdx`.

### `/* @vite-ignore */` en dynamic import de peer opcional rompe el bundle de producción

- situación: `@samline/forms` 2.2.1 usaba `await import(/* @vite-ignore */ '@samline/formatter')` para cargar un peer opcional. En dev funcionaba (Vite lo intercepta server-side), pero en `astro build` → `astro preview` (Vercel) el `format()`/`formatAll()` no hacía nada. El `try/catch` del loader se tragaba el throw y los validadores (regex) seguían funcionando, así que parecía "solo falló el formato". El proyecto consumidor (dinkbit) perdió ~1.5h hasta encontrar la causa.
- error detectada: el comentario `/* @vite-ignore */` le dice a Rollup "no me toques este import", y Rollup lo obedece literalmente — deja el specifier `"@samline/formatter"` como string en el bundle de producción. El navegador no puede resolver bare specifiers, el `import()` lanza, y el catch del loader lo silencia.
- regla a mantener en adelante:
  1. **Nunca** usar `/* @vite-ignore */` sobre un dynamic import cuyo destino sea un peer dep real (no una URL externa). Es la combinación equivocada: quieres que el bundler del consumidor lo resuelva.
  2. Para peer opcional con dynamic import en un paquete que se construye con tsup/rollup, la receta correcta es **dos cosas a la vez**:
     - Quitar el `/* @vite-ignore */` del source.
     - Añadir el specifier a `external` en tsup (para builds ESM/CJS que serán consumidos por otros bundlers).
  3. Si además publicas un bundle IIFE/CDN (cargado con `<script>` puro, sin module system), NO lo marques como `external` en esa entry — el bundle IIFE no tiene a quién pedirle que resuelva el specifier, así que el formatter tiene que quedar **bundleado** dentro del IIFE. Esto exige que el peer esté en `devDependencies` del publicador para que tsup lo pueda resolver durante la build.
  4. Diferencia práctica entre ambos entries: ESM/CJS = 30KB (peer external, lo resuelve el bundler del consumidor); IIFE = 300KB+ (peer bundleado, self-contained). Es esperado y correcto.
  5. Regression test mínimo: leer el source de `formatter-loader.ts`, quitar comentarios literales, y asertar que el cuerpo de `loadFormatter` no contiene `@vite-ignore`. Un test en `test/core/formatter-loader.test.ts` cubre esto. Verificado el 2026-07-10 al pasar de 2.2.1 a 2.2.2.
  6. Antes de declarar "arreglado", confirmar que el consumer también arregla su workaround. dinkbit tenía un Vite plugin que strip-eaba el comment en build time — debe borrarse tras upgrade.

### El usuario hace `npm publish` manualmente en este repo (decisión 2026-07-10)

- situación: durante el release 2.2.2 de `@samline/forms`, después de empujar el commit y el tag a origin, el workflow `.github/workflows/publish.yml` se disparó automáticamente. El usuario detuvo eso: "cancela el cron y elimina el github action, porque yo haré publish a mano de mis paquetes".
- error/preferencia detectada: el modelo anterior (GitHub Actions + `NPM_TOKEN` + tag-driven publish) ya no aplica. El usuario prefiere correr `npm publish` localmente desde su propia terminal. La IA NO debe re-crear el workflow ni asumir publish automático.
- regla a mantener en adelante:
  1. No re-introducir `.github/workflows/publish*.yml` (o equivalente) en este repo. Si se llega a necesitar, confirmar explícitamente con el usuario.
  2. La IA hace commit + push del código y la versión; el usuario hace `npm publish` desde su terminal.
  3. El tag sigue siendo opcional y puramente documental (ya no dispara nada). Si se crea, va después del publish manual.
  4. El `prepublishOnly` del `package.json` (que encadena `clean → build → typecheck → test`) sigue siendo válido y es la red de seguridad del publish manual.
  5. La IA no debe correr `npm publish` por su cuenta. Si el usuario pide release, terminar con: "listo, ya puedes correr `npm publish` localmente".
