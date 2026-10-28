// Compiled-JSX helper (the design-system bundle's components were written as
// React.createElement calls, which use this Babel-style spread helper
// instead of JSX's implicit prop spreading).
//
// Untyped result on purpose: every call site merges a small literal (its own
// `style`/handler overrides) with a `...rest: React.XHTMLAttributes<...>`
// spread — two very differently-shaped objects. A generic `_extends<T>(...
// sources: Partial<T>[]): T` infers `T` narrowly from whichever argument
// comes first, then rejects the other for "no properties in common" (or a
// handler-signature mismatch) even though `Object.assign` at runtime merges
// them just fine. The component's own exported `XxxProps` interface is what
// call sites in apps/web actually get type-checked against; this helper is
// internal plumbing invisible to consumers, so loosening it here (instead of
// widening every call site) doesn't loosen anything real.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- ver comentário acima
export function _extends(...sources: Array<Record<string, unknown> | undefined | null>): any {
  return Object.assign({}, ...sources);
}
