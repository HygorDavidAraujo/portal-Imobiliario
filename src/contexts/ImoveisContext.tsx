import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Imovel, ContatoCliente, Lead } from '../types';

interface ImoveisContextData {
  imoveis: Imovel[];
  contatoCliente: ContatoCliente | null;
  leads: Lead[];
  favoritos: string[];
  apiError: string | null; // Novo estado para erros da API
  adicionarImovel: (imovel: Imovel) => Promise<string>;
  atualizarImovel: (id: string, imovel: Imovel) => Promise<void>;
  removerImovel: (id: string) => Promise<void>;
  obterImovelPorId: (id: string) => Imovel | undefined;
  salvarContatoCliente: (contato: ContatoCliente) => void;
  adicionarLead: (lead: Lead) => Promise<void>;
  marcarLeadComoVisualizado: (id: string) => Promise<void>;
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

export const ImoveisProvider: React.FC<ImoveisProviderProps> = ({ children }) => {
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [contatoCliente, setContatoCliente] = useState<ContatoCliente | null>(() => {
    const storedContato = localStorage.getItem('contatoCliente');
    return storedContato ? JSON.parse(storedContato) : null;
  });
  const [leads, setLeads] = useState<Lead[]>([]);
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
      }
    } catch {
      // Ignora erro de parsing se a resposta não for JSON
    }
    setApiError(errorMessage);
    return new Error(errorMessage); // Continua propagando o erro
  };

  // Carregar imóveis do backend na inicialização
  useEffect(() => {
    const carregarDados = async () => {
      setApiError(null); // Limpa erros anteriores
      try {
        const isAdminRoute = window.location.pathname.startsWith('/admin');
        const imoveisApiUrl = `${API_BASE_URL}/api/imoveis${isAdminRoute ? '?status=all' : ''}`;

        const [imoveisRes, leadsRes] = await Promise.all([
          fetch(imoveisApiUrl),
          fetch(`${API_BASE_URL}/api/leads`),
        ]);

        if (!imoveisRes.ok) {
          throw await handleApiResponseError(imoveisRes, 'Falha ao carregar imóveis.');
        }
        const dadosImoveis = await imoveisRes.json();
        setImoveis(dadosImoveis);
        
        if (!leadsRes.ok) {
          throw await handleApiResponseError(leadsRes, 'Falha ao carregar leads.');
        }
        const dadosLeads = await leadsRes.json();
        const leadsNormalizados = (dadosLeads || []).map((lead: any) => ({
          ...lead,
          cliente: lead.cliente || {
            nome: lead.clienteNome || lead.nomeCliente || '',
            email: lead.clienteEmail || '',
            telefone: lead.clienteTelefone || '',
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
        
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        // O erro já foi setado por handleApiResponseError ou é um erro de rede/parsing
        if (!apiError) { // Se não foi setado por handleApiResponseError (erro de rede, por exemplo)
          setApiError(error instanceof Error ? error.message : 'Erro desconhecido ao carregar dados.');
        }
      }
    };

    carregarDados();
  }, []);

  // Sincronizar favoritos com localStorage
  useEffect(() => {
    localStorage.setItem('favoritos', JSON.stringify(favoritos));
  }, [favoritos]);

  const adicionarImovel = async (imovel: Imovel) => {
    setApiError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/imoveis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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

      setLeads((prev) => [lead, ...prev]);
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
      });

      if (!response.ok) {
        throw await handleApiResponseError(response, 'Erro ao atualizar lead.');
      }

      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === id ? { ...lead, visualizado: true } : lead
        )
      );
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
        contatoCliente,
        leads,
        favoritos,
        apiError, // Expondo o estado de erro
        adicionarImovel,
        atualizarImovel,
        removerImovel,
        obterImovelPorId,
        salvarContatoCliente,
        adicionarLead,
        marcarLeadComoVisualizado,
        toggleFavorito,
        isFavorito,
        clearApiError, // Expondo a função para limpar o erro
      }}
    >
      {children}
    </ImoveisContext.Provider>
  );
};

