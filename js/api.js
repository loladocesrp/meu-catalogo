// ============================================================
// js/api.js — Funções de comunicação com o Google Apps Script
// ============================================================

// ⚠️ COLE A URL DO SEU WEB APP AQUI APÓS IMPLANTAR
const API_URL = 'https://script.google.com/macros/s/AKfycbwkhihmHc_guI6A04JXJaT-QZNwZaEB05Uaq25YVjVciDbNLJGZBOqr9a49xru_5FDpcg/exec';



// -------------------------------------------------------
// UTILITÁRIO BASE
// -------------------------------------------------------
async function apiGet(params) {
  const url = new URL(API_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
  const res = await fetch(url.toString());
  return res.json();
}

async function apiPost(body) {
  const res = await fetch(API_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'text/plain' },
    body:    JSON.stringify(body)
  });
  return res.json();
}

// -------------------------------------------------------
// PRODUTOS
// -------------------------------------------------------
async function buscarProdutos() {
  return apiGet({ acao: 'listaProdutos' });
}

async function buscarProduto(id) {
  return apiGet({ acao: 'getProduto', id });
}

async function buscarCategorias() {
  return apiGet({ acao: 'listarCategorias' });
}

async function salvarProduto(produto) {
  const token = sessionStorage.getItem('adminToken');
  return apiPost({ acao: 'salvarProduto', produto, token });
}

async function editarProduto(produto) {
  const token = sessionStorage.getItem('adminToken');
  return apiPost({ acao: 'editarProduto', produto, token });
}

async function excluirProduto(id) {
  const token = sessionStorage.getItem('adminToken');
  return apiPost({ acao: 'excluirProduto', id, token });
}

// -------------------------------------------------------
// AUTENTICAÇÃO ADMIN
// -------------------------------------------------------
async function loginAdmin(usuario, senha) {
  return apiPost({ acao: 'loginAdmin', usuario, senha });
}

function adminLogado() {
  return !!sessionStorage.getItem('adminToken');
}

function adminLogout() {
  sessionStorage.removeItem('adminToken');
  sessionStorage.removeItem('adminUser');
  window.location.href = '../admin/login.html';
}

// -------------------------------------------------------
// AUTENTICAÇÃO CLIENTE
// -------------------------------------------------------
async function loginCliente(email, senha) {
  return apiPost({ acao: 'loginCliente', email, senha });
}

async function cadastrarCliente(dados) {
  return apiPost({ acao: 'cadastrarCliente', dados });
}

async function editarCliente(dados) {
  const token = localStorage.getItem('clienteToken');
  return apiPost({ acao: 'editarCliente', dados, token });
}

function clienteLogado() {
  return !!localStorage.getItem('clienteToken');
}

function getClienteLogado() {
  const data = localStorage.getItem('clienteDados');
  return data ? JSON.parse(data) : null;
}

function clienteLogout() {
  localStorage.removeItem('clienteToken');
  localStorage.removeItem('clienteDados');
  window.location.reload();
}

// -------------------------------------------------------
// PEDIDOS
// -------------------------------------------------------
async function enviarPedido(dados) {
  const cliente = getClienteLogado();
  if (cliente) dados.id_cliente = cliente.id;
  return apiPost({ acao: 'novoPedido', dados });
}

async function buscarPedidosCliente() {
  const cliente = getClienteLogado();
  if (!cliente) return { sucesso: false, msg: 'Não logado.' };
  const token = localStorage.getItem('clienteToken');
  return apiGet({ acao: 'getPedidosCliente', id_cliente: cliente.id, token });
}

async function listarPedidosAdmin() {
  const token = sessionStorage.getItem('adminToken');
  return apiGet({ acao: 'listarPedidos', token });
}

async function atualizarStatusPedido(id_pedido, status) {
  const token = sessionStorage.getItem('adminToken');
  return apiPost({ acao: 'atualizarStatus', id_pedido, status, token });
}

async function listarClientesAdmin() {
  const token = sessionStorage.getItem('adminToken');
  return apiGet({ acao: 'listarClientes', token });
}

// -------------------------------------------------------
// CARRINHO (localStorage)
// -------------------------------------------------------
function getCarrinho() {
  return JSON.parse(localStorage.getItem('carrinho') || '[]');
}

function salvarCarrinho(carrinho) {
  localStorage.setItem('carrinho', JSON.stringify(carrinho));
  atualizarBadgeCarrinho();
}

function adicionarAoCarrinho(produto, qtd = 1) {
  const carrinho = getCarrinho();
  const idx = carrinho.findIndex(i => i.id === produto.id);
  if (idx >= 0) {
    carrinho[idx].qtd += qtd;
    carrinho[idx].subtotal = carrinho[idx].qtd * carrinho[idx].preco;
  } else {
    carrinho.push({
      id:       produto.id,
      nome:     produto.nome,
      preco:    produto.preco,
      foto:     produto.foto1,
      qtd:      qtd,
      subtotal: produto.preco * qtd
    });
  }
  salvarCarrinho(carrinho);
}

function removerDoCarrinho(id) {
  const carrinho = getCarrinho().filter(i => i.id !== id);
  salvarCarrinho(carrinho);
}

function limparCarrinho() {
  localStorage.removeItem('carrinho');
  atualizarBadgeCarrinho();
}

function totalCarrinho() {
  return getCarrinho().reduce((s, i) => s + i.subtotal, 0);
}

function atualizarBadgeCarrinho() {
  const total = getCarrinho().reduce((s, i) => s + i.qtd, 0);
  document.querySelectorAll('.carrinho-badge').forEach(el => {
    el.textContent = total;
    el.style.display = total > 0 ? 'inline-flex' : 'none';
  });
}

// -------------------------------------------------------
// UTILITÁRIOS
// -------------------------------------------------------
function formatarMoeda(valor) {
  return 'R$ ' + Number(valor).toFixed(2).replace('.', ',');
}

function formatarData(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function mostrarAlerta(msg, tipo = 'sucesso', containerId = 'alerta') {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.className = 'alerta alerta-' + tipo;
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}

function mostrarCarregando(mostrar, btnId) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = mostrar;
  btn.textContent = mostrar ? 'Aguarde...' : btn.dataset.texto;
}

