const express = require("express");
const path = require("path");
const { AgenteSacole } = require("./agente");

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("ERRO: Configure a variavel GEMINI_API_KEY!");
  console.error("  No Linux/Mac: export GEMINI_API_KEY=sua_chave_aqui");
  console.error("  No Windows: set GEMINI_API_KEY=sua_chave_aqui");
  console.error("  Veja o README.md para instrucoes.");
  process.exit(1);
}

const agente = new AgenteSacole(API_KEY);
const app = express();
const PORTA = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/api/mensagem", async (req, res) => {
  const { mensagem, clienteId } = req.body;
  if (!mensagem) {
    return res.status(400).json({ erro: "Mensagem nao pode ser vazia" });
  }
  const id = clienteId || "web-" + req.ip;
  const resposta = await agente.responder(id, mensagem);
  res.json({ resposta });
});

app.get("/api/estoque", (req, res) => {
  const { carregarEstoque } = require("./agente");
  res.json(carregarEstoque());
});

app.post("/api/estoque", (req, res) => {
  const { sabor, quantidade } = req.body;
  const { carregarEstoque, salvarEstoque } = require("./agente");
  if (!sabor) return res.status(400).json({ erro: "Informe o sabor" });
  if (quantidade === undefined || quantidade === null) {
    return res.status(400).json({ erro: "Informe a quantidade" });
  }
  const estoque = carregarEstoque();
  estoque.sabores[sabor.toLowerCase()] = Number(quantidade);
  salvarEstoque(estoque);
  res.json({ sucesso: true, mensagem: "Estoque de " + sabor + " atualizado para " + quantidade });
});

app.listen(PORTA, () => {
  console.log("");
  console.log("===========================================");
  console.log("  SACOLE BOT - Atendimento Inteligente");
  console.log("===========================================");
  console.log("");
  console.log("Servidor rodando em: http://localhost:" + PORTA);
  console.log("Estoque carregado com sucesso!");
  console.log("");
  console.log("Para parar o servidor, pressione Ctrl+C");
  console.log("");
});
