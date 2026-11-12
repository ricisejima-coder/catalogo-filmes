"use server";

import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { CONFIRMAR_EMAIL, lerCredenciais, SENHA_CURTA, traduzirErroAuth, type EstadoEntrada } from "./credenciais";

export async function entrar(_estado: EstadoEntrada, dados: FormData): Promise<EstadoEntrada> {
  const { email, senha, voltar } = lerCredenciais(dados);
  if (senha.length < 6) return { erro: SENHA_CURTA, email };
  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) return { erro: traduzirErroAuth(error.code), email };
  redirect(voltar);
}

export async function criarConta(_estado: EstadoEntrada, dados: FormData): Promise<EstadoEntrada> {
  const { email, senha, voltar } = lerCredenciais(dados);
  if (senha.length < 6) return { erro: SENHA_CURTA, email };
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.auth.signUp({ email, password: senha });
  if (error) return { erro: traduzirErroAuth(error.code), email };
  // Sem sessão, o Supabase ainda espera a confirmação por e-mail: não dá para entrar agora.
  if (!data.session) return { erro: CONFIRMAR_EMAIL, email };
  redirect(voltar);
}

export async function sair(): Promise<void> {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  redirect("/");
}
