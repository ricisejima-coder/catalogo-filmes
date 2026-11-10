import { escreverFiltros, FILTROS_PADRAO, lerFiltros, type Filtros } from "./filtros";

it("lê todos os filtros", () => {
  expect(lerFiltros({ streaming: "8,119", genero: "28", ordem: "avaliados", busca: "batman" })).toEqual({
    streamings: [8, 119],
    genero: 28,
    ordem: "avaliados",
    busca: "batman",
  });
});

it("sem parâmetros devolve o padrão", () => {
  expect(lerFiltros({})).toEqual({ streamings: [], ordem: "populares" });
});

it("ignora ids inválidos e repetidos", () => {
  expect(lerFiltros({ streaming: "8,abc,8,,119" }).streamings).toEqual([8, 119]);
});

it("ignora gênero e ordem inválidos", () => {
  const f = lerFiltros({ genero: "x", ordem: "foo" });
  expect(f.genero).toBeUndefined();
  expect(f.ordem).toBe("populares");
});

it("busca só com espaços vira sem busca; busca é aparada", () => {
  expect(lerFiltros({ busca: "   " }).busca).toBeUndefined();
  expect(lerFiltros({ busca: "  batman " }).busca).toBe("batman");
});

it("usa o primeiro valor quando o parâmetro vem repetido", () => {
  expect(lerFiltros({ ordem: ["recentes", "avaliados"] }).ordem).toBe("recentes");
});

it("escreve só o que não é padrão", () => {
  expect(escreverFiltros(FILTROS_PADRAO)).toBe("");
  expect(escreverFiltros({ streamings: [8, 119], genero: 28, ordem: "recentes", busca: "ação & cia" })).toBe(
    "streaming=8%2C119&genero=28&ordem=recentes&busca=a%C3%A7%C3%A3o+%26+cia",
  );
});

it("ler(escrever(f)) devolve f", () => {
  const f: Filtros = { streamings: [337], genero: 35, ordem: "avaliados", busca: "amor" };
  expect(lerFiltros(Object.fromEntries(new URLSearchParams(escreverFiltros(f))))).toEqual(f);
});

it("lê a nota mínima e ignora valores fora da lista", () => {
  expect(lerFiltros({ nota: "8" }).notaMinima).toBe(8);
  expect(lerFiltros({ nota: "abc" }).notaMinima).toBeUndefined();
  expect(lerFiltros({ nota: "5" }).notaMinima).toBeUndefined();
  expect(lerFiltros({ nota: "10" }).notaMinima).toBeUndefined();
});

it("escreve a nota mínima na URL e ler(escrever) a preserva", () => {
  const f: Filtros = { streamings: [], ordem: "populares", notaMinima: 7 };
  expect(escreverFiltros(f)).toBe("nota=7");
  expect(lerFiltros(Object.fromEntries(new URLSearchParams(escreverFiltros(f))))).toEqual(f);
});
