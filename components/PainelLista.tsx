import Link from "next/link";
import { ListaMarcados } from "@/components/ListaMarcados";
import { type Aba, hrefAba } from "@/lib/abas";
import { hrefEntrar } from "@/lib/caminhoVolta";
import { carregarFilmesMarcados } from "@/lib/filmesMarcados";
import type { Lista, Marcacao } from "@/lib/marcacoes/tipos";

type Props = {
  aba: Lista;
  logado: boolean;
  /** null = o Supabase falhou ao carregar. */
  marcacoes: Marcacao[] | null;
};

const TITULO: Record<Lista, string> = { quero_ver: "Quero ver", ja_vi: "Já vi" };

async function Conteudo({ aba, logado, marcacoes }: Props) {
  if (!logado) {
    const entrar: Aba = aba;
    return (
      <p className="text-apagado">
        <span>Entre para montar suas listas</span>{" "}
        <Link href={hrefEntrar(hrefAba(entrar))} className="font-semibold text-luz underline">
          Entrar
        </Link>
      </p>
    );
  }
  if (marcacoes === null) return <p className="text-apagado">Não deu para carregar suas listas agora</p>;
  return <ListaMarcados filmes={await carregarFilmesMarcados(marcacoes, aba)} lista={aba} logado />;
}

export function PainelLista(props: Props) {
  return (
    <>
      <h1 className="mb-6 font-letreiro text-4xl font-extrabold tracking-wide sm:text-5xl">{TITULO[props.aba]}</h1>
      <Conteudo {...props} />
    </>
  );
}
