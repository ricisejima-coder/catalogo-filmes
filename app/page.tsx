import { BarraFiltros } from "@/components/BarraFiltros";
import { BotaoCarregarMais } from "@/components/BotaoCarregarMais";
import { EstadoVazio } from "@/components/EstadoVazio";
import { GradeFilmes } from "@/components/GradeFilmes";
import { escreverFiltros, lerFiltros } from "@/lib/filtros";
import { listarFilmes } from "@/lib/tmdb/catalogo";
import { listarGeneros, listarStreamings } from "@/lib/tmdb/referencias";

export default async function Catalogo({ searchParams }: PageProps<"/">) {
  const filtros = lerFiltros(await searchParams);
  const [streamings, generos, pagina] = await Promise.all([
    listarStreamings(),
    listarGeneros(),
    listarFilmes(filtros, 1),
  ]);
  const vazio = pagina.filmes.length === 0 && !pagina.temMais;

  return (
    <>
      <h1 className="mb-1 text-2xl font-bold tracking-tight sm:text-3xl">
        {filtros.busca ? `Resultados para “${filtros.busca}”` : "Em streaming agora"}
      </h1>
      <p className="mb-6 text-sm text-zinc-400">Filmes disponíveis por assinatura no Brasil.</p>
      <BarraFiltros streamings={streamings} generos={generos} filtros={filtros} />
      {vazio ? (
        <EstadoVazio />
      ) : (
        <>
          <GradeFilmes filmes={pagina.filmes} />
          <BotaoCarregarMais
            key={escreverFiltros(filtros)}
            filtros={filtros}
            ultimaPagina={pagina.pagina}
            temMais={pagina.temMais}
          />
        </>
      )}
    </>
  );
}
