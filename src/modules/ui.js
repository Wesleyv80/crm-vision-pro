// =====================================================
// Módulo de Interface do Usuário (UI)
// =====================================================
// Gerencia todos os elementos visuais e interações

window.CRMUI = (() => {
  
  // Estado interno do UI
  const state = {
    panelAberto: false,
    modalAberto: false,
    temaAtual: 'light',
    animacoesAtivas: true
  };
  
  // =====================================================
  // CRIAR ELEMENTOS HTML
  // =====================================================
  
  // Cria um botão estilizado
  function criarBotao(config = {}) {
    const {
      texto = '',
      icone = '',
      tipo = 'primary', // primary, secondary, success, danger, warning
      tamanho = 'normal', // small, normal, large
      onClick = () => {},
      classe = '',
      id = ''
    } = config;
    
    const btn = document.createElement('button');
    btn.className = `crm-btn btn-${tipo} btn-${tamanho} ${classe}`;
    if (id) btn.id = id;
    
    if (icone) {
      btn.innerHTML = `<span class="btn-icon">${icone}</span>`;
    }
    if (texto) {
      btn.innerHTML += `<span class="btn-text">${texto}</span>`;
    }
    
    btn.addEventListener('click', onClick);
    
    return btn;
  }
  
  // Cria um card
  function criarCard(config = {}) {
    const {
      titulo = '',
      conteudo = '',
      icone = '',
      tipo = 'default',
      acoes = [],
      classe = '',
      id = ''
    } = config;
    
    const card = document.createElement('div');
    card.className = `crm-card card-${tipo} ${classe}`;
    if (id) card.id = id;
    
    let html = '';
    
    if (titulo || icone) {
      html += '<div class="card-header">';
      if (icone) html += `<span class="card-icon">${icone}</span>`;
      if (titulo) html += `<h3 class="card-title">${titulo}</h3>`;
      html += '</div>';
    }
    
    if (conteudo) {
      html += `<div class="card-content">${conteudo}</div>`;
    }
    
    if (acoes.length > 0) {
      html += '<div class="card-actions">';
      acoes.forEach(acao => {
        html += `<button class="card-action" data-action="${acao.id}">${acao.texto}</button>`;
      });
      html += '</div>';
    }
    
    card.innerHTML = html;
    
    // Adiciona listeners para ações
    acoes.forEach(acao => {
      const btn = card.querySelector(`[data-action="${acao.id}"]`);
      if (btn && acao.onClick) {
        btn.addEventListener('click', acao.onClick);
      }
    });
    
    return card;
  }
  
  // Cria um modal - FUNÇÃO ATUALIZADA COM SUPORTE A TELA CHEIA
  function criarModal(config = {}) {
    const {
      titulo = '',
      conteudo = '',
      tamanho = 'medium', // small, medium, large, fullscreen
      acoes = [],
      onClose = () => {},
      classe = '',
      id = ''
    } = config;
    
    // Remove modal existente se houver
    const modalExistente = document.querySelector('.crm-modal-container');
    if (modalExistente) {
      modalExistente.remove();
    }
    
    const container = document.createElement('div');
    container.className = 'crm-modal-container';
    if (id) container.id = id;
    
    const modal = document.createElement('div');
    modal.className = `crm-modal modal-${tamanho} ${classe}`;
    
    // Configurações especiais para tela cheia
    if (tamanho === 'fullscreen') {
      modal.classList.add('modal-fullscreen');
      container.style.padding = '0';
    }
    
    let html = `
      <div class="modal-header">
        <h2 class="modal-title">${titulo}</h2>
        <button class="modal-close" type="button">&times;</button>
      </div>
      <div class="modal-content">${conteudo}</div>
    `;
    
    if (acoes.length > 0) {
      html += '<div class="modal-footer">';
      acoes.forEach(acao => {
        const btnClass = acao.tipo || 'secondary';
        html += `<button class="crm-btn btn-${btnClass}" type="button" data-action="${acao.id}">${acao.texto}</button>`;
      });
      html += '</div>';
    }
    
    modal.innerHTML = html;
    container.appendChild(modal);
    
    // Função para fechar o modal
    const fecharEsteModal = () => {
      container.classList.remove('show');
      setTimeout(() => {
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
        state.modalAberto = false;
      }, 300);
      onClose();
    };
    
    // Eventos - CORRIGIDOS
    container.addEventListener('click', (e) => {
      // Só fecha se clicar no container (overlay), não no modal
      if (e.target === container && tamanho !== 'fullscreen') {
        fecharEsteModal();
      }
    });
    
    // Previne que cliques no modal fechem o modal
    modal.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    // Botão X para fechar
    const btnClose = modal.querySelector('.modal-close');
    if (btnClose) {
      btnClose.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fecharEsteModal();
      });
    }
    
    // Eventos das ações
    acoes.forEach(acao => {
      const btn = modal.querySelector(`[data-action="${acao.id}"]`);
      if (btn && acao.onClick) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          // Passa o objeto modal para o onClick para permitir fechar de dentro
          acao.onClick.call({ fechar: fecharEsteModal });
        });
      }
    });
    
    // ESC para fechar
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        fecharEsteModal();
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);
    
    // Adiciona ao DOM
    document.body.appendChild(container);
    
    // Anima entrada
    requestAnimationFrame(() => {
      container.classList.add('show');
    });
    
    state.modalAberto = true;
    
    // Retorna o container e função para fechar
    return {
      elemento: container,
      fechar: fecharEsteModal
    };
  }
  
  // =====================================================
  // FORMULÁRIOS
  // =====================================================
  
  // Cria campo de formulário
  function criarCampo(config = {}) {
    const {
      tipo = 'text', // text, email, tel, number, select, textarea, checkbox, radio
      nome = '',
      label = '',
      placeholder = '',
      valor = '',
      opcoes = [],
      obrigatorio = false,
      dica = '',
      classe = '',
      onChange = () => {}
    } = config;
    
    const wrapper = document.createElement('div');
    wrapper.className = `form-field ${classe}`;
    
    let html = '';
    
    // Label
    if (label) {
      html += `<label for="${nome}" class="field-label">
        ${label}
        ${obrigatorio ? '<span class="required">*</span>' : ''}
      </label>`;
    }
    
    // Campo
    switch (tipo) {
      case 'select':
        html += `<select id="${nome}" name="${nome}" class="field-input" ${obrigatorio ? 'required' : ''}>`;
        html += `<option value="">${placeholder || 'Selecione...'}</option>`;
        opcoes.forEach(op => {
          const selected = op.valor === valor ? 'selected' : '';
          html += `<option value="${op.valor}" ${selected}>${op.texto}</option>`;
        });
        html += '</select>';
        break;
        
      case 'textarea':
        html += `<textarea id="${nome}" name="${nome}" class="field-input" 
          placeholder="${placeholder}" ${obrigatorio ? 'required' : ''}>${valor}</textarea>`;
        break;
        
      case 'checkbox':
      case 'radio':
        opcoes.forEach((op, index) => {
          const checked = Array.isArray(valor) ? valor.includes(op.valor) : valor === op.valor;
          html += `
            <label class="field-check">
              <input type="${tipo}" name="${nome}" value="${op.valor}" 
                ${checked ? 'checked' : ''} ${obrigatorio && index === 0 ? 'required' : ''}>
              <span>${op.texto}</span>
            </label>
          `;
        });
        break;
        
      default:
        html += `<input type="${tipo}" id="${nome}" name="${nome}" 
          class="field-input" placeholder="${placeholder}" value="${valor}" 
          ${obrigatorio ? 'required' : ''}>`;
    }
    
    // Dica
    if (dica) {
      html += `<small class="field-hint">${dica}</small>`;
    }
    
    wrapper.innerHTML = html;
    
    // Evento onChange
    const input = wrapper.querySelector('input, select, textarea');
    if (input) {
      input.addEventListener('change', onChange);
    }
    
    return wrapper;
  }
  
  // Cria formulário completo
  function criarFormulario(campos = [], config = {}) {
    const {
      onSubmit = () => {},
      botaoTexto = 'Salvar',
      classe = '',
      id = ''
    } = config;
    
    const form = document.createElement('form');
    form.className = `crm-form ${classe}`;
    if (id) form.id = id;
    
    // Adiciona campos
    campos.forEach(campo => {
      form.appendChild(criarCampo(campo));
    });
    
    // Botão submit
    const submitBtn = criarBotao({
      texto: botaoTexto,
      tipo: 'primary',
      tamanho: 'large',
      classe: 'form-submit'
    });
    
    form.appendChild(submitBtn);
    
    // Evento submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Coleta dados
      const formData = new FormData(form);
      const dados = {};
      
      for (let [key, value] of formData.entries()) {
        if (dados[key]) {
          // Se já existe, transforma em array
          if (!Array.isArray(dados[key])) {
            dados[key] = [dados[key]];
          }
          dados[key].push(value);
        } else {
          dados[key] = value;
        }
      }
      
      onSubmit(dados);
    });
    
    return form;
  }
  
  // =====================================================
  // NOTIFICAÇÕES E TOASTS
  // =====================================================
  
  function mostrarNotificacao(mensagem, tipo = 'info', duracao = 3000) {
    const container = document.getElementById('crm-notifications') || criarContainerNotificacoes();
    
    const notif = document.createElement('div');
    notif.className = `crm-notification ${tipo} slide-in`;
    
    const icones = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    
    notif.innerHTML = `
      <span class="notif-icon">${icones[tipo] || icones.info}</span>
      <span class="notif-message">${mensagem}</span>
      <button class="notif-close">&times;</button>
    `;
    
    container.appendChild(notif);
    
    // Auto remover
    const timer = setTimeout(() => {
      removerNotificacao(notif);
    }, duracao);
    
    // Botão fechar
    notif.querySelector('.notif-close').addEventListener('click', () => {
      clearTimeout(timer);
      removerNotificacao(notif);
    });
    
    return notif;
  }
  
  function removerNotificacao(notif) {
    notif.classList.add('slide-out');
    setTimeout(() => notif.remove(), 300);
  }
  
  function criarContainerNotificacoes() {
    const container = document.createElement('div');
    container.id = 'crm-notifications';
    container.className = 'notifications-container';
    document.body.appendChild(container);
    return container;
  }
  
  // =====================================================
  // LOADING E SPINNERS
  // =====================================================
  
  function mostrarLoading(texto = 'Carregando...') {
    const loading = document.createElement('div');
    loading.className = 'crm-loading';
    loading.innerHTML = `
      <div class="loading-spinner"></div>
      <p class="loading-text">${texto}</p>
    `;
    
    document.body.appendChild(loading);
    
    return {
      atualizar: (novoTexto) => {
        loading.querySelector('.loading-text').textContent = novoTexto;
      },
      remover: () => {
        loading.classList.add('fade-out');
        setTimeout(() => loading.remove(), 300);
      }
    };
  }
  
  // =====================================================
  // TOOLTIPS
  // =====================================================
  
  function adicionarTooltip(elemento, texto, posicao = 'top') {
    elemento.classList.add('has-tooltip');
    elemento.setAttribute('data-tooltip', texto);
    elemento.setAttribute('data-tooltip-position', posicao);
    
    elemento.addEventListener('mouseenter', mostrarTooltip);
    elemento.addEventListener('mouseleave', esconderTooltip);
  }
  
  function mostrarTooltip(e) {
    const elemento = e.target;
    const texto = elemento.getAttribute('data-tooltip');
    const posicao = elemento.getAttribute('data-tooltip-position');
    
    const tooltip = document.createElement('div');
    tooltip.className = `crm-tooltip ${posicao}`;
    tooltip.textContent = texto;
    
    document.body.appendChild(tooltip);
    
    // Posiciona tooltip
    const rect = elemento.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    switch (posicao) {
      case 'top':
        tooltip.style.left = rect.left + (rect.width - tooltipRect.width) / 2 + 'px';
        tooltip.style.top = rect.top - tooltipRect.height - 8 + 'px';
        break;
      case 'bottom':
        tooltip.style.left = rect.left + (rect.width - tooltipRect.width) / 2 + 'px';
        tooltip.style.top = rect.bottom + 8 + 'px';
        break;
      case 'left':
        tooltip.style.left = rect.left - tooltipRect.width - 8 + 'px';
        tooltip.style.top = rect.top + (rect.height - tooltipRect.height) / 2 + 'px';
        break;
      case 'right':
        tooltip.style.left = rect.right + 8 + 'px';
        tooltip.style.top = rect.top + (rect.height - tooltipRect.height) / 2 + 'px';
        break;
    }
    
    elemento._tooltip = tooltip;
  }
  
  function esconderTooltip(e) {
    if (e.target._tooltip) {
      e.target._tooltip.remove();
      delete e.target._tooltip;
    }
  }
  
  // =====================================================
  // MENUS E DROPDOWNS
  // =====================================================
  
  function criarMenu(itens = [], config = {}) {
    const {
      trigger = null,
      posicao = 'bottom-left',
      classe = '',
      id = ''
    } = config;
    
    const menu = document.createElement('div');
    menu.className = `crm-menu ${classe}`;
    if (id) menu.id = id;
    
    const ul = document.createElement('ul');
    ul.className = 'menu-list';
    
    itens.forEach(item => {
      if (item.separador) {
        ul.innerHTML += '<li class="menu-separator"></li>';
        return;
      }
      
      const li = document.createElement('li');
      li.className = 'menu-item';
      if (item.disabled) li.classList.add('disabled');
      
      li.innerHTML = `
        ${item.icone ? `<span class="menu-icon">${item.icone}</span>` : ''}
        <span class="menu-text">${item.texto}</span>
        ${item.atalho ? `<span class="menu-shortcut">${item.atalho}</span>` : ''}
      `;
      
      if (!item.disabled && item.onClick) {
        li.addEventListener('click', () => {
          item.onClick();
          fecharMenu(menu);
        });
      }
      
      ul.appendChild(li);
    });
    
    menu.appendChild(ul);
    
    // Se tem trigger, configura abertura/fechamento
    if (trigger) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu(menu, trigger, posicao);
      });
      
      // Fecha ao clicar fora
      document.addEventListener('click', () => fecharMenu(menu));
    }
    
    return menu;
  }
  
  function toggleMenu(menu, trigger, posicao) {
    if (menu.classList.contains('show')) {
      fecharMenu(menu);
    } else {
      abrirMenu(menu, trigger, posicao);
    }
  }
  
  function abrirMenu(menu, trigger, posicao) {
    document.body.appendChild(menu);
    
    const rect = trigger.getBoundingClientRect();
    
    // Posiciona o menu
    switch (posicao) {
      case 'bottom-left':
        menu.style.top = rect.bottom + 'px';
        menu.style.left = rect.left + 'px';
        break;
      case 'bottom-right':
        menu.style.top = rect.bottom + 'px';
        menu.style.right = window.innerWidth - rect.right + 'px';
        break;
      case 'top-left':
        menu.style.bottom = window.innerHeight - rect.top + 'px';
        menu.style.left = rect.left + 'px';
        break;
      case 'top-right':
        menu.style.bottom = window.innerHeight - rect.top + 'px';
        menu.style.right = window.innerWidth - rect.right + 'px';
        break;
    }
    
    menu.classList.add('show');
  }
  
  function fecharMenu(menu) {
    if (menu && menu.classList.contains('show')) {
      menu.classList.remove('show');
      setTimeout(() => {
        if (menu.parentNode) {
          menu.parentNode.removeChild(menu);
        }
      }, 300);
    }
  }
  
  // =====================================================
  // TABS (ABAS)
  // =====================================================
  
  function criarTabs(abas = [], config = {}) {
    const {
      abaAtiva = 0,
      onChange = () => {},
      classe = '',
      id = ''
    } = config;
    
    const container = document.createElement('div');
    container.className = `crm-tabs ${classe}`;
    if (id) container.id = id;
    
    // Header das tabs
    const header = document.createElement('div');
    header.className = 'tabs-header';
    
    // Conteúdo das tabs
    const content = document.createElement('div');
    content.className = 'tabs-content';
    
    abas.forEach((aba, index) => {
      // Botão da aba
      const btn = document.createElement('button');
      btn.className = 'tab-btn';
      if (index === abaAtiva) btn.classList.add('active');
      btn.innerHTML = `
        ${aba.icone ? `<span class="tab-icon">${aba.icone}</span>` : ''}
        <span class="tab-text">${aba.titulo}</span>
      `;
      
      // Painel da aba
      const panel = document.createElement('div');
      panel.className = 'tab-panel';
      if (index === abaAtiva) panel.classList.add('active');
      panel.innerHTML = aba.conteudo;
      
      // Eventos
      btn.addEventListener('click', () => {
        // Remove active de todos
        header.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        content.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        
        // Adiciona active no atual
        btn.classList.add('active');
        panel.classList.add('active');
        
        onChange(index, aba);
      });
      
      header.appendChild(btn);
      content.appendChild(panel);
    });
    
    container.appendChild(header);
    container.appendChild(content);
    
    return container;
  }
  
  // =====================================================
  // PROGRESS BAR
  // =====================================================
  
  function criarProgressBar(config = {}) {
    const {
      valor = 0,
      max = 100,
      texto = '',
      tipo = 'primary',
      animado = true,
      classe = '',
      id = ''
    } = config;
    
    const container = document.createElement('div');
    container.className = `crm-progress ${classe}`;
    if (id) container.id = id;
    
    const bar = document.createElement('div');
    bar.className = `progress-bar ${tipo} ${animado ? 'animated' : ''}`;
    bar.style.width = `${(valor / max) * 100}%`;
    
    if (texto) {
      const label = document.createElement('div');
      label.className = 'progress-label';
      label.textContent = texto;
      container.appendChild(label);
    }
    
    container.appendChild(bar);
    
    return {
      elemento: container,
      atualizar: (novoValor, novoTexto) => {
        bar.style.width = `${(novoValor / max) * 100}%`;
        if (novoTexto && texto) {
          container.querySelector('.progress-label').textContent = novoTexto;
        }
      }
    };
  }
  
  // =====================================================
  // BADGES E TAGS
  // =====================================================
  
  function criarBadge(texto, tipo = 'default', config = {}) {
    const {
      icone = '',
      removivel = false,
      onRemove = () => {},
      classe = '',
      id = ''
    } = config;
    
    const badge = document.createElement('span');
    badge.className = `crm-badge badge-${tipo} ${classe}`;
    if (id) badge.id = id;
    
    let html = '';
    if (icone) html += `<span class="badge-icon">${icone}</span>`;
    html += `<span class="badge-text">${texto}</span>`;
    if (removivel) html += '<button class="badge-remove">&times;</button>';
    
    badge.innerHTML = html;
    
    if (removivel) {
      badge.querySelector('.badge-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        badge.remove();
        onRemove();
      });
    }
    
    return badge;
  }
  
  // =====================================================
  // AVATARS
  // =====================================================
  
  function criarAvatar(config = {}) {
    const {
      nome = '',
      imagem = '',
      tamanho = 'medium', // small, medium, large
      status = '', // online, offline, busy, away
      classe = '',
      id = ''
    } = config;
    
    const avatar = document.createElement('div');
    avatar.className = `crm-avatar avatar-${tamanho} ${classe}`;
    if (id) avatar.id = id;
    if (status) avatar.classList.add(`status-${status}`);
    
    if (imagem) {
      avatar.innerHTML = `<img src="${imagem}" alt="${nome}">`;
    } else {
      // Pega iniciais do nome
      const iniciais = nome.split(' ')
        .map(p => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
      avatar.innerHTML = `<span class="avatar-initials">${iniciais}</span>`;
      avatar.style.backgroundColor = gerarCorAvatar(nome);
    }
    
    if (status) {
      avatar.innerHTML += `<span class="avatar-status"></span>`;
    }
    
    return avatar;
  }
  
  function gerarCorAvatar(nome) {
    const cores = [
      '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', 
      '#10b981', '#3b82f6', '#ef4444', '#14b8a6'
    ];
    
    let hash = 0;
    for (let i = 0; i < nome.length; i++) {
      hash = nome.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return cores[Math.abs(hash) % cores.length];
  }
  
  // =====================================================
  // EMPTY STATES
  // =====================================================
  
  function criarEmptyState(config = {}) {
    const {
      icone = '📭',
      titulo = 'Nenhum dado encontrado',
      descricao = '',
      acao = null,
      classe = '',
      id = ''
    } = config;
    
    const empty = document.createElement('div');
    empty.className = `crm-empty-state ${classe}`;
    if (id) empty.id = id;
    
    let html = `
      <div class="empty-icon">${icone}</div>
      <h3 class="empty-title">${titulo}</h3>
    `;
    
    if (descricao) {
      html += `<p class="empty-description">${descricao}</p>`;
    }
    
    if (acao) {
      html += `<button class="crm-btn btn-primary empty-action">${acao.texto}</button>`;
    }
    
    empty.innerHTML = html;
    
    if (acao && acao.onClick) {
      empty.querySelector('.empty-action').addEventListener('click', acao.onClick);
    }
    
    return empty;
  }
  
  // =====================================================
  // CONFIRMAÇÃO
  // =====================================================
  
  function confirmar(config = {}) {
    const {
      titulo = 'Confirmação',
      mensagem = 'Tem certeza?',
      textoBotaoConfirmar = 'Confirmar',
      textoBotaoCancelar = 'Cancelar',
      tipo = 'warning',
      onConfirm = () => {},
      onCancel = () => {}
    } = config;
    
    return new Promise((resolve) => {
      const modal = criarModal({
        titulo,
        conteudo: `
          <div class="confirm-content">
            <div class="confirm-icon ${tipo}">
              ${tipo === 'danger' ? '⚠️' : '❓'}
            </div>
            <p class="confirm-message">${mensagem}</p>
          </div>
        `,
        tamanho: 'small',
        acoes: [
          {
            id: 'cancel',
            texto: textoBotaoCancelar,
            tipo: 'secondary',
            onClick: () => {
              modal.fechar();
              onCancel();
              resolve(false);
            }
          },
          {
            id: 'confirm',
            texto: textoBotaoConfirmar,
            tipo: tipo === 'danger' ? 'danger' : 'primary',
            onClick: () => {
              modal.fechar();
              onConfirm();
              resolve(true);
            }
          }
        ]
      });
    });
  }
  
  // Função global para fechar modal - CORRIGIDA
  function fecharModal() {
    const modal = document.querySelector('.crm-modal-container');
    if (modal) {
      modal.classList.remove('show');
      setTimeout(() => {
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
        state.modalAberto = false;
      }, 300);
    }
  }
  
  // =====================================================
  // ANIMAÇÕES E EFEITOS
  // =====================================================
  
  function animarElemento(elemento, animacao = 'fadeIn', duracao = 300) {
    return new Promise((resolve) => {
      elemento.style.animationDuration = `${duracao}ms`;
      elemento.classList.add(`animate-${animacao}`);
      
      setTimeout(() => {
        elemento.classList.remove(`animate-${animacao}`);
        resolve();
      }, duracao);
    });
  }
  
  function efeitoRipple(elemento, event) {
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    
    const rect = elemento.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    
    elemento.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
  }
  
  // =====================================================
  // TEMA E APARÊNCIA
  // =====================================================
  
  function alternarTema() {
    const novoTema = state.temaAtual === 'light' ? 'dark' : 'light';
    aplicarTema(novoTema);
  }
  
  function aplicarTema(tema) {
    document.documentElement.setAttribute('data-theme', tema);
    state.temaAtual = tema;
    
    // Salva preferência
    localStorage.setItem('crm-theme', tema);
  }
  
  function carregarTema() {
    const temaSalvo = localStorage.getItem('crm-theme') || 'light';
    aplicarTema(temaSalvo);
  }
  
  // =====================================================
  // UTILITÁRIOS
  // =====================================================
  
  function copiarTexto(texto) {
    // Tenta usar a API moderna primeiro
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(texto).then(() => {
        mostrarNotificacao('Copiado para a área de transferência!', 'success');
      }).catch(() => {
        // Fallback para método antigo
        copiarTextoFallback(texto);
      });
    } else {
      copiarTextoFallback(texto);
    }
  }
  
  function copiarTextoFallback(texto) {
    const textarea = document.createElement('textarea');
    textarea.value = texto;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.left = '-9999px';
    
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
      document.execCommand('copy');
      mostrarNotificacao('Copiado para a área de transferência!', 'success');
    } catch (err) {
      mostrarNotificacao('Erro ao copiar texto', 'error');
    }
    
    document.body.removeChild(textarea);
  }
  
  function formatarData(data, formato = 'DD/MM/YYYY') {
    const d = new Date(data);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    const hora = String(d.getHours()).padStart(2, '0');
    const minuto = String(d.getMinutes()).padStart(2, '0');
    
    return formato
      .replace('DD', dia)
      .replace('MM', mes)
      .replace('YYYY', ano)
      .replace('HH', hora)
      .replace('mm', minuto);
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
  
  // =====================================================
  // INICIALIZAÇÃO
  // =====================================================
  
  function inicializar() {
    console.log('🎨 Módulo UI inicializado');
    carregarTema();
    
    // Adiciona listeners globais
    document.addEventListener('click', (e) => {
      // Fecha menus abertos
      document.querySelectorAll('.crm-menu.show').forEach(menu => {
        fecharMenu(menu);
      });
      
      // Efeito ripple em botões
      if (e.target.classList.contains('crm-btn')) {
        efeitoRipple(e.target, e);
      }
    });
    
    // Adiciona estilos CSS necessários se não existirem
    adicionarEstilosCSS();
  }
  
  // Adiciona estilos CSS essenciais para os modais funcionarem
  function adicionarEstilosCSS() {
    const existingStyle = document.getElementById('crm-ui-styles');
    if (existingStyle) return;
    
    const style = document.createElement('style');
    style.id = 'crm-ui-styles';
    style.textContent = `
      /* Estilos essenciais para modais */
      .crm-modal-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
      }
      
      .crm-modal-container.show {
        opacity: 1;
        visibility: visible;
      }
      
      .crm-modal {
        background: white;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        max-width: 90vw;
        max-height: 90vh;
        overflow: hidden;
        transform: scale(0.9);
        transition: transform 0.3s ease;
      }
      
      .crm-modal-container.show .crm-modal {
        transform: scale(1);
      }
      
      .modal-small { width: 400px; }
      .modal-medium { width: 600px; }
      .modal-large { width: 800px; }
      
      /* ESTILOS PARA TELA CHEIA */
      .modal-fullscreen {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        max-width: none !important;
        max-height: none !important;
        margin: 0 !important;
        border-radius: 0 !important;
        transform: none !important;
      }
      
      .modal-fullscreen .modal-content {
        height: calc(100vh - 140px) !important;
        max-height: none !important;
        overflow-y: auto !important;
      }
      
      .modal-fullscreen .modal-header {
        position: sticky;
        top: 0;
        background: white;
        z-index: 10;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      }
      
      .modal-fullscreen .modal-footer {
        position: sticky;
        bottom: 0;
        background: #f9fafb;
        z-index: 10;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
      }
      
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .modal-title {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #111827;
      }
      
      .modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #6b7280;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s;
      }
      
      .modal-close:hover {
        background-color: #f3f4f6;
        color: #111827;
      }
      
      .modal-content {
        padding: 20px;
        max-height: 60vh;
        overflow-y: auto;
      }
      
      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 20px;
        border-top: 1px solid #e5e7eb;
        background-color: #f9fafb;
      }
      
      /* Estilos para botões */
      .crm-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;
        outline: none;
      }
      
      .btn-primary {
        background-color: #3b82f6;
        color: white;
      }
      
      .btn-primary:hover {
        background-color: #2563eb;
      }
      
      .btn-secondary {
        background-color: #6b7280;
        color: white;
      }
      
      .btn-secondary:hover {
        background-color: #4b5563;
      }
      
      .btn-danger {
        background-color: #ef4444;
        color: white;
      }
      
      .btn-danger:hover {
        background-color: #dc2626;
      }
      
      .btn-success {
        background-color: #10b981;
        color: white;
      }
      
      .btn-success:hover {
        background-color: #059669;
      }
      
      .btn-warning {
        background-color: #f59e0b;
        color: white;
      }
      
      .btn-warning:hover {
        background-color: #d97706;
      }
      
      /* Notificações */
      .notifications-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10001;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .crm-notification {
        display: flex;
        align-items: center;
        gap: 10px;
        background: white;
        border-radius: 8px;
        padding: 12px 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        min-width: 300px;
        transform: translateX(100%);
        transition: transform 0.3s ease;
      }
      
      .crm-notification.slide-in {
        transform: translateX(0);
      }
      
      .crm-notification.slide-out {
        transform: translateX(100%);
      }
      
      .crm-notification.success {
        border-left: 4px solid #10b981;
      }
      
      .crm-notification.error {
        border-left: 4px solid #ef4444;
      }
      
      .crm-notification.warning {
        border-left: 4px solid #f59e0b;
      }
      
      .crm-notification.info {
        border-left: 4px solid #3b82f6;
      }
      
      .notif-close {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 18px;
        color: #6b7280;
        margin-left: auto;
      }
      
      /* Loading */
      .crm-loading {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(255, 255, 255, 0.9);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 10002;
      }
      
      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #e5e7eb;
        border-top: 4px solid #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .loading-text {
        margin-top: 16px;
        color: #6b7280;
        font-size: 14px;
      }
      
      /* Formulários */
      .form-field {
        margin-bottom: 16px;
      }
      
      .field-label {
        display: block;
        margin-bottom: 6px;
        font-weight: 500;
        color: #374151;
      }
      
      .field-input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
        transition: border-color 0.2s;
      }
      
      .field-input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      
      .required {
        color: #ef4444;
      }
      
      .field-hint {
        display: block;
        margin-top: 4px;
        font-size: 12px;
        color: #6b7280;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  // =====================================================
  // API PÚBLICA
  // =====================================================
  
  return {
    // Elementos
    criarBotao,
    criarCard,
    criarModal,
    criarCampo,
    criarFormulario,
    criarMenu,
    criarTabs,
    criarProgressBar,
    criarBadge,
    criarAvatar,
    criarEmptyState,
    
    // Notificações
    mostrarNotificacao,
    mostrarLoading,
    confirmar,
    
    // Tooltips
    adicionarTooltip,
    
    // Animações
    animarElemento,
    efeitoRipple,
    
    // Tema
    alternarTema,
    aplicarTema,
    
    // Utilitários
    copiarTexto,
    formatarData,
    debounce,
    
    // Modal
    fecharModal,
    
    // Estado
    get estado() {
      return { ...state };
    },
    
    // Inicialização
    inicializar
  };
})();

// Auto-inicializa quando carregado
CRMUI.inicializar();