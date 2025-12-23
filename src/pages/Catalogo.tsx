import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useImoveis } from '../contexts/ImoveisContext';
import { FiltrosCatalogo, Imovel } from '../types';
import { formatarMoeda, obterFotoDestaque } from '../utils/helpers';
import { Phone, Mail, Facebook, Instagram, MapPin, Bed, Bath, Car, Maximize, Search, Filter, Heart } from 'lucide-react';

export const Catalogo: React.FC = () => {
  const { imoveis, favoritos } = useImoveis();
  const [filtros, setFiltros] = useState<FiltrosCatalogo>({});
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [mostrarApensFavoritos, setMostrarApenasFavoritos] = useState(false);

  const imoveisFiltrados = useMemo(() => {
    return imoveis.filter((imovel) => {
      if (!imovel.ativo) return false;
      if (mostrarApensFavoritos && !favoritos.includes(imovel.id)) return false;
      if (filtros.categoria && imovel.categoria !== filtros.categoria) return false;
      if (filtros.tipo && imovel.tipo !== filtros.tipo) return false;
      if (filtros.bairro && imovel.endereco.bairro && !imovel.endereco.bairro.toLowerCase().includes(filtros.bairro.toLowerCase())) return false;
      if (filtros.cidade && imovel.endereco.cidade && !imovel.endereco.cidade.toLowerCase().includes(filtros.cidade.toLowerCase())) return false;
      if (filtros.estado && imovel.endereco.estado && !imovel.endereco.estado.toLowerCase().includes(filtros.estado.toLowerCase())) return false;
      if (filtros.precoMin && imovel.preco < filtros.precoMin) return false;
      if (filtros.precoMax && imovel.preco > filtros.precoMax) return false;
      if (filtros.quartos && (!imovel.fichaTecnica.quartos || imovel.fichaTecnica.quartos < filtros.quartos)) return false;
      return true;
    });
  }, [imoveis, filtros, mostrarApensFavoritos, favoritos]);

  const bairrosUnicos = Array.from(new Set(imoveis.map(i => i.endereco.bairro).filter(Boolean))).sort();
  const cidadesUnicas = Array.from(new Set(imoveis.map(i => i.endereco.cidade))).sort();
  const tiposUnicos = Array.from(new Set(imoveis.map(i => i.tipo))).sort();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Logo e Nome */}
            <div className="flex items-center gap-4">
              <img
                src="/src/img/logo.png"
                alt="Logo Hygor David Araújo"
                className="w-16 h-16 rounded-lg shadow-lg object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gold-300 to-gold-500 bg-clip-text text-transparent">
                  Hygor David Araújo
                </h1>
                <p className="text-sm text-slate-300">Corretor de Imóveis</p>
                <p className="text-xs text-gold-400 font-semibold">CRECI: 42.860</p>
              </div>
            </div>

            {/* Contatos */}
            <div className="flex flex-col md:items-end gap-2">
              <div className="flex items-center gap-4 text-sm">
                <a
                  href="tel:5562981831483"
                  className="flex items-center gap-2 hover:text-gold-400 transition-colors"
                >
                  <Phone size={16} />
                  (62) 98183-1483
                </a>
                <a
                  href="mailto:hygordavidaraujo@gmail.com"
                  className="flex items-center gap-2 hover:text-gold-400 transition-colors"
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
                  className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                >
                  <Facebook size={16} />
                </a>
                <a
                  href="https://instagram.com/corretor.hygoraraujo"
                  target="_blank"
                  rel="noopener noreferrer"
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
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="flex items-center gap-2 text-slate-700 hover:text-blue-600 transition-colors mb-3 md:hidden"
          >
            <Filter size={20} />
            {mostrarFiltros ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </button>

          <div className={`${mostrarFiltros ? 'block' : 'hidden'} md:block`}>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <select
                value={filtros.categoria || ''}
                onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value as any, tipo: undefined })}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">Todas as categorias</option>
                <option value="Residencial">Residencial</option>
                <option value="Comercial">Comercial</option>
                <option value="Rural">Rural</option>
              </select>

              <select
                value={filtros.tipo || ''}
                onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">Todos os tipos</option>
                {tiposUnicos.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>

              <select
                value={filtros.bairro || ''}
                onChange={(e) => setFiltros({ ...filtros, bairro: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">Todos os bairros</option>
                {bairrosUnicos.map(bairro => (
                  <option key={bairro} value={bairro}>{bairro}</option>
                ))}
              </select>

              <select
                value={filtros.cidade || ''}
                onChange={(e) => setFiltros({ ...filtros, cidade: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">Todas as cidades</option>
                {cidadesUnicas.map(cidade => (
                  <option key={cidade} value={cidade}>{cidade}</option>
                ))}
              </select>

              <button
                onClick={() => setFiltros({})}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Resultados */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
          <h2 className="text-2xl font-bold text-slate-800">
            {imoveisFiltrados.length} {imoveisFiltrados.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}
          </h2>
          <button
            onClick={() => setMostrarApenasFavoritos(!mostrarApensFavoritos)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              mostrarApensFavoritos
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Heart size={20} fill={mostrarApensFavoritos ? 'currentColor' : 'none'} />
            {mostrarApensFavoritos ? `Meus Favoritos (${favoritos.length})` : `Ver Favoritos (${favoritos.length})`}
          </button>
        </div>

        {imoveisFiltrados.length === 0 ? (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {imoveisFiltrados.map((imovel) => (
              <ImovelCard key={imovel.id} imovel={imovel} />
            ))}
          </div>
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
  const fotoDestaque = obterFotoDestaque(imovel.fotos);
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
          className="absolute top-3 left-3 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all hover:scale-110"
          title={favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
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
        {/* Preço */}
        <div className="mb-2">
          <span className="text-2xl font-bold text-blue-600">
            {formatarMoeda(imovel.preco)}
          </span>
        </div>

        {/* Título */}
        <h3 className="text-lg font-semibold text-slate-800 mb-2 line-clamp-2 min-h-[3.5rem]">
          {imovel.titulo}
        </h3>

        {/* Localização */}
        <div className="flex items-center gap-2 text-slate-600 mb-3 text-sm">
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
