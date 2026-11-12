import { render, screen } from "@testing-library/react";
import { ListaMarcados } from "./ListaMarcados";

vi.mock("@/lib/marcacoes/acoes", () => ({ marcarFilme: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn() }),
}));

const base = { ano: "2021", nota: 7, posterUrl: null, generoIds: [] };

it("lista vazia mostra 'Nenhum filme aqui ainda. Marque filmes no catálogo.'", () => {
  render(<ListaMarcados filmes={[]} lista="quero_ver" logado />);
  expect(screen.getByText("Nenhum filme aqui ainda. Marque filmes no catálogo.")).toBeInTheDocument();
});

it("cada cartão vem com a marcação da lista e o selo quando fora do streaming", () => {
  render(
    <ListaMarcados
      filmes={[
        { ...base, id: 1, titulo: "Duna", foraDoStreaming: true },
        { ...base, id: 2, titulo: "Alien", foraDoStreaming: false },
      ]}
      lista="ja_vi"
      logado
    />,
  );
  expect(screen.getAllByText("Fora do streaming agora")).toHaveLength(1);
  expect(screen.getByRole("button", { name: "Marcar Duna como já vi" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "Marcar Alien como já vi" })).toHaveAttribute("aria-pressed", "true");
});
