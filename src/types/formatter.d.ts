// Type shim for the optional `@samline/formatter` peer.
//
// The runtime loader (`src/core/formatter-loader.ts`) imports the
// module dynamically and the build never references `@samline/formatter`
// at compile time. This ambient declaration replaces the installed
// package's types inside this repository (source and tests), so it must
// describe every member the repo uses. It is not emitted to `dist/`:
// consumers always get the real types from their installed peer.
// Mirrors @samline/formatter 3.2.0.

declare module '@samline/formatter' {
  export type FormatType =
    | 'general'
    | 'phone'
    | 'numeral'
    | 'date'
    | 'time'
    | 'creditCard'
    | 'creditCardType'
    | 'text'
    | 'slug'

  export interface FormatterResult {
    readonly formatted: string
    readonly raw: string
    readonly type: FormatType
  }

  export const format: (
    value: unknown,
    formatType: FormatType,
    options?: Record<string, unknown>
  ) => FormatterResult

  export const FORMAT_TYPES: readonly FormatType[]
  export const isFormatType: (value: unknown) => value is FormatType
  export interface RegexEntry {
    pattern: RegExp
    errorMessage: string
  }

  /** Callable entry that also keeps its static `pattern` and `errorMessage`. */
  type RegexBuilder = ((options?: Record<string, unknown>) => RegexEntry) & RegexEntry

  export const regex: Readonly<Record<string, RegexEntry>> & {
    readonly email: RegexEntry
    readonly curp: RegexEntry
    readonly rfc: RegexEntry
    readonly iban: RegexEntry
    readonly phone: RegexBuilder
    readonly creditCard: RegexBuilder
    readonly url: RegexBuilder
    readonly uuid: RegexBuilder
    readonly date: RegexBuilder
    readonly numeral: RegexBuilder
    readonly postalCode: (options: { country: string }) => RegexEntry
    readonly time: ((options?: Record<string, unknown>) => RegexEntry) & { errorMessage: string }
    readonly digits: (count: number | { min?: number; max?: number }) => RegexEntry
    readonly password: (options?: Record<string, unknown>) => RegexEntry
    readonly custom: (pattern: RegExp | RegexEntry, errorMessage?: string) => RegexEntry
  }

  export const isLuhn: (value: unknown) => boolean
  export const isValidCard: (value: unknown) => boolean
  export const isValidClabe: (value: unknown) => boolean
  export const isValidNss: (value: unknown) => boolean
  export const isValidCurp: (value: unknown) => boolean
  export const isValidRfc: (value: unknown) => boolean
  export const isValidIban: (value: unknown) => boolean
  export const isValidRoutingNumber: (value: unknown) => boolean
  export const isValidDniEs: (value: unknown) => boolean
  export const isPhoneRegistered: () => boolean
}

declare module '@samline/formatter/phone' {
  export const registerPhone: () => void
}
