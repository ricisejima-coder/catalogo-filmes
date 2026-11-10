"use server";

import { refresh } from "next/cache";
import { criarClienteServidor, obterUsuario } from "@/lib/supabase/servidor";
import { LISTAS, type Lista, type ResultadoMarcacao } from "./tipos";

/** Põe o filme numa lista, ou tira das listas quando `lista` é null. */
export async function marcarFilme(
  filmeId: number,
  lista: Lista | null,
): Promise<ResultadoMarcacao> {
  // A entrada vem do navegador: valida antes de qualquer outra chamada.
  if (!Number.isInteger(filmeId) || filmeId <= 0) return "erro";
  if (lista !== null && !LISTAS.includes(lista)) return "erro";

  const usuario = await obterUsuario();
  if (!usuario) return "sem-login";

  try {
    const supabase = await criarClienteServidor();
    const { error } =
      lista === null
        ? await supabase
            .from("marcacoes")
            .delete()
            .eq("usuario_id", usuario.id)
            .eq("filme_id", filmeId)
        : await supabase.from("marcacoes").upsert(
            {
              usuario_id: usuario.id,
              filme_id: filmeId,
              lista,
              criado_em: new Date().toISOString(),
            },
            { onConflict: "usuario_id,filme_id" },
          );
    if (error) return "erro";
  } catch (erro) {
    console.error("Falha ao marcar filme:", erro);
    return "erro";
  }

  refresh();
  return "ok";
}
