import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Erro from "./error";

it("mostra erro amigável e tenta de novo", async () => {
  const retry = vi.fn();
  vi.spyOn(console, "error").mockImplementation(() => {});
  render(<Erro error={new Error("x")} retry={retry} />);
  expect(screen.getByText("Não conseguimos carregar os filmes agora")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
  expect(retry).toHaveBeenCalled();
});
