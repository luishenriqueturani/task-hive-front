/** CPF: só dígitos. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * CNPJ sem máscara: 14 caracteres A-Z/0-9 em maiúsculas.
 * IN RFB nº 2.229/2024 — as 12 primeiras posições podem ter letras;
 * os 2 dígitos verificadores continuam numéricos.
 */
export function normalizeCnpj(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 14);
}

function allSameChar(value: string): boolean {
  return value.length > 0 && /^([A-Z0-9])\1+$/.test(value);
}

/** Valor para o módulo 11: código ASCII − 48 (dígito '0'→0, letra 'A'→17). */
function cnpjCharValue(char: string): number {
  return char.charCodeAt(0) - 48;
}

function mod11CheckDigit(values: number[], weights: number[]): number {
  const sum = values.reduce(
    (acc, value, i) => acc + value * (weights[i] ?? 0),
    0,
  );
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

/** Máscara `000.000.000-00` enquanto o utilizador escreve. */
export function formatCpf(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  const p1 = d.slice(0, 3);
  const p2 = d.slice(3, 6);
  const p3 = d.slice(6, 9);
  const p4 = d.slice(9, 11);
  if (d.length <= 3) return p1;
  if (d.length <= 6) return `${p1}.${p2}`;
  if (d.length <= 9) return `${p1}.${p2}.${p3}`;
  return `${p1}.${p2}.${p3}-${p4}`;
}

/** Máscara `XX.XXX.XXX/XXXX-XX` (letras ou dígitos nas 12 primeiras posições). */
export function formatCnpj(value: string): string {
  const d = normalizeCnpj(value);
  const p1 = d.slice(0, 2);
  const p2 = d.slice(2, 5);
  const p3 = d.slice(5, 8);
  const p4 = d.slice(8, 12);
  const p5 = d.slice(12, 14);
  if (d.length <= 2) return p1;
  if (d.length <= 5) return `${p1}.${p2}`;
  if (d.length <= 8) return `${p1}.${p2}.${p3}`;
  if (d.length <= 12) return `${p1}.${p2}.${p3}/${p4}`;
  return `${p1}.${p2}.${p3}/${p4}-${p5}`;
}

export function isValidCpf(value: string): boolean {
  const d = onlyDigits(value);
  if (d.length !== 11 || allSameChar(d)) return false;
  const values = d.split("").map(cnpjCharValue);
  const d1 = mod11CheckDigit(values.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = mod11CheckDigit(values.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d1 === Number(d[9]) && d2 === Number(d[10]);
}

export function isValidCnpj(value: string): boolean {
  const d = normalizeCnpj(value);
  if (d.length !== 14) return false;
  if (!/^[A-Z0-9]{12}\d{2}$/.test(d)) return false;
  if (allSameChar(d) || /^0{12}/.test(d)) return false;
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const values = d.split("").map(cnpjCharValue);
  const d1 = mod11CheckDigit(values.slice(0, 12), w1);
  const d2 = mod11CheckDigit(values.slice(0, 13), w2);
  return d1 === Number(d[12]) && d2 === Number(d[13]);
}

/** E-mail no query `?invite=` (atalho até existir o token da Onda 2). */
export function inviteQueryLooksLikeEmail(value: string): boolean {
  return value.includes("@");
}
