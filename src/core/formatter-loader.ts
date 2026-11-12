// Lazy singleton loader for the optional `@samline/formatter` peer.
// The formatter is imported dynamically so the package stays usable
// even when the peer is not installed: callers receive `null` and a
// single console.error explaining the missing dependency.
//
// The first failure is cached so the warning is printed exactly once
// per process, not on every `format(...)` call.

export interface FormatterModule {
  format: (
    value: unknown,
    formatType: string,
    options?: Record<string, unknown>
  ) => { formatted: string; raw: string; type: string }
  FORMAT_TYPES?: readonly string[]
  isFormatType?: (value: unknown) => boolean
  regex?: Record<string, { pattern: RegExp; errorMessage: string }>
  /** Present since @samline/formatter 3.0.0, where phones are opt-in. */
  isPhoneRegistered?: () => boolean
}

interface PhoneModule {
  registerPhone: () => void
}

export interface LoadFormatterOptions {
  /** Also make sure phone formatting is registered (formatter >= 3.0.0). */
  phone?: boolean
}

type LoaderState =
  | { status: 'pending'; promise: Promise<FormatterModule | null> }
  | { status: 'resolved'; module: FormatterModule | null }

let state: LoaderState | null = null

const MISSING_MESSAGE =
  '[samline/forms] The `format()` and `formatAll()` methods require the ' +
  '@samline/formatter package. Install it with: npm i @samline/formatter ' +
  '(or pnpm/bun/yarn equivalent).'

let warned = false
let phonePromise: Promise<boolean> | null = null

const PHONE_MESSAGE =
  '[samline/forms] Phone formatting needs `@samline/formatter/phone` ' +
  '(@samline/formatter >= 3.0.0 makes phones opt-in) and it could not be loaded.'

const warnOnce = () => {
  if (warned) return
  warned = true
  console.error(MISSING_MESSAGE)
}

// Formatter 3 makes phones opt-in to keep libphonenumber-js (~140 KB) out of
// forms that never format a phone. Forms registers it on demand, the first
// time a phone field is formatted, so consumers do not have to. The subpath is
// a separate dynamic import: bundlers split it into its own lazy chunk.
const ensurePhone = (formatter: FormatterModule): Promise<boolean> => {
  // Formatter 2.x always includes phones.
  if (typeof formatter.isPhoneRegistered !== 'function') return Promise.resolve(true)
  if (formatter.isPhoneRegistered()) return Promise.resolve(true)
  if (!phonePromise) {
    phonePromise = (async () => {
      try {
        const mod = (await import('@samline/formatter/phone')) as PhoneModule
        mod.registerPhone()
        return true
      } catch {
        console.error(PHONE_MESSAGE)
        phonePromise = null
        return false
      }
    })()
  }
  return phonePromise
}

export const loadFormatter = async (
  options: LoadFormatterOptions = {}
): Promise<FormatterModule | null> => {
  const formatter = await loadFormatterModule()
  if (!formatter || !options.phone) return formatter
  return (await ensurePhone(formatter)) ? formatter : null
}

const loadFormatterModule = (): Promise<FormatterModule | null> => {
  if (state && state.status === 'resolved') {
    if (!state.module) warnOnce()
    return Promise.resolve(state.module)
  }

  if (state && state.status === 'pending') {
    return state.promise
  }

  const promise = (async () => {
    try {
      // Dynamic import keeps the optional peer out of the eager build graph.
      // The consumer's bundler is responsible for resolving the peer at
      // build time — `tsup` treats `@samline/formatter` as `external` so it
      // does not try to pre-bundle it. Do NOT re-add `/* @vite-ignore */`
      // here: in production it leaves the bare specifier as a literal in
      // the bundle, browsers cannot resolve it, and the formatter silently
      // never loads (the catch below masks the failure).
      const mod = (await import('@samline/formatter')) as FormatterModule
      state = { status: 'resolved', module: mod }
      return mod
    } catch {
      warnOnce()
      state = { status: 'resolved', module: null }
      return null
    }
  })()

  state = { status: 'pending', promise }
  return promise
}

// Test-only helper: reset the cached loader so unit tests can swap the
// dynamic import between "installed" and "missing" scenarios.
export const __resetFormatterLoaderForTests = (): void => {
  state = null
  warned = false
  phonePromise = null
}

// Test-only helper: inject a formatter implementation directly,
// bypassing the dynamic import. Pass `null` to simulate the
// "peer not installed" branch.
export const __setFormatterModuleForTests = (
  module: FormatterModule | null
): void => {
  state = { status: 'resolved', module }
}

export const __setFormatterPromiseForTests = (
  promise: Promise<FormatterModule | null>
): void => {
  state = { status: 'pending', promise }
}
