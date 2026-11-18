/** Satu-satunya script inline: menandai bahwa JS aktif sebelum render (dipakai carousel). */
export const JS_FLAG_SCRIPT = "document.documentElement.classList.add('js')";

let hash: Promise<string> | undefined;
export function jsFlagHash(): Promise<string> {
  hash ??= crypto.subtle
    .digest('SHA-256', new TextEncoder().encode(JS_FLAG_SCRIPT))
    .then((buf) => `'sha256-${btoa(String.fromCharCode(...new Uint8Array(buf)))}'`);
  return hash;
}
