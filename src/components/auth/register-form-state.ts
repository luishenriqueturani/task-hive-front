import { ACCOUNT_KIND, type AccountKind } from "@/lib/account-kind";
import {
  formatCnpj,
  formatCpf,
  inviteQueryLooksLikeEmail,
  isValidCnpj,
  isValidCpf,
  normalizeCnpj,
  onlyDigits,
} from "@/lib/br-documents";

export type RegisterFormState = {
  accountKind: AccountKind;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  document: string;
  legalName: string;
  tradeName: string;
  companyDocument: string;
  formError: string | null;
  emailLocked: boolean;
};

export type RegisterFormAction =
  | { type: "setAccountKind"; accountKind: AccountKind }
  | { type: "setName"; name: string }
  | { type: "setEmail"; email: string }
  | { type: "setPassword"; password: string }
  | { type: "setConfirmPassword"; confirmPassword: string }
  | { type: "setDocument"; document: string }
  | { type: "setLegalName"; legalName: string }
  | { type: "setTradeName"; tradeName: string }
  | { type: "setCompanyDocument"; companyDocument: string }
  | { type: "setGeneratedPassword"; password: string }
  | { type: "setFormError"; formError: string | null }
  | { type: "lockEmailFromInvite"; email: string };

export function createRegisterFormState(
  inviteQuery?: string,
): RegisterFormState {
  const fromEmail = Boolean(
    inviteQuery && inviteQueryLooksLikeEmail(inviteQuery),
  );
  return {
    accountKind: ACCOUNT_KIND.INDIVIDUAL,
    name: "",
    email: fromEmail ? inviteQuery!.trim() : "",
    password: "",
    confirmPassword: "",
    document: "",
    legalName: "",
    tradeName: "",
    companyDocument: "",
    formError: null,
    emailLocked: fromEmail,
  };
}

export function registerFormReducer(
  state: RegisterFormState,
  action: RegisterFormAction,
): RegisterFormState {
  switch (action.type) {
    case "setAccountKind":
      return { ...state, accountKind: action.accountKind, formError: null };
    case "setName":
      return { ...state, name: action.name };
    case "setEmail":
      return { ...state, email: action.email };
    case "setPassword":
      return { ...state, password: action.password };
    case "setConfirmPassword":
      return { ...state, confirmPassword: action.confirmPassword };
    case "setDocument":
      return { ...state, document: formatCpf(action.document) };
    case "setLegalName":
      return { ...state, legalName: action.legalName };
    case "setTradeName":
      return { ...state, tradeName: action.tradeName };
    case "setCompanyDocument":
      return {
        ...state,
        companyDocument: formatCnpj(action.companyDocument),
      };
    case "setGeneratedPassword":
      return {
        ...state,
        password: action.password,
        confirmPassword: action.password,
      };
    case "setFormError":
      return { ...state, formError: action.formError };
    case "lockEmailFromInvite":
      return {
        ...state,
        email: action.email,
        emailLocked: true,
        formError: null,
      };
    default:
      return state;
  }
}

export type RegisterRequestBody = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  accountKind: AccountKind;
  document?: string;
  company?: {
    legalName: string;
    tradeName?: string;
    document: string;
  };
  inviteToken?: string;
};

export function validateRegisterForm(
  state: RegisterFormState,
): string | null {
  if (!state.email.trim() || !state.password || !state.confirmPassword) {
    return "Preencha o e-mail e a senha.";
  }
  if (state.password !== state.confirmPassword) {
    return "As senhas não coincidem.";
  }
  if (state.accountKind === ACCOUNT_KIND.INDIVIDUAL) {
    const cpf = onlyDigits(state.document);
    if (cpf && !isValidCpf(cpf)) {
      return "Informe um CPF válido.";
    }
    return null;
  }
  if (!state.name.trim()) {
    return "Informe o nome do responsável.";
  }
  if (!state.legalName.trim()) {
    return "Informe a razão social.";
  }
  if (!isValidCnpj(state.companyDocument)) {
    return "Informe um CNPJ válido.";
  }
  return null;
}

export function buildRegisterRequestBody(
  state: RegisterFormState,
  inviteToken?: string,
): RegisterRequestBody {
  const body: RegisterRequestBody = {
    name: state.name.trim(),
    email: state.email.trim(),
    password: state.password,
    confirmPassword: state.confirmPassword,
    accountKind: state.accountKind,
  };
  if (inviteToken) {
    body.inviteToken = inviteToken;
  }
  if (state.accountKind === ACCOUNT_KIND.INDIVIDUAL) {
    const cpf = onlyDigits(state.document);
    if (cpf) body.document = cpf;
    return body;
  }
  const tradeName = state.tradeName.trim();
  body.company = {
    legalName: state.legalName.trim(),
    document: normalizeCnpj(state.companyDocument),
    ...(tradeName ? { tradeName } : {}),
  };
  return body;
}
