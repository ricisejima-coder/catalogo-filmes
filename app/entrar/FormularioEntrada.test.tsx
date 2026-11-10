import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormularioEntrada } from "./FormularioEntrada";

function montar(over: Partial<Parameters<typeof FormularioEntrada>[0]> = {}) {
  const acaoEntrar = vi.fn().mockResolvedValue({ erro: null });
  const acaoCriarConta = vi.fn().mockResolvedValue({ erro: null });
  render(<FormularioEntrada voltar="/filme/550" acaoEntrar={acaoEntrar} acaoCriarConta={acaoCriarConta} {...over} />);
  return { acaoEntrar, acaoCriarConta };
}

it("começa em Entrar e alterna para Criar conta", async () => {
  montar();
  expect(screen.getByRole("tab", { name: "Entrar" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("button", { name: "Entrar" })).toHaveAttribute("type", "submit");
  await userEvent.click(screen.getByRole("tab", { name: "Criar conta" }));
  expect(screen.getByRole("tab", { name: "Criar conta" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("tab", { name: "Entrar" })).toHaveAttribute("aria-selected", "false");
  expect(screen.getByRole("button", { name: "Criar conta" })).toHaveAttribute("type", "submit");
});

it("envia e-mail, senha e o voltar escondido para a ação da aba ativa", async () => {
  const { acaoEntrar, acaoCriarConta } = montar();
  await userEvent.click(screen.getByRole("tab", { name: "Criar conta" }));
  await userEvent.type(screen.getByLabelText("E-mail"), "a@x.com");
  await userEvent.type(screen.getByLabelText("Senha"), "123456");
  await userEvent.click(screen.getByRole("button", { name: "Criar conta" }));
  expect(acaoCriarConta).toHaveBeenCalledTimes(1);
  expect(acaoEntrar).not.toHaveBeenCalled();
  const dados = acaoCriarConta.mock.calls[0][1] as FormData;
  expect(dados.get("email")).toBe("a@x.com");
  expect(dados.get("senha")).toBe("123456");
  expect(dados.get("voltar")).toBe("/filme/550");
});

it("mostra o erro devolvido pela ação", async () => {
  montar({ acaoEntrar: vi.fn().mockResolvedValue({ erro: "E-mail ou senha incorretos" }) });
  await userEvent.type(screen.getByLabelText("E-mail"), "a@x.com");
  await userEvent.type(screen.getByLabelText("Senha"), "123456");
  await userEvent.click(screen.getByRole("button", { name: "Entrar" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("E-mail ou senha incorretos");
});
