/**
 * Ambient declaration for Vite's `?raw` imports, used by tests to load the
 * HTML fixture as a string (vitest processes `?raw`; tsc sees this wildcard).
 */
declare module '*.html?raw' {
  const content: string;
  export default content;
}
