import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useImoveis } from '../contexts/ImoveisContext';
import { formatarMoeda, obterFotoDestaque, formatarTelefone, otimizarUrlCloudinary } from '../utils/helpers';
import { Users, Eye, Home, Building2, Mail, Phone, Calendar } from 'lucide-react';

export const Leads: React.FC = () => {
  const {
    leads,
    marcarLeadComoVisualizado,
    imoveis,
    paginacaoLeads,
    carregandoLeads,
    totalLeads,
    leadsNaoVisualizados,
    filtroLeadsVisualizado,
    sortLeadsAtual,
    carregarProximaPaginaLeads,
    aplicarFiltroLeadsVisualizado,
    definirOrdenacaoLeads,
  } = useImoveis();

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const obterImovel = (imovelId: string) => {
    return imoveis.find(i => i.id === imovelId);
  };

  const formatarData = (data: Date) => {
    const d = new Date(data);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (!paginacaoLeads?.hasNextPage) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        if (carregandoLeads) return;
        void carregarProximaPaginaLeads();
      },
      { rootMargin: '600px' }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [paginacaoLeads?.hasNextPage, carregandoLeads, carregarProximaPaginaLeads]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Users size={32} className="text-gold-400" />
              <div>
                <h1 className="text-3xl font-bold">Leads e Contatos</h1>
                <p className="text-slate-300 text-sm">
                  {leadsNaoVisualizados > 0 && (
                    <span className="bg-red-500 px-2 py-1 rounded-full text-xs font-semibold mr-2">
                      {leadsNaoVisualizados} novo{leadsNaoVisualizados > 1 ? 's' : ''}
                    </span>
                  )}
                  Total de {totalLeads} contato{totalLeads !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <Link
                to="/admin"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <Building2 size={20} />
                Imóveis
              </Link>
              <Link
                to="/"
                className="px-4 py-2 bg-white text-slate-800 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2"
              >
                <Home size={20} />
                Ver Catálogo
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-slate-700">Filtro:</span>
            <select
              value={filtroLeadsVisualizado}
              onChange={(e) => void aplicarFiltroLeadsVisualizado(e.target.value as any)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="all">Todos</option>
              <option value="nao-visualizados">Não visualizados</option>
              <option value="visualizados">Visualizados</option>
            </select>

            <span className="text-sm font-semibold text-slate-700">Ordenar:</span>
            <select
              value={sortLeadsAtual}
              onChange={(e) => void definirOrdenacaoLeads(e.target.value as any)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="data-desc">Mais recentes</option>
              <option value="data-asc">Mais antigos</option>
            </select>
          </div>

          {paginacaoLeads?.total != null && (
            <div className="text-sm text-slate-600">
              Mostrando <span className="font-semibold">{leads.length}</span> de{' '}
              <span className="font-semibold">{paginacaoLeads.total}</span>
            </div>
          )}
        </div>

        {leads.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <Users size={64} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">
              Nenhum lead ainda
            </h3>
            <p className="text-slate-500 mb-6">
              Quando os clientes demonstrarem interesse nos imóveis, os contatos aparecerão aqui
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Home size={20} />
              Ver Catálogo
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {leads.map((lead) => {
              const imovel = obterImovel(lead.imovelId);
              // Busca direto dos campos do banco, sem depender do objeto cliente
              const nome = (lead as any).nomeCliente || (lead as any).clienteNome || (lead.cliente && lead.cliente.nome) || '(sem nome)';
              const telefone = (lead as any).telefoneCliente || (lead as any).clienteTelefone || (lead.cliente && lead.cliente.telefone) || '';
              const email = (lead as any).emailCliente || (lead as any).clienteEmail || (lead.cliente && lead.cliente.email) || '';
              return (
                <div
                  key={lead.id}
                  className={`bg-white rounded-lg shadow-lg overflow-hidden transition-all ${
                    !lead.visualizado ? 'border-l-4 border-blue-600' : ''
                  }`}
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Foto do Imóvel */}
                    {imovel && (
                      <div className="md:w-48 h-32 md:h-auto bg-slate-200 flex-shrink-0">
                        <img
                          src={otimizarUrlCloudinary(obterFotoDestaque(imovel.fotos), { width: 500 })}
                          alt={imovel.titulo}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e2e8f0" width="400" height="300"/%3E%3Ctext fill="%2394a3b8" font-family="sans-serif" font-size="24" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ESem imagem%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      </div>
                    )}

                    {/* Informações do Lead */}
                    <div className="flex-1 p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          {!lead.visualizado && (
                            <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold mb-2">
                              NOVO
                            </span>
                          )}
                          <h3 className="text-xl font-bold text-slate-800 mb-1">
                            {nome}
                          </h3>
                          <div className="flex items-center gap-2 text-slate-600 text-sm mb-2">
                            <Calendar size={16} />
                            <span>{formatarData(lead.data)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        <div className="flex items-center gap-2 text-slate-700">
                          <Phone size={16} className="text-blue-600" />
                          {telefone ? (
                            <a
                              href={`tel:${telefone}`}
                              className="hover:text-blue-600 transition-colors"
                            >
                              {formatarTelefone(telefone)}
                            </a>
                          ) : (
                            <span className="text-slate-400">(sem telefone)</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-slate-700">
                          <Mail size={16} className="text-blue-600" />
                          {email ? (
                            <a
                              href={`mailto:${email}`}
                              className="hover:text-blue-600 transition-colors truncate"
                            >
                              {email}
                            </a>
                          ) : (
                            <span className="text-slate-400">(sem email)</span>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-lg p-3 mb-4">
                        <p className="text-sm text-slate-600 mb-1">Interesse no imóvel:</p>
                        <p className="font-semibold text-slate-800">{lead.imovelTitulo || '(imóvel não encontrado)'}</p>
                        {imovel && (
                          <p className="text-sm text-blue-600 mt-1">
                            {formatarMoeda(imovel.preco)}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {imovel && (
                          <Link
                            to={`/imovel/${imovel.id}`}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            Ver Imóvel
                          </Link>
                        )}
                        {!lead.visualizado && (
                          <button
                            onClick={async () => {
                              try {
                                await marcarLeadComoVisualizado(lead.id);
                              } catch (error) {
                                console.error('Erro ao marcar lead como visualizado:', error);
                              }
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            <Eye size={16} />
                            Marcar como Visualizado
                          </button>
                        )}
                        <a
                          href={`https://wa.me/${(lead.cliente?.telefone || '').replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                        >
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {paginacaoLeads?.hasNextPage && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => void carregarProximaPaginaLeads()}
                  disabled={carregandoLeads}
                  className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  {carregandoLeads ? 'Carregando...' : 'Carregar mais'}
                </button>
              </div>
            )}

            <div ref={sentinelRef} className="h-1" />
          </div>
        )}
      </div>
    </div>
  );
};
