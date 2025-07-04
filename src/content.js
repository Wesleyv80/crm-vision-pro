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
    totalAdesao: 0,
    totalGordurinha: 0
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
      if (window.CRMUI && window.CRMKanban && window.CRMStorage && window.CRMDashboard) {
        console.log('✅ Todos os módulos carregados');
        resolve();
      } else {
        console.log('⏳ Aguardando módulos...', {
          CRMUI: !!window.CRMUI,
          CRMKanban: !!window.CRMKanban,
          CRMStorage: !!window.CRMStorage,
          CRMDashboard: !!window.CRMDashboard
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
// CRIAR INTERFACE - SIMPLIFICADA
// =====================================================
function criarInterface() {
  // Remove elementos antigos se existirem
  const elementosAntigos = document.querySelectorAll('#crm-sidebar-container, #crm-floating-button');
  elementosAntigos.forEach(el => el.remove());
  
  // 1. Cria container principal
  const container = document.createElement('div');
  container.id = 'crm-sidebar-container';
  
  // Adiciona estilos inline para garantir funcionamento
  container.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    height: 100vh;
    z-index: 9999;
    pointer-events: auto;
  `;
  
  container.innerHTML = `
    <!-- Barra Lateral Minimalista -->
    <div id="crm-mini-sidebar" class="mini-sidebar">
      <div class="sidebar-logo">
        <div class="logo-animation">
          <span class="logo-icon">🚀</span>
        </div>
      </div>
      
      <div class="sidebar-menu">
        <button type="button" class="sidebar-btn pulse-animation" data-action="dashboard" title="Dashboard Completo" style="pointer-events: auto;">
          <span class="btn-icon">📊</span>
          <span class="btn-label">Dashboard</span>
        </button>
        
        <button type="button" class="sidebar-btn" data-action="capture" title="Capturar Contato" style="pointer-events: auto;">
          <span class="btn-icon">📸</span>
          <span class="btn-label">Capturar</span>
          <span class="pulse-dot"></span>
        </button>
        
        <button type="button" class="sidebar-btn" data-action="kanban" title="Pipeline" style="pointer-events: auto;">
          <span class="btn-icon">📋</span>
          <span class="btn-label">Pipeline</span>
        </button>
        
        <button type="button" class="sidebar-btn" data-action="ai" title="IA Assistant" style="pointer-events: auto;">
          <span class="btn-icon">🤖</span>
          <span class="btn-label">IA</span>
          <span class="ai-glow"></span>
        </button>
      </div>
      
      <div class="sidebar-footer">
        <button type="button" class="sidebar-btn" data-action="settings" title="Configurações" style="pointer-events: auto;">
          <span class="btn-icon">⚙️</span>
          <span class="btn-label">Config</span>
        </button>
      </div>
    </div>
    
    <!-- Overlay para modais -->
    <div id="crm-overlay" class="overlay hidden"></div>
  `;
  
  document.body.appendChild(container);
  
  // 2. Configura eventos dos botões com delay para garantir que elementos existam
  setTimeout(() => {
    configurarEventosSidebar();
  }, 100);
  
  // 3. Ajusta layout do WhatsApp
  ajustarLayoutWhatsApp();
}

// =====================================================
// CONFIGURAR EVENTOS DA SIDEBAR
// =====================================================
function configurarEventosSidebar() {
  console.log('🔧 Configurando eventos da sidebar...');
  
  // Verifica se o container existe
  const container = document.getElementById('crm-sidebar-container');
  if (!container) {
    console.error('❌ Container da sidebar não encontrado');
    return;
  }
  
  // Usa delegação de eventos para garantir funcionamento
  container.addEventListener('click', function(e) {
    // Verifica se é um botão da sidebar ou filho de um botão
    let botao = e.target.closest('.sidebar-btn');
    
    if (botao) {
      e.preventDefault();
      e.stopPropagation();
      
      const action = botao.dataset.action;
      console.log('🎯 Botão clicado:', action);
      
      if (action) {
        // Efeito visual
        botao.classList.add('active');
        setTimeout(() => botao.classList.remove('active'), 300);
        
        // Executa ação
        executarAcao(action);
      }
    }
  });
  
  // Adiciona eventos específicos para cada botão como fallback
  const botoes = container.querySelectorAll('.sidebar-btn');
  console.log(`📊 ${botoes.length} botões encontrados na sidebar`);
  
  botoes.forEach((btn, index) => {
    // Remove listeners antigos
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    // Adiciona novo listener
    newBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const action = this.dataset.action;
      console.log(`🎯 Botão ${index} clicado - Ação: ${action}`);
      
      if (action) {
        // Efeito visual
        this.classList.add('active');
        setTimeout(() => this.classList.remove('active'), 300);
        
        // Executa ação
        executarAcao(action);
      }
    });
    
    // Garante que o botão seja clicável
    newBtn.style.cursor = 'pointer';
    newBtn.style.pointerEvents = 'auto';
  });
  
  console.log('✅ Eventos da sidebar configurados');
}

// =====================================================
// EXECUTAR AÇÕES - SIMPLIFICADO
// =====================================================
async function executarAcao(action) {
  console.log(`🎯 Executando ação: ${action}`);
  
  // Verifica se os módulos estão disponíveis
  if (!window.CRMUI) {
    console.error('❌ CRMUI não está disponível. Recarregue a página.');
    return;
  }
  
  try {
    switch (action) {
      case 'dashboard':
        console.log('📊 Abrindo Dashboard Completo...');
        mostrarDashboard();
        break;
        
      case 'capture':
        console.log('📸 Capturando contato...');
        await capturarContatoAtual();
        break;
        
      case 'kanban':
        console.log('📋 Abrindo Kanban...');
        mostrarKanban();
        break;
        
      case 'ai':
        console.log('🤖 Abrindo IA Assistant...');
        mostrarAssistenteIA();
        break;
        
      case 'settings':
        console.log('⚙️ Abrindo Configurações...');
        mostrarConfiguracoes();
        break;
        
      default:
        console.warn('⚠️ Ação desconhecida:', action);
        CRMUI.mostrarNotificacao(`Ação "${action}" não reconhecida`, 'warning');
    }
  } catch (erro) {
    console.error('❌ Erro ao executar ação:', erro);
    CRMUI.mostrarNotificacao('Erro ao executar ação', 'error');
  }
}

// =====================================================
// MOSTRAR DASHBOARD - TELA CHEIA COM TUDO
// =====================================================
function mostrarDashboard() {
  console.log('📊 Abrindo Dashboard Completo em Tela Cheia...');
  
  // Verifica se o módulo existe
  if (window.CRMDashboard) {
    window.CRMDashboard.mostrarDashboardCompleto();
  } else {
    console.error('❌ Módulo Dashboard não encontrado');
    window.CRMUI.mostrarNotificacao('Erro ao carregar dashboard', 'error');
  }
}

// =====================================================
// CAPTURAR CONTATO ATUAL
// =====================================================
async function capturarContatoAtual() {
  CRMUI.mostrarNotificacao('Capturando dados do contato...', 'info');
  
  // Verifica se o módulo de captura existe
  if (!window.CRMCapture) {
    console.warn('⚠️ Módulo de captura não encontrado, usando dados simulados');
    
    // Dados simulados para teste
    const dadosSimulados = {
      nome: 'Contato Teste',
      telefone: '11999999999',
      imagem: ''
    };
    
    mostrarFormularioCadastro(dadosSimulados);
    return;
  }
  
  // Usa o módulo de captura
  const dadosContato = CRMCapture.capturarDadosContato();
  
  if (!dadosContato || !dadosContato.nome) {
    CRMUI.mostrarNotificacao('Nenhum contato ativo detectado!', 'warning');
    
    // Permite cadastro manual
    const cadastrarManualmente = await CRMUI.confirmar({
      titulo: 'Nenhum contato detectado',
      mensagem: 'Deseja cadastrar um contato manualmente?',
      textoBotaoConfirmar: 'Sim, cadastrar',
      textoBotaoCancelar: 'Cancelar'
    });
    
    if (cadastrarManualmente) {
      mostrarFormularioCadastro({});
    }
    return;
  }
  
  // Mostra painel de cadastro usando CRMUI
  mostrarFormularioCadastro(dadosContato);
}

// =====================================================
// MOSTRAR FORMULÁRIO DE CADASTRO
// =====================================================
function mostrarFormularioCadastro(dadosIniciais = {}) {
  const conteudo = `
    <div class="cadastro-form">
      <div class="form-header" style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
        <img src="${dadosIniciais.imagem || '/assets/avatar-placeholder.png'}" 
             class="contact-photo" 
             alt="Foto" 
             style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;"
             onerror="this.src='/assets/avatar-placeholder.png'">
        <div class="contact-info">
          <h3 style="margin: 0;">${dadosIniciais.nome || 'Novo Contato'}</h3>
          <p style="margin: 0; color: #6b7280;">${dadosIniciais.telefone || ''}</p>
        </div>
      </div>
      
      <form id="form-cadastro-contato" style="margin-top: 20px;">
        <div class="form-field">
          <label>Nome Completo <span class="required">*</span></label>
          <input type="text" name="nome" value="${dadosIniciais.nome || ''}" required class="field-input">
        </div>
        
        <div class="form-field">
          <label>Telefone <span class="required">*</span></label>
          <input type="tel" name="telefone" value="${dadosIniciais.telefone || ''}" required class="field-input">
        </div>
        
        <div class="form-field">
          <label>Email</label>
          <input type="email" name="email" placeholder="email@exemplo.com" class="field-input">
        </div>
        
        <div class="form-field">
          <label>Origem</label>
          <select name="origem" id="origem-select" class="field-input">
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
            <input type="text" name="indicador_nome" placeholder="Quem indicou?" class="field-input">
          </div>
          <div class="form-field">
            <label>Telefone do Indicador</label>
            <input type="tel" name="indicador_telefone" placeholder="Telefone de quem indicou" class="field-input">
          </div>
        </div>
        
        <div class="form-field">
          <label>Tags</label>
          <div class="tags-container" style="display: flex; flex-direction: column; gap: 8px;">
            <label style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" name="tags" value="potencial-alto"> 
              <span>🔥 Potencial Alto</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" name="tags" value="urgente"> 
              <span>⚡ Urgente</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" name="tags" value="retorno"> 
              <span>🔄 Retorno</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" name="tags" value="vip"> 
              <span>⭐ VIP</span>
            </label>
          </div>
        </div>
        
        <div class="form-field">
          <label>Observações</label>
          <textarea name="observacoes" rows="3" placeholder="Adicione notas sobre este contato..." class="field-input"></textarea>
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
          
          // Adiciona imagem se existir
          dados.imagem = dadosIniciais.imagem || '';
          
          salvarContatoEContinuar(dados);
        }
      }
    ]
  });
  
  // Configura campo condicional de indicação
  setTimeout(() => {
    const origemSelect = document.getElementById('origem-select');
    const camposIndicacao = document.getElementById('campos-indicacao');
    
    if (origemSelect && camposIndicacao) {
      origemSelect.addEventListener('change', (e) => {
        if (e.target.value === 'indicacao') {
          camposIndicacao.style.display = 'block';
        } else {
          camposIndicacao.style.display = 'none';
        }
      });
    }
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
      photo: dados.imagem || '',
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
// MOSTRAR CADASTRO DE NEGÓCIO
// =====================================================
function mostrarCadastroNegocio(clientId) {
  const cliente = window.crmState.kanbanData.clients[clientId];
  
  if (!cliente) {
    CRMUI.mostrarNotificacao('Cliente não encontrado', 'error');
    return;
  }
  
  const conteudo = `
    <div class="negocio-form">
      <div class="form-info" style="margin-bottom: 20px; padding: 12px; background: #f3f4f6; border-radius: 6px;">
        <p style="margin: 0;">Cadastre um negócio para <strong>${cliente.nome}</strong></p>
      </div>
      
      <form id="form-cadastro-negocio">
        <div class="form-field">
          <label>Título do Negócio</label>
          <input type="text" name="titulo" placeholder="Ex: Consultoria de Marketing" required class="field-input">
        </div>
        
        <div class="form-field">
          <label>Valor Adesão</label>
          <input type="number" name="valor_adesao" placeholder="0,00" step="0.01" required class="field-input">
        </div>
        
        <div class="form-field">
          <label>Valor Gordurinha</label>
          <input type="number" name="valor_gordurinha" placeholder="0,00" step="0.01" required class="field-input">
        </div>
        
        <div class="form-field">
          <label>Status</label>
          <select name="status" class="field-input">
            <option value="em_negociacao">Em Negociação</option>
            <option value="proposta_enviada">Proposta Enviada</option>
            <option value="fechado">Fechado</option>
            <option value="perdido">Perdido</option>
          </select>
        </div>
        
        <div class="form-field">
          <label>Descrição</label>
          <textarea name="descricao" rows="3" placeholder="Detalhes do negócio..." class="field-input"></textarea>
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
// MOSTRAR KANBAN
// =====================================================
function mostrarKanban() {
  if (!window.CRMKanban) {
    CRMUI.mostrarNotificacao('❌ Módulo Kanban não encontrado', 'error');
    return;
  }
  
  // Usa a função do módulo kanban
  CRMKanban.mostrarKanban();
}

// =====================================================
// CALCULAR ESTATÍSTICAS
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
// OUTRAS FUNÇÕES
// =====================================================
function mostrarAssistenteIA() {
  console.log('🤖 Mostrando IA Assistant...');
  
  const conteudo = `
    <div style="text-align: center; padding: 40px;">
      <div style="font-size: 64px; margin-bottom: 20px;">🤖</div>
      <h3>Assistente IA em Desenvolvimento</h3>
      <p style="color: #6b7280;">Em breve você terá um assistente inteligente para ajudar em suas vendas!</p>
    </div>
  `;
  
  CRMUI.criarModal({
    titulo: 'IA Assistant',
    conteudo: conteudo,
    tamanho: 'medium'
  });
}

function mostrarConfiguracoes() {
  console.log('⚙️ Mostrando Configurações...');
  
  const conteudo = `
    <div style="padding: 20px;">
      <h3>Configurações do CRM</h3>
      <div style="margin-top: 20px;">
        <label style="display: block; margin-bottom: 16px;">
          <input type="checkbox" checked> Notificações ativadas
        </label>
        <label style="display: block; margin-bottom: 16px;">
          <input type="checkbox" checked> Captura automática
        </label>
        <label style="display: block; margin-bottom: 16px;">
          <input type="checkbox"> Modo escuro
        </label>
      </div>
      <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          CRM Vision Pro v2.0.1<br>
          Por Wesley Silva
        </p>
      </div>
    </div>
  `;
  
  CRMUI.criarModal({
    titulo: 'Configurações',
    conteudo: conteudo,
    tamanho: 'small'
  });
}

function ajustarLayoutWhatsApp() {
  const app = document.querySelector('#app');
  const sidebar = document.querySelector('.mini-sidebar');

  if (!app || !sidebar) return;

  // Define estilo inicial
  app.style.transition = 'all 0.3s ease';
  app.style.marginRight = '70px';
  app.style.width = 'calc(100% - 70px)';

  // Expande ao passar o mouse na barra
  sidebar.addEventListener('mouseenter', () => {
    sidebar.style.width = '220px';
    app.style.marginRight = '220px';
    app.style.width = 'calc(100% - 220px)';
  });

  // Recolhe ao tirar o mouse
  sidebar.addEventListener('mouseleave', () => {
    sidebar.style.width = '70px';
    app.style.marginRight = '70px';
    app.style.width = 'calc(100% - 70px)';
  });
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