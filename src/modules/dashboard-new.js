// =====================================================
// SISTEMA COMPLETO DE DASHBOARD - TUDO EM UM
// =====================================================
window.CRMDashboard = {
  
  // =====================================================
  // MOSTRAR DASHBOARD COMPLETO EM TELA CHEIA
  // =====================================================
  mostrarDashboardCompleto: function() {
    const stats = this.calcularEstatisticas();
    const insights = this.gerarInsights(stats);
    const metrics = this.calcularMetricas();
    
    const conteudo = `
      <div class="dashboard-completo" style="padding: 24px; max-height: 90vh; overflow-y: auto;">
        <!-- SEÇÃO 1: DASHBOARD PRINCIPAL -->
        <div class="section-dashboard" style="margin-bottom: 48px;">
          <div style="margin-bottom: 24px;">
            <h1 style="font-size: 32px; font-weight: 700; margin: 0; background: linear-gradient(to-right, #1e293b, #475569); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
              Dashboard Inteligente
            </h1>
            <p style="color: #6b7280; margin-top: 8px;">Visão completa do seu negócio em tempo real</p>
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
        </div>

        <!-- SEÇÃO 2: GRÁFICOS -->
        <div class="section-graficos" style="margin-bottom: 48px;">
          <h2 style="font-size: 24px; font-weight: 600; margin-bottom: 24px;">📊 Análise Visual</h2>
          <div class="charts-container">
            <div class="chart-card">
              <h3>Pipeline de Vendas</h3>
              <div id="pipeline-chart" style="height: 250px;">
                ${this.renderPipelineChart(stats)}
              </div>
            </div>
            
            <div class="chart-card">
              <h3>Origem dos Leads</h3>
              <div id="origem-chart" style="height: 250px;">
                ${this.renderOrigemChart(stats)}
              </div>
            </div>
          </div>
        </div>

        <!-- SEÇÃO 3: ANÁLISES INTELIGENTES -->
        <div class="section-analytics" style="margin-bottom: 48px;">
          <h2 style="font-size: 24px; font-weight: 600; margin-bottom: 24px;">🧠 Análises Inteligentes</h2>
          <div class="analytics-grid">
            ${insights.map(insight => `
              <div class="insight-card">
                <div class="insight-header">
                  <div class="insight-icon-wrapper" style="background: ${insight.bgColor};">
                    <span style="font-size: 24px;">${insight.icon}</span>
                  </div>
                  <div>
                    <h3 style="margin: 0; font-size: 16px;">${insight.title}</h3>
                    <span class="badge badge-${insight.status === 'positive' ? 'success' : 'warning'}">
                      ${insight.status === 'positive' ? 'Positivo' : 'Atenção'}
                    </span>
                  </div>
                </div>
                <div class="insight-value">${insight.value}</div>
                <p class="insight-description">${insight.description}</p>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- SEÇÃO 4: MÉTRICAS DETALHADAS -->
        <div class="section-metricas" style="margin-bottom: 48px;">
          <h2 style="font-size: 24px; font-weight: 600; margin-bottom: 24px;">📈 Métricas Detalhadas</h2>
          
          <!-- Top 3 Métricas -->
          <div class="stats-grid" style="margin-bottom: 32px;">
            ${metrics.top3.map((metric, index) => `
              <div class="stat-card gradient-${metric.color}">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                  <div>
                    <div class="stat-icon">${metric.icon}</div>
                    <h3>${metric.name}</h3>
                    <div style="margin-top: 8px;">
                      <div style="font-size: 14px; opacity: 0.9;">Progresso da Meta</div>
                      <div style="font-size: 24px; font-weight: 700;">${metric.progress.toFixed(1)}%</div>
                    </div>
                  </div>
                  <span style="font-size: 32px;">
                    ${index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </span>
                </div>
                <div class="progress-container">
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: ${metric.progress}%"></div>
                  </div>
                  <p style="font-size: 12px; margin-top: 8px; opacity: 0.8;">
                    ${metric.current.toLocaleString()} de ${metric.target.toLocaleString()}
                  </p>
                </div>
              </div>
            `).join('')}
          </div>
          
          <!-- Performance por Categoria -->
          <div class="metrics-section">
            <h3>Performance por Categoria</h3>
            ${this.renderCategoryPerformance(stats)}
          </div>
        </div>

        <!-- SEÇÃO 5: RELATÓRIOS RÁPIDOS -->
        <div class="section-relatorios" style="margin-bottom: 48px;">
          <h2 style="font-size: 24px; font-weight: 600; margin-bottom: 24px;">📄 Relatórios Rápidos</h2>
          <div class="report-grid">
            <div class="report-card">
              <div class="report-icon gradient-emerald">
                <span>📈</span>
              </div>
              <h3>Relatório de Vendas</h3>
              <p style="color: #6b7280; font-size: 14px;">
                Análise completa das vendas com totais, médias e histórico
              </p>
              <div class="report-actions">
                <button onclick="CRMDashboard.baixarRelatorio('vendas')" class="btn btn-primary">
                  <span>⬇️</span> Baixar
                </button>
                <button onclick="CRMDashboard.compartilharRelatorio('vendas')" class="btn btn-secondary">
                  <span>📤</span> Compartilhar
                </button>
              </div>
            </div>
            
            <div class="report-card">
              <div class="report-icon gradient-blue">
                <span>📊</span>
              </div>
              <h3>Relatório de Performance</h3>
              <p style="color: #6b7280; font-size: 14px;">
                Métricas de performance, indicadores e análise de tendências
              </p>
              <div class="report-actions">
                <button onclick="CRMDashboard.baixarRelatorio('performance')" class="btn btn-primary">
                  <span>⬇️</span> Baixar
                </button>
                <button onclick="CRMDashboard.compartilharRelatorio('performance')" class="btn btn-secondary">
                  <span>📤</span> Compartilhar
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- RESUMO EXECUTIVO -->
        <div class="executive-summary">
          <h3>📋 Resumo Executivo</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <h4>Total de Registros</h4>
              <div class="value">${stats.totalRecords}</div>
            </div>
            <div class="summary-item">
              <h4>Categorias Ativas</h4>
              <div class="value">${stats.activeCategories}</div>
            </div>
            <div class="summary-item">
              <h4>Taxa de Conversão</h4>
              <div class="value">${stats.conversionRate}%</div>
            </div>
            <div class="summary-item">
              <h4>Crescimento Médio</h4>
              <div class="value">+${stats.growthRate}%</div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Cria modal em tela cheia
    const modal = window.CRMUI.criarModal({
      titulo: '🚀 CRM Vision Pro - Dashboard Completo',
      conteudo: conteudo,
      tamanho: 'fullscreen', // TELA CHEIA
      acoes: [
        {
          id: 'atualizar',
          texto: '🔄 Atualizar Dados',
          tipo: 'primary',
          onClick: () => {
            window.CRMUI.mostrarNotificacao('Atualizando dados...', 'info');
            setTimeout(() => {
              modal.fechar();
              this.mostrarDashboardCompleto();
            }, 500);
          }
        },
        {
          id: 'fechar',
          texto: 'Fechar',
          tipo: 'secondary',
          onClick: function() { this.fechar(); }
        }
      ]
    });
  },
  
  // =====================================================
  // FUNÇÕES AUXILIARES (mantidas as mesmas)
  // =====================================================
  calcularEstatisticas: function() {
    const data = window.crmState.kanbanData;
    const clients = Object.values(data?.clients || {});
    
    let totalAdesao = 0;
    let totalGordurinha = 0;
    let totalRevenue = 0;
    let totalDeals = 0;
    
    // Calcular origens
    const origens = {};
    
    clients.forEach(client => {
      // Contar origens
      const origem = client.origem || 'whatsapp';
      origens[origem] = (origens[origem] || 0) + 1;
      
      // Somar valores dos negócios
      (client.deals || []).forEach(deal => {
        totalDeals++;
        totalAdesao += deal.valor_adesao || 0;
        totalGordurinha += deal.valor_gordurinha || 0;
        totalRevenue += deal.valor || 0;
      });
    });
    
    return {
      totalClients: clients.length,
      totalDeals,
      totalRevenue,
      totalAdesao,
      totalGordurinha,
      conversionRate: clients.length > 0 ? Math.round((totalDeals / clients.length) * 100) : 0,
      origens,
      totalRecords: clients.length + totalDeals,
      activeCategories: 5,
      growthRate: 15,
      positiveIndicators: 3,
      improvementAreas: 2
    };
  },
  
  calcularMetricas: function() {
    const stats = this.calcularEstatisticas();
    
    const metricas = [
      {
        id: 'vendas',
        name: 'Vendas',
        icon: '📈',
        color: 'emerald',
        current: stats.totalDeals,
        target: 50,
        average: stats.totalDeals / 30,
        best: Math.max(stats.totalDeals, 5),
        worst: 0,
        count: stats.totalDeals,
        growth: 12.5,
        progressColor: '#10b981'
      },
      {
        id: 'usuarios',
        name: 'Usuários',
        icon: '👥',
        color: 'blue',
        current: stats.totalClients,
        target: 100,
        average: stats.totalClients / 30,
        best: Math.max(stats.totalClients, 10),
        worst: 0,
        count: stats.totalClients,
        growth: 8.3,
        progressColor: '#3b82f6'
      },
      {
        id: 'receita',
        name: 'Receita',
        icon: '💰',
        color: 'purple',
        current: stats.totalRevenue,
        target: 100000,
        average: stats.totalRevenue / 30,
        best: stats.totalRevenue,
        worst: 0,
        count: stats.totalDeals,
        growth: 25.7,
        progressColor: '#8b5cf6'
      },
      {
        id: 'performance',
        name: 'Performance',
        icon: '⚡',
        color: 'orange',
        current: 85,
        target: 95,
        average: 85,
        best: 95,
        worst: 75,
        count: 30,
        growth: 5.2,
        progressColor: '#f59e0b'
      }
    ];
    
    // Calcular progresso
    metricas.forEach(m => {
      m.progress = Math.min((m.current / m.target) * 100, 100);
    });
    
    return {
      all: metricas,
      top3: metricas.sort((a, b) => b.progress - a.progress).slice(0, 3),
      growth: metricas.sort((a, b) => b.growth - a.growth)
    };
  },
  
  gerarInsights: function(stats) {
    const insights = [];
    
    // Tendência de Vendas
    if (stats.totalDeals > 0) {
      insights.push({
        title: 'Tendência de Vendas',
        value: '+12.5%',
        description: 'Crescimento em relação ao período anterior',
        status: 'positive',
        icon: '📈',
        bgColor: '#d1fae5'
      });
    }
    
    // Performance Geral
    insights.push({
      title: 'Performance Geral',
      value: '85.5%',
      description: 'Boa performance mantida',
      status: 'positive',
      icon: '⚡',
      bgColor: '#fed7aa'
    });
    
    // Base de Usuários
    if (stats.totalClients > 0) {
      insights.push({
        title: 'Base de Usuários',
        value: stats.totalClients.toLocaleString(),
        description: 'Crescimento médio de 8.3%',
        status: 'positive',
        icon: '👥',
        bgColor: '#dbeafe'
      });
    }
    
    // Receita Média
    const receitaMedia = stats.totalRevenue / Math.max(stats.totalDeals, 1);
    insights.push({
      title: 'Receita Média',
      value: `R$ ${receitaMedia.toLocaleString('pt-BR')}`,
      description: `Total: R$ ${stats.totalRevenue.toLocaleString('pt-BR')}`,
      status: 'positive',
      icon: '💰',
      bgColor: '#e9d5ff'
    });
    
    return insights;
  },
  
  renderPipelineChart: function(stats) {
    const stages = [
      { name: 'Leads', value: stats.totalClients, color: '#6366f1' },
      { name: 'Negociação', value: Math.round(stats.totalClients * 0.7), color: '#8b5cf6' },
      { name: 'Proposta', value: Math.round(stats.totalClients * 0.4), color: '#ec4899' },
      { name: 'Fechamento', value: stats.totalDeals, color: '#10b981' }
    ];
    
    return `
      <div style="display: flex; justify-content: space-around; align-items: flex-end; height: 200px; padding: 20px;">
        ${stages.map(stage => `
          <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
            <div style="
              width: 60px;
              height: ${Math.max((stage.value / stats.totalClients) * 150, 20)}px;
              background: ${stage.color};
              border-radius: 4px 4px 0 0;
              transition: height 0.3s ease;
            "></div>
            <div style="text-align: center; margin-top: 8px;">
              <div style="font-weight: 600; font-size: 18px;">${stage.value}</div>
              <div style="font-size: 12px; color: #6b7280;">${stage.name}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },
  
  renderOrigemChart: function(stats) {
    const origens = [
      { name: 'WhatsApp', value: stats.origens.whatsapp || 0, color: '#10b981' },
      { name: 'Instagram', value: stats.origens.instagram || 0, color: '#f59e0b' },
      { name: 'Site', value: stats.origens.site || 0, color: '#3b82f6' },
      { name: 'Indicação', value: stats.origens.indicacao || 0, color: '#8b5cf6' }
    ];
    
    const total = origens.reduce((sum, o) => sum + o.value, 0) || 1;
    
    return `
      <div style="padding: 20px;">
        ${origens.map(origem => `
          <div style="margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 14px;">${origem.name}</span>
              <span style="font-weight: 600;">${origem.value} (${Math.round((origem.value / total) * 100)}%)</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${(origem.value / total) * 100}%; background: ${origem.color};"></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },
  
  renderCategoryPerformance: function(stats) {
    const categories = [
      { name: 'Vendas', progress: 85, icon: '💰', color: '#10b981' },
      { name: 'Atendimento', progress: 92, icon: '💬', color: '#3b82f6' },
      { name: 'Conversão', progress: stats.conversionRate, icon: '🎯', color: '#8b5cf6' },
      { name: 'Satisfação', progress: 88, icon: '⭐', color: '#f59e0b' }
    ];
    
    return `
      <div style="space-y-4">
        ${categories.map(cat => `
          <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 20px;">${cat.icon}</span>
                <span style="font-weight: 500;">${cat.name}</span>
              </div>
              <span style="font-weight: 600; color: ${cat.color};">${cat.progress}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${cat.progress}%; background: ${cat.color};"></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },
  
  // Funções de Relatório
  gerarRelatorioVendas: function() {
    const stats = this.calcularEstatisticas();
    const data = window.crmState.kanbanData;
    const vendas = [];
    
    Object.values(data.clients || {}).forEach(client => {
      (client.deals || []).forEach(deal => {
        vendas.push({
          cliente: client.nome,
          valor: deal.valor,
          adesao: deal.valor_adesao,
          gordurinha: deal.valor_gordurinha,
          data: new Date(deal.dataCriacao).toLocaleDateString('pt-BR')
        });
      });
    });
    
    let relatorio = `RELATÓRIO DE VENDAS - ${new Date().toLocaleDateString('pt-BR')}\n`;
    relatorio += `==================================================\n\n`;
    relatorio += `RESUMO GERAL:\n`;
    relatorio += `• Total de vendas: ${stats.totalDeals}\n`;
    relatorio += `• Valor total: R$ ${stats.totalRevenue.toLocaleString('pt-BR')}\n`;
    relatorio += `• Total Adesão: R$ ${stats.totalAdesao.toLocaleString('pt-BR')}\n`;
    relatorio += `• Total Gordurinha: R$ ${stats.totalGordurinha.toLocaleString('pt-BR')}\n`;
    relatorio += `• Ticket médio: R$ ${(stats.totalRevenue / Math.max(stats.totalDeals, 1)).toFixed(2)}\n\n`;
    
    relatorio += `DETALHAMENTO:\n`;
    vendas.forEach(v => {
      relatorio += `• ${v.cliente}: R$ ${v.valor} (Adesão: R$ ${v.adesao}, Gordurinha: R$ ${v.gordurinha}) - ${v.data}\n`;
    });
    
    relatorio += `\nGerado em: ${new Date().toLocaleString('pt-BR')}`;
    
    return relatorio;
  },
  
  gerarRelatorioPerformance: function() {
    const stats = this.calcularEstatisticas();
    
    let relatorio = `RELATÓRIO DE PERFORMANCE - ${new Date().toLocaleDateString('pt-BR')}\n`;
    relatorio += `==================================================\n\n`;
    relatorio += `INDICADORES PRINCIPAIS:\n`;
    relatorio += `• Taxa de conversão: ${stats.conversionRate}%\n`;
    relatorio += `• Total de clientes: ${stats.totalClients}\n`;
    relatorio += `• Negócios fechados: ${stats.totalDeals}\n`;
    relatorio += `• Crescimento: +15%\n\n`;
    
    relatorio += `ANÁLISE POR ORIGEM:\n`;
    Object.entries(stats.origens).forEach(([origem, count]) => {
      relatorio += `• ${origem}: ${count} clientes\n`;
    });
    
    relatorio += `\nSTATUS: EXCELENTE\n`;
    relatorio += `TENDÊNCIA: CRESCENTE\n\n`;
    relatorio += `Gerado em: ${new Date().toLocaleString('pt-BR')}`;
    
    return relatorio;
  },
  
  baixarRelatorio: function(tipo) {
    let conteudo = '';
    let nomeArquivo = '';
    
    if (tipo === 'vendas') {
      conteudo = this.gerarRelatorioVendas();
      nomeArquivo = 'relatorio-vendas.txt';
    } else if (tipo === 'performance') {
      conteudo = this.gerarRelatorioPerformance();
      nomeArquivo = 'relatorio-performance.txt';
    }
    
    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = nomeArquivo;
    link.click();
    
    window.CRMUI.mostrarNotificacao('📥 Relatório baixado com sucesso!', 'success');
  },
  
  compartilharRelatorio: function(tipo) {
    const menu = document.createElement('div');
    menu.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      padding: 20px;
      z-index: 10000;
    `;
    
    menu.innerHTML = `
      <h3 style="margin: 0 0 16px 0;">Compartilhar Relatório</h3>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <button onclick="CRMDashboard.enviarPorEmail('${tipo}')" class="btn btn-primary" style="width: 200px;">
          📧 Por E-mail
        </button>
        <button onclick="CRMDashboard.enviarPorWhatsApp('${tipo}')" class="btn btn-secondary" style="width: 200px;">
          💬 WhatsApp Web
        </button>
        <button onclick="this.parentElement.parentElement.remove()" class="btn btn-secondary" style="width: 200px;">
          Cancelar
        </button>
      </div>
    `;
    
    document.body.appendChild(menu);
  },
  
  enviarPorEmail: function(tipo) {
    const conteudo = tipo === 'vendas' ? this.gerarRelatorioVendas() : this.gerarRelatorioPerformance();
    const assunto = tipo === 'vendas' ? 'Relatório de Vendas' : 'Relatório de Performance';
    
    const mailtoLink = `mailto:?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(conteudo)}`;
    window.open(mailtoLink);
    
    // Remove menu
    document.querySelector('[onclick*="enviarPorEmail"]').parentElement.parentElement.remove();
  },
  
  enviarPorWhatsApp: function(tipo) {
    const conteudo = tipo === 'vendas' ? this.gerarRelatorioVendas() : this.gerarRelatorioPerformance();
    
    const whatsappUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(conteudo)}`;
    window.open(whatsappUrl, '_blank');
    
    // Remove menu
    document.querySelector('[onclick*="enviarPorWhatsApp"]').parentElement.parentElement.remove();
  }
};