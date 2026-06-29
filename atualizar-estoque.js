const fs = require("fs");
const path = require("path");
const CAMINHO_ESTOQUE = path.join(__dirname, "estoque.json");

function carregarEstoque() {
  return JSON.parse(fs.readFileSync(CAMINHO_ESTOQUE, "utf-8"));
}
function salvarEstoque(estoque) {
  fs.writeFileSync(CAMINHO_ESTOQUE, JSON.stringify(estoque, null, 2), "utf-8");
}

const args = process.argv.slice(2);
const comando = args[0];
if (!comando) { mostrarAjuda(); process.exit(0); }

switch (comando.toLowerCase()) {
  case "ver": case "listar": verEstoque(); break;
  case "atualizar": case "set": atualizarSabor(args[1], args[2]); break;
  case "adicionar": case "add": adicionarSabor(args[1], args[2]); break;
  case "remover": case "deletar": removerSabor(args[1]); break;
  case "preco": atualizarPreco(args[1]); break;
  default: console.log("Comando nao reconhecido."); mostrarAjuda();
}

function verEstoque() {
  const estoque = carregarEstoque();
  console.log("
=== ESTOQUE ATUAL ===");
  console.log("Preco por unidade: R$ " + estoque.preco_unidade.toFixed(2) + "
");
  let total = 0;
  for (const [sabor, qtd] of Object.entries(estoque.sabores)) {
    const nome = sabor.charAt(0).toUpperCase() + sabor.slice(1);
    console.log("  [" + (qtd > 0 ? "OK" : "ESGOTADO") + "] " + nome + ": " + qtd + " unidades");
    total += qtd;
  }
  console.log("
Total: " + total + " sacoles");
  console.log("Valor total: R$ " + (total * estoque.preco_unidade).toFixed(2) + "
");
}

function atualizarSabor(sabor, quantidade) {
  if (!sabor || quantidade === undefined) {
    console.log("Use: node atualizar-estoque.js atualizar <sabor> <quantidade>");
    return;
  }
  const estoque = carregarEstoque();
  if (!estoque.sabores.hasOwnProperty(sabor.toLowerCase())) {
    console.log("Sabor nao existe. Use 'adicionar' para criar um novo.");
    return;
  }
  estoque.sabores[sabor.toLowerCase()] = Number(quantidade);
  salvarEstoque(estoque);
  console.log(sabor + " atualizado para " + quantidade + " unidades!");
}

function adicionarSabor(sabor, quantidade) {
  if (!sabor) { console.log("Use: node atualizar-estoque.js adicionar <sabor> <qtd>"); return; }
  const estoque = carregarEstoque();
  estoque.sabores[sabor.toLowerCase()] = Number(quantidade) || 0;
  salvarEstoque(estoque);
  console.log("Sabor " + sabor + " adicionado!");
}

function removerSabor(sabor) {
  if (!sabor) { console.log("Use: node atualizar-estoque.js remover <sabor>"); return; }
  const estoque = carregarEstoque();
  if (!estoque.sabores.hasOwnProperty(sabor.toLowerCase())) {
    console.log("Sabor nao existe."); return;
  }
  delete estoque.sabores[sabor.toLowerCase()];
  salvarEstoque(estoque);
  console.log("Sabor " + sabor + " removido!");
}

function atualizarPreco(novoPreco) {
  if (!novoPreco) { console.log("Use: node atualizar-estoque.js preco <valor>"); return; }
  const estoque = carregarEstoque();
  estoque.preco_unidade = Number(novoPreco);
  salvarEstoque(estoque);
  console.log("Preco atualizado para R$ " + Number(novoPreco).toFixed(2));
}

function mostrarAjuda() {
  console.log("SACOLE BOT - Gerenciador de Estoque");
  console.log("===================================
");
  console.log("  ver                      - Ver todo o estoque");
  console.log("  atualizar <sabor> <qtd>  - Mudar quantidade");
  console.log("  adicionar <sabor> <qtd>  - Adicionar novo sabor");
  console.log("  remover <sabor>          - Remover um sabor");
  console.log("  preco <valor>            - Alterar o preco
");
  console.log("Exemplos:");
  console.log("  node atualizar-estoque.js ver");
  console.log("  node atualizar-estoque.js atualizar morango 30");
  console.log("  node atualizar-estoque.js adicionar chocolate 15
");
}
