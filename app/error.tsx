"use client";

import { useEffect } from "react";

export default function Erro({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
      <p className="text-lg text-zinc-300">Não conseguimos carregar os filmes agora</p>
      <button
        type="button"
        onClick={() => retry()}
        className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-300"
      >
        Tentar de novo
      </button>
    </div>
  );
}
