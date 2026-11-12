import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { validarVoltar } from "@/lib/caminhoVolta";
import { obterUsuarioComSeguranca } from "@/lib/supabase/servidor";
import { criarConta, entrar } from "./acoes";
import { FormularioEntrada } from "./FormularioEntrada";

export const metadata: Metadata = { title: "Entrar | Catálogo de Streaming" };

export default async function PaginaEntrar({ searchParams }: PageProps<"/entrar">) {
  const voltar = validarVoltar((await searchParams).voltar);
  const usuario = await obterUsuarioComSeguranca();
  if (usuario && usuario !== "indisponivel") redirect(voltar);

  return (
    <div className="moldura flex flex-col items-center py-12">
      <h1 className="font-letreiro mb-8 text-4xl font-black tracking-wide uppercase">Sua conta</h1>
      <FormularioEntrada voltar={voltar} acaoEntrar={entrar} acaoCriarConta={criarConta} />
    </div>
  );
}
