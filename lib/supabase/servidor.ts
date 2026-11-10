import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
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

export async function obterUsuario(): Promise<{
  id: string;
  email: string;
} | null> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? "" };
}
