import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Imovel, ContatoCliente, Lead } from '../types';

interface ImoveisContextData {
  imoveis: Imovel[];
  contatoCliente: ContatoCliente | null;
  leads: Lead[];
  favoritos: string[];
  adicionarImovel: (imovel: Imovel) => Promise<void>;
  atualizarImovel: (id: string, imovel: Imovel) => Promise<void>;
  removerImovel: (id: string) => Promise<void>;
  obterImovelPorId: (id: string) => Imovel | undefined;
  salvarContatoCliente: (contato: ContatoCliente) => void;
  adicionarLead: (lead: Lead) => Promise<void>;
  marcarLeadComoVisualizado: (id: string) => Promise<void>;
  toggleFavorito: (imovelId: string) => boolean;
  isFavorito: (imovelId: string) => boolean;
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

  // Carregar imóveis do backend na inicialização
  useEffect(() => {
    const carregarDados = async () => {
      try {
        const [imoveisRes, leadsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/imoveis`),
          fetch(`${API_BASE_URL}/api/leads`),
        ]);

        if (imoveisRes.ok) {
          const dadosImoveis = await imoveisRes.json();
          setImoveis(dadosImoveis);
        }

        if (leadsRes.ok) {
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
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };

    carregarDados();
  }, []);

  // Sincronizar favoritos com localStorage
  useEffect(() => {
    localStorage.setItem('favoritos', JSON.stringify(favoritos));
  }, [favoritos]);

  const adicionarImovel = async (imovel: Imovel) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/imoveis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imovel),
      });

      if (!response.ok) throw new Error('Erro ao salvar imóvel');

      // Atualizar lista local
      setImoveis((prev) => [...prev, imovel]);
    } catch (error) {
      console.error('Erro ao adicionar imóvel:', error);
      throw error;
    }
  };

  const atualizarImovel = async (id: string, imovelAtualizado: Imovel) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/imoveis/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imovelAtualizado),
      });

      if (!response.ok) throw new Error('Erro ao atualizar imóvel');

      setImoveis((prev) =>
        prev.map((imovel) => (imovel.id === id ? imovelAtualizado : imovel))
      );
    } catch (error) {
      console.error('Erro ao atualizar imóvel:', error);
      throw error;
    }
  };

  const removerImovel = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/imoveis/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erro ao deletar imóvel');

      setImoveis((prev) => prev.filter((imovel) => imovel.id !== id));
    } catch (error) {
      console.error('Erro ao remover imóvel:', error);
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
        }),
      });

      if (!response.ok) throw new Error('Erro ao salvar lead');

      setLeads((prev) => [lead, ...prev]);
    } catch (error) {
      console.error('Erro ao adicionar lead:', error);
      throw error;
    }
  };

  const marcarLeadComoVisualizado = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leads/${id}`, {
        method: 'PATCH',
      });

      if (!response.ok) throw new Error('Erro ao atualizar lead');

      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === id ? { ...lead, visualizado: true } : lead
        )
      );
    } catch (error) {
      console.error('Erro ao marcar lead como visualizado:', error);
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
        adicionarImovel,
        atualizarImovel,
        removerImovel,
        obterImovelPorId,
        salvarContatoCliente,
        adicionarLead,
        marcarLeadComoVisualizado,
        toggleFavorito,
        isFavorito,
      }}
    >
      {children}
    </ImoveisContext.Provider>
  );
};
