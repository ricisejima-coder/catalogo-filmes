import { render, screen } from "@testing-library/react";
import { Rodape } from "./Rodape";

it("mostra as atribuições do TMDB e do JustWatch", () => {
  render(<Rodape />);
  expect(
    screen.getByText("Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB."),
  ).toBeInTheDocument();
  expect(screen.getByText("Dados de streaming fornecidos por JustWatch.")).toBeInTheDocument();
  expect(screen.getByAltText("TMDB")).toBeInTheDocument();
});
