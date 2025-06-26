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
    conversionRate: 0,
    totalAdesao: 0,      // NOVO
    totalGordurinha: 0   // NOVO
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
  
  // Aguarda os módulos carregarem
  await aguardarModulos();
  
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
  
  // Usa CRMUI para mostrar notificação
  if (window.CRMUI) {
    CRMUI.mostrarNotificacao('CRM Vision Pro está ativo!', 'success');
  }
}

// =====================================================
// AGUARDAR MÓDULOS CARREGAREM
// =====================================================
async function aguardarModulos() {
  return new Promise((resolve) => {
    const verificarModulos = () => {
      if (window.CRMUI && window.CRMKanban && window.CRMStorage) {
        console.log('✅ Todos os módulos carregados');
        resolve();
      } else {
        console.log('⏳ Aguardando módulos...', {
          CRMUI: !!window.CRMUI,
          CRMKanban: !!window.CRMKanban,
          CRMStorage: !!window.CRMStorage
        });
        setTimeout(verificarModulos, 100);
      }
    };
    verificarModulos();
  });
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
// EXECUTAR AÇÕES - CORRIGIDO
// =====================================================
async function executarAcao(action) {
  console.log(`🎯 Executando ação: ${action}`);
  
  // Verifica se os módulos estão disponíveis
  if (!window.CRMUI) {
    console.error('❌ CRMUI não está disponível');
    alert('Erro: Módulo UI não carregado. Recarregue a página.');
    return;
  }
  
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
// CAPTURAR CONTATO ATUAL - ATUALIZADO COM CAMPOS CONDICIONAIS
// =====================================================
async function capturarContatoAtual() {
  CRMUI.mostrarNotificacao('Capturando dados do contato...', 'info');
  
  // Verifica se o módulo de captura existe
  if (!window.CRMCapture) {
    CRMUI.mostrarNotificacao('Módulo de captura não encontrado!', 'error');
    return;
  }
  
  // Usa o módulo de captura
  const dadosContato = CRMCapture.capturarDadosContato();
  
  if (!dadosContato || !dadosContato.nome) {
    CRMUI.mostrarNotificacao('Nenhum contato ativo detectado!', 'warning');
    return;
  }
  
  // Mostra painel de cadastro usando CRMUI
  mostrarFormularioCadastro(dadosContato);
}

// =====================================================
// MOSTRAR FORMULÁRIO DE CADASTRO - ATUALIZADO COM CAMPOS CONDICIONAIS
// =====================================================
function mostrarFormularioCadastro(dadosIniciais = {}) {
  const conteudo = `
    <div class="cadastro-form">
      <div class="form-header">
        <img src="${dadosIniciais.imagem || '/assets/avatar-placeholder.png'}" 
             class="contact-photo" 
             alt="Foto" 
             style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;">
        <div class="contact-info">
          <h3>${dadosIniciais.nome || 'Novo Contato'}</h3>
          <p>${dadosIniciais.telefone || ''}</p>
        </div>
      </div>
      
      <form id="form-cadastro-contato" style="margin-top: 20px;">
        <div class="form-field">
          <label>Nome Completo <span class="required">*</span></label>
          <input type="text" name="nome" value="${dadosIniciais.nome || ''}" required>
        </div>
        
        <div class="form-field">
          <label>Telefone <span class="required">*</span></label>
          <input type="tel" name="telefone" value="${dadosIniciais.telefone || ''}" required>
        </div>
        
        <div class="form-field">
          <label>Email</label>
          <input type="email" name="email" placeholder="email@exemplo.com">
        </div>
        
        <div class="form-field">
          <label>Origem</label>
          <select name="origem" id="origem-select">
            <option value="whatsapp">WhatsApp</option>
            <option value="indicacao">Indicação</option>
            <option value="site">Site</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
          </select>
        </div>
        
        <!-- Campos condicionais para indicação -->
        <div id="campos-indicacao" style="display: none;">
          <div class="form-field">
            <label>Nome do Indicador</label>
            <input type="text" name="indicador_nome" placeholder="Quem indicou?">
          </div>
          <div class="form-field">
            <label>Telefone do Indicador</label>
            <input type="tel" name="indicador_telefone" placeholder="Telefone de quem indicou">
          </div>
        </div>
        
        <div class="form-field">
          <label>Tags</label>
          <div class="tags-container">
            <label><input type="checkbox" name="tags" value="potencial-alto"> 🔥 Potencial Alto</label>
            <label><input type="checkbox" name="tags" value="urgente"> ⚡ Urgente</label>
            <label><input type="checkbox" name="tags" value="retorno"> 🔄 Retorno</label>
            <label><input type="checkbox" name="tags" value="vip"> ⭐ VIP</label>
          </div>
        </div>
        
        <div class="form-field">
          <label>Observações</label>
          <textarea name="observacoes" rows="3" placeholder="Adicione notas sobre este contato..."></textarea>
        </div>
      </form>
    </div>
  `;
  
  // Cria modal usando CRMUI
  const modal = CRMUI.criarModal({
    titulo: 'Cadastrar Contato',
    conteudo: conteudo,
    tamanho: 'medium',
    acoes: [
      {
        id: 'cancelar',
        texto: 'Cancelar',
        tipo: 'secondary',
        onClick: () => modal.fechar()
      },
      {
        id: 'salvar',
        texto: '💾 Salvar e Continuar',
        tipo: 'primary',
        onClick: () => {
          const form = document.getElementById('form-cadastro-contato');
          const formData = new FormData(form);
          const dados = {};
          
          // Coleta dados do formulário
          for (let [key, value] of formData.entries()) {
            if (key === 'tags') {
              if (!dados.tags) dados.tags = [];
              dados.tags.push(value);
            } else {
              dados[key] = value;
            }
          }
          
          salvarContatoEContinuar(dados);
        }
      }
    ]
  });
  
  // Configura campo condicional de indicação
  setTimeout(() => {
    const origemSelect = document.getElementById('origem-select');
    const camposIndicacao = document.getElementById('campos-indicacao');
    
    origemSelect.addEventListener('change', (e) => {
      if (e.target.value === 'indicacao') {
        camposIndicacao.style.display = 'block';
      } else {
        camposIndicacao.style.display = 'none';
      }
    });
  }, 100);
}

// =====================================================
// SALVAR CONTATO E ABRIR CADASTRO DE NEGÓCIOS
// =====================================================
async function salvarContatoEContinuar(dados) {
  try {
    // Cria novo cliente
    const novoCliente = {
      id: 'client_' + Date.now(),
      nome: dados.nome,
      telefone: dados.telefone,
      email: dados.email || '',
      origem: dados.origem || '',
      tags: dados.tags || [],
      observacoes: dados.observacoes || '',
      dataCadastro: new Date().toISOString(),
      ultimaInteracao: new Date().toISOString(),
      status: 'lead',
      deals: [],
      tasks: [],
      // Adiciona dados de indicação se existirem
      indicacao: dados.origem === 'indicacao' ? {
        nome: dados.indicador_nome || '',
        telefone: dados.indicador_telefone || ''
      } : null
    };
    
    // Salva no estado
    window.crmState.kanbanData.clients[novoCliente.id] = novoCliente;
    
    // Adiciona à primeira coluna
    window.crmState.kanbanData.columns[0].clients.push(novoCliente.id);
    
    // Salva no storage
    await CRMStorage.salvar('kanban_data', window.crmState.kanbanData);
    
    // Feedback visual
    CRMUI.mostrarNotificacao('✅ Contato salvo com sucesso!', 'success');
    
    // Fecha modal atual
    CRMUI.fecharModal();
    
    // Abre janela de cadastro de negócios
    setTimeout(() => {
      mostrarCadastroNegocio(novoCliente.id);
    }, 300);
    
    // Atualiza analytics
    atualizarAnalytics();
    
  } catch (erro) {
    console.error('Erro ao salvar contato:', erro);
    CRMUI.mostrarNotificacao('❌ Erro ao salvar contato', 'error');
  }
}

// =====================================================
// MOSTRAR CADASTRO DE NEGÓCIO - NOVO
// =====================================================
function mostrarCadastroNegocio(clientId) {
  const cliente = window.crmState.kanbanData.clients[clientId];
  
  const conteudo = `
    <div class="negocio-form">
      <div class="form-info">
        <p>Cadastre um negócio para <strong>${cliente.nome}</strong></p>
      </div>
      
      <form id="form-cadastro-negocio">
        <div class="form-field">
          <label>Título do Negócio</label>
          <input type="text" name="titulo" placeholder="Ex: Consultoria de Marketing" required>
        </div>
        
        <div class="form-field">
          <label>Valor Adesão</label>
          <input type="number" name="valor_adesao" placeholder="0,00" step="0.01" required>
        </div>
        
        <div class="form-field">
          <label>Valor Gordurinha</label>
          <input type="number" name="valor_gordurinha" placeholder="0,00" step="0.01" required>
        </div>
        
        <div class="form-field">
          <label>Status</label>
          <select name="status">
            <option value="em_negociacao">Em Negociação</option>
            <option value="proposta_enviada">Proposta Enviada</option>
            <option value="fechado">Fechado</option>
            <option value="perdido">Perdido</option>
          </select>
        </div>
        
        <div class="form-field">
          <label>Descrição</label>
          <textarea name="descricao" rows="3" placeholder="Detalhes do negócio..."></textarea>
        </div>
      </form>
    </div>
  `;
  
  const modal = CRMUI.criarModal({
    titulo: 'Cadastrar Negócio',
    conteudo: conteudo,
    tamanho: 'medium',
    acoes: [
      {
        id: 'pular',
        texto: 'Pular esta etapa',
        tipo: 'secondary',
        onClick: () => modal.fechar()
      },
      {
        id: 'salvar',
        texto: '💰 Salvar Negócio',
        tipo: 'primary',
        onClick: async () => {
          const form = document.getElementById('form-cadastro-negocio');
          const formData = new FormData(form);
          
          const negocio = {
            id: 'deal_' + Date.now(),
            titulo: formData.get('titulo'),
            valor_adesao: parseFloat(formData.get('valor_adesao')) || 0,
            valor_gordurinha: parseFloat(formData.get('valor_gordurinha')) || 0,
            valor: parseFloat(formData.get('valor_adesao')) + parseFloat(formData.get('valor_gordurinha')),
            status: formData.get('status'),
            descricao: formData.get('descricao'),
            dataCriacao: new Date().toISOString()
          };
          
          // Adiciona negócio ao cliente
          if (!cliente.deals) cliente.deals = [];
          cliente.deals.push(negocio);
          
          // Salva
          await CRMStorage.salvar('kanban_data', window.crmState.kanbanData);
          
          CRMUI.mostrarNotificacao('💰 Negócio cadastrado com sucesso!', 'success');
          modal.fechar();
          
          // Atualiza analytics
          atualizarAnalytics();
        }
      }
    ]
  });
}

// =====================================================
// MOSTRAR DASHBOARD - ATUALIZADO COM ADESÃO E GORDURINHA
// =====================================================
function mostrarDashboard() {
  // Calcula estatísticas
  const stats = calcularEstatisticas();
  
  const conteudo = `
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
          <div class="stat-icon">💎</div>
          <div class="stat-content">
            <h3>R$ ${stats.totalAdesao.toLocaleString('pt-BR')}</h3>
            <p>Adesão</p>
            <span class="trend up">+25%</span>
          </div>
        </div>
        
        <div class="stat-card gradient-orange">
          <div class="stat-icon">🎯</div>
          <div class="stat-content">
            <h3>R$ ${stats.totalGordurinha.toLocaleString('pt-BR')}</h3>
            <p>Gordurinha</p>
            <span class="trend up">+15%</span>
          </div>
        </div>
      </div>
      
      <div class="charts-container">
        <div class="chart-card">
          <h3>Evolução de Vendas</h3>
          <canvas id="chart-vendas" style="height: 200px;"></canvas>
        </div>
        
        <div class="chart-card">
          <h3>Origem dos Leads</h3>
          <canvas id="chart-origem" style="height: 200px;"></canvas>
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
  
  // Cria modal usando CRMUI
  const modal = CRMUI.criarModal({
    titulo: 'Dashboard',
    conteudo: conteudo,
    tamanho: 'large',
    acoes: [
      {
        id: 'fechar',
        texto: 'Fechar',
        tipo: 'secondary',
        onClick: () => modal.fechar()
      }
    ]
  });
  
  // Inicializa gráficos após o modal ser criado
  setTimeout(() => {
    inicializarGraficos();
  }, 300);
}

// =====================================================
// INICIALIZAR GRÁFICOS - NOVO
// =====================================================
function inicializarGraficos() {
  // Verifica se Chart.js está disponível
  if (typeof Chart === 'undefined') {
    console.log('Chart.js não está disponível, usando gráficos simulados');
    
    // Gráfico de vendas simulado
    const canvasVendas = document.getElementById('chart-vendas');
    if (canvasVendas) {
      canvasVendas.style.background = '#f8f9fa';
      canvasVendas.style.borderRadius = '8px';
      canvasVendas.style.display = 'flex';
      canvasVendas.style.alignItems = 'center';
      canvasVendas.style.justifyContent = 'center';
      canvasVendas.innerHTML = '<div style="text-align: center; color: #6b7280;">📊 Gráfico de vendas</div>';
    }
    
    // Gráfico de origem simulado
    const canvasOrigem = document.getElementById('chart-origem');
    if (canvasOrigem) {
      canvasOrigem.style.background = '#f8f9fa';
      canvasOrigem.style.borderRadius = '8px';
      canvasOrigem.style.display = 'flex';
      canvasOrigem.style.alignItems = 'center';
      canvasOrigem.style.justifyContent = 'center';
      canvasOrigem.innerHTML = '<div style="text-align: center; color: #6b7280;">📈 Gráfico de origem</div>';
    }
    
    return;
  }
  
  // Se Chart.js estiver disponível, criar gráficos reais
  // ... código para gráficos reais ...
}

// =====================================================
// MOSTRAR KANBAN - MODIFICADO PARA TELA CHEIA
// =====================================================
function mostrarKanban() {
  if (!window.CRMKanban) {
    CRMUI.mostrarNotificacao('❌ Módulo Kanban não encontrado', 'error');
    return;
  }
  
  // Remove o modal e usa a tela inteira
  const existingModal = document.querySelector('.crm-modal-container');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Cria container fullscreen
  const fullscreenContainer = document.createElement('div');
  fullscreenContainer.id = 'kanban-fullscreen';
  fullscreenContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: white;
    z-index: 9999;
    display: flex;
    flex-direction: column;
  `;
  
  fullscreenContainer.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid #e5e7eb;">
      <h2 style="margin: 0; font-size: 24px; font-weight: 600;">Pipeline de Vendas</h2>
      <button id="close-kanban" style="
        background: #6b7280;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
      ">✕ Fechar</button>
    </div>
    <div id="kanban-container" style="flex: 1; overflow: auto; padding: 20px;"></div>
  `;
  
  document.body.appendChild(fullscreenContainer);
  
  // Inicializa o kanban
  const container = document.getElementById('kanban-container');
  if (container) {
    CRMKanban.criarKanban(container);
  }
  
  // Botão fechar
  document.getElementById('close-kanban').addEventListener('click', () => {
    fullscreenContainer.remove();
  });
}

// =====================================================
// CALCULAR ESTATÍSTICAS - ATUALIZADO
// =====================================================
function calcularEstatisticas() {
  const data = window.crmState.kanbanData;
  const totalClients = Object.keys(data?.clients || {}).length;
  const totalDeals = Object.values(data?.clients || {})
    .reduce((sum, client) => sum + (client.deals?.length || 0), 0);
  
  let totalAdesao = 0;
  let totalGordurinha = 0;
  let totalRevenue = 0;
  
  Object.values(data?.clients || {}).forEach(client => {
    (client.deals || []).forEach(deal => {
      totalAdesao += deal.valor_adesao || 0;
      totalGordurinha += deal.valor_gordurinha || 0;
      totalRevenue += deal.valor || 0;
    });
  });
  
  return {
    totalClients,
    totalDeals,
    totalRevenue,
    totalAdesao,
    totalGordurinha,
    conversionRate: totalClients > 0 ? Math.round((totalDeals / totalClients) * 100) : 0
  };
}

// =====================================================
// OUTRAS FUNÇÕES - MANTIDAS
// =====================================================
function mostrarAnalytics() {
  CRMUI.mostrarNotificacao('📊 Analytics detalhado em desenvolvimento...', 'info');
}

function mostrarAssistenteIA() {
  CRMUI.mostrarNotificacao('🤖 IA Assistant em desenvolvimento...', 'info');
}

function mostrarConfiguracoes() {
  CRMUI.mostrarNotificacao('⚙️ Configurações em desenvolvimento...', 'info');
}

function fecharPainel() {
  const panel = document.querySelector('#crm-main-panel');
  const overlay = document.querySelector('#crm-overlay');
  
  panel?.classList.add('hidden');
  overlay?.classList.add('hidden');
}

function ajustarLayoutWhatsApp() {
  // Ajusta o layout do WhatsApp para acomodar a sidebar
  const app = document.querySelector('#app');
  if (app) {
    app.style.marginRight = '70px';
    app.style.transition = 'margin-right 0.3s ease';
  }
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

// =====================================================
// CONFIGURAR CAPTURA AUTOMÁTICA
// =====================================================
function configurarCapturaAutomatica() {
  // Verifica se o módulo existe
  if (!window.CRMCapture) {
    console.warn('⚠️ Módulo CRMCapture não encontrado');
    return;
  }
  
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
    
    // Ctrl+Shift+D = Dashboard
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      executarAcao('dashboard');
    }
  });
}

// =====================================================
// TRATAMENTO DE MENSAGENS
// =====================================================
window.addEventListener('message', (event) => {
  if (event.data.type === 'CRM_ACTION') {
    switch (event.data.action) {
      case 'editarCliente':
        // Implementar edição de cliente
        CRMUI.mostrarNotificacao('Edição de cliente em desenvolvimento', 'info');
        break;
        
      case 'novoNegocio':
        mostrarCadastroNegocio(event.data.clientId);
        break;
        
      case 'novaTarefa':
        // Implementar nova tarefa
        CRMUI.mostrarNotificacao('Cadastro de tarefa em desenvolvimento', 'info');
        break;
    }
  }
});

// =====================================================
// INICIALIZAÇÃO
// =====================================================
// Inicia quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciarExtensao);
} else {
  iniciarExtensao();
}
