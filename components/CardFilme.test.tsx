import { render, screen } from "@testing-library/react";
import { CardFilme } from "./CardFilme";

const filme = { id: 7, titulo: "Duna", ano: "2021", nota: 7.8, posterUrl: "https://image.tmdb.org/t/p/w342/d.jpg", generoIds: [] };

it("mostra título, ano, nota e link para o detalhe", () => {
  render(<CardFilme filme={filme} />);
  expect(screen.getByRole("link")).toHaveAttribute("href", "/filme/7");
  expect(screen.getByText("Duna")).toBeInTheDocument();
  expect(screen.getByText("2021")).toBeInTheDocument();
  expect(screen.getByText("7.8")).toBeInTheDocument();
  expect(screen.getByAltText("Pôster de Duna")).toBeInTheDocument();
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
