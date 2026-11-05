"use client";

import { useRouter } from "next/navigation";
import { escreverFiltros, type Filtros } from "@/lib/filtros";
import type { Genero, Streaming } from "@/lib/tmdb/tipos";
import { CampoBusca } from "./CampoBusca";
import { SeletorGenero } from "./SeletorGenero";
import { SeletorOrdem } from "./SeletorOrdem";
import { SeletorStreamings } from "./SeletorStreamings";

type Props = { streamings: Streaming[]; generos: Genero[]; filtros: Filtros };

export function BarraFiltros({ streamings, generos, filtros }: Props) {
  const router = useRouter();

  function aplicar(novo: Filtros) {
    const query = escreverFiltros(novo);
    router.push(query ? `/?${query}` : "/");
  }

  function alternarStreaming(id: number) {
    const selecionados = filtros.streamings.includes(id)
      ? filtros.streamings.filter((s) => s !== id)
      : [...filtros.streamings, id];
    aplicar({ ...filtros, streamings: selecionados });
  }

  return (
    <section aria-label="Filtros" className="mb-8 flex flex-col gap-5 rounded-2xl bg-zinc-900/60 p-4 ring-1 ring-white/5 sm:p-5">
      <SeletorStreamings streamings={streamings} selecionados={filtros.streamings} aoAlternar={alternarStreaming} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <CampoBusca valorInicial={filtros.busca} aoBuscar={(busca) => aplicar({ ...filtros, busca })} />
        <SeletorGenero generos={generos} valor={filtros.genero} aoMudar={(genero) => aplicar({ ...filtros, genero })} />
        <SeletorOrdem valor={filtros.ordem} desabilitado={Boolean(filtros.busca)} aoMudar={(ordem) => aplicar({ ...filtros, ordem })} />
      </div>
    </section>
  );
}
