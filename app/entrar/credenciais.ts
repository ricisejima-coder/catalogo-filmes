// Funções puras da entrada. Ficam fora de acoes.ts porque um arquivo "use server"
// só pode exportar funções async.
import { validarVoltar } from "@/lib/caminhoVolta";

/** `email` devolve o que a pessoa digitou, porque o React limpa o formulário depois da ação. */
export type EstadoEntrada = { erro: string | null; email?: string };

export const SENHA_CURTA = "A senha precisa ter pelo menos 6 caracteres";

export const CONFIRMAR_EMAIL = "Confirme seu e-mail para entrar ou peça para desligar a confirmação no Supabase.";

const MENSAGENS: Record<string, string> = {
  invalid_credentials: "E-mail ou senha incorretos",
  user_already_exists: "Este e-mail já tem conta",
  email_exists: "Este e-mail já tem conta",
  weak_password: SENHA_CURTA,
};

export function traduzirErroAuth(codigo: string | undefined): string {
  return (codigo && MENSAGENS[codigo]) || "Algo deu errado. Tente de novo.";
}

export function lerCredenciais(dados: FormData): { email: string; senha: string; voltar: string } {
  return {
    email: String(dados.get("email") ?? "").trim(),
    senha: String(dados.get("senha") ?? ""),
    voltar: validarVoltar(dados.get("voltar")),
  };
}
