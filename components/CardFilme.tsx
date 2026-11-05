import Image from "next/image";
import Link from "next/link";
import type { FilmeResumo } from "@/lib/tmdb/tipos";

export function CardFilme({ filme }: { filme: FilmeResumo }) {
  return (
    <Link
      href={`/filme/${filme.id}`}
      className="group block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-zinc-800 shadow-lg ring-1 ring-white/5 transition duration-300 group-hover:-translate-y-1 group-hover:shadow-amber-500/10 group-hover:ring-amber-400/40">
        <Image
          src={filme.posterUrl ?? "/sem-poster.svg"}
          alt={`Pôster de ${filme.titulo}`}
          width={342}
          height={513}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <span className="absolute top-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 text-xs font-semibold text-amber-300 backdrop-blur-sm">
          ★ <span>{filme.nota.toFixed(1)}</span>
        </span>
      </div>
      <h3 className="mt-2 line-clamp-2 text-sm font-medium leading-snug text-zinc-100 group-hover:text-amber-300">
        {filme.titulo}
      </h3>
      {filme.ano && <p className="text-xs text-zinc-500">{filme.ano}</p>}
    </Link>
  );
}
