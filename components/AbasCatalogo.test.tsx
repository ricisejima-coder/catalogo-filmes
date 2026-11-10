import { render, screen } from "@testing-library/react";
import { AbasCatalogo } from "./AbasCatalogo";

it("mostra três links com hrefAba e aria-current='page' na ativa", () => {
  render(<AbasCatalogo ativa="quero_ver" />);
  expect(screen.getByRole("link", { name: "Em streaming" })).toHaveAttribute("href", "/");
  expect(screen.getByRole("link", { name: "Quero ver" })).toHaveAttribute("href", "/?aba=quero-ver");
  expect(screen.getByRole("link", { name: "Já vi" })).toHaveAttribute("href", "/?aba=ja-vi");
  expect(screen.getByRole("link", { name: "Quero ver" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: "Já vi" })).not.toHaveAttribute("aria-current");
  expect(screen.getByRole("navigation", { name: "Listas" })).toBeInTheDocument();
});
