metricas.ticketMedio = metricas.totalDeals > 0 ? 
      metricas.valorTotal / metricas.totalDeals : 0;
    
    metricas.taxaConversao = metricas.totalClientes > 0 ?
      (metricas.totalDeals / metricas.totalClientes) * 100 : 0;
    
    // Rankings
    metricas.topOrigens = Object.entries(metricas.clientesPorOrigem)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([origem, count]) => ({ origem, count }));
    
    metricas.topTags = Object.entries(metricas.clientesPorTag)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));
    
    // Top clientes por valor
    metricas.topClientes = Object.values(dados.clients || {})
      .map(cliente => ({
        nome: cliente.nome,
        valor: (cliente.deals || []).reduce((sum, deal) => sum + (deal.valor || 0), 0),
        deals: (cliente.deals || []).length
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10);
    
    state.metricas = metricas;
    state.dadosCarregados = true;

    return metricas;
  }
  
  // =====================================================
  // ANÁLISE DE TENDÊNCIAS
  // =====================================================
  
  function analisarTendencias(periodo = 30) {
    const dados = window.crmState?.kanbanData;
    if (!dados) return null;
    
    const agora = new Date();
    const inicio = new Date(agora.getTime() - (periodo * 24 * 60 * 60 * 1000));
    
    const tendencias = {
      crescimentoClientes: 0,
      crescimentoDeals: 0,
      crescimentoReceita: 0,
      diasMaisAtivos: [],
      horariosNobres: [],
      previsaoProximoMes: 0
    };
    
    // Análise por dia
    const atividadePorDia = {};
    const receitaPorDia = {};
    
    Object.values(dados.clients || {}).forEach(cliente => {
      if (cliente.dataCadastro) {
        const data = new Date(cliente.dataCadastro);
        if (data >= inicio) {
          const dia = data.toISOString().split('T')[0];
          atividadePorDia[dia] = (atividadePorDia[dia] || 0) + 1;
        }
      }
      
      (cliente.deals || []).forEach(deal => {
        if (deal.dataCriacao) {
          const data = new Date(deal.dataCriacao);
          if (data >= inicio) {
            const dia = data.toISOString().split('T')[0];
            receitaPorDia[dia] = (receitaPorDia[dia] || 0) + (deal.valor || 0);
          }
        }
      });
    });
    
    // Calcula crescimento
    const dias = Object.keys(atividadePorDia).sort();
    if (dias.length > 1) {
      const primeiraSemana = dias.slice(0, 7);
      const ultimaSemana = dias.slice(-7);
      
      const mediaPrimeira = primeiraSemana.reduce((sum, dia) => 
        sum + (atividadePorDia[dia] || 0), 0) / 7;
      
      const mediaUltima = ultimaSemana.reduce((sum, dia) => 
        sum + (atividadePorDia[dia] || 0), 0) / 7;
      
      tendencias.crescimentoClientes = mediaUltima > 0 ? 
        ((mediaUltima - mediaPrimeira) / mediaPrimeira) * 100 : 0;
    }
    
    // Identifica padrões
    tendencias.diasMaisAtivos = Object.entries(atividadePorDia)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([dia, atividade]) => ({
        dia: new Date(dia).toLocaleDateString('pt-BR'),
        atividade
      }));
    
    // Previsão simplificada
    const receitaTotal = Object.values(receitaPorDia)
      .reduce((sum, valor) => sum + valor, 0);
    
    tendencias.previsaoProximoMes = (receitaTotal / periodo) * 30;
    
    return tendencias;
  }
  
  // =====================================================
  // FUNIL DE VENDAS
  // =====================================================
  
  function analisarFunil() {
    const dados = window.crmState?.kanbanData;
    if (!dados || !dados.columns) return null;
    
    const funil = {
      etapas: [],
      taxaConversaoTotal: 0,
      tempoMedioPorEtapa: {},
      gargalos: []
    };
    
    // Mapeia etapas do funil
    dados.columns.forEach((coluna, index) => {
      const etapa = {
        nome: coluna.title,
        total: (coluna.clients || []).length,
        valor: 0,
        percentual: 0,
        taxaConversao: 0
      };
      
      // Calcula valor total da etapa
      (coluna.clients || []).forEach(clientId => {
        const cliente = dados.clients?.[clientId];
        if (cliente && cliente.deals) {
          etapa.valor += cliente.deals.reduce((sum, deal) => 
            sum + (deal.valor || 0), 0);
        }
      });
      
      funil.etapas.push(etapa);
    });
    
    // Calcula percentuais e conversões
    if (funil.etapas.length > 0) {
      const totalInicial = funil.etapas[0].total || 1;
      
      funil.etapas.forEach((etapa, index) => {
        etapa.percentual = (etapa.total / totalInicial) * 100;
        
        if (index > 0 && funil.etapas[index - 1].total > 0) {
          etapa.taxaConversao = (etapa.total / funil.etapas[index - 1].total) * 100;
        }
      });
      
      // Taxa de conversão total
      const totalFinal = funil.etapas[funil.etapas.length - 1].total;
      funil.taxaConversaoTotal = (totalFinal / totalInicial) * 100;
      
      // Identifica gargalos
      funil.etapas.forEach((etapa, index) => {
        if (etapa.taxaConversao < 50 && etapa.taxaConversao > 0) {
          funil.gargalos.push({
            etapa: etapa.nome,
            perda: 100 - etapa.taxaConversao
          });
        }
      });
    }
    
    return funil;
  }
  
  // =====================================================
  // RELATÓRIOS
  // =====================================================
  
  function gerarRelatorio(tipo = 'completo') {
    const metricas = state.metricas;
    const tendencias = analisarTendencias();
    const funil = analisarFunil();
    
    const relatorio = {
      tipo,
      dataGeracao: new Date().toISOString(),
      periodo: state.periodoSelecionado,
      resumo: {
        titulo: 'Relatório de Performance CRM',
        totalClientes: metricas.totalClientes,
        totalDeals: metricas.totalDeals,
        valorTotal: metricas.valorTotal,
        ticketMedio: metricas.ticketMedio,
        taxaConversao: metricas.taxaConversao
      },
      detalhes: {}
    };
    
    switch (tipo) {
      case 'vendas':
        relatorio.detalhes = {
          vendaPorPeriodo: calcularVendasPorPeriodo(),
          topClientes: metricas.topClientes,
          produtosMaisVendidos: calcularProdutosMaisVendidos(),
          previsaoReceita: tendencias?.previsaoProximoMes
        };
        break;
        
      case 'clientes':
        relatorio.detalhes = {
          clientesPorOrigem: metricas.clientesPorOrigem,
          clientesPorTag: metricas.clientesPorTag,
          clientesNovos: metricas.clientesNovos,
          retencao: calcularTaxaRetencao()
        };
        break;
        
      case 'funil':
        relatorio.detalhes = funil;
        break;
        
      case 'completo':
      default:
        relatorio.detalhes = {
          metricas,
          tendencias,
          funil,
          insights: gerarInsights()
        };
    }
    
    return relatorio;
  }
  
  // =====================================================
  // VISUALIZAÇÕES
  // =====================================================
  
  function prepararDadosGrafico(tipo) {
    const metricas = state.metricas;
    
    switch (tipo) {
      case 'pizza-origem':
        return {
          labels: Object.keys(metricas.clientesPorOrigem),
          data: Object.values(metricas.clientesPorOrigem),
          colors: Object.keys(metricas.clientesPorOrigem).map(() => 
            CRMUtils.gerarCorAleatoria())
        };
        
      case 'barras-vendas':
        return prepararDadosVendasMensais();
        
      case 'linha-crescimento':
        return prepararDadosCrescimento();
        
      case 'funil':
        const funil = analisarFunil();
        return {
          labels: funil.etapas.map(e => e.nome),
          data: funil.etapas.map(e => e.total),
          percentuais: funil.etapas.map(e => e.percentual)
        };
        
      default:
        return null;
    }
  }
  
  // =====================================================
  // INSIGHTS AUTOMÁTICOS
  // =====================================================
  
  function gerarInsights() {
    const insights = [];
    const metricas = state.metricas;
    const tendencias = analisarTendencias();
    
    // Insight sobre crescimento
    if (tendencias && tendencias.crescimentoClientes > 20) {
      insights.push({
        tipo: 'positivo',
        icone: '📈',
        titulo: 'Crescimento Acelerado',
        descricao: `Crescimento de ${tendencias.crescimentoClientes.toFixed(1)}% no número de clientes`,
        acao: 'Mantenha o ritmo e considere expandir a equipe'
      });
    }
    
    // Insight sobre conversão
    if (metricas.taxaConversao < 30) {
      insights.push({
        tipo: 'alerta',
        icone: '⚠️',
        titulo: 'Taxa de Conversão Baixa',
        descricao: `Apenas ${metricas.taxaConversao.toFixed(1)}% dos leads viram clientes`,
        acao: 'Revise o processo de vendas e qualificação de leads'
      });
    }
    
    // Insight sobre ticket médio
    if (metricas.ticketMedio > 1000) {
      insights.push({
        tipo: 'positivo',
        icone: '💰',
        titulo: 'Ticket Médio Alto',
        descricao: `Ticket médio de ${CRMUtils.formatarDinheiro(metricas.ticketMedio)}`,
        acao: 'Foque em reter esses clientes de alto valor'
      });
    }
    
    // Insight sobre origem
    if (metricas.topOrigens.length > 0) {
      const melhorOrigem = metricas.topOrigens[0];
      insights.push({
        tipo: 'info',
        icone: '🎯',
        titulo: 'Principal Fonte de Leads',
        descricao: `${melhorOrigem.origem} representa ${((melhorOrigem.count / metricas.totalClientes) * 100).toFixed(1)}% dos clientes`,
        acao: 'Invista mais neste canal de aquisição'
      });
    }
    
    // Insight sobre horários
    const horariosNobres = identificarHorariosNobres();
    if (horariosNobres.length > 0) {
      insights.push({
        tipo: 'info',
        icone: '⏰',
        titulo: 'Melhores Horários',
        descricao: `Maior atividade entre ${horariosNobres[0]}h e ${horariosNobres[horariosNobres.length - 1]}h`,
        acao: 'Concentre seus esforços nestes horários'
      });
    }
    
    return insights;
  }
  
  // =====================================================
  // FUNÇÕES AUXILIARES
  // =====================================================
  
  function calcularVendasPorPeriodo() {
    const dados = window.crmState?.kanbanData;
    if (!dados) return {};
    
    const vendas = {};
    const agora = new Date();
    
    for (let i = 0; i < 12; i++) {
      const mes = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      const mesKey = mes.toISOString().slice(0, 7);
      vendas[mesKey] = 0;
    }
    
    Object.values(dados.clients || {}).forEach(cliente => {
      (cliente.deals || []).forEach(deal => {
        if (deal.dataCriacao) {
          const mesKey = deal.dataCriacao.slice(0, 7);
          if (vendas.hasOwnProperty(mesKey)) {
            vendas[mesKey] += deal.valor || 0;
          }
        }
      });
    });
    
    return vendas;
  }
  
  function calcularProdutosMaisVendidos() {
    // Implementar quando houver dados de produtos
    return [];
  }
  
  function calcularTaxaRetencao() {
    const dados = window.crmState?.kanbanData;
    if (!dados) return 0;
    
    let clientesRetidos = 0;
    let totalClientesAntigos = 0;
    
    Object.values(dados.clients || {}).forEach(cliente => {
      if (cliente.dataCadastro) {
        const diasDesde = (new Date() - new Date(cliente.dataCadastro)) / (1000 * 60 * 60 * 24);
        
        if (diasDesde > 90) {
          totalClientesAntigos++;
          
          // Considera retido se teve atividade nos últimos 30 dias
          if (cliente.ultimaInteracao) {
            const diasUltimaInteracao = (new Date() - new Date(cliente.ultimaInteracao)) / (1000 * 60 * 60 * 24);
            if (diasUltimaInteracao < 30) {
              clientesRetidos++;
            }
          }
        }
      }
    });
    
    return totalClientesAntigos > 0 ? 
      (clientesRetidos / totalClientesAntigos) * 100 : 0;
  }
  
  function prepararDadosVendasMensais() {
    const vendas = calcularVendasPorPeriodo();
    const meses = Object.keys(vendas).sort();
    
    return {
      labels: meses.map(mes => {
        const [ano, m] = mes.split('-');
        return new Date(ano, parseInt(m) - 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      }),
      data: meses.map(mes => vendas[mes])
    };
  }
  
  function prepararDadosCrescimento() {
    const dados = window.crmState?.kanbanData;
    if (!dados) return { labels: [], data: [] };
    
    const crescimento = {};
    const agora = new Date();
    
    // Últimos 30 dias
    for (let i = 0; i < 30; i++) {
      const dia = new Date(agora.getTime() - (i * 24 * 60 * 60 * 1000));
      const diaKey = dia.toISOString().split('T')[0];
      crescimento[diaKey] = 0;
    }
    
    Object.values(dados.clients || {}).forEach(cliente => {
      if (cliente.dataCadastro) {
        const diaKey = cliente.dataCadastro.split('T')[0];
        if (crescimento.hasOwnProperty(diaKey)) {
          crescimento[diaKey]++;
        }
      }
    });
    
    const dias = Object.keys(crescimento).sort();
    let acumulado = 0;
    
    return {
      labels: dias.map(dia => new Date(dia).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })),
      data: dias.map(dia => {
        acumulado += crescimento[dia];
        return acumulado;
      })
    };
  }
  
  function identificarHorariosNobres() {
    // Simplificado - retorna horário comercial
    return [9, 10, 11, 14, 15, 16, 17];
  }
  
  // =====================================================
  // EXPORTAÇÃO
  // =====================================================
  
  async function exportarRelatorio(formato = 'pdf') {
    const relatorio = gerarRelatorio('completo');
    
    switch (formato) {
      case 'json':
        return exportarJSON(relatorio);
      case 'csv':
        return exportarCSV(relatorio);
      case 'pdf':
        return exportarPDF(relatorio);
      default:
        return exportarJSON(relatorio);
    }
  }
  
  function exportarJSON(dados) {
    const json = JSON.stringify(dados, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_crm_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    return true;
  }
  
  function exportarCSV(relatorio) {
    // Implementar conversão para CSV
    console.log('Exportação CSV em desenvolvimento');
    return false;
  }
  
  function exportarPDF(relatorio) {
    // Implementar geração de PDF
    console.log('Exportação PDF em desenvolvimento');
    return false;
  }
  
  // =====================================================
  // INICIALIZAÇÃO
  // =====================================================
  
  async function inicializar() {
    console.log('📊 Iniciando módulo Analytics...');
    await coletarMetricas();
    console.log('✅ Analytics pronto!', state.metricas);
  }
  
  // =====================================================
  // API PÚBLICA
  // =====================================================
  
  return {
    inicializar,
    coletarMetricas,
    analisarTendencias,
    analisarFunil,
    gerarRelatorio,
    gerarInsights,
    prepararDadosGrafico,
    exportarRelatorio,
    
    // Getters
    get metricas() {
      return { ...state.metricas };
    },
    
    get dadosCarregados() {
      return state.dadosCarregados;
    }
  };
})();

// Auto-inicializa
CRMAnalytics.inicializar();
      tarefasConcluidas: 0,
      
      // Taxa de conversão
      taxaConversao: 0,
      tempoMedioConversao: 0,
      
      // Por origem
      clientesPorOrigem: {},
      
      // Por tags
      clientesPorTag: {},
      
      // Por coluna/estágio
      clientesPorEstagio: {},
      
      // Atividade
      atividadePorDia: {},
      atividadePorHora: new Array(24).fill(0),
      
      // Rankings
      topClientes: [],
      topOrigens: [],
      topTags: []
    };
    
    // Processa clientes
    Object.values(dados.clients || {}).forEach(cliente => {
      // Total de deals e valor
      if (cliente.deals) {
        metricas.totalDeals += cliente.deals.length;
        cliente.deals.forEach(deal => {
          metricas.valorTotal += deal.valor || 0;
        });
      }
      
      // Clientes novos (últimos 30 dias)
      if (cliente.dataCadastro) {
        const dataCadastro = new Date(cliente.dataCadastro);
        const diasDesde = (agora - dataCadastro) / (1000 * 60 * 60 * 24);
        if (diasDesde <= 30) {
          metricas.clientesNovos++;
        }
      }
      
      // Por origem
      const origem = cliente.origem || 'Não especificado';
      metricas.clientesPorOrigem[origem] = (metricas.clientesPorOrigem[origem] || 0) + 1;
      
      // Por tags
      (cliente.tags || []).forEach(tag => {
        metricas.clientesPorTag[tag] = (metricas.clientesPorTag[tag] || 0) + 1;
      });
    });
    
    // Processa colunas
    (dados.columns || []).forEach(coluna => {
      metricas.clientesPorEstagio[coluna.title] = (coluna.clients || []).length;
      
      // Tarefas
      if (coluna.tasks) {
        metricas.totalTarefas += coluna.tasks.length;
      }
    });
    
    // Calcula métricas derivadas
    metricas.ticketMedio = me// =====================================================
// Módulo de Analytics e Relatórios
// =====================================================
// Análise de dados e geração de insights

window.CRMAnalytics = (() => {
  
  // Estado do analytics
  const state = {
    metricas: {},
    periodoSelecionado: 'mes',
    dadosCarregados: false
  };
  
  // =====================================================
  // COLETA DE MÉTRICAS
  // =====================================================
  
  async function coletarMetricas() {
    const dados = await CRMStorage.carregar('kanban_data');
    if (!dados) return null;
    
    const agora = new Date();
    const metricas = {
      // Métricas gerais
      totalClientes: Object.keys(dados.clients || {}).length,
      totalDeals: 0,
      totalTarefas: 0,
      valorTotal: 0,
      ticketMedio: 0,
      
      // Métricas por período
      clientesNovos: 0,
      dealsNovos: 0,
