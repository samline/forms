# `append(options)`

Inserts a DOM node into the bound form. Useful for rendering banners, hints, or summary blocks that should live inside the `<form>` element so they are reset together with the form.

## Signature

```ts
append(options: AppendContentOptions): HTMLElement | null
```

```ts
interface AppendContentOptions {
  tag: keyof HTMLElementTagNameMap
  content: string
  class?: string
  atStart?: boolean
}
```

## Parameters

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `options.tag` | `keyof HTMLElementTagNameMap` | yes | — | The HTML tag to create (e.g. `'div'`, `'p'`, `'output'`). |
| `options.content` | `string` | yes | — | `innerHTML` content for the new node. |
| `options.class` | `string` | no | — | Class name. If a node with the same first class already exists inside the form, it is removed first. |
| `options.atStart` | `boolean` | no | `false` | When `true`, the node is inserted at the start of the form. When `false`, it is appended at the end. |

## Returns

The created `HTMLElement`, or `null` when the controller has no bound form.

## Behaviour

- Clears the field cache (because the form subtree changed).
- If `class` is provided and a descendant of the form matches the first class in the string, that descendant is removed before the new node is inserted. This gives you a single “render or replace” pattern.
- The created node receives `innerHTML = content`. The content is trusted HTML; escape it yourself if it comes from user input.

## Examples

### Render a static hint

```ts
import { form } from '@samline/forms'

const signup = form('signup-form')

signup.append({
  tag: 'p',
  content: 'We will never share your email.',
  class: 'signup-hint'
})
```

### Render a live region for validation messages

```ts
const profile = form('profile-form')

profile.append({
  tag: 'output',
  content: '',
  class: 'profile-status',
  atStart: true
})

profile.subscribe(state => {
  const status = profile.element?.querySelector('.profile-status')
  if (status) status.textContent = state.isValid ? 'Looks good' : 'Please fix errors'
})
```

### Replace a previous banner

```ts
import { form } from '@samline/forms'

const contact = form('contact-form')

contact.append({ tag: 'div', content: 'Draft saved.', class: 'banner banner-info' })

// Some time later — replaces the previous banner instead of stacking.
contact.append({ tag: 'div', content: 'Draft published.', class: 'banner banner-success' })
```

## Edge cases

- **Only the first class token is used for deduplication.** If you pass `'a b'`, the controller searches for `.a` inside the form and removes it. The other classes are still applied to the new node.
- **The returned element is a live reference.** It stays in the DOM until you remove it or until [`reset`](reset.md) is called (which strips `css-filled` / `css-error` attributes but does not remove nodes you added).
- **Appending does not trigger validation, watchers, or autoSubmit.** It only mutates the DOM.
- **Calling `append` from a non-form controller** returns `null` and does nothing.

## Related

- [`reset`](reset.md) — strips visual attributes but not custom nodes.
- [`destroy`](destroy.md) — removes listeners and observer but does not remove custom nodes.