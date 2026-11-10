import Image from "next/image";
import Link from "next/link";
import type { Ordem } from "@/lib/filtros";
import type { FilmeResumo } from "@/lib/tmdb/tipos";

// Explica por que este filme está em destaque, de acordo com a ordem escolhida.
const MOTIVO: Record<Ordem, string> = {
  populares: "O mais popular agora",
  avaliados: "O mais bem avaliado",
  recentes: "A estreia mais recente",
};

type Props = { filme: FilmeResumo & { fundoUrl: string }; ordem: Ordem };

export function Destaque({ filme, ordem }: Props) {
  // A lista traz a cena em tamanho médio; no destaque ela ocupa a tela toda, então pedimos a maior.
  const cena = filme.fundoUrl.replace("/w780/", "/w1280/");

  return (
    <section aria-labelledby="destaque-titulo" className="relative -mt-20 flex min-h-[34rem] items-end overflow-hidden sm:min-h-[min(78svh,52rem)]">
      <div aria-hidden className="absolute inset-0">
        <Image src={cena} alt="" fill priority sizes="100vw" className="acender object-cover object-[70%_20%]" />
        {/* Escurece a esquerda (onde fica o texto) e o pé (onde começa a lista). */}
        <div className="absolute inset-0 bg-gradient-to-r from-tela via-tela/75 to-tela/0 sm:via-tela/55" />
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-tela to-tela/0" />
        {/* Garante leitura do nome do site no topo, mesmo com cena clara. */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-tela/80 to-tela/0" />
      </div>

      <div className="moldura relative pt-40 pb-14 sm:pb-20">
        <p className="text-sm font-medium text-luz">{MOTIVO[ordem]}</p>
        <h2
          id="destaque-titulo"
          className="mt-2 max-w-[14ch] font-letreiro text-[clamp(3.25rem,9vw,8.5rem)] leading-[0.86] font-black text-balance uppercase"
        >
          {filme.titulo}
        </h2>
        <p className="mt-5 flex items-center gap-4 text-base text-apagado">
          <span className="font-semibold text-luz">★ {filme.nota.toFixed(1)}</span>
          {filme.ano && <span>{filme.ano}</span>}
        </p>
        {filme.sinopse && (
          <p className="mt-4 line-clamp-3 max-w-[52ch] text-base leading-relaxed text-texto/85 sm:text-lg">{filme.sinopse}</p>
        )}
        <Link
          href={`/filme/${filme.id}`}
          className="mt-8 inline-block rounded-md bg-luz px-6 py-3 text-sm font-semibold text-tela hover:bg-texto focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-luz"
        >
          Ver detalhes
        </Link>
      </div>
    </section>
  );
}
