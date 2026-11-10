"use client";

import { useActionState, useState } from "react";
import type { EstadoEntrada } from "./credenciais";

type AcaoEntrada = (e: EstadoEntrada, d: FormData) => Promise<EstadoEntrada>;
type Aba = "entrar" | "criar";

const ESTADO_INICIAL: EstadoEntrada = { erro: null };
const CAMPO =
  "w-full rounded-md border border-white/20 bg-pelicula px-3 py-2.5 text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-luz";

export function FormularioEntrada({
  voltar,
  acaoEntrar,
  acaoCriarConta,
}: {
  voltar: string;
  acaoEntrar: AcaoEntrada;
  acaoCriarConta: AcaoEntrada;
}) {
  const [aba, setAba] = useState<Aba>("entrar");
  const [estado, acao, pendente] = useActionState(aba === "entrar" ? acaoEntrar : acaoCriarConta, ESTADO_INICIAL);
  const criando = aba === "criar";
  const rotulo = criando ? "Criar conta" : "Entrar";

  const tab = (id: Aba, texto: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={aba === id}
      onClick={() => setAba(id)}
      className={`flex-1 border-b-2 px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-luz ${
        aba === id ? "border-luz text-luz" : "border-transparent text-apagado hover:text-texto"
      }`}
    >
      {texto}
    </button>
  );

  return (
    <div className="w-full max-w-sm">
      <div role="tablist" className="mb-6 flex border-b border-white/10">
        {tab("entrar", "Entrar")}
        {tab("criar", "Criar conta")}
      </div>
      <form action={acao} className="flex flex-col gap-4">
        <input type="hidden" name="voltar" value={voltar} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm text-apagado">E-mail</label>
          <input id="email" name="email" type="email" required autoComplete="email" className={CAMPO} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="senha" className="text-sm text-apagado">Senha</label>
          <input
            id="senha"
            name="senha"
            type="password"
            required
            autoComplete={criando ? "new-password" : "current-password"}
            className={CAMPO}
          />
        </div>
        {estado.erro && (
          <p role="alert" className="text-sm text-red-400">
            {estado.erro}
          </p>
        )}
        <button
          type="submit"
          disabled={pendente}
          className="rounded-md bg-luz px-6 py-2.5 text-sm font-semibold text-tela hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-luz disabled:opacity-50"
        >
          {rotulo}
        </button>
      </form>
    </div>
  );
}
