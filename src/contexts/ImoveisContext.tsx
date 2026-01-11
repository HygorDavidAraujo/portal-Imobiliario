import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Imovel, ContatoCliente, Lead, FiltrosCatalogo } from '../types';

interface PaginacaoInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ImoveisContextData {
  imoveis: Imovel[];
  paginacaoImoveis: PaginacaoInfo | null;
  carregandoImoveis: boolean;
  sortImoveisAtual: 'data-desc' | 'data-asc' | 'preco-asc' | 'preco-desc';
  contatoCliente: ContatoCliente | null;
  leads: Lead[];
  paginacaoLeads: PaginacaoInfo | null;
  carregandoLeads: boolean;
  totalLeads: number;
  leadsNaoVisualizados: number;
  filtroLeadsVisualizado: 'all' | 'nao-visualizados' | 'visualizados';
  sortLeadsAtual: 'data-desc' | 'data-asc';
  favoritos: string[];
  apiError: string | null; // Novo estado para erros da API
  carregarProximaPaginaImoveis: () => Promise<void>;
  aplicarFiltrosCatalogo: (filtros: FiltrosCatalogo) => Promise<void>;
  definirOrdenacaoImoveis: (sort: 'data-desc' | 'data-asc' | 'preco-asc' | 'preco-desc') => Promise<void>;
  adicionarImovel: (imovel: Imovel) => Promise<string>;
  atualizarImovel: (id: string, imovel: Imovel) => Promise<void>;
  removerImovel: (id: string) => Promise<void>;
  obterImovelPorId: (id: string) => Imovel | undefined;
  salvarContatoCliente: (contato: ContatoCliente) => void;
  adicionarLead: (lead: Lead) => Promise<void>;
  marcarLeadComoVisualizado: (id: string) => Promise<void>;
  carregarProximaPaginaLeads: () => Promise<void>;
  aplicarFiltroLeadsVisualizado: (filtro: 'all' | 'nao-visualizados' | 'visualizados') => Promise<void>;
  definirOrdenacaoLeads: (sort: 'data-desc' | 'data-asc') => Promise<void>;
  toggleFavorito: (imovelId: string) => boolean;
  isFavorito: (imovelId: string) => boolean;
  clearApiError: () => void; // Nova função para limpar o erro
}

const ImoveisContext = createContext<ImoveisContextData>({} as ImoveisContextData);

export const useImoveis = () => {
  const context = useContext(ImoveisContext);
  if (!context) {
    throw new Error('useImoveis deve ser usado dentro de um ImoveisProvider');
  }
  return context;
};

interface ImoveisProviderProps {
  children: ReactNode;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// Helper para obter headers de autenticação
const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export const ImoveisProvider: React.FC<ImoveisProviderProps> = ({ children }) => {
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [paginacaoImoveis, setPaginacaoImoveis] = useState<PaginacaoInfo | null>(null);
  const [carregandoImoveis, setCarregandoImoveis] = useState(false);
  const [paginaImoveisAtual, setPaginaImoveisAtual] = useState(1);
  const [filtrosCatalogoAtual, setFiltrosCatalogoAtual] = useState<FiltrosCatalogo>({});
  const [sortImoveisAtual, setSortImoveisAtual] = useState<'data-desc' | 'data-asc' | 'preco-asc' | 'preco-desc'>('data-desc');
  const [contatoCliente, setContatoCliente] = useState<ContatoCliente | null>(() => {
    const storedContato = localStorage.getItem('contatoCliente');
    return storedContato ? JSON.parse(storedContato) : null;
  });
  const [leads, setLeads] = useState<Lead[]>([]);
  const [paginacaoLeads, setPaginacaoLeads] = useState<PaginacaoInfo | null>(null);
  const [carregandoLeads, setCarregandoLeads] = useState(false);
  const [paginaLeadsAtual, setPaginaLeadsAtual] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const [leadsNaoVisualizados, setLeadsNaoVisualizados] = useState(0);
  const [filtroLeadsVisualizado, setFiltroLeadsVisualizado] = useState<'all' | 'nao-visualizados' | 'visualizados'>('all');
  const [sortLeadsAtual, setSortLeadsAtual] = useState<'data-desc' | 'data-asc'>('data-desc');
  const [favoritos, setFavoritos] = useState<string[]>(() => {
    const storedFavoritos = localStorage.getItem('favoritos');
    try {
      return storedFavoritos ? JSON.parse(storedFavoritos) : [];
    } catch {
      return [];
    }
  });
  const [apiError, setApiError] = useState<string | null>(null); // Novo estado de erro

  const clearApiError = () => setApiError(null); // Função para limpar o erro

  // Helper para lidar com respostas de erro da API
  const handleApiResponseError = async (response: Response, defaultMessage: string) => {
    let errorMessage = defaultMessage;
    try {
      const errorData = await response.json();
      if (errorData && errorData.detail) {
        errorMessage = errorData.detail;
      } else if (errorData && errorData.error) {
        errorMessage = errorData.error;
      } else if (errorData && errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData && Array.isArray(errorData.details) && errorData.details.length) {
        errorMessage = errorData.details.join('\n');
      }
    } catch {
      // Ignora erro de parsing se a resposta não for JSON
    }
    setApiError(errorMessage);
    return new Error(errorMessage); // Continua propagando o erro
  };

  const fetchImoveisPage = async (opts: { page: number; limit: number; status?: 'all'; sort?: 'data-desc' | 'data-asc' | 'preco-asc' | 'preco-desc'; filtros?: FiltrosCatalogo }) => {
    const params = new URLSearchParams();
    params.set('page', String(opts.page));
    params.set('limit', String(opts.limit));
    params.set('sort', opts.sort || sortImoveisAtual);
    if (opts.status) params.set('status', opts.status);

    if (opts.status === 'all' && !localStorage.getItem('adminToken')) {
      throw new Error('Token de autenticação não fornecido');
    }

    const filtros = opts.filtros || {};
    if (filtros.id) params.set('id', filtros.id);
    if (filtros.categoria) params.set('categoria', filtros.categoria);
    if (filtros.tipo) params.set('tipo', filtros.tipo);
    if (filtros.bairro) params.set('bairro', filtros.bairro);
    if (filtros.cidade) params.set('cidade', filtros.cidade);
    if (filtros.estado) params.set('estado', filtros.estado);
    if (typeof filtros.precoMin === 'number') params.set('precoMin', String(filtros.precoMin));
    if (typeof filtros.precoMax === 'number') params.set('precoMax', String(filtros.precoMax));
    if (typeof filtros.quartos === 'number') params.set('quartos', String(filtros.quartos));

    const response = await fetch(`${API_BASE_URL}/api/imoveis?${params.toString()}`, {
      headers: opts.status === 'all' ? getAuthHeaders() : undefined,
    });
    if (!response.ok) {
      throw await handleApiResponseError(response, 'Falha ao carregar imóveis.');
    }

    const payload = await response.json();
    if (Array.isArray(payload)) {
      return { data: payload as Imovel[], pagination: null as PaginacaoInfo | null };
    }
    return {
      data: (payload?.data || []) as Imovel[],
      pagination: (payload?.pagination || null) as PaginacaoInfo | null,
    };
  };

  const fetchLeadsPage = async (opts: { page: number; limit: number }) => {
    const params = new URLSearchParams();
    params.set('page', String(opts.page));
    params.set('limit', String(opts.limit));
    params.set('sort', sortLeadsAtual);
    if (filtroLeadsVisualizado === 'nao-visualizados') params.set('visualizado', 'false');
    if (filtroLeadsVisualizado === 'visualizados') params.set('visualizado', 'true');

    const response = await fetch(`${API_BASE_URL}/api/leads?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw await handleApiResponseError(response, 'Falha ao carregar leads.');
    }

    const payload = await response.json();
    if (Array.isArray(payload)) {
      return { data: payload as any[], pagination: null as PaginacaoInfo | null };
    }
    return {
      data: (payload?.data || []) as any[],
      pagination: (payload?.pagination || null) as PaginacaoInfo | null,
    };
  };

  const fetchLeadsStats = async () => {
    const response = await fetch(`${API_BASE_URL}/api/leads/stats`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw await handleApiResponseError(response, 'Falha ao carregar estatísticas de leads.');
    }
    const json = await response.json();
    return {
      total: Number(json?.total || 0),
      naoVisualizados: Number(json?.naoVisualizados || 0),
    };
  };

  // Carregar imóveis do backend na inicialização
  useEffect(() => {
    const carregarDados = async () => {
      setApiError(null); // Limpa erros anteriores
      setCarregandoImoveis(true);
      try {
        const pathname = window.location.pathname;
        const isAdminLoginRoute = pathname.startsWith('/admin/login');
        const isAdminRoute = pathname.startsWith('/admin') && !isAdminLoginRoute;

        // Página de login não precisa pré-carregar dados (e não tem token ainda).
        if (isAdminLoginRoute) {
          setImoveis([]);
          setPaginacaoImoveis(null);
          setPaginaImoveisAtual(1);
          setLeads([]);
          setPaginacaoLeads(null);
          setTotalLeads(0);
          setLeadsNaoVisualizados(0);
          return;
        }

        // Admin: pré-carrega tudo (paginado) para manter UX atual.
        if (isAdminRoute) {
          const limite = 100;
          let page = 1;
          let allImoveis: Imovel[] = [];
          while (true) {
            const { data, pagination } = await fetchImoveisPage({ page, limit: limite, status: 'all', sort: 'data-desc' });
            allImoveis = [...allImoveis, ...data];
            if (!pagination?.hasNextPage) {
              setPaginacaoImoveis(pagination || null);
              break;
            }
            page += 1;
          }
          setImoveis(allImoveis);
          setPaginaImoveisAtual(1);

          const stats = await fetchLeadsStats();
          setTotalLeads(stats.total);
          setLeadsNaoVisualizados(stats.naoVisualizados);

          const { data: leadsData, pagination: leadsPagination } = await fetchLeadsPage({ page: 1, limit: 50 });
          const leadsNormalizados = (leadsData || []).map((lead: any) => ({
            ...lead,
            cliente: lead.cliente || {
              nome: lead.clienteNome || lead.nomeCliente || '',
              email: lead.clienteEmail || lead.emailCliente || '',
              telefone: lead.clienteTelefone || lead.telefoneCliente || '',
            },
            imovelTitulo: lead.imovelTitulo || lead.titulo || '',
            data: lead.data
              ? new Date(lead.data)
              : lead.criadoEm
                ? new Date(lead.criadoEm)
                : new Date(),
            visualizado: !!lead.visualizado,
          }));
          setLeads(leadsNormalizados);
          setPaginacaoLeads(leadsPagination);
          setPaginaLeadsAtual(1);
          return;
        }

        // Público: carrega primeira página, e só.
        const { data, pagination } = await fetchImoveisPage({ page: 1, limit: 20, sort: 'data-desc' });
        setImoveis(data);
        setPaginacaoImoveis(pagination);
        setPaginaImoveisAtual(1);
        setLeads([]);
        setPaginacaoLeads(null);
        setTotalLeads(0);
        setLeadsNaoVisualizados(0);

        // Se a resposta ainda vier como array (compat), mantemos sem paginação.
        if (!pagination) {
          setPaginacaoImoveis(null);
        }

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        if (!apiError) {
          setApiError(error instanceof Error ? error.message : 'Erro desconhecido ao carregar dados.');
        }
      } finally {
        setCarregandoImoveis(false);
      }
    };

    carregarDados();
  }, []);

  const carregarProximaPaginaLeads = async () => {
    if (carregandoLeads) return;
    if (!paginacaoLeads?.hasNextPage) return;

    setCarregandoLeads(true);
    setApiError(null);
    try {
      const nextPage = paginaLeadsAtual + 1;
      const { data, pagination } = await fetchLeadsPage({ page: nextPage, limit: paginacaoLeads.limit });
      const leadsNormalizados = (data || []).map((lead: any) => ({
        ...lead,
        cliente: lead.cliente || {
          nome: lead.clienteNome || lead.nomeCliente || '',
          email: lead.clienteEmail || lead.emailCliente || '',
          telefone: lead.clienteTelefone || lead.telefoneCliente || '',
        },
        imovelTitulo: lead.imovelTitulo || lead.titulo || '',
        data: lead.data
          ? new Date(lead.data)
          : lead.criadoEm
            ? new Date(lead.criadoEm)
            : new Date(),
        visualizado: !!lead.visualizado,
      }));

      setLeads((prev) => [...prev, ...leadsNormalizados]);
      setPaginacaoLeads(pagination);
      setPaginaLeadsAtual(nextPage);
    } catch (error) {
      console.error('Erro ao carregar próxima página de leads:', error);
      if (!apiError) {
        setApiError(error instanceof Error ? error.message : 'Erro desconhecido ao carregar mais leads.');
      }
    } finally {
      setCarregandoLeads(false);
    }
  };

  const recarregarLeadsPrimeiraPagina = async () => {
    setCarregandoLeads(true);
    setApiError(null);
    try {
      const stats = await fetchLeadsStats();
      setTotalLeads(stats.total);
      setLeadsNaoVisualizados(stats.naoVisualizados);

      const { data, pagination } = await fetchLeadsPage({ page: 1, limit: 50 });
      const leadsNormalizados = (data || []).map((lead: any) => ({
        ...lead,
        cliente: lead.cliente || {
          nome: lead.clienteNome || lead.nomeCliente || '',
          email: lead.clienteEmail || lead.emailCliente || '',
          telefone: lead.clienteTelefone || lead.telefoneCliente || '',
        },
        imovelTitulo: lead.imovelTitulo || lead.titulo || '',
        data: lead.data
          ? new Date(lead.data)
          : lead.criadoEm
            ? new Date(lead.criadoEm)
            : new Date(),
        visualizado: !!lead.visualizado,
      }));

      setLeads(leadsNormalizados);
      setPaginacaoLeads(pagination);
      setPaginaLeadsAtual(1);
    } finally {
      setCarregandoLeads(false);
    }
  };

  const aplicarFiltroLeadsVisualizado = async (filtro: 'all' | 'nao-visualizados' | 'visualizados') => {
    if (carregandoLeads) return;
    setFiltroLeadsVisualizado(filtro);
    await recarregarLeadsPrimeiraPagina();
  };

  const definirOrdenacaoLeads = async (sort: 'data-desc' | 'data-asc') => {
    if (carregandoLeads) return;
    setSortLeadsAtual(sort);
    await recarregarLeadsPrimeiraPagina();
  };

  const carregarProximaPaginaImoveis = async () => {
    if (carregandoImoveis) return;
    if (!paginacaoImoveis?.hasNextPage) return;

    setCarregandoImoveis(true);
    setApiError(null);
    try {
      const nextPage = paginaImoveisAtual + 1;
      const { data, pagination } = await fetchImoveisPage({ page: nextPage, limit: paginacaoImoveis.limit, sort: sortImoveisAtual, filtros: filtrosCatalogoAtual });
      setImoveis((prev) => [...prev, ...data]);
      setPaginacaoImoveis(pagination);
      setPaginaImoveisAtual(nextPage);
    } catch (error) {
      console.error('Erro ao carregar próxima página:', error);
      if (!apiError) {
        setApiError(error instanceof Error ? error.message : 'Erro desconhecido ao carregar mais imóveis.');
      }
    } finally {
      setCarregandoImoveis(false);
    }
  };

  const aplicarFiltrosCatalogo = async (filtros: FiltrosCatalogo) => {
    if (carregandoImoveis) return;

    setFiltrosCatalogoAtual(filtros);
    setCarregandoImoveis(true);
    setApiError(null);
    try {
      const { data, pagination } = await fetchImoveisPage({ page: 1, limit: 20, sort: sortImoveisAtual, filtros });
      setImoveis(data);
      setPaginacaoImoveis(pagination);
      setPaginaImoveisAtual(1);
    } catch (error) {
      console.error('Erro ao aplicar filtros:', error);
      if (!apiError) {
        setApiError(error instanceof Error ? error.message : 'Erro desconhecido ao buscar imóveis.');
      }
    } finally {
      setCarregandoImoveis(false);
    }
  };

  const definirOrdenacaoImoveis = async (sort: 'data-desc' | 'data-asc' | 'preco-asc' | 'preco-desc') => {
    if (carregandoImoveis) return;
    setSortImoveisAtual(sort);

    setCarregandoImoveis(true);
    setApiError(null);
    try {
      const { data, pagination } = await fetchImoveisPage({ page: 1, limit: 20, sort, filtros: filtrosCatalogoAtual });
      setImoveis(data);
      setPaginacaoImoveis(pagination);
      setPaginaImoveisAtual(1);
    } catch (error) {
      console.error('Erro ao alterar ordenação:', error);
      if (!apiError) {
        setApiError(error instanceof Error ? error.message : 'Erro desconhecido ao ordenar imóveis.');
      }
    } finally {
      setCarregandoImoveis(false);
    }
  };

  // Sincronizar favoritos com localStorage
  useEffect(() => {
    localStorage.setItem('favoritos', JSON.stringify(favoritos));
  }, [favoritos]);

  const adicionarImovel = async (imovel: Imovel) => {
    setApiError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/imoveis`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(imovel),
      });

      if (!response.ok) {
        throw await handleApiResponseError(response, 'Erro ao salvar imóvel.');
      }

      const data = await response.json();
      const imovelComId = { ...imovel, id: data.id };
      setImoveis((prev) => [...prev, imovelComId]);
      
      return data.id;
    } catch (error) {
      console.error('Erro ao adicionar imóvel:', error);
      if (!apiError) {
        setApiError(error instanceof Error ? error.message : 'Erro desconhecido ao adicionar imóvel.');
      }
      throw error;
    }
  };

  const atualizarImovel = async (id: string, imovelAtualizado: Imovel) => {
    setApiError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/imoveis/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(imovelAtualizado),
      });

      if (!response.ok) {
        throw await handleApiResponseError(response, 'Erro ao atualizar imóvel.');
      }

      setImoveis((prev) =>
        prev.map((imovel) => (imovel.id === id ? imovelAtualizado : imovel))
      );
    } catch (error) {
      console.error('Erro ao atualizar imóvel:', error);
      if (!apiError) {
        setApiError(error instanceof Error ? error.message : 'Erro desconhecido ao atualizar imóvel.');
      }
      throw error;
    }
  };

  const removerImovel = async (id: string) => {
    setApiError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/imoveis/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await handleApiResponseError(response, 'Erro ao deletar imóvel.');
      }

      setImoveis((prev) => prev.filter((imovel) => imovel.id !== id));
    } catch (error) {
      console.error('Erro ao remover imóvel:', error);
      if (!apiError) {
        setApiError(error instanceof Error ? error.message : 'Erro desconhecido ao remover imóvel.');
      }
      throw error;
    }
  };

  const obterImovelPorId = (id: string) => {
    return imoveis.find((imovel) => imovel.id === id);
  };

  const salvarContatoCliente = (contato: ContatoCliente) => {
    setContatoCliente(contato);
    localStorage.setItem('contatoCliente', JSON.stringify(contato));
  };

  const adicionarLead = async (lead: Lead) => {
    setApiError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: lead.id,
          imovelId: lead.imovelId,
          imovelTitulo: lead.imovelTitulo,
          nomeCliente: lead.cliente.nome,
          telefoneCliente: lead.cliente.telefone,
          emailCliente: lead.cliente.email,
          cliente: lead.cliente, // Mantido para compatibilidade, mas os campos individuais são preferidos
        }),
      });

      if (!response.ok) {
        throw await handleApiResponseError(response, 'Erro ao salvar lead.');
      }

      // Garante que cada lead adicionado tenha um objeto cliente independente
      setLeads((prev) => [
        {
          ...lead,
          cliente: { ...lead.cliente },
        },
        ...prev,
      ]);
    } catch (error) {
      console.error('Erro ao adicionar lead:', error);
      if (!apiError) {
        setApiError(error instanceof Error ? error.message : 'Erro desconhecido ao adicionar lead.');
      }
      throw error;
    }
  };

  const marcarLeadComoVisualizado = async (id: string) => {
    setApiError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/leads/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await handleApiResponseError(response, 'Erro ao atualizar lead.');
      }

      setLeads((prev) => {
        const updated = prev.map((lead) => (lead.id === id ? { ...lead, visualizado: true } : lead));
        if (filtroLeadsVisualizado === 'nao-visualizados') {
          return updated.filter((lead) => lead.id !== id);
        }
        return updated;
      });
      setLeadsNaoVisualizados((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao marcar lead como visualizado:', error);
      if (!apiError) {
        setApiError(error instanceof Error ? error.message : 'Erro desconhecido ao marcar lead como visualizado.');
      }
      throw error;
    }
  };

  const toggleFavorito = (imovelId: string): boolean => {
    const jaFavorito = favoritos.includes(imovelId);
    if (jaFavorito) {
      setFavoritos((prev) => prev.filter((id) => id !== imovelId));
      return false;
    } else {
      setFavoritos((prev) => [...prev, imovelId]);
      return true;
    }
  };

  const isFavorito = (imovelId: string): boolean => {
    return favoritos.includes(imovelId);
  };

  return (
    <ImoveisContext.Provider
      value={{
        imoveis,
        paginacaoImoveis,
        carregandoImoveis,
        sortImoveisAtual,
        contatoCliente,
        leads,
        paginacaoLeads,
        carregandoLeads,
        totalLeads,
        leadsNaoVisualizados,
        filtroLeadsVisualizado,
        sortLeadsAtual,
        favoritos,
        apiError, // Expondo o estado de erro
        carregarProximaPaginaImoveis,
        aplicarFiltrosCatalogo,
        definirOrdenacaoImoveis,
        adicionarImovel,
        atualizarImovel,
        removerImovel,
        obterImovelPorId,
        salvarContatoCliente,
        adicionarLead,
        marcarLeadComoVisualizado,
        carregarProximaPaginaLeads,
        aplicarFiltroLeadsVisualizado,
        definirOrdenacaoLeads,
        toggleFavorito,
        isFavorito,
        clearApiError, // Expondo a função para limpar o erro
      }}
    >
      {children}
    </ImoveisContext.Provider>
  );
};

