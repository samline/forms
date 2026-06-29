# `element` and `f`

Read-only getters that return the bound `HTMLFormElement`, or `null` if the binding target was unresolved at construction time.

## Signatures

```ts
interface FormController {
  readonly element: HTMLFormElement | null
  readonly f: HTMLFormElement | null
  readonly options: FormControllerOptions
}
```

- `element` — the bound form.
- `f` — alias of `element`, kept short for fluent setup.
- `options` — the resolved options object (defaults merged with user-provided values).

## Returns

`HTMLFormElement | null`. `null` when the target passed to [`form()`](form.md) did not resolve to a form.

## Examples

### Read the bound form

```ts
import { form } from '@samline/forms'

const profile = form('profile-form')

if (profile.element) {
  profile.element.classList.add('mounted')
}
```

### Use the short alias

```ts
import { form } from '@samline/forms'

const profile = form('profile-form')

profile.f?.querySelector('[data-status]')?.setAttribute('data-state', 'ready')
```

### Read the resolved options

```ts
import { form } from '@samline/forms'

const profile = form('profile-form', {
  autoValidate: false,
  attributes: { error: 'is-invalid' }
})

profile.options.autoValidate            // false (overridden)
profile.options.autoSubmit              // false (default)
profile.options.clearErrorsOnSubmit     // true (default)
profile.options.attributes.error        // 'is-invalid'
profile.options.attributes.filled       // 'css-filled' (default)
```

## Edge cases

- The getter returns `null` when the target was `null`, `undefined`, a non-existent id, or an element that is not an `HTMLFormElement`.
- The reference is the same one the controller uses internally — do not replace the form node, or the controller will keep listening to the original.

## Related

- [`form(target, options?)`](form.md) — bind a controller.
- [`destroy`](destroy.md) — tear the controller down.