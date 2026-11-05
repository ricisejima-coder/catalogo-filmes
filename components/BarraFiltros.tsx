"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { escreverFiltros, type Filtros } from "@/lib/filtros";
import type { Genero, Streaming } from "@/lib/tmdb/tipos";
import { CampoBusca } from "./CampoBusca";
import { SeletorGenero } from "./SeletorGenero";
import { SeletorOrdem } from "./SeletorOrdem";
import { SeletorStreamings } from "./SeletorStreamings";

type Props = { streamings: Streaming[]; generos: Genero[]; filtros: Filtros };

export function BarraFiltros({ streamings, generos, filtros }: Props) {
  const router = useRouter();
  const chaveDaUrl = escreverFiltros(filtros);

  // Filtros que o usuário acabou de escolher, enquanto a nova página ainda não chegou.
  const [pendentes, setPendentes] = useState<Filtros | null>(null);
  const [chaveAnterior, setChaveAnterior] = useState(chaveDaUrl);
  if (chaveAnterior !== chaveDaUrl) {
    // A URL mudou (nova página carregada, "voltar", "Limpar filtros"): ela volta a mandar.
    setChaveAnterior(chaveDaUrl);
    setPendentes(null);
  }

  const atuais = pendentes ?? filtros;
  const carregando = pendentes !== null && escreverFiltros(pendentes) !== chaveDaUrl;

  function aplicar(novo: Filtros) {
    setPendentes(novo);
    const query = escreverFiltros(novo);
    router.push(query ? `/?${query}` : "/");
  }

  function alternarStreaming(id: number) {
    const selecionados = atuais.streamings.includes(id)
      ? atuais.streamings.filter((s) => s !== id)
      : [...atuais.streamings, id];
    aplicar({ ...atuais, streamings: selecionados });
  }

  return (
    <section
      aria-label="Filtros"
      aria-busy={carregando}
      className="mb-8 flex flex-col gap-5 rounded-2xl bg-zinc-900/60 p-4 ring-1 ring-white/5 sm:p-5"
    >
      <div className="flex items-center justify-between gap-4">
        <SeletorStreamings streamings={streamings} selecionados={atuais.streamings} aoAlternar={alternarStreaming} />
        {carregando && (
          <span role="status" className="flex items-center gap-2 text-sm text-amber-300">
            <span aria-hidden className="size-3 animate-spin rounded-full border-2 border-amber-300 border-t-transparent" />
            Carregando…
          </span>
        )}
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <CampoBusca
          key={filtros.busca ?? ""}
          valorInicial={filtros.busca}
          aoBuscar={(busca) => aplicar({ ...atuais, busca })}
        />
        <SeletorGenero generos={generos} valor={atuais.genero} aoMudar={(genero) => aplicar({ ...atuais, genero })} />
        <SeletorOrdem valor={atuais.ordem} desabilitado={Boolean(atuais.busca)} aoMudar={(ordem) => aplicar({ ...atuais, ordem })} />
      </div>
    </section>
  );
}
