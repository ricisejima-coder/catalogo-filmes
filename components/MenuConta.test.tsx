import { render, screen } from "@testing-library/react";
import { MenuConta } from "./MenuConta";

it("sem usuário mostra o link Entrar para /entrar", () => {
  render(<MenuConta usuario={null} acaoSair={vi.fn()} />);
  expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/entrar");
});

it("com usuário mostra o e-mail e o botão Sair", () => {
  render(<MenuConta usuario={{ email: "ana@x.com" }} acaoSair={vi.fn()} />);
  expect(screen.getByText("ana@x.com")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Entrar" })).not.toBeInTheDocument();
});
