import "server-only";
import { criarClienteServidor, obterUsuario } from "@/lib/supabase/servidor";
import type { Lista, MapaMarcacoes, Marcacao } from "./tipos";

type LinhaMarcacao = { filme_id: number; lista: Lista; criado_em: string };

/** Marcações do usuário logado, da mais recente para a mais antiga. */
export async function listarMarcacoes(): Promise<Marcacao[]> {
  const usuario = await obterUsuario();
  if (!usuario) return [];

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("marcacoes")
    .select("filme_id, lista, criado_em")
    // Além da segurança por linha (RLS) do banco, filtra aqui também.
    .eq("usuario_id", usuario.id)
    .order("criado_em", { ascending: false });
  if (error) throw new Error(`Falha ao listar marcações: ${error.message}`);

  return ((data ?? []) as LinhaMarcacao[]).map((linha) => ({
    filmeId: linha.filme_id,
    lista: linha.lista,
    criadoEm: linha.criado_em,
  }));
}

export function paraMapa(marcacoes: Marcacao[]): MapaMarcacoes {
  const mapa: MapaMarcacoes = {};
  for (const m of marcacoes) mapa[m.filmeId] = m.lista;
  return mapa;
}

/** Igual a listarMarcacoes, mas devolve null em vez de lançar erro. */
export async function listarMarcacoesComSeguranca(): Promise<Marcacao[] | null> {
  try {
    return await listarMarcacoes();
  } catch {
    return null;
  }
}
