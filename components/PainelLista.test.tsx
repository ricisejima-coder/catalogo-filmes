import { render, screen } from "@testing-library/react";
import { PainelLista } from "./PainelLista";

vi.mock("@/lib/filmesMarcados", () => ({ carregarFilmesMarcados: vi.fn(async () => []) }));
vi.mock("@/components/ListaMarcados", () => ({ ListaMarcados: () => <p>lista</p> }));

it("deslogado: convida a entrar, voltando para a aba", async () => {
  render(await PainelLista({ aba: "quero_ver", logado: false, marcacoes: [] }));
  expect(screen.getByText("Entre para montar suas listas")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/entrar?voltar=%2F%3Faba%3Dquero-ver");
});

it("Supabase indisponível: avisa que não deu para carregar", async () => {
  render(await PainelLista({ aba: "quero_ver", logado: false, indisponivel: true, marcacoes: null }));
  expect(screen.getByText("Não deu para carregar suas listas agora")).toBeInTheDocument();
  expect(screen.queryByText("Entre para montar suas listas")).not.toBeInTheDocument();
});

it("logado com falha ao listar: avisa que não deu para carregar", async () => {
  render(await PainelLista({ aba: "ja_vi", logado: true, marcacoes: null }));
  expect(screen.getByText("Não deu para carregar suas listas agora")).toBeInTheDocument();
});
