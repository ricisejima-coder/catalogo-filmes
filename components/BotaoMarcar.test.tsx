import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { marcarFilme } from "@/lib/marcacoes/acoes";
import type { Lista, ResultadoMarcacao } from "@/lib/marcacoes/tipos";
import { BotaoMarcar } from "./BotaoMarcar";

const push = vi.fn();
vi.mock("@/lib/marcacoes/acoes", () => ({ marcarFilme: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/filme/550",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push }),
}));

const marcar = vi.mocked(marcarFilme);
beforeEach(() => {
  marcar.mockReset();
  push.mockReset();
});

function montar(marcacao: Lista | null = null, logado = true, variante: "compacta" | "completa" = "compacta") {
  return render(<BotaoMarcar filmeId={550} titulo="Duna" marcacao={marcacao} logado={logado} variante={variante} />);
}
const quero = () => screen.getByRole("button", { name: "Marcar Duna como quero ver" });
const jaVi = () => screen.getByRole("button", { name: "Marcar Duna como já vi" });

it("mostra os dois botões com aria-pressed e rótulo com o título", () => {
  montar("quero_ver");
  expect(quero()).toHaveAttribute("aria-pressed", "true");
  expect(jaVi()).toHaveAttribute("aria-pressed", "false");
});

it("clicar no inativo chama marcarFilme(id, lista) e acende na hora", async () => {
  let resolver!: (r: ResultadoMarcacao) => void;
  marcar.mockReturnValue(new Promise((r) => (resolver = r)));
  montar(null);
  await userEvent.click(jaVi());
  expect(marcar).toHaveBeenCalledWith(550, "ja_vi");
  expect(jaVi()).toHaveAttribute("aria-pressed", "true");
  resolver("ok");
  await waitFor(() => expect(quero()).not.toBeDisabled());
});

it("clicar no ativo chama marcarFilme(id, null)", async () => {
  marcar.mockResolvedValue("ok");
  montar("quero_ver");
  await userEvent.click(quero());
  expect(marcar).toHaveBeenCalledWith(550, null);
  await waitFor(() => expect(quero()).not.toBeDisabled());
});

it("enquanto grava, os botões ficam desabilitados", async () => {
  let resolver!: (r: ResultadoMarcacao) => void;
  marcar.mockReturnValue(new Promise((r) => (resolver = r)));
  montar(null);
  await userEvent.click(quero());
  expect(quero()).toBeDisabled();
  expect(jaVi()).toBeDisabled();
  resolver("ok");
  await waitFor(() => expect(jaVi()).not.toBeDisabled());
});

it("se a ação devolver 'erro', volta ao estado anterior e mostra a mensagem", async () => {
  marcar.mockResolvedValue("erro");
  montar(null);
  await userEvent.click(quero());
  expect(await screen.findByRole("alert")).toHaveTextContent("Não deu para salvar, tente de novo");
  await waitFor(() => expect(quero()).toHaveAttribute("aria-pressed", "false"));
});

it("sem login, o clique leva a /entrar?voltar=<página atual> sem chamar a ação", async () => {
  montar(null, false);
  await userEvent.click(quero());
  expect(push).toHaveBeenCalledWith("/entrar?voltar=%2Ffilme%2F550");
  expect(marcar).not.toHaveBeenCalled();
});

it("se a ação devolver 'sem-login' (sessão expirada), também leva a /entrar", async () => {
  marcar.mockResolvedValue("sem-login");
  montar(null);
  await userEvent.click(quero());
  await waitFor(() => expect(push).toHaveBeenCalledWith("/entrar?voltar=%2Ffilme%2F550"));
});

it("variante completa mostra os textos 'Quero ver' e 'Já vi'", () => {
  montar(null, true, "completa");
  expect(screen.getByText("Quero ver")).toBeInTheDocument();
  expect(screen.getByText("Já vi")).toBeInTheDocument();
});
