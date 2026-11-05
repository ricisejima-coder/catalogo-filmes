import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FILTROS_PADRAO } from "@/lib/filtros";
import { respostaJson } from "@/tests/fetchFalso";
import { BotaoCarregarMais } from "./BotaoCarregarMais";

const filmeX = { id: 42, titulo: "Filme X", ano: "2020", nota: 7, posterUrl: null, generoIds: [] };
const fetchFalso = vi.fn();
beforeEach(() => {
  fetchFalso.mockReset();
  vi.stubGlobal("fetch", fetchFalso);
});

it("busca a próxima página e mostra os filmes", async () => {
  fetchFalso.mockResolvedValue(respostaJson({ filmes: [filmeX], pagina: 2, temMais: false }));
  render(<BotaoCarregarMais filtros={{ streamings: [8], ordem: "populares" }} ultimaPagina={1} temMais />);
  await userEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
  expect(fetchFalso).toHaveBeenCalledWith("/api/filmes?streaming=8&pagina=2");
  expect(await screen.findByText("Filme X")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Carregar mais" })).not.toBeInTheDocument();
});

it("continua da última página devolvida", async () => {
  fetchFalso
    .mockResolvedValueOnce(respostaJson({ filmes: [], pagina: 4, temMais: true }))
    .mockResolvedValueOnce(respostaJson({ filmes: [filmeX], pagina: 5, temMais: false }));
  render(<BotaoCarregarMais filtros={FILTROS_PADRAO} ultimaPagina={1} temMais />);
  await userEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
  await userEvent.click(await screen.findByRole("button", { name: "Carregar mais" }));
  expect(fetchFalso).toHaveBeenLastCalledWith("/api/filmes?pagina=5");
  expect(await screen.findByText("Filme X")).toBeInTheDocument();
});

it("em erro mostra mensagem e Tentar de novo", async () => {
  fetchFalso.mockResolvedValue(respostaJson({ erro: "x" }, 502));
  render(<BotaoCarregarMais filtros={FILTROS_PADRAO} ultimaPagina={1} temMais />);
  await userEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
  expect(await screen.findByText("Não foi possível carregar mais filmes.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Tentar de novo" })).toBeInTheDocument();
});

it("falha de rede também mostra o erro", async () => {
  fetchFalso.mockRejectedValue(new TypeError("offline"));
  render(<BotaoCarregarMais filtros={FILTROS_PADRAO} ultimaPagina={1} temMais />);
  await userEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
  expect(await screen.findByText("Não foi possível carregar mais filmes.")).toBeInTheDocument();
});

it("sem mais páginas não mostra o botão", () => {
  render(<BotaoCarregarMais filtros={FILTROS_PADRAO} ultimaPagina={1} temMais={false} />);
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
