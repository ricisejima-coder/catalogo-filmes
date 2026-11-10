"use client";

import { useState } from "react";

type Props = { valorInicial?: string; aoBuscar: (texto: string) => void };

export function CampoBusca({ valorInicial = "", aoBuscar }: Props) {
  const [texto, setTexto] = useState(valorInicial);
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        aoBuscar(texto);
      }}
      className="flex-1"
    >
      <label className="flex flex-col gap-1 text-xs text-apagado">
        Buscar filme
        <input
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Digite o nome e aperte Enter"
          className="w-full rounded-md border border-white/15 bg-pelicula px-3 py-2 text-sm text-texto placeholder:text-zinc-500 focus-visible:border-luz focus-visible:outline-none"
        />
      </label>
    </form>
  );
}
