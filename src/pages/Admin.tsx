
import { useImoveis } from '../contexts/ImoveisContext';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Users, Home, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { obterFotoDestaque, formatarMoeda, otimizarUrlCloudinary } from '../utils/helpers';
import { Skeleton } from '../components/Skeleton';

export const Admin: React.FC = () => {
  const { imoveis, removerImovel, atualizarImovel, leadsNaoVisualizados, carregandoImoveis } = useImoveis();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminSession');
    localStorage.removeItem('adminToken');
    navigate('/admin/login', { replace: true });
  };

  const handleToggleAtivo = async (imovel: any) => {
    try {
      await atualizarImovel(imovel.id, { ...imovel, ativo: !imovel.ativo });
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('Erro ao alterar status do imóvel. Tente novamente.');
    }
  };

  const handleRemover = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este imóvel?')) {
      try {
        await removerImovel(id);
      } catch (error) {
        console.error('Erro ao remover imóvel:', error);
        alert('Erro ao remover imóvel. Tente novamente.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Building2 size={32} className="text-gold-400" />
              <h1 className="text-3xl font-bold font-display">Gerenciamento de Imóveis</h1>
            </div>
            <div className="flex gap-4 items-center">
              <Link
                to="/admin/leads"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                <Users size={20} />
                Leads
                {leadsNaoVisualizados > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {leadsNaoVisualizados}
                  </span>
                )}
              </Link>
              <Link
                to="/"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                <Home size={20} />
                Ver Catálogo
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-white font-semibold ml-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                title="Encerrar sessão"
              >
                Encerrar Sessão
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">
            {imoveis.length} {imoveis.length === 1 ? 'imóvel cadastrado' : 'imóveis cadastrados'}
          </h2>
          <Link
            to="/admin/imovel/novo"
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
            <Plus size={20} />
            Cadastrar Novo Imóvel
          </Link>
        </div>

        {carregandoImoveis && imoveis.length === 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <Skeleton className="md:w-64 h-48 md:h-auto" />
                  <div className="flex-1 p-6 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-44 rounded" />
                        <Skeleton className="h-6 w-3/4 rounded" />
                      </div>
                      <div className="text-right space-y-2">
                        <Skeleton className="h-4 w-24 rounded" />
                        <Skeleton className="h-7 w-32 rounded" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-full rounded" />
                    <Skeleton className="h-4 w-5/6 rounded" />
                    <div className="pt-2 flex gap-2">
                      <Skeleton className="h-10 w-28 rounded-lg" />
                      <Skeleton className="h-10 w-24 rounded-lg" />
                      <Skeleton className="h-10 w-28 rounded-lg" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : imoveis.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <Building2 size={64} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">
              Nenhum imóvel cadastrado
            </h3>
            <p className="text-slate-500 mb-6">
              Comece cadastrando seu primeiro imóvel
            </p>
            <Link
              to="/admin/imovel/novo"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <Plus size={20} />
              Cadastrar Imóvel
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {imoveis.map((imovel) => (
              <div
                key={imovel.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Foto */}
                  <div className="md:w-64 h-48 md:h-auto bg-slate-200 flex-shrink-0">
                    <img
                      src={otimizarUrlCloudinary(obterFotoDestaque(imovel.fotos), { width: 700 })}
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

                  {/* Informações */}
                  <div className="flex-1 p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-block bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-display font-semibold">
                            #{imovel.id}
                          </span>
                          <span className={`inline-block ${imovel.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} px-3 py-1 rounded-full text-xs font-semibold`}>
                            {imovel.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                          <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                            {imovel.categoria} - {imovel.tipo}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">{imovel.titulo}</h3>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-600">{imovel.tipologia.tipoVenda}</div>
                        <div className="text-2xl font-bold text-blue-600 font-display">
                          {formatarMoeda(imovel.preco)}
                        </div>
                      </div>
                    </div>

                    <p className="text-slate-600 mb-3 line-clamp-2">{imovel.descricao}</p>

                    <div className="flex flex-wrap gap-2 text-sm text-slate-600 mb-4">
                      <span>📍 {imovel.endereco.bairro}, {imovel.endereco.cidade} - {imovel.endereco.estado}</span>
                      {imovel.fichaTecnica.quartos && <span>🛏️ {imovel.fichaTecnica.quartos} quartos</span>}
                      {imovel.fichaTecnica.banheiros && <span>🚿 {imovel.fichaTecnica.banheiros} banheiros</span>}
                      {imovel.fichaTecnica.areaTotal && <span>📐 {imovel.fichaTecnica.areaTotal}m²</span>}
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleAtivo(imovel)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          imovel.ativo
                            ? 'bg-orange-600 text-white hover:bg-orange-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                        title={imovel.ativo ? 'Desativar (ocultar do catálogo)' : 'Ativar (mostrar no catálogo)'}
                      >
                        {imovel.ativo ? <EyeOff size={16} /> : <Eye size={16} />}
                        {imovel.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                      <Link
                        to={`/admin/imovel/${imovel.id}`}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Edit size={16} />
                        Editar
                      </Link>
                      <button
                        onClick={() => handleRemover(imovel.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Trash2 size={16} />
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
