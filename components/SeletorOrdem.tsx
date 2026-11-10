import type { Ordem } from "@/lib/filtros";

type Props = { valor: Ordem; desabilitado: boolean; aoMudar: (ordem: Ordem) => void };

const OPCOES: { valor: Ordem; rotulo: string }[] = [
  { valor: "populares", rotulo: "Mais populares" },
  { valor: "avaliados", rotulo: "Melhor avaliados" },
  { valor: "recentes", rotulo: "Mais recentes" },
];

export function SeletorOrdem({ valor, desabilitado, aoMudar }: Props) {
  return (
    <div className="flex flex-col gap-1 text-xs text-apagado">
      <label htmlFor="ordem">Ordenar por</label>
      <select
        id="ordem"
        value={valor}
        disabled={desabilitado}
        onChange={(e) => aoMudar(e.target.value as Ordem)}
        className="rounded-md border border-white/15 bg-pelicula px-3 py-2 text-sm text-texto focus-visible:border-luz focus-visible:outline-none disabled:opacity-50"
      >
        {OPCOES.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.rotulo}
          </option>
        ))}
      </select>
      {desabilitado && <span className="text-zinc-500">Ordenado por relevância</span>}
    </div>
  );
}
