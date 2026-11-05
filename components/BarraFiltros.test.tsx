import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FILTROS_PADRAO } from "@/lib/filtros";
import { BarraFiltros } from "./BarraFiltros";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
beforeEach(() => {
  push.mockClear();
});

const streamings = [
  { id: 8, nome: "Netflix", logoUrl: null },
  { id: 119, nome: "Prime Video", logoUrl: null },
];
const generos = [{ id: 28, nome: "Ação" }];

it("marcar um streaming adiciona à URL", async () => {
  render(<BarraFiltros streamings={streamings} generos={generos} filtros={{ streamings: [8], ordem: "populares" }} />);
  await userEvent.click(screen.getByRole("button", { name: "Prime Video" }));
  expect(push).toHaveBeenCalledWith("/?streaming=8%2C119");
});

it("desmarcar o último streaming volta para /", async () => {
  render(<BarraFiltros streamings={streamings} generos={generos} filtros={{ streamings: [8], ordem: "populares" }} />);
  expect(screen.getByRole("button", { name: "Netflix" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "Prime Video" })).toHaveAttribute("aria-pressed", "false");
  await userEvent.click(screen.getByRole("button", { name: "Netflix" }));
  expect(push).toHaveBeenCalledWith("/");
});

it("escolher gênero e ordem", async () => {
  render(<BarraFiltros streamings={streamings} generos={generos} filtros={FILTROS_PADRAO} />);
  await userEvent.selectOptions(screen.getByLabelText("Gênero"), "28");
  expect(push).toHaveBeenLastCalledWith("/?genero=28");
  await userEvent.selectOptions(screen.getByLabelText("Ordenar por"), "avaliados");
  expect(push).toHaveBeenLastCalledWith("/?ordem=avaliados");
});

it("voltar o gênero para Todos remove da URL", async () => {
  render(<BarraFiltros streamings={streamings} generos={generos} filtros={{ ...FILTROS_PADRAO, genero: 28 }} />);
  await userEvent.selectOptions(screen.getByLabelText("Gênero"), "");
  expect(push).toHaveBeenLastCalledWith("/");
});

it("buscar ao apertar Enter", async () => {
  render(<BarraFiltros streamings={streamings} generos={generos} filtros={FILTROS_PADRAO} />);
  await userEvent.type(screen.getByLabelText("Buscar filme"), "batman{Enter}");
  expect(push).toHaveBeenLastCalledWith("/?busca=batman");
});

it("com busca ativa a ordem fica desabilitada", () => {
  render(<BarraFiltros streamings={streamings} generos={generos} filtros={{ ...FILTROS_PADRAO, busca: "x" }} />);
  expect(screen.getByLabelText("Ordenar por")).toBeDisabled();
  expect(screen.getByText("Ordenado por relevância")).toBeInTheDocument();
});
