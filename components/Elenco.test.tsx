import { render, screen } from "@testing-library/react";
import { Elenco } from "./Elenco";

it("elenco vazio não renderiza nada", () => {
  const { container } = render(<Elenco pessoas={[]} />);
  expect(container).toBeEmptyDOMElement();
});

it("mostra nome e personagem; sem foto usa avatar padrão", () => {
  render(<Elenco pessoas={[{ nome: "Ana", personagem: "Rita", fotoUrl: null }]} />);
  expect(screen.getByAltText("Ana").getAttribute("src")).toContain("sem-foto.svg");
  expect(screen.getByText("Ana")).toBeInTheDocument();
  expect(screen.getByText("Rita")).toBeInTheDocument();
});
