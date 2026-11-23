import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * The desk's deploy path prefix, inlined at build time by NEXT_PUBLIC_BASE_PATH
 * ("/gold" on the Currena worker build — the desk serves at currena.ir/gold;
 * "" in the sandbox, where the desk serves at /). Client fetches must carry
 * it because raw fetch() paths are not rewritten by Next.js basePath the way
 * next/link and asset URLs are.
 */
export const deskBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
