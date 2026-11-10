import { NOTAS_MINIMAS, type NotaMinima } from "@/lib/filtros";

type Props = { valor?: NotaMinima; aoMudar: (nota: NotaMinima | undefined) => void };

export function SeletorNota({ valor, aoMudar }: Props) {
  return (
    <label className="flex flex-col gap-1 text-xs text-apagado">
      Nota mínima
      <select
        value={valor ?? ""}
        onChange={(e) => aoMudar(e.target.value ? (Number(e.target.value) as NotaMinima) : undefined)}
        className="rounded-md border border-white/15 bg-pelicula px-3 py-2 text-sm text-texto focus-visible:border-luz focus-visible:outline-none"
      >
        <option value="">Qualquer nota</option>
        {NOTAS_MINIMAS.map((n) => (
          <option key={n} value={n}>
            {n}+
          </option>
        ))}
      </select>
    </label>
  );
}
