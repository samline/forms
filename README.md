# @samline/forms

Controlador de formularios para HTML nativo, React, Vue, Svelte y uso directo en browser.

## Contents

- [Installation](#installation)
- [CDN / Browser](#browser)
- [Entrypoints](#entrypoints)
- [Quick Start](#quick-start)
- [API](#api)
- [Documentation](#documentation)
- [License](#license)

## Installation

```bash
npm install @samline/forms
```

```bash
pnpm add @samline/forms
```

```bash
yarn add @samline/forms
```

```bash
bun add @samline/forms
```

## Entrypoints

| Entrypoint | Uso |
| --- | --- |
| `@samline/forms` | API vanilla principal |
| `@samline/forms/core` | Tipos, serialización y validación |
| `@samline/forms/vanilla` | Alias explícito de la API DOM |
| `@samline/forms/react` | Hook para React |
| `@samline/forms/vue` | Composable para Vue |
| `@samline/forms/svelte` | Store y action para Svelte |
| `@samline/forms/browser` | Bundle global para script tag |

## Quick Start

```ts
import { form } from '@samline/forms'

const contactForm = form('contact-form', {
  validators: {
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    }
  }
})

contactForm.onSubmit((element, data, formData, state) => {
  console.log(element, data, formData, state)
})
```

## API

- `form(target, options)` crea un controlador para un `form` real o un id.
- `watch` y `observe` reaccionan a cambios por campo.
- `validate` y `revalidate` ejecutan reglas básicas compartidas.
- `setErrors` y `clearErrors` mantienen el estado visual y lógico.
- `getData` devuelve objeto serializado y `FormData` listo para `fetch`.

## Documentation

- [docs/vanilla.md](docs/vanilla.md)
- [docs/react.md](docs/react.md)
- [docs/vue.md](docs/vue.md)
- [docs/svelte.md](docs/svelte.md)
- [docs/browser.md](docs/browser.md)

## License

MIT

## Browser

El build browser expone `window.SamlineForms` para proyectos sin bundler.

```html
<script src="/dist/browser/global.global.js"></script>
<script>
  const contactForm = window.SamlineForms.form('contact-form')
</script>
```