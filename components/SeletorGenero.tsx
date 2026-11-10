import type { Genero } from "@/lib/tmdb/tipos";

type Props = { generos: Genero[]; valor?: number; aoMudar: (id: number | undefined) => void };

export function SeletorGenero({ generos, valor, aoMudar }: Props) {
  return (
    <label className="flex flex-col gap-1 text-xs text-apagado">
      Gênero
      <select
        value={valor ?? ""}
        onChange={(e) => aoMudar(e.target.value ? Number(e.target.value) : undefined)}
        className="rounded-md border border-white/15 bg-pelicula px-3 py-2 text-sm text-texto focus-visible:border-luz focus-visible:outline-none"
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
