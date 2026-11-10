"use server";

import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { lerCredenciais, SENHA_CURTA, traduzirErroAuth, type EstadoEntrada } from "./credenciais";

export async function entrar(_estado: EstadoEntrada, dados: FormData): Promise<EstadoEntrada> {
  const { email, senha, voltar } = lerCredenciais(dados);
  if (senha.length < 6) return { erro: SENHA_CURTA };
  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) return { erro: traduzirErroAuth(error.code) };
  redirect(voltar);
}

export async function criarConta(_estado: EstadoEntrada, dados: FormData): Promise<EstadoEntrada> {
  const { email, senha, voltar } = lerCredenciais(dados);
  if (senha.length < 6) return { erro: SENHA_CURTA };
  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.signUp({ email, password: senha });
  if (error) return { erro: traduzirErroAuth(error.code) };
  redirect(voltar);
}

export async function sair(): Promise<void> {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  redirect("/");
}
