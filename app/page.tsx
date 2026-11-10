import { AbasCatalogo } from "@/components/AbasCatalogo";
import { BarraFiltros } from "@/components/BarraFiltros";
import { BotaoCarregarMais } from "@/components/BotaoCarregarMais";
import { Destaque } from "@/components/Destaque";
import { EstadoVazio } from "@/components/EstadoVazio";
import { GradeFilmes } from "@/components/GradeFilmes";
import { PainelLista } from "@/components/PainelLista";
import { lerAba } from "@/lib/abas";
import { escreverFiltros, lerFiltros } from "@/lib/filtros";
import { listarMarcacoesComSeguranca, paraMapa } from "@/lib/marcacoes/consultas";
import { obterUsuario } from "@/lib/supabase/servidor";
import { listarFilmes } from "@/lib/tmdb/catalogo";
import { listarGeneros, listarStreamings } from "@/lib/tmdb/referencias";
import type { FilmeResumo } from "@/lib/tmdb/tipos";

function temCena(filme: FilmeResumo): filme is FilmeResumo & { fundoUrl: string } {
  return Boolean(filme.fundoUrl);
}

export default async function Catalogo({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const aba = lerAba(params);
  const [usuario, lista] = await Promise.all([obterUsuario(), listarMarcacoesComSeguranca()]);
  const logado = usuario !== null;

  if (aba !== "streaming") {
    return (
      <div className="moldura pt-4 pb-16">
        <AbasCatalogo ativa={aba} />
        <PainelLista aba={aba} logado={logado} marcacoes={lista} />
      </div>
    );
  }

  const marcacoes = paraMapa(lista ?? []);
  const filtros = lerFiltros(params);
  const [streamings, generos, pagina] = await Promise.all([
    listarStreamings(),
    listarGeneros(),
    listarFilmes(filtros, 1),
  ]);
  const vazio = pagina.filmes.length === 0 && !pagina.temMais;
  // Na busca, quem manda é o que a pessoa digitou: sem destaque.
  const destaque = filtros.busca ? undefined : pagina.filmes.find(temCena);

  return (
    <>
      {destaque && <Destaque filme={destaque} ordem={filtros.ordem} />}
      <div className={`moldura ${destaque ? "pt-6" : "pt-4"} pb-16`}>
        <AbasCatalogo ativa={aba} />
        <h1 className="font-letreiro text-4xl font-extrabold tracking-wide sm:text-5xl">
          {filtros.busca ? `Resultados para “${filtros.busca}”` : "Em streaming agora"}
        </h1>
        <p className="mt-1 mb-6 text-sm text-apagado">Filmes disponíveis por assinatura no Brasil.</p>
        <BarraFiltros streamings={streamings} generos={generos} filtros={filtros} />
        {vazio ? (
          <EstadoVazio />
        ) : (
          <>
            <GradeFilmes filmes={pagina.filmes} marcacoes={marcacoes} logado={logado} />
            <BotaoCarregarMais
              key={escreverFiltros(filtros)}
              filtros={filtros}
              ultimaPagina={pagina.pagina}
              temMais={pagina.temMais}
              marcacoes={marcacoes}
              logado={logado}
            />
          </>
        )}
      </div>
    </>
  );
}
