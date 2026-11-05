import { render, screen } from "@testing-library/react";
import { EstadoVazio } from "./EstadoVazio";

it("estado vazio oferece limpar filtros", () => {
  render(<EstadoVazio />);
  expect(screen.getByText("Nenhum filme encontrado com esses filtros")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Limpar filtros" })).toHaveAttribute("href", "/");
});
