import type { Genero } from "@/lib/tmdb/tipos";

type Props = { generos: Genero[]; valor?: number; aoMudar: (id: number | undefined) => void };

export function SeletorGenero({ generos, valor, aoMudar }: Props) {
  return (
    <label className="flex flex-col gap-1 text-xs text-zinc-400">
      Gênero
      <select
        value={valor ?? ""}
        onChange={(e) => aoMudar(e.target.value ? Number(e.target.value) : undefined)}
        className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
      >
        <option value="">Todos</option>
        {generos.map((g) => (
          <option key={g.id} value={g.id}>
            {g.nome}
          </option>
        ))}
      </select>
    </label>
  );
}
