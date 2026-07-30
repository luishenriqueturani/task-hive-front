/**
 * Geração de senha forte no cliente com Web Crypto (`crypto.getRandomValues`),
 * seguindo as regras do backend (IsStrongPassword): mínimo 8 caracteres com
 * maiúscula, minúscula, número e símbolo.
 */

const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghijkmnopqrstuvwxyz";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%&*-_=+?";
const ALL = UPPER + LOWER + DIGITS + SYMBOLS;

/** Índice aleatório uniforme em [0, max) sem viés de módulo (rejection sampling). */
function randomIndex(max: number): number {
  const limit = Math.floor(256 / max) * max;
  const byte = new Uint8Array(1);
  do {
    crypto.getRandomValues(byte);
  } while (byte[0] >= limit);
  return byte[0] % max;
}

function pick(charset: string): string {
  return charset[randomIndex(charset.length)];
}

export function generateStrongPassword(length = 16): string {
  // Garante pelo menos um caractere de cada classe exigida pelo backend.
  const chars = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SYMBOLS)];
  while (chars.length < length) {
    chars.push(pick(ALL));
  }

  // Fisher–Yates para não deixar as classes obrigatórias em posições fixas.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}

/**
 * Copia para a área de transferência. `navigator.clipboard` só existe em
 * contexto seguro (HTTPS/localhost); em HTTP na rede local usa o fallback
 * com `execCommand`.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // tenta o fallback abaixo
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
}
