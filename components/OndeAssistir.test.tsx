import { render, screen } from "@testing-library/react";
import { OndeAssistir } from "./OndeAssistir";

it("onde assistir lista logos e atribuição", () => {
  render(<OndeAssistir streamings={[{ id: 8, nome: "Netflix", logoUrl: "https://image.tmdb.org/t/p/w92/n.png" }]} />);
  expect(screen.getByAltText("Netflix")).toBeInTheDocument();
  expect(screen.getByText("Dados de streaming fornecidos por JustWatch.")).toBeInTheDocument();
});

it("onde assistir vazio explica", () => {
  render(<OndeAssistir streamings={[]} />);
  expect(screen.getByText("No momento não está em nenhum streaming por assinatura no Brasil.")).toBeInTheDocument();
});
