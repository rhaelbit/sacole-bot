const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

const CAMINHO_ESTOQUE = path.join(__dirname, "estoque.json");

function carregarEstoque() {
  const dados = fs.readFileSync(CAMINHO_ESTOQUE, "utf-8");
  return JSON.parse(dados);
}

function salvarEstoque(estoque) {
  fs.writeFileSync(CAMINHO_ESTOQUE, JSON.stringify(estoque, null, 2), "utf-8");
}

function montarInfoEstoque() {
  const estoque = carregarEstoque();
  const preco = estoque.preco_unidade;
  const sabores = estoque.sabores;
  let texto = "INFORMACOES ATUALIZADAS DA LOJA:
";
  texto += "- Preco por unidade: R$ " + preco.toFixed(2) + "
";
  texto += "- Sabores disponiveis e quantidade em estoque:
";
  for (const [sabor, quantidade] of Object.entries(sabores)) {
    const status = quantidade > 0 ? quantidade + " unidades" : "ESGOTADO";
    texto += "  - " + sabor.charAt(0).toUpperCase() + sabor.slice(1) + ": " + status + "
";
  }
  return texto;
}

function criarInstrucaoSistema() {
  const infoEstoque = montarInfoEstoque();
  return `Voce e a atendente virtual da loja de sacole (geladinho/gelinho).
Seu nome e Gelinha. Voce e simpatica, educada e direta.

REGRAS IMPORTANTES:
1. Sempre cumprimente o cliente de forma amigavel
2. Informe os sabores disponiveis e o preco quando perguntarem
3. Se um sabor esta ESGOTADO (0 unidades), avise que nao tem no momento
4. O preco e SEMPRE o mesmo para todos os sabores
5. Para pedidos, pergunte: sabor, quantidade e forma de entrega (retirada ou entrega)
6. Se o cliente pedir mais do que tem em estoque, avise a quantidade disponivel
7. Aceite pedidos via Pix ou dinheiro
8. Seja breve e objetiva nas respostas
9. Use emojis com moderacao para ser mais simpatica
10. Se perguntarem algo que nao seja sobre sacole, diga educadamente que so pode ajudar com pedidos de sacole

${infoEstoque}

EXEMPLO DE ATENDIMENTO:
Cliente: "Oi, quais sabores voces tem?"
Gelinha: "Oi! Temos os seguintes sabores disponiveis: [lista sabores com estoque > 0]. Cada sacole custa R$ 6,00. Qual voce gostaria?"
`;
}

class AgenteSacole {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error("API Key do Google Gemini nao configurada!");
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    this.conversas = new Map();
  }

  obterConversa(clienteId) {
    if (!this.conversas.has(clienteId)) {
      this.conversas.set(clienteId, []);
    }
    return this.conversas.get(clienteId);
  }

  async responder(clienteId, mensagem) {
    try {
      const historico = this.obterConversa(clienteId);
      const instrucaoSistema = criarInstrucaoSistema();
      const mensagens = [];
      const historicoRecente = historico.slice(-10);
      for (const msg of historicoRecente) {
        mensagens.push(msg);
      }
      mensagens.push({ role: "user", parts: [{ text: mensagem }] });

      const chat = this.model.startChat({
        history: mensagens.slice(0, -1),
        systemInstruction: instrucaoSistema,
      });

      const resultado = await chat.sendMessage(mensagem);
      const resposta = resultado.response.text();
      historico.push({ role: "user", parts: [{ text: mensagem }] });
      historico.push({ role: "model", parts: [{ text: resposta }] });
      return resposta;
    } catch (erro) {
      console.error("Erro ao gerar resposta:", erro.message);
      return "Desculpe, estou com um probleminha tecnico. Pode tentar de novo em alguns segundos?";
    }
  }

  limparConversa(clienteId) {
    this.conversas.delete(clienteId);
  }
}

module.exports = { AgenteSacole, carregarEstoque, salvarEstoque };
