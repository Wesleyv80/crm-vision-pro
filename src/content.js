// =====================================================
// CRM Vision Pro - Script Principal
// =====================================================
// Este é o arquivo principal que coordena toda a extensão
// Ele conecta todos os módulos e inicia o sistema

console.log('🚀 CRM Vision Pro - Iniciando...');

// Estado global da aplicação
window.crmState = {
  isOpen: false,
  currentContact: null,
  kanbanData: null,
  analytics: {
    totalClients: 0,
    totalDeals: 0,
    totalRevenue: 0,
    conversionRate: 0
  }
};

// =====================================================
// FUNÇÃO PRINCIPAL - Inicia toda a extensão
// =====================================================
async function iniciarExtensao() {
  console.log('📱 Verificando WhatsApp Web...');
  
  // Aguarda o WhatsApp carregar completamente
  if (!aguardarWhatsApp()) {
    setTimeout(iniciarExtensao, 1000);
    return;
  }
  
  console.log('✅ WhatsApp Web detectado!');
  
  // 1. Carrega dados salvos
  await carregarDadosSalvos();
  
  // 2. Cria a interface
  criarInterface();
  
  // 3. Configura captura automática
  configurarCapturaAutomatica();
  
  // 4. Inicia análise em tempo real
  iniciarAnalytics();
  
  // 5. Configura atalhos de teclado
  configurarAtalhos();
  
  console.log('🎉 CRM Vision Pro carregado com sucesso!');
  mostrarNotificacao('CRM Vision Pro está ativo!', 'success');
}

// =====================================================
// VERIFICAÇÃO DO WHATSAPP
// =====================================================
function aguardarWhatsApp() {
  // Verifica se os elementos principais do WhatsApp estão carregados
  const app = document.querySelector('#app');
  const sidebar = document.querySelector('[data-testid="chat-list"]');
  const main = document.querySelector('#main');
  
  return app && (sidebar || main);
}

// =====================================================
// CARREGAR DADOS SALVOS
// =====================================================
async function carregarDadosSalvos() {
  try {
    const dados = await CRMStorage.carregar('kanban_data');
    if (dados) {
      window.crmState.kanbanData = dados;
      console.log('📊 Dados carregados:', dados);
    } else {
      // Primeira vez - cria estrutura inicial
      window.crmState.kanbanData = {
        clients: {},
        columns: [
          { id: 'leads', title: '🎯 Leads', clients: [], color: '#6366f1' },
          { id: 'negotiation', title: '💬 Em Negociação', clients: [], color: '#8b5cf6' },
          { id: 'proposal', title: '📝 Proposta Enviada', clients: [], color: '#ec4899' },
          { id: 'closing', title: '🤝 Fechamento', clients: [], color: '#f59e0b' },
          { id: 'success', title: '✅ Sucesso', clients: [], color: '#10b981' }
        ],
        tasks: []
      };
      await CRMStorage.salvar('kanban_data', window.crmState.kanbanData);
    }
  } catch (erro) {
    console.error('❌ Erro ao carregar dados:', erro);
  }
}

// =====================================================
// CRIAR INTERFACE
// =====================================================
function criarInterface() {
  // Remove elementos antigos se existirem
  const elementosAntigos = document.querySelectorAll('#crm-sidebar-container, #crm-floating-button');
  elementosAntigos.forEach(el => el.remove());
  
  // 1. Cria container principal
  const container = document.createElement('div');
  container.id = 'crm-sidebar-container';
  container.innerHTML = `
    <!-- Barra Lateral Minimalista -->
    <div id="crm-mini-sidebar" class="mini-sidebar">
      <div class="sidebar-logo">
        <div class="logo-animation">
          <span class="logo-icon">🚀</span>
        </div>
      </div>
      
      <div class="sidebar-menu">
        <button class="sidebar-btn" data-action="dashboard" title="Dashboard">
          <span class="btn-icon">📊</span>
          <span class="btn-label">Dashboard</span>
        </button>
        
        <button class="sidebar-btn" data-action="capture" title="Capturar Contato">
          <span class="btn-icon">📸</span>
          <span class="btn-label">Capturar</span>
          <span class="pulse-dot"></span>
        </button>
        
        <button class="sidebar-btn" data-action="kanban" title="Kanban">
          <span class="btn-icon">📋</span>
          <span class="btn-label">Pipeline</span>
        </button>
        
        <button class="sidebar-btn" data-action="analytics" title="Analytics">
          <span class="btn-icon">📈</span>
          <span class="btn-label">Analytics</span>
        </button>
        
        <button class="sidebar-btn" data-action="ai" title="IA Assistant">
          <span class="btn-icon">🤖</span>
          <span class="btn-label">IA</span>
          <span class="ai-glow"></span>
        </button>
      </div>
      
      <div class="sidebar-footer">
        <button class="sidebar-btn" data-action="settings">
          <span class="btn-icon">⚙️</span>
        </button>
      </div>
    </div>
    
    <!-- Painel Principal (oculto inicialmente) -->
    <div id="crm-main-panel" class="main-panel hidden">
      <div class="panel-header">
        <h2 class="panel-title">CRM Vision Pro</h2>
        <button class="close-panel">✕</button>
      </div>
      
      <div id="panel-content" class="panel-content">
        <!-- Conteúdo dinâmico será inserido aqui -->
      </div>
    </div>
    
    <!-- Overlay para modais -->
    <div id="crm-overlay" class="overlay hidden"></div>
  `;
  
  document.body.appendChild(container);
  
  // 2. Configura eventos dos botões
  configurarEventosSidebar();
  
  // 3. Ajusta layout do WhatsApp
  ajustarLayoutWhatsApp();
}

// =====================================================
// CONFIGURAR EVENTOS DA SIDEBAR
// =====================================================
function configurarEventosSidebar() {
  // Eventos dos botões da sidebar
  document.querySelectorAll('.sidebar-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const action = btn.dataset.action;
      executarAcao(action);
      
      // Efeito visual
      btn.classList.add('clicked');
      setTimeout(() => btn.classList.remove('clicked'), 300);
    });
  });
  
  // Botão fechar painel
  const closeBtn = document.querySelector('.close-panel');
  if (closeBtn) {
    closeBtn.addEventListener('click', fecharPainel);
  }
  
  // Clique no overlay fecha o painel
  const overlay = document.querySelector('#crm-overlay');
  if (overlay) {
    overlay.addEventListener('click', fecharPainel);
  }
}

// =====================================================
// EXECUTAR AÇÕES
// =====================================================
async function executarAcao(action) {
  console.log(`🎯 Executando ação: ${action}`);
  
  switch (action) {
    case 'dashboard':
      mostrarDashboard();
      break;
      
    case 'capture':
      await capturarContatoAtual();
      break;
      
    case 'kanban':
      mostrarKanban();
      break;
      
    case 'analytics':
      mostrarAnalytics();
      break;
      
    case 'ai':
      mostrarAssistenteIA();
      break;
      
    case 'settings':
      mostrarConfiguracoes();
      break;
      
    default:
      console.warn('Ação desconhecida:', action);
  }
}

// =====================================================
// CAPTURAR CONTATO ATUAL
// =====================================================
async function capturarContatoAtual() {
  mostrarNotificacao('Capturando dados do contato...', 'info');
  
  // Usa o módulo de captura
  const dadosContato = CRMCapture.capturarDadosContato();
  
  if (!dadosContato || !dadosContato.nome) {
    mostrarNotificacao('Nenhum contato ativo detectado!', 'warning');
    return;
  }
  
  // Mostra painel de cadastro
  mostrarFormularioCadastro(dadosContato);
}

// =====================================================
// MOSTRAR FORMULÁRIO DE CADASTRO
// =====================================================
function mostrarFormularioCadastro(dadosIniciais = {}) {
  const panel = document.querySelector('#crm-main-panel');
  const content = document.querySelector('#panel-content');
  const overlay = document.querySelector('#crm-overlay');
  
  content.innerHTML = `
    <div class="cadastro-form">
      <div class="form-header">
        <img src="${dadosIniciais.imagem || ''}" class="contact-photo" alt="Foto">
        <div class="contact-info">
          <h3>${dadosIniciais.nome || 'Novo Contato'}</h3>
          <p>${dadosIniciais.telefone || ''}</p>
        </div>
      </div>
      
      <form id="form-cadastro">
        <div class="form-group">
          <label>Nome Completo</label>
          <input type="text" id="nome" value="${dadosIniciais.nome || ''}" required>
        </div>
        
        <div class="form-group">
          <label>Telefone</label>
          <input type="text" id="telefone" value="${dadosIniciais.telefone || ''}" required>
        </div>
        
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="email" placeholder="email@exemplo.com">
        </div>
        
        <div class="form-group">
          <label>Origem</label>
          <select id="origem">
            <option value="">Selecione...</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="indicacao">Indicação</option>
            <option value="site">Site</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Tags</label>
          <div class="tags-container">
            <label class="tag-option">
              <input type="checkbox" value="potencial-alto">
              <span>🔥 Potencial Alto</span>
            </label>
            <label class="tag-option">
              <input type="checkbox" value="urgente">
              <span>⚡ Urgente</span>
            </label>
            <label class="tag-option">
              <input type="checkbox" value="retorno">
              <span>🔄 Retorno</span>
            </label>
            <label class="tag-option">
              <input type="checkbox" value="vip">
              <span>⭐ VIP</span>
            </label>
          </div>
        </div>
        
        <div class="form-group">
          <label>Observações</label>
          <textarea id="observacoes" rows="3" placeholder="Adicione notas sobre este contato..."></textarea>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn-secondary" onclick="fecharPainel()">Cancelar</button>
          <button type="submit" class="btn-primary">
            <span>💾</span> Salvar Contato
          </button>
        </div>
      </form>
    </div>
  `;
  
  // Mostra painel
  panel.classList.remove('hidden');
  overlay.classList.remove('hidden');
  
  // Configura envio do formulário
  document.getElementById('form-cadastro').addEventListener('submit', salvarContato);
}

// =====================================================
// SALVAR CONTATO
// =====================================================
async function salvarContato(e) {
  e.preventDefault();
  
  // Coleta dados do formulário
  const novoCliente = {
    id: 'client_' + Date.now(),
    nome: document.getElementById('nome').value,
    telefone: document.getElementById('telefone').value,
    email: document.getElementById('email').value,
    origem: document.getElementById('origem').value,
    tags: Array.from(document.querySelectorAll('.tags-container input:checked')).map(cb => cb.value),
    observacoes: document.getElementById('observacoes').value,
    dataCadastro: new Date().toISOString(),
    ultimaInteracao: new Date().toISOString(),
    status: 'lead',
    deals: [],
    tasks: []
  };
  
  // Salva no estado
  window.crmState.kanbanData.clients[novoCliente.id] = novoCliente;
  
  // Adiciona à primeira coluna
  window.crmState.kanbanData.columns[0].clients.push(novoCliente.id);
  
  // Salva no storage
  await CRMStorage.salvar('kanban_data', window.crmState.kanbanData);
  
  // Feedback visual
  mostrarNotificacao('✅ Contato salvo com sucesso!', 'success');
  
  // Fecha painel
  fecharPainel();
  
  // Atualiza analytics
  atualizarAnalytics();
}

// =====================================================
// MOSTRAR DASHBOARD
// =====================================================
function mostrarDashboard() {
  const panel = document.querySelector('#crm-main-panel');
  const content = document.querySelector('#panel-content');
  const overlay = document.querySelector('#crm-overlay');
  
  // Calcula estatísticas
  const stats = calcularEstatisticas();
  
  content.innerHTML = `
    <div class="dashboard">
      <div class="dashboard-header">
        <h2>Dashboard Inteligente</h2>
        <p class="subtitle">Visão geral do seu negócio em tempo real</p>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card gradient-purple">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <h3>${stats.totalClients}</h3>
            <p>Total de Clientes</p>
            <span class="trend up">+12%</span>
          </div>
        </div>
        
        <div class="stat-card gradient-blue">
          <div class="stat-icon">💼</div>
          <div class="stat-content">
            <h3>${stats.totalDeals}</h3>
            <p>Negócios em Andamento</p>
            <span class="trend up">+8%</span>
          </div>
        </div>
        
        <div class="stat-card gradient-green">
          <div class="stat-icon">💰</div>
          <div class="stat-content">
            <h3>R$ ${stats.totalRevenue.toLocaleString('pt-BR')}</h3>
            <p>Receita Total</p>
            <span class="trend up">+25%</span>
          </div>
        </div>
        
        <div class="stat-card gradient-orange">
          <div class="stat-icon">📈</div>
          <div class="stat-content">
            <h3>${stats.conversionRate}%</h3>
            <p>Taxa de Conversão</p>
            <span class="trend up">+5%</span>
          </div>
        </div>
      </div>
      
      <div class="charts-container">
        <div class="chart-card">
          <h3>Evolução de Vendas</h3>
          <canvas id="sales-chart"></canvas>
        </div>
        
        <div class="chart-card">
          <h3>Origem dos Leads</h3>
          <canvas id="sources-chart"></canvas>
        </div>
      </div>
      
      <div class="recent-activities">
        <h3>Atividades Recentes</h3>
        <div class="activity-list">
          ${gerarAtividadesRecentes()}
        </div>
      </div>
    </div>
  `;
  
  // Mostra painel
  panel.classList.remove('hidden');
  overlay.classList.remove('hidden');
  
  // Renderiza gráficos (simulado)
  setTimeout(renderizarGraficos, 100);
}

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================
function fecharPainel() {
  const panel = document.querySelector('#crm-main-panel');
  const overlay = document.querySelector('#crm-overlay');
  
  panel.classList.add('hidden');
  overlay.classList.add('hidden');
}

function mostrarNotificacao(mensagem, tipo = 'info') {
  // Cria elemento de notificação
  const notif = document.createElement('div');
  notif.className = `crm-notification ${tipo}`;
  notif.innerHTML = `
    <span>${mensagem}</span>
  `;
  
  document.body.appendChild(notif);
  
  // Anima entrada
  setTimeout(() => notif.classList.add('show'), 10);
  
  // Remove após 3 segundos
  setTimeout(() => {
    notif.classList.remove('show');
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

function ajustarLayoutWhatsApp() {
  // Ajusta o layout do WhatsApp para acomodar a sidebar
  const app = document.querySelector('#app');
  if (app) {
    app.style.marginRight = '70px';
    app.style.transition = 'margin-right 0.3s ease';
  }
}

function calcularEstatisticas() {
  const data = window.crmState.kanbanData;
  const totalClients = Object.keys(data.clients || {}).length;
  const totalDeals = Object.values(data.clients || {})
    .reduce((sum, client) => sum + (client.deals?.length || 0), 0);
  const totalRevenue = Object.values(data.clients || {})
    .reduce((sum, client) => {
      return sum + (client.deals || []).reduce((dealSum, deal) => dealSum + (deal.valor || 0), 0);
    }, 0);
  
  return {
    totalClients,
    totalDeals,
    totalRevenue,
    conversionRate: totalClients > 0 ? Math.round((totalDeals / totalClients) * 100) : 0
  };
}

function gerarAtividadesRecentes() {
  // Simulação de atividades recentes
  const atividades = [
    { icon: '✅', text: 'João Silva movido para Fechamento', time: 'há 5 min' },
    { icon: '📞', text: 'Ligação agendada com Maria Santos', time: 'há 15 min' },
    { icon: '💰', text: 'Novo negócio criado: R$ 5.000', time: 'há 1 hora' },
    { icon: '📧', text: 'Proposta enviada para Pedro Costa', time: 'há 2 horas' }
  ];
  
  return atividades.map(a => `
    <div class="activity-item">
      <span class="activity-icon">${a.icon}</span>
      <div class="activity-content">
        <p>${a.text}</p>
        <span class="time">${a.time}</span>
      </div>
    </div>
  `).join('');
}

function renderizarGraficos() {
  // Aqui você poderia integrar Chart.js ou outra biblioteca
  // Por enquanto, apenas um placeholder visual
  console.log('📊 Renderizando gráficos...');
}

// =====================================================
// CONFIGURAR CAPTURA AUTOMÁTICA
// =====================================================
function configurarCapturaAutomatica() {
  // Observa mudanças no chat para detectar novo contato
  const observer = new MutationObserver(() => {
    const novoContato = CRMCapture.detectarMudancaContato();
    if (novoContato) {
      window.crmState.currentContact = novoContato;
      console.log('📱 Novo contato detectado:', novoContato);
    }
  });
  
  const chatContainer = document.querySelector('#main');
  if (chatContainer) {
    observer.observe(chatContainer, {
      childList: true,
      subtree: true
    });
  }
}

// =====================================================
// INICIAR ANALYTICS
// =====================================================
function iniciarAnalytics() {
  // Atualiza estatísticas a cada 30 segundos
  setInterval(atualizarAnalytics, 30000);
  atualizarAnalytics();
}

function atualizarAnalytics() {
  const stats = calcularEstatisticas();
  window.crmState.analytics = stats;
  console.log('📊 Analytics atualizado:', stats);
}

// =====================================================
// CONFIGURAR ATALHOS DE TECLADO
// =====================================================
function configurarAtalhos() {
  document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+C = Capturar contato
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      executarAcao('capture');
    }
    
    // Ctrl+Shift+K = Abrir Kanban
    if (e.ctrlKey && e.shiftKey && e.key === 'K') {
      e.preventDefault();
      executarAcao('kanban');
    }
  });
}

// =====================================================
// FUNÇÕES PLACEHOLDER (serão implementadas nos módulos)
// =====================================================
function mostrarKanban() {
  mostrarNotificacao('🚧 Kanban em desenvolvimento...', 'info');
}

function mostrarAnalytics() {
  mostrarNotificacao('🚧 Analytics em desenvolvimento...', 'info');
}

function mostrarAssistenteIA() {
  mostrarNotificacao('🤖 IA Assistant em desenvolvimento...', 'info');
}

function mostrarConfiguracoes() {
  mostrarNotificacao('⚙️ Configurações em desenvolvimento...', 'info');
}

// =====================================================
// INICIALIZAÇÃO
// =====================================================
// Inicia quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciarExtensao);
} else {
  iniciarExtensao();
}