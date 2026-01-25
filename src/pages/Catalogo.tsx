import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useImoveis } from '../contexts/ImoveisContext';
import { FiltrosCatalogo, Imovel } from '../types';
import { formatarMoeda, obterFotoDestaque, otimizarUrlCloudinary } from '../utils/helpers';
import { Phone, Mail, Facebook, Instagram, MapPin, Bed, Bath, Car, Maximize, Search, Filter, Heart } from 'lucide-react';
import logo from '../img/logo.png';
import { Skeleton } from '../components/Skeleton';
import { ApiErrorBanner } from '../components/ApiErrorBanner';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getImoveisFacets, getImoveisPage } from '../api/imoveis';

export const Catalogo: React.FC = () => {
  const {
    favoritos,
    apiError,
    clearApiError,
  } = useImoveis();
  const [filtros, setFiltros] = useState<FiltrosCatalogo>({});
  const [buscaTexto, setBuscaTexto] = useState('');
  const [buscaTextoDebounced, setBuscaTextoDebounced] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [mostrarApensFavoritos, setMostrarApenasFavoritos] = useState(false);

  const [sort, setSort] = useState<'data-desc' | 'data-asc' | 'preco-asc' | 'preco-desc'>('data-desc');
  const [dismissQueryError, setDismissQueryError] = useState(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setBuscaTextoDebounced(buscaTexto.trim());
    }, 350);
    return () => window.clearTimeout(t);
  }, [buscaTexto]);

  const filtrosEfetivos = useMemo<FiltrosCatalogo>(() => {
    return {
      ...filtros,
      q: buscaTextoDebounced || undefined,
    };
  }, [filtros, buscaTextoDebounced]);

  useEffect(() => {
    setDismissQueryError(false);
  }, [mostrarApensFavoritos, filtrosEfetivos, sort]);

  const facetsQuery = useQuery({
    queryKey: ['imoveis', 'facets'],
    queryFn: getImoveisFacets,
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });

  const bairrosUnicos = facetsQuery.data?.bairros ?? [];
  const cidadesUnicas = facetsQuery.data?.cidades ?? [];
  const tiposUnicos = facetsQuery.data?.tipos ?? [];

  const imoveisQuery = useInfiniteQuery({
    queryKey: ['imoveis', 'catalogo', { filtros: filtrosEfetivos, sort }],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getImoveisPage({
        page: Number(pageParam ?? 1),
        limit: 20,
        sort,
        filtros: filtrosEfetivos,
      }),
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination?.hasNextPage) return undefined;
      return lastPage.pagination.page + 1;
    },
    enabled: !mostrarApensFavoritos,
    retry: 1,
  });

  const imoveis = useMemo(() => {
    const pages = imoveisQuery.data?.pages || [];
    return pages.flatMap((p) => p.data || []);
  }, [imoveisQuery.data]);

  const paginacaoImoveis = useMemo(() => {
    const pages = imoveisQuery.data?.pages || [];
    if (!pages.length) return null;
    return pages[pages.length - 1]?.pagination ?? null;
  }, [imoveisQuery.data]);

  const queryErrorMessage = useMemo(() => {
    if (dismissQueryError) return null;
    if (!imoveisQuery.error) return null;
    return imoveisQuery.error instanceof Error ? imoveisQuery.error.message : 'Falha ao carregar imóveis.';
  }, [dismissQueryError, imoveisQuery.error]);

  // Filtros agora são aplicados no backend; no front filtramos apenas por favoritos.
  const imoveisFiltrados = useMemo(() => {
    if (!mostrarApensFavoritos) return imoveis;
    return imoveis.filter((imovel) => favoritos.includes(imovel.id));
  }, [imoveis, mostrarApensFavoritos, favoritos]);

  const removerFiltro = (key: string) => {
    if (key === 'q') {
      setBuscaTexto('');
      return;
    }
    setFiltros((prev) => {
      const next: any = { ...prev };
      delete next[key];
      return next;
    });
  };

  const chipsAtivos = useMemo(() => {
    const chips: Array<{ key: string; label: string }> = [];
    const q = buscaTexto.trim();
    if (q) chips.push({ key: 'q', label: `Busca: ${q}` });
    if (filtros.id) chips.push({ key: 'id', label: `ID: ${filtros.id}` });
    if (filtros.categoria) chips.push({ key: 'categoria', label: `Categoria: ${filtros.categoria}` });
    if (filtros.tipo) chips.push({ key: 'tipo', label: `Tipo: ${filtros.tipo}` });
    if (filtros.bairro) chips.push({ key: 'bairro', label: `Bairro: ${filtros.bairro}` });
    if (filtros.cidade) chips.push({ key: 'cidade', label: `Cidade: ${filtros.cidade}` });
    if ((filtros as any).estado) chips.push({ key: 'estado', label: `Estado: ${(filtros as any).estado}` });
    if (typeof filtros.precoMin === 'number') chips.push({ key: 'precoMin', label: `Preço mín: ${formatarMoeda(filtros.precoMin)}` });
    if (typeof filtros.precoMax === 'number') chips.push({ key: 'precoMax', label: `Preço máx: ${formatarMoeda(filtros.precoMax)}` });
    if (typeof filtros.quartos === 'number') chips.push({ key: 'quartos', label: `Quartos: ${filtros.quartos}+` });
    return chips;
  }, [buscaTexto, filtros]);

  // Scroll infinito: quando sentinel aparece, carrega próxima página.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (mostrarApensFavoritos) return;
    if (!imoveisQuery.hasNextPage) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        if (imoveisQuery.isFetchingNextPage) return;
        void imoveisQuery.fetchNextPage();
      },
      { rootMargin: '600px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [imoveisQuery.hasNextPage, imoveisQuery.isFetchingNextPage, imoveisQuery.fetchNextPage, mostrarApensFavoritos]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Logo e Nome */}
            <div className="flex items-center gap-4">
              <img
                src={logo}
                alt="Logo Hygor David Araújo"
                className="w-16 h-16 rounded-lg shadow-lg object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold font-display bg-gradient-to-r from-gold-300 to-gold-500 bg-clip-text text-transparent">
                  Hygor Araújo
                </h1>
                <p className="text-sm text-slate-300">Corretor de Imóveis</p>
                <p className="text-xs text-gold-400 font-semibold">CRECI: 42.860</p>
              </div>
            </div>

            {/* Contatos */}
            <div className="flex flex-col md:items-end gap-2">
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-x-4 gap-y-2 text-sm">
                <a
                  href="tel:5562981831483"
                  className="flex items-center gap-2 hover:text-gold-400 transition-colors max-w-full"
                >
                  <Phone size={16} />
                  (62) 98183-1483
                </a>
                <a
                  href="mailto:hygordavidaraujo@gmail.com"
                  className="flex items-center gap-2 hover:text-gold-400 transition-colors max-w-full break-all"
                >
                  <Mail size={16} />
                  hygordavidaraujo@gmail.com
                </a>
              </div>
              <div className="flex gap-3">
                <a
                  href="https://facebook.com/Corretor.hygoraraujo"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                >
                  <Facebook size={16} />
                </a>
                <a
                  href="https://instagram.com/corretor.hygoraraujo"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center hover:from-purple-700 hover:to-pink-700 transition-colors"
                >
                  <Instagram size={16} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Filtros */}
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="mb-3">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por título, bairro, cidade..."
                value={buscaTexto}
                onChange={(e) => setBuscaTexto(e.target.value)}
                aria-label="Buscar imóveis"
                className="w-full pl-10 pr-4 py-3 md:py-2 min-h-11 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base md:text-sm"
              />
            </div>
          </div>

          {chipsAtivos.length > 0 && !mostrarApensFavoritos && (
            <div className="flex flex-wrap gap-2 mb-3" aria-label="Filtros ativos">
              {chipsAtivos.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => removerFiltro(chip.key)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  title="Remover filtro"
                >
                  <span className="truncate max-w-[240px]">{chip.label}</span>
                  <span aria-hidden="true" className="text-slate-500">×</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setFiltros({});
                  setBuscaTexto('');
                }}
                className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                Limpar tudo
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            aria-controls="catalogo-filtros"
            aria-expanded={mostrarFiltros}
            className="flex items-center gap-2 text-slate-700 hover:text-blue-600 transition-colors mb-3 md:hidden min-h-11 px-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <Filter size={20} />
            {mostrarFiltros ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </button>

          <div id="catalogo-filtros" role="region" aria-label="Filtros do catálogo" className={`${mostrarFiltros ? 'block' : 'hidden'} md:block`}>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
              <input
                type="text"
                placeholder="Buscar por ID..."
                value={filtros.id || ''}
                onChange={(e) => setFiltros({ ...filtros, id: e.target.value })}
                aria-label="Buscar por ID"
                className="px-4 py-3 md:px-3 md:py-2 min-h-11 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base md:text-sm"
              />

              <select
                value={filtros.categoria || ''}
                onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value as any, tipo: undefined })}
                aria-label="Categoria"
                className="px-4 py-3 md:px-3 md:py-2 min-h-11 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base md:text-sm"
              >
                <option value="">Todas as categorias</option>
                <option value="Residencial">Residencial</option>
                <option value="Comercial">Comercial</option>
                <option value="Rural">Rural</option>
              </select>

              <select
                value={filtros.tipo || ''}
                onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
                aria-label="Tipo"
                className="px-4 py-3 md:px-3 md:py-2 min-h-11 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base md:text-sm"
              >
                <option value="">Todos os tipos</option>
                {tiposUnicos.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>

              <select
                value={filtros.bairro || ''}
                onChange={(e) => setFiltros({ ...filtros, bairro: e.target.value })}
                aria-label="Bairro"
                className="px-4 py-3 md:px-3 md:py-2 min-h-11 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base md:text-sm"
              >
                <option value="">Todos os bairros</option>
                {bairrosUnicos.map(bairro => (
                  <option key={bairro} value={bairro}>{bairro}</option>
                ))}
              </select>

              <select
                value={filtros.cidade || ''}
                onChange={(e) => setFiltros({ ...filtros, cidade: e.target.value })}
                aria-label="Cidade"
                className="px-4 py-3 md:px-3 md:py-2 min-h-11 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base md:text-sm"
              >
                <option value="">Todas as cidades</option>
                {cidadesUnicas.map(cidade => (
                  <option key={cidade} value={cidade}>{cidade}</option>
                ))}
              </select>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
                className="px-4 py-3 md:px-3 md:py-2 min-h-11 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base md:text-sm"
                title="Ordenar resultados"
                aria-label="Ordenar resultados"
              >
                <option value="data-desc">Mais recentes</option>
                <option value="data-asc">Mais antigos</option>
                <option value="preco-asc">Menor preço</option>
                <option value="preco-desc">Maior preço</option>
              </select>

              <button
                type="button"
                onClick={() => setFiltros({})}
                className="px-4 py-3 md:px-4 md:py-2 min-h-11 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-base md:text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Resultados */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {(apiError || queryErrorMessage) && (
          <ApiErrorBanner
            message={apiError || queryErrorMessage || ''}
            onClose={() => {
              clearApiError();
              setDismissQueryError(true);
            }}
            className="mb-6"
          />
        )}
        <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
          <h2 className="text-2xl font-bold text-slate-800">
            {paginacaoImoveis?.total != null && !mostrarApensFavoritos
              ? `${paginacaoImoveis.total} ${paginacaoImoveis.total === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}`
              : `${imoveisFiltrados.length} ${imoveisFiltrados.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}`}
          </h2>
          {!mostrarApensFavoritos && paginacaoImoveis?.total != null && (
            <div className="text-sm text-slate-600">
              Mostrando <span className="font-semibold">{imoveis.length}</span> de{' '}
              <span className="font-semibold">{paginacaoImoveis.total}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setMostrarApenasFavoritos(!mostrarApensFavoritos)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              mostrarApensFavoritos
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 max-w-full whitespace-normal break-words`}
            aria-pressed={mostrarApensFavoritos}
          >
            <Heart size={20} fill={mostrarApensFavoritos ? 'currentColor' : 'none'} />
            {mostrarApensFavoritos ? `Meus Favoritos (${favoritos.length})` : `Ver Favoritos (${favoritos.length})`}
          </button>
        </div>

        {imoveisQuery.isLoading && imoveis.length === 0 && !mostrarApensFavoritos ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="bg-white rounded-lg overflow-hidden shadow-lg">
                <Skeleton className="h-48 w-full" />
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Skeleton className="h-5 w-16 rounded" />
                    <Skeleton className="h-7 w-24 rounded" />
                  </div>
                  <Skeleton className="h-5 w-5/6 rounded" />
                  <Skeleton className="h-4 w-4/6 rounded" />
                  <div className="pt-3 border-t border-slate-200 flex gap-3">
                    <Skeleton className="h-4 w-10 rounded" />
                    <Skeleton className="h-4 w-10 rounded" />
                    <Skeleton className="h-4 w-10 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : imoveisFiltrados.length === 0 ? (
          <div className="text-center py-16">
            <Search size={64} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">
              Nenhum imóvel encontrado
            </h3>
            <p className="text-slate-500">
              Tente ajustar os filtros para ver mais resultados
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {imoveisFiltrados.map((imovel) => (
                <ImovelCard key={imovel.id} imovel={imovel} />
              ))}
            </div>

            {imoveisQuery.hasNextPage && !mostrarApensFavoritos && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={() => void imoveisQuery.fetchNextPage()}
                  disabled={imoveisQuery.isFetchingNextPage}
                  className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  {imoveisQuery.isFetchingNextPage ? 'Carregando...' : 'Carregar mais imóveis'}
                </button>
              </div>
            )}

            {/* Sentinel do scroll infinito */}
            {imoveisQuery.hasNextPage && !mostrarApensFavoritos && (
              <div className="mt-6" aria-live="polite" aria-atomic="true">
                {imoveisQuery.isFetchingNextPage && imoveis.length > 0 && (
                  <div className="text-center text-sm text-slate-600">Carregando mais imóveis…</div>
                )}
                <div ref={sentinelRef} className="h-6" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-slate-900 to-blue-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-300">
            © 2025 Hygor David Araújo - Corretor de Imóveis. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

interface ImovelCardProps {
  imovel: Imovel;
}

const ImovelCard: React.FC<ImovelCardProps> = ({ imovel }) => {
  const { toggleFavorito, isFavorito } = useImoveis();
  const fotoDestaque = otimizarUrlCloudinary(obterFotoDestaque(imovel.fotos), { width: 700 });
  const favorito = isFavorito(imovel.id);

  const handleFavoritar = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorito(imovel.id);
  };

  return (
    <Link
      to={`/imovel/${imovel.id}`}
      className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full"
    >
      {/* Foto */}
      <div className="relative h-48 bg-slate-200 overflow-hidden">
        <img
          src={fotoDestaque}
          alt={imovel.titulo}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e2e8f0" width="400" height="300"/%3E%3Ctext fill="%2394a3b8" font-family="sans-serif" font-size="24" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ESem imagem%3C/text%3E%3C/svg%3E';
          }}
        />
        <div className="absolute top-3 right-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
          {imovel.tipologia.tipoVenda}
        </div>
        <button
          onClick={handleFavoritar}
          className="absolute top-3 left-3 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          title={favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          aria-label={favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          aria-pressed={favorito}
        >
          <Heart
            size={20}
            className={favorito ? 'text-red-500' : 'text-slate-400'}
            fill={favorito ? 'currentColor' : 'none'}
          />
        </button>
      </div>

      {/* Conteúdo */}
      <div className="p-4 flex flex-col flex-grow">
        {/* ID e Preço */}
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 min-w-0">
          <span className="text-xs font-display font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded">
            #{imovel.id}
          </span>
          <span className="text-2xl font-bold text-blue-600 font-display text-right leading-tight break-words">
            {formatarMoeda(imovel.preco)}
          </span>
        </div>

        {/* Título */}
        <h3 className="text-lg font-semibold text-slate-800 mb-2 line-clamp-2 min-h-[3.5rem] font-display break-words">
          {imovel.titulo}
        </h3>

        {/* Localização */}
        <div className="flex items-center gap-2 text-slate-600 mb-3 text-sm min-w-0">
          <MapPin size={16} className="flex-shrink-0" />
          <span className="truncate">
            {imovel.endereco.bairro}, {imovel.endereco.cidade} - {imovel.endereco.estado}
          </span>
        </div>

        {/* Características */}
        <div className="flex flex-wrap gap-3 text-sm text-slate-600 mt-auto pt-3 border-t border-slate-200">
          {imovel.fichaTecnica.quartos && (
            <div className="flex items-center gap-1">
              <Bed size={16} />
              <span>{imovel.fichaTecnica.quartos}</span>
            </div>
          )}
          {imovel.fichaTecnica.banheiros && (
            <div className="flex items-center gap-1">
              <Bath size={16} />
              <span>{imovel.fichaTecnica.banheiros}</span>
            </div>
          )}
          {imovel.fichaTecnica.vagasGaragem && (
            <div className="flex items-center gap-1">
              <Car size={16} />
              <span>{imovel.fichaTecnica.vagasGaragem}</span>
            </div>
          )}
          {imovel.fichaTecnica.areaTotal && (
            <div className="flex items-center gap-1">
              <Maximize size={16} />
              <span>{imovel.fichaTecnica.areaTotal}m²</span>
            </div>
          )}
          {imovel.fichaTecnica.areaConstruida && (
            <div className="flex items-center gap-1">
              <Maximize size={16} />
              <span>{imovel.fichaTecnica.areaConstruida}m² const.</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
