import Image from "next/image";
import type { Streaming } from "@/lib/tmdb/tipos";

type Props = { streamings: Streaming[]; selecionados: number[]; aoAlternar: (id: number) => void };

export function SeletorStreamings({ streamings, selecionados, aoAlternar }: Props) {
  return (
    <div role="group" aria-label="Streamings" className="flex flex-wrap gap-2">
      {streamings.map((s) => {
        const ativo = selecionados.includes(s.id);
        return (
          <button
            key={s.id}
            type="button"
            aria-label={s.nome}
            aria-pressed={ativo}
            title={s.nome}
            onClick={() => aoAlternar(s.id)}
            className={`size-11 overflow-hidden rounded-xl ring-2 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 ${
              ativo ? "scale-105 ring-amber-400" : "opacity-60 ring-transparent grayscale hover:opacity-100 hover:grayscale-0"
            }`}
          >
            {s.logoUrl ? (
              <Image src={s.logoUrl} alt="" width={92} height={92} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-zinc-800 text-[10px] leading-tight">{s.nome}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
