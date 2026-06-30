// Type shim for the optional `@samline/formatter` peer.
//
// The runtime loader (`src/core/formatter-loader.ts`) imports the
// module dynamically and the build never references `@samline/formatter`
// at compile time. This shim keeps `tsc` happy in environments where
// the peer is not installed while still pointing consumers who DO
// install it at the real upstream types when they exist on disk
// (TypeScript prefers the resolved package types over this shim).

declare module '@samline/formatter' {
  export type FormatType =
    | 'general'
    | 'phone'
    | 'numeral'
    | 'date'
    | 'time'
    | 'creditCard'
    | 'creditCardType'

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
  export const regex: Record<string, { pattern: RegExp; errorMessage: string }>
}