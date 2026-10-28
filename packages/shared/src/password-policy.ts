import { APP_SLUG } from "./app";

// Política de senha compartilhada entre API (validação de verdade,
// via passwordSchema em auth.ts) e web (validação ao vivo no
// formulário, mesma regra, sem duplicar lógica). O check contra
// nome/e-mail do próprio usuário não entra aqui porque o Zod schema
// não tem acesso a esse contexto — fica a cargo do service
// (auth.service.ts / profiles.service.ts) chamar containsUserIdentifier
// depois de carregar o Profile.

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 32;

// Blocos de teclado/alfabeto/dígitos onde uma sequência "óbvia" (ex.:
// 123456, qwerty, abcdef) aparece como substring contígua, nos dois
// sentidos (crescente e decrescente).
const SEQUENTIAL_BLOCKS = [
  "0123456789",
  "9876543210",
  "abcdefghijklmnopqrstuvwxyz",
  "zyxwvutsrqponmlkjihgfedcba",
  "qwertyuiop",
  "poiuytrewq",
  "asdfghjkl",
  "lkjhgfdsa",
  "zxcvbnm",
  "mnbvcxz",
];

function hasSequentialRun(password: string, runLength = 6): boolean {
  const lower = password.toLowerCase();
  return SEQUENTIAL_BLOCKS.some((block) => {
    for (let i = 0; i + runLength <= block.length; i++) {
      if (lower.includes(block.slice(i, i + runLength))) return true;
    }
    return false;
  });
}

// Repetição do mesmo caractere 4+ vezes seguidas (ex.: "aaaaaa",
// "1111"). 4 em vez de "runLength da senha inteira" pra pegar
// repetição mesmo dentro de uma senha maior, não só senha 100% igual.
function hasRepeatedRun(password: string, runLength = 4): boolean {
  let streak = 1;
  for (let i = 1; i < password.length; i++) {
    streak = password[i] === password[i - 1] ? streak + 1 : 1;
    if (streak >= runLength) return true;
  }
  return false;
}

export function isPasswordDenylisted(password: string): boolean {
  return hasSequentialRun(password) || hasRepeatedRun(password) || password.toLowerCase().includes(APP_SLUG);
}

export function emailLocalPart(email: string): string {
  return email.split("@")[0] ?? email;
}

// Rejeita se a senha contiver o nome do usuário (ou parte relevante
// dele) ou a parte local do e-mail. Ignora fragmentos curtos (<3
// caracteres) pra não invalidar toda senha só por conter uma
// preposição/inicial em comum por acaso.
export function containsUserIdentifier(password: string, identifiers: Array<string | undefined | null>): boolean {
  const lower = password.toLowerCase();
  const fragments = identifiers
    .filter((v): v is string => Boolean(v))
    .flatMap((v) => v.split(/\s+/))
    .map((v) => v.trim().toLowerCase())
    .filter((v) => v.length >= 3);
  return fragments.some((fragment) => lower.includes(fragment));
}

export interface PasswordCheck {
  key: "length" | "pattern" | "identifier";
  label: string;
  valid: boolean;
}

// Checklist ao vivo pro formulário (web) — cada item some/acende
// conforme o usuário digita, em vez de uma frase só de regras. O item
// "identifier" só faz sentido quando o caller tem nome/e-mail à mão
// (registro, troca de senha); redefinir-senha (usuário deslogado)
// passa identifiers vazio e o item nem aparece.
export function passwordChecklist(
  password: string,
  identifiers: Array<string | undefined | null> = [],
): PasswordCheck[] {
  const hasIdentifiers = identifiers.some((v) => Boolean(v && v.trim().length >= 3));
  const checks: PasswordCheck[] = [
    {
      key: "length",
      label: `${PASSWORD_MIN_LENGTH} a ${PASSWORD_MAX_LENGTH} caracteres`,
      valid: password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH,
    },
    {
      key: "pattern",
      label: "Nada de sequências (123456, qwerty) ou repetições (aaaaaa)",
      valid: password.length > 0 && !isPasswordDenylisted(password),
    },
  ];
  if (hasIdentifiers) {
    checks.push({
      key: "identifier",
      label: "Diferente do seu nome e do seu e-mail",
      valid: password.length > 0 && !containsUserIdentifier(password, identifiers),
    });
  }
  return checks;
}
