// =====================================================
// Módulo Kanban - Sistema de Cards Drag & Drop
// =====================================================
// Gerencia o quadro Kanban com arrastar e soltar

window.CRMKanban = (() => {
  
  // Estado do Kanban
  const state = {
    colunas: [],
    cards: [],
    draggedCard: null,
    filtros: {
      busca: '',
      tags: [],
      origem: ''
    },
    todosClientes: [],
    fullscreenContainer: null // Para referência do container
  };
  
  // =====================================================
  // CRIAR KANBAN - MODIFICADO SEM BARRA SUPERIOR
  // =====================================================
  
  function criarKanban(container) {
    if (!container) {
      console.error('Container não fornecido para o Kanban');
      return;
    }
    
    // Limpa container
    container.innerHTML = '';
    container.className = 'crm-kanban-board';
    
    // Header do Kanban (agora com botão fechar integrado)
    const header = criarHeaderKanban();
    container.appendChild(header);
    
    // Container das colunas
    const colunasContainer = document.createElement('div');
    colunasContainer.className = 'kanban-columns';
    colunasContainer.style.cssText = 'display: flex; gap: 16px; overflow-x: auto; padding: 20px 0;';
    
    // Carrega dados e renderiza colunas
    carregarDados().then(() => {
      renderizarColunas(colunasContainer);
    });
    
    container.appendChild(colunasContainer);
    
    // Adiciona eventos globais
    configurarEventosGlobais();
    
    return container;
  }
  
  // =====================================================
  // HEADER DO KANBAN - AGORA COM BOTÃO FECHAR INTEGRADO
  // =====================================================
  
  function criarHeaderKanban() {
    const header = document.createElement('div');
    header.className = 'kanban-header';
    header.style.cssText = 'padding: 20px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white;';
    
    header.innerHTML = `
      <div class="kanban-title">
        <h2>Pipeline de Vendas</h2>
        <span class="kanban-subtitle">Arraste os cards entre as colunas para gerenciar seu funil</span>
      </div>
      
      <div class="kanban-controls" style="margin-top: 15px; display: flex; gap: 12px; align-items: center; justify-content: space-between;">
        <div style="display: flex; gap: 12px; align-items: center; flex: 1;">
          <div class="kanban-search" style="position: relative; max-width: 400px; flex: 1;">
            <input type="text" 
              id="kanban-search-input"
              placeholder="Buscar cliente... (Enter para buscar, Delete para limpar)" 
              class="kanban-search-input"
              style="width: 100%; padding: 8px 35px 8px 12px; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; background: rgba(255,255,255,0.1); color: white;">
            <button class="kanban-search-btn" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: white;">🔍</button>
          </div>
          
          <div class="kanban-filters" style="display: flex; gap: 8px;">
            <button class="filter-btn" data-filter="tags" style="padding: 8px 12px; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; background: rgba(255,255,255,0.1); color: white; cursor: pointer;">
              <span>🏷️ Tags</span>
            </button>
            <button class="filter-btn" data-filter="origem" style="padding: 8px 12px; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; background: rgba(255,255,255,0.1); color: white; cursor: pointer;">
              <span>📍 Origem</span>
            </button>
          </div>
          
          <button class="kanban-add-btn" style="padding: 8px 12px; background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; cursor: pointer;">
            <span>➕ Nova Coluna</span>
          </button>
        </div>
        
        <!-- BOTÃO FECHAR AGORA AQUI -->
        <button class="kanban-close-btn" id="close-kanban-btn" style="
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s ease;
        ">✕ Fechar CRM</button>
      </div>
    `;
    
    // Eventos do header CORRIGIDOS
    const searchInput = header.querySelector('#kanban-search-input');
    const searchBtn = header.querySelector('.kanban-search-btn');
    const closeBtn = header.querySelector('#close-kanban-btn');
    
    // Busca com ENTER
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        realizarBusca(searchInput.value);
      } else if (e.key === 'Delete') {
        e.preventDefault();
        searchInput.value = '';
        limparBusca();
      }
    });
    
    // Busca ao digitar (com debounce)
    searchInput.addEventListener('input', debounce((e) => {
      if (e.target.value === '') {
        limparBusca();
      }
    }, 300));
    
    // Botão de busca
    searchBtn.addEventListener('click', () => {
      realizarBusca(searchInput.value);
    });
    
    // BOTÃO FECHAR - AGORA INTEGRADO
    closeBtn.addEventListener('click', () => {
      fecharKanban();
    });
    
    // Filtros de Tags e Origem
    header.querySelector('[data-filter="tags"]').addEventListener('click', () => {
      mostrarFiltroTags();
    });
    
    header.querySelector('[data-filter="origem"]').addEventListener('click', () => {
      mostrarFiltroOrigem();
    });
    
    // Nova coluna
    header.querySelector('.kanban-add-btn').addEventListener('click', adicionarColuna);
    
    return header;
  }
  
  // =====================================================
  // FECHAR KANBAN - NOVA FUNÇÃO
  // =====================================================
  
  function fecharKanban() {
    if (state.fullscreenContainer) {
      state.fullscreenContainer.remove();
      state.fullscreenContainer = null;
    }
  }
  
  // =====================================================
  // MOSTRAR KANBAN - MODIFICADO PARA ARMAZENAR REFERÊNCIA
  // =====================================================
  
  function mostrarKanban() {
    if (!window.CRMKanban) {
      CRMUI.mostrarNotificacao('❌ Módulo Kanban não encontrado', 'error');
      return;
    }
    
    // Remove modal existente se houver
    const existingModal = document.querySelector('.crm-modal-container');
    if (existingModal) {
      existingModal.remove();
    }
    
    // Cria container fullscreen SEM barra superior separada
    const fullscreenContainer = document.createElement('div');
    fullscreenContainer.id = 'kanban-fullscreen';
    fullscreenContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: white;
      z-index: 99999;
      display: flex;
      flex-direction: column;
    `;
    
    // Armazena referência para poder fechar depois
    state.fullscreenContainer = fullscreenContainer;
    
    // O kanban é criado diretamente no container (header já inclui o botão fechar)
    criarKanban(fullscreenContainer);
    
    document.body.appendChild(fullscreenContainer);
    
    return fullscreenContainer;
  }
  
  // =====================================================
  // FUNÇÕES DE BUSCA - MELHORADAS
  // =====================================================
  
  function realizarBusca(termo) {
    if (!termo.trim()) {
      limparBusca();
      return;
    }
    
    state.filtros.busca = termo.toLowerCase();
    
    // Esconde todos os cards primeiro
    const todosCards = document.querySelectorAll('.kanban-card');
    todosCards.forEach(card => {
      card.style.display = 'none';
    });
    
    // Mostra apenas cards que correspondem à busca
    let encontrados = 0;
    todosCards.forEach(card => {
      const clientId = card.dataset.clientId;
      const client = obterClientePorId(clientId);
      
      if (client) {
        const nome = (client.nome || '').toLowerCase();
        const telefone = (client.telefone || '').toLowerCase();
        const observacoes = (client.observacoes || '').toLowerCase();
        
        if (nome.includes(state.filtros.busca) || 
            telefone.includes(state.filtros.busca) || 
            observacoes.includes(state.filtros.busca)) {
          card.style.display = '';
          encontrados++;
        }
      }
    });
    
    // Atualiza contadores
    atualizarContadores();
    
    // Mostra mensagem
    if (encontrados === 0) {
      CRMUI.mostrarNotificacao('Nenhum cliente encontrado', 'info');
    } else {
      CRMUI.mostrarNotificacao(`${encontrados} cliente(s) encontrado(s)`, 'success');
    }
  }
  
  function limparBusca() {
    state.filtros.busca = '';
    
    // Mostra todos os cards
    const todosCards = document.querySelectorAll('.kanban-card');
    todosCards.forEach(card => {
      card.style.display = '';
    });
    
    // Atualiza contadores
    atualizarContadores();
  }
  
  // =====================================================
  // CRIAR CARD - ATUALIZADO COM OBSERVAÇÕES
  // =====================================================
  
  function criarCard(clientData) {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.dataset.clientId = clientData.id;
    card.draggable = true;
    card.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      cursor: move;
      transition: all 0.2s;
    `;
    
    const ultimoNegocio = clientData.deals?.[clientData.deals.length - 1];
    const totalAdesao = clientData.deals?.reduce((sum, deal) => sum + (deal.valor_adesao || 0), 0) || 0;
    const totalGordurinha = clientData.deals?.reduce((sum, deal) => sum + (deal.valor_gordurinha || 0), 0) || 0;
    
    // Corrige a imagem
    const fotoUrl = clientData.photo || clientData.imagem || '/assets/avatar-placeholder.png';
    
    card.innerHTML = `
      <div class="card-header" style="display: flex; align-items: center; margin-bottom: 8px;">
        <img src="${fotoUrl}" 
             alt="${clientData.nome}" 
             class="card-avatar"
             style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; margin-right: 8px;"
             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNFNUU3RUIiLz4KPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI4IiB5PSI4Ij4KPHBhdGggZD0iTTggMTBDMTAuMjA5MSAxMCAxMiA4LjIwOTEgMTIgNkMxMiAzLjc5MDkgMTAuMjA5MSAyIDggMkM1Ljc5MDkgMiA0IDMuNzkwOSA0IDZDNCA4LjIwOTEgNS43OTA5IDEwIDggMTBaIiBmaWxsPSIjOUI5QjlCIi8+CjxwYXRoIGQ9Ik0xNiAxNEMxNiAxMSAxMi40MTggOCA4IDhDMy41ODIgOCAwIDExIDAgMTRIMTZaIiBmaWxsPSIjOUI5QjlCIi8+Cjwvc3ZnPgo8L3N2Zz4K'">
        <div class="card-info" style="flex: 1; min-width: 0;">
          <h4 class="card-name" style="margin: 0; font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${clientData.nome}</h4>
          <p class="card-phone" style="margin: 0; font-size: 12px; color: #6b7280;">${clientData.telefone || 'Sem telefone'}</p>
        </div>
        <button class="card-menu-btn" style="background: none; border: none; cursor: pointer; padding: 4px; color: #9ca3af;">⋮</button>
      </div>
      
      <div class="card-body">
        ${clientData.tags?.length ? `
          <div class="card-tags" style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 8px;">
            ${clientData.tags.slice(0, 2).map(tag => `
              <span class="card-tag" style="font-size: 11px; padding: 2px 6px; background: #e5e7eb; border-radius: 4px;">${getTagEmoji(tag)}</span>
            `).join('')}
            ${clientData.tags.length > 2 ? `<span style="font-size: 11px; color: #6b7280;">+${clientData.tags.length - 2}</span>` : ''}
          </div>
        ` : ''}
        
        ${clientData.indicacao ? `
          <p style="font-size: 11px; color: #6b7280; margin: 4px 0;">
            📍 Indicação: ${clientData.indicacao.nome}
          </p>
        ` : ''}
        
        <!-- OBSERVAÇÕES AGORA APARECEM NO CARD -->
        ${clientData.observacoes ? `
          <div class="card-notes" style="
            font-size: 11px;
            color: #6b7280;
            background: #f9fafb;
            padding: 6px 8px;
            border-radius: 4px;
            border-left: 3px solid #e5e7eb;
            margin-bottom: 8px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            line-height: 1.3;
          ">
            💭 ${clientData.observacoes}
          </div>
        ` : ''}
        
        <div class="card-metrics" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px;">
          <div>
            <span style="color: #6b7280;">Adesão:</span>
            <strong style="display: block;">R$ ${totalAdesao.toLocaleString('pt-BR')}</strong>
          </div>
          <div>
            <span style="color: #6b7280;">Gordurinha:</span>
            <strong style="display: block;">R$ ${totalGordurinha.toLocaleString('pt-BR')}</strong>
          </div>
        </div>
      </div>
      
      <div class="card-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding-top: 8px; border-top: 1px solid #f3f4f6;">
        <div class="card-actions" style="display: flex; gap: 4px;">
          <button class="card-action" data-action="editar" title="Editar" style="background: none; border: none; cursor: pointer; padding: 4px; font-size: 14px;">✏️</button>
          <button class="card-action" data-action="negocio" title="Negócio" style="background: none; border: none; cursor: pointer; padding: 4px; font-size: 14px;">💼</button>
          <button class="card-action" data-action="tarefa" title="Tarefa" style="background: none; border: none; cursor: pointer; padding: 4px; font-size: 14px;">📋</button>
          <button class="card-action" data-action="excluir" title="Excluir" style="background: none; border: none; cursor: pointer; padding: 4px; font-size: 14px; color: #ef4444;">🗑️</button>
        </div>
        
        <div class="card-priority" style="width: 8px; height: 8px; border-radius: 50%; background: ${getPriorityColor(clientData)}"></div>
      </div>
    `;
    
    // Eventos do card
    configurarEventosCard(card, clientData);
    
    return card;
  }
  
  // =====================================================
  // AÇÕES DOS CARDS - AGORA ABREM DENTRO DO CRM
  // =====================================================
  
  function editarCliente(clientId) {
    const cliente = obterClientePorId(clientId);
    if (!cliente) {
      CRMUI.mostrarNotificacao('Cliente não encontrado', 'error');
      return;
    }
    
    const conteudo = `
      <div class="form-container">
        <form id="form-editar-cliente">
          <div class="form-field" style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">Nome Completo</label>
            <input type="text" name="nome" value="${cliente.nome || ''}" required 
                   style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
          </div>
          
          <div class="form-field" style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">Telefone</label>
            <input type="tel" name="telefone" value="${cliente.telefone || ''}" required
                   style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
          </div>
          
          <div class="form-field" style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">Email</label>
            <input type="email" name="email" value="${cliente.email || ''}"
                   style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
          </div>
          
          <div class="form-field" style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">Origem</label>
            <select name="origem" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
              <option value="whatsapp" ${cliente.origem === 'whatsapp' ? 'selected' : ''}>WhatsApp</option>
              <option value="indicacao" ${cliente.origem === 'indicacao' ? 'selected' : ''}>Indicação</option>
              <option value="site" ${cliente.origem === 'site' ? 'selected' : ''}>Site</option>
              <option value="instagram" ${cliente.origem === 'instagram' ? 'selected' : ''}>Instagram</option>
              <option value="facebook" ${cliente.origem === 'facebook' ? 'selected' : ''}>Facebook</option>
            </select>
          </div>
          
          <div class="form-field" style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">Observações</label>
            <textarea name="observacoes" rows="3" placeholder="Notas sobre este cliente..."
                      style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; resize: vertical;">${cliente.observacoes || ''}</textarea>
          </div>
        </form>
      </div>
    `;
    
    const modal = CRMUI.criarModal({
      titulo: `Editar Cliente: ${cliente.nome}`,
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
          texto: '💾 Salvar Alterações',
          tipo: 'primary',
          onClick: async () => {
            const form = document.getElementById('form-editar-cliente');
            const formData = new FormData(form);
            
            // Atualiza dados do cliente
            cliente.nome = formData.get('nome');
            cliente.telefone = formData.get('telefone');
            cliente.email = formData.get('email');
            cliente.origem = formData.get('origem');
            cliente.observacoes = formData.get('observacoes');
            cliente.ultimaAtualizacao = new Date().toISOString();
            
            // Salva no storage
            await salvarDados();
            
            // Atualiza o card na interface
            const cardElement = document.querySelector(`[data-client-id="${clientId}"]`);
            if (cardElement) {
              const novoCard = criarCard(cliente);
              cardElement.parentNode.replaceChild(novoCard, cardElement);
            }
            
            CRMUI.mostrarNotificacao('✅ Cliente atualizado com sucesso!', 'success');
            modal.fechar();
          }
        }
      ]
    });
  }
  
  function novoNegocio(clientId) {
    const cliente = obterClientePorId(clientId);
    if (!cliente) {
      CRMUI.mostrarNotificacao('Cliente não encontrado', 'error');
      return;
    }
    
    const conteudo = `
      <div class="form-container">
        <div style="margin-bottom: 20px; padding: 12px; background: #f3f4f6; border-radius: 6px;">
          <p style="margin: 0;">Novo negócio para <strong>${cliente.nome}</strong></p>
        </div>
        
        <form id="form-novo-negocio">
          <div class="form-field" style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">Título do Negócio</label>
            <input type="text" name="titulo" placeholder="Ex: Consultoria de Marketing" required
                   style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div class="form-field">
              <label style="display: block; margin-bottom: 4px; font-weight: 500;">Valor Adesão</label>
              <input type="number" name="valor_adesao" placeholder="0,00" step="0.01" required
                     style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
            </div>
            
            <div class="form-field">
              <label style="display: block; margin-bottom: 4px; font-weight: 500;">Valor Gordurinha</label>
              <input type="number" name="valor_gordurinha" placeholder="0,00" step="0.01" required
                     style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
            </div>
          </div>
          
          <div class="form-field" style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">Status</label>
            <select name="status" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
              <option value="em_negociacao">Em Negociação</option>
              <option value="proposta_enviada">Proposta Enviada</option>
              <option value="fechado">Fechado</option>
              <option value="perdido">Perdido</option>
            </select>
          </div>
          
          <div class="form-field">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">Descrição</label>
            <textarea name="descricao" rows="3" placeholder="Detalhes do negócio..."
                      style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; resize: vertical;"></textarea>
          </div>
        </form>
      </div>
    `;
    
    const modal = CRMUI.criarModal({
      titulo: 'Novo Negócio',
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
          texto: '💰 Salvar Negócio',
          tipo: 'primary',
          onClick: async () => {
            const form = document.getElementById('form-novo-negocio');
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
            await salvarDados();
            
            // Atualiza o card na interface
            const cardElement = document.querySelector(`[data-client-id="${clientId}"]`);
            if (cardElement) {
              const novoCard = criarCard(cliente);
              cardElement.parentNode.replaceChild(novoCard, cardElement);
            }
            
            // Atualiza contadores das colunas
            atualizarContadores();
            
            CRMUI.mostrarNotificacao('💰 Negócio cadastrado com sucesso!', 'success');
            modal.fechar();
          }
        }
      ]
    });
  }
  
  function novaTarefa(clientId) {
    const cliente = obterClientePorId(clientId);
    if (!cliente) {
      CRMUI.mostrarNotificacao('Cliente não encontrado', 'error');
      return;
    }
    
    const conteudo = `
      <div class="form-container">
        <div style="margin-bottom: 20px; padding: 12px; background: #f3f4f6; border-radius: 6px;">
          <p style="margin: 0;">Nova tarefa para <strong>${cliente.nome}</strong></p>
        </div>
        
        <form id="form-nova-tarefa">
          <div class="form-field" style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">Título da Tarefa</label>
            <input type="text" name="titulo" placeholder="Ex: Ligar para cliente" required
                   style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div class="form-field">
              <label style="display: block; margin-bottom: 4px; font-weight: 500;">Data de Vencimento</label>
              <input type="date" name="data_vencimento" required
                     style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
            </div>
            
            <div class="form-field">
              <label style="display: block; margin-bottom: 4px; font-weight: 500;">Prioridade</label>
              <select name="prioridade" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
                <option value="baixa">🔵 Baixa</option>
                <option value="media" selected>🟡 Média</option>
                <option value="alta">🔴 Alta</option>
                <option value="urgente">⚡ Urgente</option>
              </select>
            </div>
          </div>
          
          <div class="form-field">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">Descrição</label>
            <textarea name="descricao" rows="3" placeholder="Detalhes da tarefa..."
                      style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; resize: vertical;"></textarea>
          </div>
        </form>
      </div>
    `;
    
    const modal = CRMUI.criarModal({
      titulo: 'Nova Tarefa',
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
          texto: '📋 Salvar Tarefa',
          tipo: 'primary',
          onClick: async () => {
            const form = document.getElementById('form-nova-tarefa');
            const formData = new FormData(form);
            
            const tarefa = {
              id: 'task_' + Date.now(),
              titulo: formData.get('titulo'),
              descricao: formData.get('descricao'),
              data_vencimento: formData.get('data_vencimento'),
              prioridade: formData.get('prioridade'),
              status: 'pendente',
              clienteId: clientId,
              dataCriacao: new Date().toISOString()
            };
            
            // Adiciona tarefa ao cliente
            if (!cliente.tasks) cliente.tasks = [];
            cliente.tasks.push(tarefa);
            
            // Adiciona à lista global de tarefas
            if (!window.crmState.kanbanData.tasks) window.crmState.kanbanData.tasks = [];
            window.crmState.kanbanData.tasks.push(tarefa);
            
            // Salva
            await salvarDados();
            
            CRMUI.mostrarNotificacao('📋 Tarefa criada com sucesso!', 'success');
            modal.fechar();
          }
        }
      ]
    });
  }
  
  // =====================================================
  // RENDERIZAR COLUNAS - LARGURA AJUSTADA
  // =====================================================
  
  function renderizarColunas(container) {
    container.innerHTML = '';
    
    state.colunas.forEach(coluna => {
      const colunaEl = criarColuna(coluna);
      container.appendChild(colunaEl);
    });
    
    // Adiciona botão para nova coluna no final
    const addColBtn = document.createElement('div');
    addColBtn.className = 'kanban-add-column';
    addColBtn.style.cssText = 'min-width: 280px; display: flex; align-items: center; justify-content: center;';
    addColBtn.innerHTML = `
      <button class="add-column-btn" style="padding: 12px 24px; border: 2px dashed #d1d5db; border-radius: 8px; background: transparent; cursor: pointer;">
        <span>➕</span>
        <span>Adicionar Coluna</span>
      </button>
    `;
    addColBtn.querySelector('button').addEventListener('click', adicionarColuna);
    container.appendChild(addColBtn);
  }
  
  // =====================================================
  // CRIAR COLUNA - LARGURA REDUZIDA
  // =====================================================
  
  function criarColuna(colunaData) {
    const coluna = document.createElement('div');
    coluna.className = 'kanban-column';
    coluna.dataset.colunaId = colunaData.id;
    coluna.style.cssText = `
      min-width: 280px;
      max-width: 280px;
      background: #f9fafb;
      border-radius: 8px;
      border-top: 4px solid ${colunaData.color || '#6366f1'};
      padding: 16px;
    `;
    
    // Header da coluna
    const header = document.createElement('div');
    header.className = 'column-header';
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;';
    header.innerHTML = `
      <div class="column-info">
        <h3 class="column-title" contenteditable="false" style="margin: 0; font-size: 16px; font-weight: 600;">${colunaData.title}</h3>
        <span class="column-count" style="font-size: 12px; color: #6b7280;">${colunaData.clients.length} cards</span>
      </div>

      <div class="column-actions" style="display: flex; gap: 4px;">
        <button class="column-btn edit-column" title="Editar" style="background: none; border: none; cursor: pointer; padding: 4px;">✏️</button>
        <button class="column-btn color-column" title="Cor" style="background: none; border: none; cursor: pointer; padding: 4px;">🎨</button>
        <button class="column-btn delete-column" title="Excluir" style="background: none; border: none; cursor: pointer; padding: 4px;">🗑️</button>
      </div>
    `;

    // Adesão e Gordurinha no topo da coluna
    const { totalAdesao, totalGordurinha } = calcularTotaisColuna(colunaData);
    const valoresContainer = document.createElement("div");
    valoresContainer.className = "valores-topo";
    valoresContainer.style.fontSize = "12px";
    valoresContainer.style.marginTop = "4px";
    valoresContainer.innerHTML = `
      <div>Adesão: <strong>R$ ${totalAdesao.toFixed(2)}</strong></div>
      <div>Gordurinha: <strong>R$ ${totalGordurinha.toFixed(2)}</strong></div>
    `;
    header.appendChild(valoresContainer);
    
    // Área dos cards
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'column-cards';
    cardsContainer.dataset.colunaId = colunaData.id;
    cardsContainer.style.cssText = 'min-height: 100px; max-height: calc(100vh - 300px); overflow-y: auto;';
    
    // Renderiza cards da coluna
    colunaData.clients.forEach(clientId => {
      const clientData = obterClientePorId(clientId);
      if (clientData) {
        const card = criarCard(clientData);
        cardsContainer.appendChild(card);
      }
    });

    // Adiciona eventos de coluna
    const titulo = header.querySelector('.column-title');
    const editBtn = header.querySelector('.edit-column');
    const colorBtn = header.querySelector('.color-column');
    const deleteBtn = header.querySelector('.delete-column');

    // Editar título
    editBtn.addEventListener('click', () => {
      titulo.contentEditable = true;
      titulo.focus();
      titulo.style.background = '#fff';
      titulo.style.padding = '4px 8px';
      titulo.style.borderRadius = '4px';

      const salvarTitulo = () => {
        titulo.contentEditable = false;
        titulo.style.background = 'transparent';
        titulo.style.padding = '0';
        const novoTitulo = titulo.textContent.trim();

        if (novoTitulo && novoTitulo !== colunaData.title) {
          colunaData.title = novoTitulo;
          salvarDados();
        } else {
          titulo.textContent = colunaData.title;
        }
      };

      titulo.addEventListener('blur', salvarTitulo, { once: true });
      titulo.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          titulo.blur();
        }
      });
    });

    // Mudar cor
    colorBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      mostrarSeletorCor(coluna, colunaData);
    });

    // Excluir coluna
    deleteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      
      if (colunaData.clients.length > 0) {
        CRMUI.mostrarNotificacao('Não é possível excluir colunas com cards', 'warning');
        return;
      }

      const confirmar = await CRMUI.confirmar({
        titulo: 'Excluir Coluna',
        mensagem: `Deseja excluir a coluna "${colunaData.title}"?`,
        tipo: 'danger'
      });

      if (confirmar) {
        excluirColuna(colunaData.id);
      }
    });

    coluna.appendChild(header);
    coluna.appendChild(cardsContainer);

    // Drag & Drop
    configurarDragDrop(cardsContainer);


    return coluna;
  }
  
  // =====================================================
  // RESTO DAS FUNÇÕES (sem alteração significativa)
  // =====================================================
  
  function configurarEventosCard(card, clientData) {
    // Drag start
    card.addEventListener('dragstart', (e) => {
      state.draggedCard = card;
      card.classList.add('dragging');
      card.style.opacity = '0.5';
      e.dataTransfer.effectAllowed = 'move';
    });
    
    // Drag end
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      card.style.opacity = '1';
      state.draggedCard = null;
      
      // Remove todos os indicadores
      document.querySelectorAll('.drag-over').forEach(el => {
        el.classList.remove('drag-over');
      });
    });
    
    // Double click para editar
    card.addEventListener('dblclick', () => {
      editarCliente(clientData.id);
    });
    
    // Menu do card
    const menuBtn = card.querySelector('.card-menu-btn');
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      mostrarMenuCard(card, clientData);
    });
    
    // Ações do card - AGORA ABREM MODAIS INTERNOS
    card.querySelectorAll('.card-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        
        switch (action) {
          case 'editar':
            editarCliente(clientData.id);
            break;
          case 'negocio':
            novoNegocio(clientData.id);
            break;
          case 'tarefa':
            novaTarefa(clientData.id);
            break;
          case 'excluir':
            excluirCliente(clientData.id);
            break;
        }
      });
    });
  }
  
  // Todas as outras funções permanecem iguais...
  // (mostrarFiltroTags, mostrarFiltroOrigem, aplicarFiltros, configurarDragDrop, etc.)
  
  function mostrarFiltroTags() {
    // Coleta todas as tags únicas
    const todasTags = new Set();
    Object.values(window.crmState.kanbanData.clients || {}).forEach(client => {
      (client.tags || []).forEach(tag => todasTags.add(tag));
    });
    
    const conteudo = `
      <div class="filtro-tags">
        <p>Selecione as tags para filtrar:</p>
        <div style="margin-top: 10px;">
          ${Array.from(todasTags).map(tag => `
            <label style="display: block; margin: 5px 0;">
              <input type="checkbox" value="${tag}" ${state.filtros.tags.includes(tag) ? 'checked' : ''}>
              ${getTagEmoji(tag)} ${tag}
            </label>
          `).join('')}
        </div>
      </div>
    `;
    
    const modal = CRMUI.criarModal({
      titulo: 'Filtrar por Tags',
      conteudo: conteudo,
      tamanho: 'small',
      acoes: [
        {
          id: 'limpar',
          texto: 'Limpar Filtros',
          tipo: 'secondary',
          onClick: () => {
            state.filtros.tags = [];
            aplicarFiltros();
            modal.fechar();
          }
        },
        {
          id: 'aplicar',
          texto: 'Aplicar',
          tipo: 'primary',
          onClick: () => {
            const checkboxes = document.querySelectorAll('.filtro-tags input[type="checkbox"]:checked');
            state.filtros.tags = Array.from(checkboxes).map(cb => cb.value);
            aplicarFiltros();
            modal.fechar();
          }
        }
      ]
    });
  }
  
  function mostrarFiltroOrigem() {
    // Coleta todas as origens únicas
    const todasOrigens = new Set();
    Object.values(window.crmState.kanbanData.clients || {}).forEach(client => {
      if (client.origem) todasOrigens.add(client.origem);
    });
    
    const conteudo = `
      <div class="filtro-origem">
        <p>Selecione a origem para filtrar:</p>
        <div style="margin-top: 10px;">
          <label style="display: block; margin: 5px 0;">
            <input type="radio" name="origem" value="" ${!state.filtros.origem ? 'checked' : ''}>
            Todas as origens
          </label>
          ${Array.from(todasOrigens).map(origem => `
            <label style="display: block; margin: 5px 0;">
              <input type="radio" name="origem" value="${origem}" ${state.filtros.origem === origem ? 'checked' : ''}>
              ${origem}
            </label>
          `).join('')}
        </div>
      </div>
    `;
    
    const modal = CRMUI.criarModal({
      titulo: 'Filtrar por Origem',
      conteudo: conteudo,
      tamanho: 'small',
      acoes: [
        {
          id: 'aplicar',
          texto: 'Aplicar',
          tipo: 'primary',
          onClick: () => {
            const radio = document.querySelector('.filtro-origem input[type="radio"]:checked');
            state.filtros.origem = radio ? radio.value : '';
            aplicarFiltros();
            modal.fechar();
          }
        }
      ]
    });
  }
  
  function aplicarFiltros() {
    const cards = document.querySelectorAll('.kanban-card');
    
    cards.forEach(card => {
      const clientId = card.dataset.clientId;
      const client = obterClientePorId(clientId);
      
      if (!client) {
        card.style.display = 'none';
        return;
      }
      
      let visible = true;
      
      // Filtro de busca
      if (state.filtros.busca) {
        const busca = state.filtros.busca.toLowerCase();
        const nome = (client.nome || '').toLowerCase();
        const telefone = (client.telefone || '').toLowerCase();
        const observacoes = (client.observacoes || '').toLowerCase();
        
        visible = nome.includes(busca) || telefone.includes(busca) || observacoes.includes(busca);
      }
      
      // Filtro de tags
      if (visible && state.filtros.tags.length > 0) {
        visible = state.filtros.tags.some(tag => 
          client.tags?.includes(tag)
        );
      }
      
      // Filtro de origem
      if (visible && state.filtros.origem) {
        visible = client.origem === state.filtros.origem;
      }
      
      card.style.display = visible ? '' : 'none';
    });
    
    atualizarContadores();
  }
  
  function configurarDragDrop(container) {
    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('drop', handleDrop);
    container.addEventListener('dragleave', handleDragLeave);
  }
  
  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const container = e.currentTarget;
    container.style.background = '#e5e7eb';
  }
  
  function handleDrop(e) {
    e.preventDefault();
    const container = e.currentTarget;
    container.style.background = '';
    
    if (state.draggedCard) {
      const oldColumnId = state.draggedCard.closest('.column-cards').dataset.colunaId;
      const newColumnId = container.dataset.colunaId;
      const clientId = state.draggedCard.dataset.clientId;
      
      if (oldColumnId !== newColumnId) {
        container.appendChild(state.draggedCard);
        moverCard(clientId, oldColumnId, newColumnId);
      }
    }
  }
  
  function handleDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      e.currentTarget.style.background = '';
    }
  }
  
  function moverCard(clientId, oldColumnId, newColumnId) {
    const oldColumn = state.colunas.find(col => col.id === oldColumnId);
    if (oldColumn) {
      oldColumn.clients = oldColumn.clients.filter(id => id !== clientId);
    }
    
    const newColumn = state.colunas.find(col => col.id === newColumnId);
    if (newColumn) {
      newColumn.clients.push(clientId);
    }
    
    atualizarContadores();
    salvarDados();
    CRMUI.mostrarNotificacao(`Card movido para ${newColumn.title}`, 'success');
  }
  
  function calcularTotaisColuna(coluna) {
    let totalAdesao = 0;
    let totalGordurinha = 0;
    
    coluna.clients.forEach(clientId => {
      const client = obterClientePorId(clientId);
      if (client && client.deals) {
        client.deals.forEach(deal => {
          totalAdesao += deal.valor_adesao || 0;
          totalGordurinha += deal.valor_gordurinha || 0;
        });
      }
    });
    
    return { totalAdesao, totalGordurinha };
  }
  
  function atualizarContadores() {
    document.querySelectorAll('.kanban-column').forEach(colunaEl => {
      const colunaId = colunaEl.dataset.colunaId;
      const coluna = state.colunas.find(col => col.id === colunaId);
      
      if (coluna) {
        const visibleCards = colunaEl.querySelectorAll('.kanban-card:not([style*="display: none"])');
        const countEl = colunaEl.querySelector('.column-count');
        if (countEl) {
          countEl.textContent = `${visibleCards.length} cards`;
        }
        
        // Atualiza totais
        const { totalAdesao, totalGordurinha } = calcularTotaisColuna(coluna);
        const valoresEl = colunaEl.querySelector('.valores-topo');
        if (valoresEl) {
          valoresEl.innerHTML = `
            <div>Adesão: <strong>R$ ${totalAdesao.toFixed(2)}</strong></div>
            <div>Gordurinha: <strong>R$ ${totalGordurinha.toFixed(2)}</strong></div>
          `;
        }
      }
    });
  }
  
  function mostrarMenuCard(card, clientData) {
    const menuItems = [
      { texto: 'Editar Cliente', icone: '✏️', onClick: () => editarCliente(clientData.id) },
      { texto: 'Novo Negócio', icone: '💼', onClick: () => novoNegocio(clientData.id) },
      { texto: 'Nova Tarefa', icone: '📋', onClick: () => novaTarefa(clientData.id) },
      { separador: true },
      { texto: 'Ver Histórico', icone: '📊', onClick: () => verHistorico(clientData.id) },
      { texto: 'Duplicar', icone: '📑', onClick: () => duplicarCliente(clientData.id) },
      { separador: true },
      { texto: 'Arquivar', icone: '📁', onClick: () => arquivarCliente(clientData.id) },
      { texto: 'Excluir', icone: '🗑️', onClick: () => excluirCliente(clientData.id) }
    ];
    
    CRMUI.criarMenu(menuItems, {
      trigger: card.querySelector('.card-menu-btn'),
      posicao: 'bottom-right'
    });
  }
  
  function mostrarSeletorCor(coluna, colunaData) {
    const cores = [
      { cor: '#6366f1', nome: 'Violeta' },
      { cor: '#8b5cf6', nome: 'Roxo' },
      { cor: '#ec4899', nome: 'Rosa' },
      { cor: '#f59e0b', nome: 'Laranja' },
      { cor: '#10b981', nome: 'Verde' },
      { cor: '#3b82f6', nome: 'Azul' },
      { cor: '#ef4444', nome: 'Vermelho' },
      { cor: '#14b8a6', nome: 'Teal' }
    ];
    
    const conteudo = `
      <div class="color-picker-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 20px;">
        ${cores.map(({ cor, nome }) => `
          <button class="color-option" 
                  data-color="${cor}"
                  style="
                    width: 60px;
                    height: 60px;
                    border: 2px solid ${cor};
                    border-radius: 8px;
                    background: ${cor};
                    cursor: pointer;
                    transition: all 0.2s;
                    position: relative;
                  "
                  title="${nome}">
            <span style="
              position: absolute;
              bottom: -20px;
              left: 50%;
              transform: translateX(-50%);
              font-size: 11px;
              color: #6b7280;
            ">${nome}</span>
          </button>
        `).join('')}
      </div>
    `;
    
    const modal = CRMUI.criarModal({
      titulo: 'Escolher Cor da Coluna',
      conteudo: conteudo,
      tamanho: 'small',
      acoes: [
        {
          id: 'cancelar',
          texto: 'Cancelar',
          tipo: 'secondary',
          onClick: () => modal.fechar()
        }
      ]
    });
    
    // Adiciona eventos aos botões de cor
    setTimeout(() => {
      document.querySelectorAll('.color-option').forEach(btn => {
        btn.addEventListener('click', () => {
          const cor = btn.dataset.color;
          colunaData.color = cor;
          coluna.style.borderTopColor = cor;
          salvarDados();
          modal.fechar();
          CRMUI.mostrarNotificacao('Cor alterada com sucesso!', 'success');
        });
      });
    }, 100);
  }
  
  function excluirColuna(colunaId) {
    // Remove a coluna do estado
    state.colunas = state.colunas.filter(col => col.id !== colunaId);
    
    // Salva os dados
    salvarDados();
    
    // Re-renderiza apenas as colunas (não fecha o CRM)
    const container = document.querySelector('.kanban-columns');
    if (container) {
      renderizarColunas(container);
    }
    
    CRMUI.mostrarNotificacao('Coluna excluída!', 'success');
  }
  
  async function adicionarColuna() {
    const cores = [
      { cor: '#6366f1', nome: 'Violeta' },
      { cor: '#8b5cf6', nome: 'Roxo' },
      { cor: '#ec4899', nome: 'Rosa' },
      { cor: '#f59e0b', nome: 'Laranja' },
      { cor: '#10b981', nome: 'Verde' },
      { cor: '#3b82f6', nome: 'Azul' },
      { cor: '#ef4444', nome: 'Vermelho' },
      { cor: '#14b8a6', nome: 'Teal' }
    ];
    
    const conteudo = `
      <form id="form-nova-coluna">
        <div class="form-field" style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 4px; font-weight: 500;">Nome da Coluna</label>
          <input type="text" name="titulo" required placeholder="Ex: Em Negociação" 
                 style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
        </div>
        
        <div class="form-field" style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500;">Cor da Coluna</label>
          <div class="color-picker" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
            ${cores.map(({ cor, nome }, index) => `
              <label style="position: relative; cursor: pointer;">
                <input type="radio" name="cor" value="${cor}" ${index === 0 ? 'checked' : ''} 
                       style="position: absolute; opacity: 0;">
                <div style="
                  width: 40px;
                  height: 40px;
                  background: ${cor};
                  border-radius: 6px;
                  border: 2px solid transparent;
                  transition: all 0.2s;
                " 
                class="color-box"
                onclick="this.parentElement.querySelector('input').checked = true;
                         document.querySelectorAll('.color-box').forEach(el => el.style.borderColor = 'transparent');
                         this.style.borderColor = '#111827';">
                </div>
              </label>
            `).join('')}
          </div>
        </div>
        
        <div class="form-field">
          <label style="display: block; margin-bottom: 4px; font-weight: 500;">Posição</label>
          <select name="posicao" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
            <option value="fim">No final</option>
            ${state.colunas.map((col, idx) => 
              `<option value="${idx}">Antes de "${col.title}"</option>`
            ).join('')}
          </select>
        </div>
      </form>
    `;
    
    const modal = CRMUI.criarModal({
      titulo: 'Nova Coluna',
      conteudo: conteudo,
      tamanho: 'small',
      acoes: [
        {
          id: 'cancelar',
          texto: 'Cancelar',
          tipo: 'secondary',
          onClick: () => modal.fechar()
        },
        {
          id: 'criar',
          texto: 'Criar Coluna',
          tipo: 'primary',
          onClick: () => {
            const form = document.getElementById('form-nova-coluna');
            const formData = new FormData(form);
            
            const novaColuna = {
              id: 'col_' + Date.now(),
              title: formData.get('titulo'),
              color: formData.get('cor') || '#6366f1',
              clients: []
            };
            
            const posicao = formData.get('posicao');
            if (posicao === 'fim') {
              state.colunas.push(novaColuna);
            } else {
              state.colunas.splice(parseInt(posicao), 0, novaColuna);
            }
            
            salvarDados();
            renderizarColunas(document.querySelector('.kanban-columns'));
            modal.fechar();
            CRMUI.mostrarNotificacao('Coluna criada com sucesso!', 'success');
          }
        }
      ]
    });
  }
  
  function verHistorico(clientId) {
    CRMUI.mostrarNotificacao('Histórico em desenvolvimento...', 'info');
  }
  
  function duplicarCliente(clientId) {
    const client = obterClientePorId(clientId);
    if (!client) return;
    
    const novoCliente = {
      ...client,
      id: 'client_' + Date.now(),
      nome: client.nome + ' (Cópia)',
      dataCadastro: new Date().toISOString()
    };
    
    window.crmState.kanbanData.clients[novoCliente.id] = novoCliente;
    
    if (state.colunas.length > 0) {
      state.colunas[0].clients.push(novoCliente.id);
    }
    
    salvarDados();
    renderizarColunas(document.querySelector('.kanban-columns'));
    CRMUI.mostrarNotificacao('Cliente duplicado!', 'success');
  }
  
  async function arquivarCliente(clientId) {
    const confirmar = await CRMUI.confirmar({
      titulo: 'Arquivar Cliente',
      mensagem: 'O cliente será movido para o arquivo. Deseja continuar?'
    });
    
    if (confirmar) {
      CRMUI.mostrarNotificacao('Arquivamento em desenvolvimento...', 'info');
    }
  }
  
  async function excluirCliente(clientId) {
    const confirmar = await CRMUI.confirmar({
      titulo: 'Excluir Cliente',
      mensagem: 'Esta ação não pode ser desfeita. Deseja continuar?',
      tipo: 'danger'
    });
    
    if (confirmar) {
      // Remove de todas as colunas
      state.colunas.forEach(col => {
        col.clients = col.clients.filter(id => id !== clientId);
      });
      
      // Remove do storage
      delete window.crmState.kanbanData.clients[clientId];
      
      salvarDados();
      
      // Remove o card da interface
      const card = document.querySelector(`[data-client-id="${clientId}"]`);
      if (card) {
        card.style.transition = 'all 0.3s ease';
        card.style.transform = 'scale(0)';
        card.style.opacity = '0';
        setTimeout(() => card.remove(), 300);
      }
      
      atualizarContadores();
      CRMUI.mostrarNotificacao('Cliente excluído!', 'success');
    }
  }
  
  // =====================================================
  // UTILITÁRIOS E DADOS
  // =====================================================
  
  function obterClientePorId(clientId) {
    const kanbanData = window.crmState?.kanbanData;
    return kanbanData?.clients?.[clientId];
  }
  
  function getTagEmoji(tag) {
    const emojis = {
      'potencial-alto': '🔥',
      'urgente': '⚡',
      'retorno': '🔄',
      'vip': '⭐',
      'frio': '❄️',
      'quente': '🌡️'
    };
    return emojis[tag] || '🏷️';
  }
  
  function getPriorityColor(client) {
    if (client.tags?.includes('urgente')) return '#ef4444';
    if (client.tags?.includes('potencial-alto')) return '#f59e0b';
    if (client.tags?.includes('vip')) return '#8b5cf6';
    return '#10b981';
  }
  
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  async function carregarDados() {
    const kanbanData = window.crmState?.kanbanData;
    
    if (kanbanData && kanbanData.columns) {
      state.colunas = kanbanData.columns;
    } else {
      state.colunas = [
        { id: 'leads', title: '🎯 Leads', clients: [], color: '#6366f1' },
        { id: 'negotiation', title: '💬 Em Negociação', clients: [], color: '#8b5cf6' },
        { id: 'proposal', title: '📝 Proposta Enviada', clients: [], color: '#ec4899' },
        { id: 'closing', title: '🤝 Fechamento', clients: [], color: '#f59e0b' },
        { id: 'success', title: '✅ Sucesso', clients: [], color: '#10b981' }
      ];
    }
  }
  
  async function salvarDados() {
    if (window.crmState && window.crmState.kanbanData) {
      window.crmState.kanbanData.columns = state.colunas;
      
      if (window.CRMStorage && typeof CRMStorage.salvar === 'function') {
        await CRMStorage.salvar('kanban_data', window.crmState.kanbanData);
      } else {
        localStorage.setItem('crm_kanban_data', JSON.stringify(window.crmState.kanbanData));
      }
    }
  }
  
  function configurarEventosGlobais() {
    // Atalhos de teclado
    document.addEventListener('keydown', (e) => {
      // Ctrl+F para buscar
      if (e.ctrlKey && e.key === 'f' && document.querySelector('.crm-kanban-board')) {
        e.preventDefault();
        document.querySelector('#kanban-search-input')?.focus();
      }
      
      // ESC para limpar busca
      if (e.key === 'Escape' && state.filtros.busca) {
        const searchInput = document.querySelector('#kanban-search-input');
        if (searchInput) {
          searchInput.value = '';
          limparBusca();
        }
      }
    });
  }
  
  // =====================================================
  // API PÚBLICA
  // =====================================================
  
  return {
    criarKanban,
    mostrarKanban, // Agora exposta publicamente
    renderizarColunas,
    aplicarFiltros,
    atualizarContadores,
    
    get estado() {
      return { ...state };
    },
    
    adicionarColuna,
    excluirColuna,
    moverCard,
    
    obterClientePorId,
    calcularTotaisColuna
  };

})();

console.log('✅ Módulo CRMKanban carregado!');
