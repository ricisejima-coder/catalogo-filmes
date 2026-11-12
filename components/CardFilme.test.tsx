import { render, screen } from "@testing-library/react";
import { CardFilme } from "./CardFilme";

vi.mock("@/lib/marcacoes/acoes", () => ({ marcarFilme: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn() }),
}));

const filme = {
  id: 7,
  titulo: "Duna",
  ano: "2021",
  nota: 7.8,
  posterUrl: "https://image.tmdb.org/t/p/w342/d.jpg",
  generoIds: [],
};

it("mostra título, ano, nota e link para o detalhe", () => {
  render(<CardFilme filme={filme} />);
  expect(screen.getByRole("link")).toHaveAttribute("href", "/filme/7");
  expect(screen.getByText("Duna")).toBeInTheDocument();
  expect(screen.getByText("2021")).toBeInTheDocument();
  expect(screen.getByText("7.8")).toBeInTheDocument();
  expect(screen.getByAltText("Pôster de Duna")).toBeInTheDocument();
});

it("com cena disponível mostra a cena no lugar do pôster", () => {
  render(<CardFilme filme={{ ...filme, fundoUrl: "https://image.tmdb.org/t/p/w780/c.jpg" }} />);
  expect(screen.getByAltText("Cena de Duna")).toBeInTheDocument();
  expect(screen.queryByAltText("Pôster de Duna")).not.toBeInTheDocument();
});

it("sem pôster usa a imagem padrão", () => {
  render(<CardFilme filme={{ ...filme, posterUrl: null }} />);
  expect(screen.getByAltText("Pôster de Duna").getAttribute("src")).toContain("sem-poster.svg");
});

it("nota inteira aparece com uma casa decimal; sem ano não mostra ano", () => {
  render(<CardFilme filme={{ ...filme, nota: 8, ano: null }} />);
  expect(screen.getByText("8.0")).toBeInTheDocument();
  expect(screen.queryByText("2021")).not.toBeInTheDocument();
});

it("o botão de marcar fica fora do link do filme", () => {
  render(<CardFilme filme={filme} marcacao="ja_vi" logado />);
  const botao = screen.getByRole("button", { name: "Marcar Duna como já vi" });
  expect(botao).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("link")).not.toContainElement(botao);
});

it("foraDoStreaming mostra o selo", () => {
  render(<CardFilme filme={filme} foraDoStreaming />);
  expect(screen.getByText("Fora do streaming agora")).toBeInTheDocument();
});

it("sem foraDoStreaming não mostra o selo", () => {
  render(<CardFilme filme={filme} />);
  expect(screen.queryByText("Fora do streaming agora")).not.toBeInTheDocument();
});
