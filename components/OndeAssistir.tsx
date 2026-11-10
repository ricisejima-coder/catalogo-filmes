import Image from "next/image";
import type { Streaming } from "@/lib/tmdb/tipos";

export function OndeAssistir({ streamings }: { streamings: Streaming[] }) {
  return (
    <section aria-labelledby="onde-assistir">
      <h2 id="onde-assistir" className="mb-3 font-letreiro text-2xl font-extrabold tracking-wide">Onde assistir</h2>
      {streamings.length > 0 ? (
        <ul className="flex flex-wrap gap-3">
          {streamings.map((s) => (
            <li key={s.id} className="flex items-center gap-2 rounded-md bg-pelicula/90 py-1.5 pr-3 pl-1.5 ring-1 ring-white/10">
              {s.logoUrl ? (
                <Image src={s.logoUrl} alt={s.nome} width={36} height={36} className="rounded-lg" />
              ) : null}
              <span className="text-sm">{s.nome}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-apagado">No momento não está em nenhum streaming por assinatura no Brasil.</p>
      )}
      <p className="mt-2 text-xs text-zinc-500">Dados de streaming fornecidos por JustWatch.</p>
    </section>
  );
}
