import "server-only";
import { createServerClient } from "@supabase/ssr";
import { isAuthRetryableFetchError, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { cache } from "react";
import { lerConfigSupabase } from "./config";

export async function criarClienteServidor(): Promise<SupabaseClient> {
  const { url, chave } = lerConfigSupabase();
  const armazenamento = await cookies();

  return createServerClient(url, chave, {
    cookies: {
      getAll() {
        return armazenamento.getAll();
      },
      setAll(cookiesParaGravar) {
        try {
          cookiesParaGravar.forEach(({ name, value, options }) =>
            armazenamento.set(name, value, options),
          );
        } catch {
          // Em Server Components o Next não deixa gravar cookies.
          // Tudo bem: o proxy.ts renova a sessão a cada requisição.
        }
      },
    },
  });
}

type Usuario = { id: string; email: string };

/**
 * Usuário logado, ou null se não há sessão (ou o token é inválido).
 * Lança erro se o Supabase não respondeu: aí não dá para saber se a pessoa está logada.
 * O cache() evita repetir a chamada ao Supabase dentro da mesma requisição.
 */
export const obterUsuario = cache(async (): Promise<Usuario | null> => {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.auth.getUser();
  if (isAuthRetryableFetchError(error)) throw error;
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? "" };
});

/** Igual a obterUsuario, mas devolve "indisponivel" em vez de lançar erro. */
export async function obterUsuarioComSeguranca(): Promise<Usuario | null | "indisponivel"> {
  try {
    return await obterUsuario();
  } catch {
    return "indisponivel";
  }
}
