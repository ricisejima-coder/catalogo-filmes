import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Elenco } from "@/components/Elenco";
import { OndeAssistir } from "@/components/OndeAssistir";
import { Trailer } from "@/components/Trailer";
import { lerIdFilme } from "@/lib/idFilme";
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
  const filme = await carregar((await params).id);
  const info = [filme.ano, filme.duracao, filme.generos.join(", ")].filter(Boolean).join(" · ");

  return (
    <article className="relative">
      {filme.fundoUrl && (
        <div aria-hidden className="absolute inset-x-0 -top-6 -z-10 h-[28rem] overflow-hidden">
          <Image src={filme.fundoUrl} alt="" fill priority sizes="100vw" className="object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/40 via-zinc-950/80 to-zinc-950" />
        </div>
      )}

      <div className="flex flex-col gap-8 pt-4 md:flex-row">
        <Image
          src={filme.posterUrl ?? "/sem-poster.svg"}
          alt={`Pôster de ${filme.titulo}`}
          width={500}
          height={750}
          priority
          className="mx-auto w-56 shrink-0 self-start rounded-xl shadow-2xl ring-1 ring-white/10 md:mx-0 md:w-72"
        />
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{filme.titulo}</h1>
            {filme.tituloOriginal && <p className="mt-1 text-zinc-400">{filme.tituloOriginal}</p>}
          </div>
          {info && <p className="text-sm text-zinc-300">{info}</p>}
          <p className="text-lg font-semibold text-amber-300">
            ★ {filme.nota.toFixed(1)} <span className="text-sm font-normal text-zinc-500">/ 10</span>
          </p>
          {filme.sinopse && <p className="max-w-prose leading-relaxed text-zinc-200">{filme.sinopse}</p>}
          <OndeAssistir streamings={filme.ondeAssistir} />
        </div>
      </div>

      <div className="mt-12 flex flex-col gap-12">
        <Trailer youtubeId={filme.trailerYoutubeId} />
        <Elenco pessoas={filme.elenco} />
      </div>
    </article>
  );
}
