/**
 * Builds a URL for a file in /public. The base can be overridden at build time
 * (NEXT_PUBLIC_ASSET_BASE) so static previews can use relative paths.
 */
export function asset(path: string) {
  const base = process.env.NEXT_PUBLIC_ASSET_BASE ?? "/";

  return `${base}${path.replace(/^\//, "")}`;
}
