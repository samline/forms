# `destroy()`

Tears the controller down. Removes all DOM listeners, disconnects the `MutationObserver`, clears caches, drops subscribers and submit handlers, and resets internal state.

## Signature

```ts
destroy(): void
```

## Returns

`void`. Idempotent — calling `destroy()` more than once is a no-op.

## Behaviour

When invoked, the controller:

- Removes every listener it added (`input`, `change`, `submit`, plus any others).
- Cancels any pending auto-submit debounce timer.
- Disconnects the form `MutationObserver`.
- Clears `watchedFields`, `subscribers`, `submitHandlers`, and `fieldCache`.
- Resets manual and validation error maps.

After `destroy()` the controller object still exists and its methods are still callable, but they no longer interact with the DOM.

## Examples

### SPA route unmount

```ts
import { form } from '@samline/forms'

let profile: ReturnType<typeof form> | null = null

function mountProfileForm(element: HTMLFormElement) {
  profile = form(element, { validators: { email: { required: true } } })
}

function unmountProfileForm() {
  profile?.destroy()
  profile = null
}
```

### Cleanup on script teardown

```ts
const profile = form('profile-form')

window.addEventListener('beforeunload', () => {
  profile.destroy()
})
```

## Edge cases

- **`destroy()` does not remove `css-filled` / `css-error` attributes** from fields. If you need that, call [`reset()`](reset.md) before destroy, or strip the attributes yourself.
- **Subscribers and watchers stop receiving notifications immediately**, but their closures remain until you release them.
- **Reusing the controller reference after destroy is safe** for reads (`element`, `options`, `getValue`, `getState`, `getData`), but writes do nothing.

## Related

- [`reset`](reset.md) — restore form values without removing listeners.
- [`form`](form.md) — bind a new controller.