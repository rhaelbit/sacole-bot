const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

const CAMINHO_ESTOQUE = path.join(__dirname, "estoque.json");

function carregarEstoque() {
  var dados = fs.readFileSync(CAMINHO_ESTOQUE, "utf-8");
  return JSON.parse(dados);
}

function salvarEstoque(estoque) {
  fs.writeFileSync(CAMINHO_ESTOQUE, JSON.stringify(estoque, null, 2), "utf-8");
}

function montarInfoEstoque() {
  var estoque = carregarEstoque();
  var preco = estoque.preco_unidade;
  var sabores = estoque.sabores;
  var texto = "INFORMACOES ATUALIZADAS DA LOJA:
";
  texto += "- Preco por unidade: R$ " + preco.toFixed(2) + "
";
  texto += "- Sabores disponiveis e quantidade em estoque:
";
  var keys = Object.keys(sabores);
  for (var i = 0; i < keys.length; i++) {
    var sabor = keys[i];
    var quantidade = sabores[sabor];
    var status = quantidade > 0 ? quantidade + " unidades" : "ESGOTADO";
    texto += "  - " + sabor.charAt(0).toUpperCase() + sabor.slice(1) + ": " + status + "
";
  }
  return texto;
}

function criarInstrucaoSistema() {
  var infoEstoque = montarInfoEstoque();
  var instrucao = "Voce e a atendente virtual da loja de sacole (geladinho/gelinho).
";
  instrucao += "Seu nome e Gelinha. Voce e simpatica, educada e direta.

";
  instrucao += "REGRAS IMPORTANTES:
";
  instrucao += "1. Sempre cumprimente o cliente de forma amigavel
";
  instrucao += "2. Informe os sabores disponiveis e o preco quando perguntarem
";
  instrucao += "3. Se um sabor esta ESGOTADO (0 unidades), avise que nao tem no momento
";
  instrucao += "4. O preco e SEMPRE o mesmo para todos os sabores
";
  instrucao += "5. Para pedidos, pergunte: sabor, quantidade e forma de entrega (retirada ou entrega)
";
  instrucao += "6. Se o cliente pedir mais do que tem em estoque, avise a quantidade disponivel
";
  instrucao += "7. Aceite pedidos via Pix ou dinheiro
";
  instrucao += "8. Seja breve e objetiva nas respostas
";
  instrucao += "9. Use emojis com moderacao para ser mais simpatica
";
  instrucao += "10. Se perguntarem algo que nao seja sobre sacole, diga educadamente que so pode ajudar com pedidos de sacole

";
  instrucao += infoEstoque + "
";
  instrucao += "EXEMPLO DE ATENDIMENTO:
";
  instrucao += "Cliente: Oi, quais sabores voces tem?
";
  instrucao += "Gelinha: Oi! Temos os seguintes sabores disponiveis: [lista sabores com estoque > 0]. Cada sacole custa R$ 6,00. Qual voce gostaria?
";
  return instrucao;
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
      var historico = this.obterConversa(clienteId);
      var instrucaoSistema = criarInstrucaoSistema();
      var mensagens = [];
      var historicoRecente = historico.slice(-10);
      for (var i = 0; i < historicoRecente.length; i++) {
        mensagens.push(historicoRecente[i]);
      }
      mensagens.push({ role: "user", parts: [{ text: mensagem }] });

      var chat = this.model.startChat({
        history: mensagens.slice(0, -1),
        systemInstruction: instrucaoSistema,
      });

      var resultado = await chat.sendMessage(mensagem);
      var resposta = resultado.response.text();
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
