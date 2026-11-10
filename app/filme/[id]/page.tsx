import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BotaoMarcar } from "@/components/BotaoMarcar";
import { Elenco } from "@/components/Elenco";
import { OndeAssistir } from "@/components/OndeAssistir";
import { Trailer } from "@/components/Trailer";
import { lerIdFilme } from "@/lib/idFilme";
import { listarMarcacoesComSeguranca, paraMapa } from "@/lib/marcacoes/consultas";
import { obterUsuarioComSeguranca } from "@/lib/supabase/servidor";
import { ErroNaoEncontrado } from "@/lib/tmdb/cliente";
import { obterDetalhes } from "@/lib/tmdb/detalhes";

async function carregar(bruto: string) {
  const id = lerIdFilme(bruto);
  if (id === null) notFound();
  try {
    return await obterDetalhes(id);
  } catch (erro) {
    if (erro instanceof ErroNaoEncontrado) notFound();
    throw erro;
  }
}

export async function generateMetadata({ params }: PageProps<"/filme/[id]">): Promise<Metadata> {
  const filme = await carregar((await params).id);
  return { title: `${filme.titulo} | Catálogo de Streaming`, description: filme.sinopse || undefined };
}

export default async function PaginaFilme({ params }: PageProps<"/filme/[id]">) {
  const [filme, usuario, marcacoes] = await Promise.all([
    carregar((await params).id),
    obterUsuarioComSeguranca(),
    listarMarcacoesComSeguranca(),
  ]);
  const info = [filme.ano, filme.duracao, filme.generos.join(", ")].filter(Boolean);

  return (
    <article>
      <header className="relative -mt-20 overflow-hidden">
        {filme.fundoUrl && (
          <div aria-hidden className="absolute inset-0">
            <Image src={filme.fundoUrl} alt="" fill priority sizes="100vw" className="acender object-cover object-[70%_20%]" />
            <div className="absolute inset-0 bg-gradient-to-r from-tela via-tela/80 to-tela/10" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-tela to-tela/0" />
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-tela/80 to-tela/0" />
          </div>
        )}

        <div className="moldura relative flex flex-col gap-8 pt-28 pb-12 md:flex-row md:gap-12 md:pt-36">
          <Image
            src={filme.posterUrl ?? "/sem-poster.svg"}
            alt={`Pôster de ${filme.titulo}`}
            width={500}
            height={750}
            priority
            className="w-44 shrink-0 self-start rounded-md shadow-2xl shadow-black md:w-64"
          />
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="max-w-[16ch] font-letreiro text-[clamp(2.75rem,7vw,6.5rem)] leading-[0.88] font-black text-balance uppercase">
                {filme.titulo}
              </h1>
              {filme.tituloOriginal && <p className="mt-3 text-apagado">{filme.tituloOriginal}</p>}
            </div>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-apagado">
              <span className="text-base font-semibold text-luz">
                ★ {filme.nota.toFixed(1)} <span className="text-sm font-normal text-apagado">/ 10</span>
              </span>
              {info.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </p>
            <BotaoMarcar
              variante="completa"
              filmeId={filme.id}
              titulo={filme.titulo}
              marcacao={paraMapa(marcacoes ?? [])[filme.id] ?? null}
              logado={usuario !== null && usuario !== "indisponivel"}
            />
            {filme.sinopse && <p className="max-w-[60ch] leading-relaxed text-texto/90">{filme.sinopse}</p>}
            <OndeAssistir streamings={filme.ondeAssistir} />
          </div>
        </div>
      </header>

      <div className="moldura flex flex-col gap-12 pt-6 pb-16">
        <Trailer youtubeId={filme.trailerYoutubeId} />
        <Elenco pessoas={filme.elenco} />
      </div>
    </article>
  );
}
