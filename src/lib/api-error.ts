/**
 * Tradução das mensagens de erro do backend (class-validator/Nest, em inglês)
 * para pt-BR. Mensagens já em português (ex.: "Usuário não cadastrado")
 * passam intactas pelo fallback.
 */

const TRANSLATIONS: Array<[RegExp, string]> = [
  [
    /password is not strong enough/i,
    "A senha deve ter no mínimo 8 caracteres, com letra maiúscula, minúscula, número e símbolo.",
  ],
  [/confirmPassword must match password/i, "As senhas não coincidem."],
  [/email must be an email/i, "Informe um e-mail válido."],
  [/must be a jwt string/i, "O link de redefinição é inválido ou está incompleto."],
  [/must be shorter than or equal to (\d+) characters/i, "Valor excede o tamanho máximo permitido."],
  [/should not be empty/i, "Preencha todos os campos obrigatórios."],
  [/Forbidden resource/i, "Você não tem permissão para esta ação."],
  [/Unauthorized/i, "Sessão expirada. Entre novamente."],
];

function translate(message: string): string {
  for (const [pattern, ptBr] of TRANSLATIONS) {
    if (pattern.test(message)) return ptBr;
  }
  return message;
}

/** Extrai e traduz a mensagem de um corpo de erro do backend/BFF. */
export async function readApiErrorMessage(
  res: Response,
  fallback: string,
): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string | string[] };
    if (Array.isArray(body.message) && body.message.length > 0) {
      return body.message.map(translate).join(" ");
    }
    if (typeof body.message === "string" && body.message) {
      return translate(body.message);
    }
    return fallback;
  } catch {
    return fallback;
  }
}
