"use client";

import { useState } from "react";
import { escreverFiltros, type Filtros } from "@/lib/filtros";
import type { FilmeResumo, PaginaFilmes } from "@/lib/tmdb/tipos";
import { GradeFilmes } from "./GradeFilmes";

type Props = { filtros: Filtros; ultimaPagina: number; temMais: boolean };

export function BotaoCarregarMais({ filtros, ultimaPagina: paginaInicial, temMais: temMaisInicial }: Props) {
  const [filmes, setFilmes] = useState<FilmeResumo[]>([]);
  const [ultimaPagina, setUltimaPagina] = useState(paginaInicial);
  const [temMais, setTemMais] = useState(temMaisInicial);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(false);

  async function carregar() {
    setCarregando(true);
    setErro(false);
    try {
      const query = escreverFiltros(filtros);
      const pagina = ultimaPagina + 1;
      const resposta = await fetch(`/api/filmes?${query ? `${query}&` : ""}pagina=${pagina}`);
      if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
      const dados = (await resposta.json()) as PaginaFilmes;
      setFilmes((atuais) => {
        const vistos = new Set(atuais.map((f) => f.id));
        return [...atuais, ...dados.filmes.filter((f) => !vistos.has(f.id))];
      });
      setUltimaPagina(dados.pagina);
      setTemMais(dados.temMais);
    } catch {
      setErro(true);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <>
      {filmes.length > 0 && (
        <div className="mt-6">
          <GradeFilmes filmes={filmes} />
        </div>
      )}
      {(temMais || erro) && (
        <div className="mt-10 flex flex-col items-center gap-2">
          {erro && <p className="text-sm text-red-400">Não foi possível carregar mais filmes.</p>}
          <button
            type="button"
            onClick={carregar}
            disabled={carregando}
            className="rounded-full border border-zinc-700 px-6 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-amber-400 hover:text-amber-300 disabled:opacity-50"
          >
            {carregando ? "Carregando…" : erro ? "Tentar de novo" : "Carregar mais"}
          </button>
        </div>
      )}
    </>
  );
}
