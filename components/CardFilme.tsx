import Image from "next/image";
import Link from "next/link";
import type { FilmeResumo } from "@/lib/tmdb/tipos";

export function CardFilme({ filme }: { filme: FilmeResumo }) {
  // Cartão deitado, como uma tela de cinema. Sem cena disponível, mostra o pôster sobre fundo escuro.
  const temCena = Boolean(filme.fundoUrl);

  return (
    <Link href={`/filme/${filme.id}`} className="group block rounded-md focus-visible:outline-none">
      <div className="relative aspect-video overflow-hidden rounded-md bg-pelicula ring-2 ring-transparent group-hover:ring-luz group-focus-visible:ring-luz">
        {temCena ? (
          <Image
            src={filme.fundoUrl!}
            alt={`Cena de ${filme.titulo}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1536px) 25vw, 20vw"
            className="object-cover"
          />
        ) : (
          <Image
            src={filme.posterUrl ?? "/sem-poster.svg"}
            alt={`Pôster de ${filme.titulo}`}
            fill
            sizes="(max-width: 640px) 25vw, 12vw"
            className="object-contain py-2"
          />
        )}
      </div>
      <h3 className="mt-2.5 line-clamp-1 text-sm font-medium text-texto group-hover:text-luz">{filme.titulo}</h3>
      <p className="mt-0.5 flex gap-3 text-xs text-apagado">
        <span className="text-luz">
          ★ <span>{filme.nota.toFixed(1)}</span>
        </span>
        {filme.ano && <span>{filme.ano}</span>}
      </p>
    </Link>
  );
}
