"use client";

import { useOptimistic, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { hrefEntrar } from "@/lib/caminhoVolta";
import { marcarFilme } from "@/lib/marcacoes/acoes";
import type { Lista } from "@/lib/marcacoes/tipos";

type Props = {
  filmeId: number;
  titulo: string;
  marcacao: Lista | null;
  logado: boolean;
  variante: "compacta" | "completa";
};

function IconeQueroVer() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 shrink-0" fill="currentColor">
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
    </svg>
  );
}

function IconeJaVi() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function BotaoMarcar({ filmeId, titulo, marcacao, logado, variante }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [otimista, definirOtimista] = useOptimistic(marcacao);
  const [pendente, iniciarTransicao] = useTransition();
  const [erro, setErro] = useState(false);

  const caminhoAtual = pathname + (search ? "?" + search : "");

  function clicar(lista: Lista) {
    setErro(false);
    if (!logado) {
      router.push(hrefEntrar(caminhoAtual));
      return;
    }
    const nova = otimista === lista ? null : lista;
    iniciarTransicao(async () => {
      definirOtimista(nova);
      const resultado = await marcarFilme(filmeId, nova);
      if (resultado === "sem-login") router.push(hrefEntrar(caminhoAtual));
      else if (resultado === "erro") setErro(true);
    });
  }

  const compacta = variante === "compacta";
  const itens: { lista: Lista; texto: string; rotulo: string; icone: React.ReactNode }[] = [
    { lista: "quero_ver", texto: "Quero ver", rotulo: `Marcar ${titulo} como quero ver`, icone: <IconeQueroVer /> },
    { lista: "ja_vi", texto: "Já vi", rotulo: `Marcar ${titulo} como já vi`, icone: <IconeJaVi /> },
  ];

  return (
    <div className={compacta ? "flex flex-col items-end gap-1" : "flex flex-col gap-2"}>
      <div className="flex gap-2">
        {itens.map(({ lista, texto, rotulo, icone }) => {
          const ativo = otimista === lista;
          const classes = compacta
            ? `flex size-7 items-center justify-center rounded-full bg-black/60 hover:text-luz focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-luz disabled:opacity-60 ${ativo ? "text-luz" : "text-texto"}`
            : `flex items-center gap-2 rounded-md border px-6 py-2.5 text-sm font-medium hover:border-luz hover:text-luz focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-luz disabled:opacity-50 ${ativo ? "border-luz text-luz" : "border-white/20 text-texto"}`;
          return (
            <button
              key={lista}
              type="button"
              aria-label={rotulo}
              aria-pressed={ativo}
              disabled={pendente}
              onClick={() => clicar(lista)}
              className={classes}
            >
              {icone}
              {!compacta && <span>{texto}</span>}
            </button>
          );
        })}
      </div>
      {erro && (
        <p role="alert" className="rounded bg-black/70 px-2 py-1 text-xs text-red-400">
          Não deu para salvar, tente de novo
        </p>
      )}
    </div>
  );
}
