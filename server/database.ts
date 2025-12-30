import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'portal_imobiliario.db');
const dbInstance = new Database(dbPath);

dbInstance.pragma('journal_mode = WAL');

const prepare = (sql: string) => {
  const stmt = dbInstance.prepare(sql);
  
  const get = async (...params: any[]) => {
    return stmt.get(...params);
  };
  
  const all = async (...params: any[]) => {
    return stmt.all(...params);
  };
  
  const run = async (...params: any[]) => {
    return stmt.run(...params);
  };
  
  return { get, all, run };
};

const db = {
  exec: (sql: string) => dbInstance.exec(sql),
  prepare,
};


export const initializeDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS imoveis (
      id TEXT PRIMARY KEY,
      titulo TEXT NOT NULL,
      descricao TEXT,
      categoria TEXT NOT NULL,
      tipo TEXT NOT NULL,
      preco REAL NOT NULL,
      ativo BOOLEAN DEFAULT 1,
      
      endereco_logradouro TEXT,
      endereco_numero TEXT,
      endereco_bairro TEXT,
      endereco_cidade TEXT,
      endereco_estado TEXT,
      endereco_cep TEXT,
      endereco_complemento TEXT,
      
      quartos INTEGER,
      suites INTEGER,
      banheiros INTEGER,
      vagasGaragem INTEGER,
      areaTotal REAL,
      areaConstruida REAL,
      anoConstructao INTEGER,
      mobiliado BOOLEAN DEFAULT 0,
      valorIptu REAL,
      valorItu REAL,
      
      escritorio BOOLEAN DEFAULT 0,
      lavabo BOOLEAN DEFAULT 0,
      despensa BOOLEAN DEFAULT 0,
      areaServico BOOLEAN DEFAULT 0,
      jardim BOOLEAN DEFAULT 0,
      varandaGourmet BOOLEAN DEFAULT 0,
      piscinaPrivativa BOOLEAN DEFAULT 0,
      churrasqueiraPrivativa BOOLEAN DEFAULT 0,
      
      numeroApartamento TEXT,
      andar TEXT,
      blocoTorre TEXT,
      nomeEmpreendimento TEXT,
      elevador BOOLEAN,
      fachada TEXT,
      
      nomeEmpreendimentoLote TEXT,
      quadraLote TEXT,
      loteLote TEXT,
      
      valorCondominio REAL,
      seguranca24h BOOLEAN DEFAULT 0,
      portaria BOOLEAN DEFAULT 0,
      elevadorCondominio BOOLEAN DEFAULT 0,
      quadraEsportiva BOOLEAN DEFAULT 0,
      piscina BOOLEAN DEFAULT 0,
      salaoDeFestas BOOLEAN DEFAULT 0,
      churrasqueira BOOLEAN DEFAULT 0,
      playground BOOLEAN DEFAULT 0,
      academia BOOLEAN DEFAULT 0,
      vagasVisitante BOOLEAN DEFAULT 0,
      salaCinema BOOLEAN DEFAULT 0,
      hortaComunitaria BOOLEAN DEFAULT 0,
      areaGourmetChurrasqueira BOOLEAN DEFAULT 0,
      miniMercado BOOLEAN DEFAULT 0,
      portariaRemota BOOLEAN DEFAULT 0,
      coworking BOOLEAN DEFAULT 0,
      
      rio BOOLEAN DEFAULT 0,
      piscinaRural BOOLEAN DEFAULT 0,
      represa BOOLEAN DEFAULT 0,
      lago BOOLEAN DEFAULT 0,
      curral BOOLEAN DEFAULT 0,
      estabulo BOOLEAN DEFAULT 0,
      galinheiro BOOLEAN DEFAULT 0,
      pocilga BOOLEAN DEFAULT 0,
      silo BOOLEAN DEFAULT 0,
      terraceamento BOOLEAN DEFAULT 0,
      energia BOOLEAN DEFAULT 0,
      agua BOOLEAN DEFAULT 0,
      acessoAsfalto BOOLEAN DEFAULT 0,
      casariao BOOLEAN DEFAULT 0,
      areaAlqueires REAL,
      tipoAlqueire TEXT,
      valorItr REAL,
      
      tipoVenda TEXT,
      aceitaPermuta BOOLEAN DEFAULT 0,
      aceitaFinanciamento BOOLEAN DEFAULT 0,
      
      fotos TEXT DEFAULT '[]',
      
      nomeDono TEXT,
      cpfDono TEXT,
      telefoneDono TEXT,
      emailDono TEXT,
      
      criadoEm DATETIME DEFAULT CURRENT_TIMESTAMP,
      atualizadoEm DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      imovelId TEXT NOT NULL,
      imovelTitulo TEXT,
      mensagem TEXT,
      nomeCliente TEXT NOT NULL,
      telefoneCliente TEXT NOT NULL,
      emailCliente TEXT NOT NULL,
      visualizado BOOLEAN DEFAULT 0,
      criadoEm DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(imovelId) REFERENCES imoveis(id) ON DELETE CASCADE
    );
    
    CREATE TABLE IF NOT EXISTS contatos_cliente (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      telefone TEXT NOT NULL,
      email TEXT NOT NULL,
      criadoEm DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TRIGGER IF NOT EXISTS update_imoveis_atualizadoEm
    AFTER UPDATE ON imoveis
    FOR EACH ROW
    BEGIN
        UPDATE imoveis SET atualizadoEm = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;

    CREATE INDEX IF NOT EXISTS idx_imoveis_categoria ON imoveis(categoria);
    CREATE INDEX IF NOT EXISTS idx_imoveis_tipo ON imoveis(tipo);
    CREATE INDEX IF NOT EXISTS idx_imoveis_ativo ON imoveis(ativo);
    CREATE INDEX IF NOT EXISTS idx_leads_imovelId ON leads(imovelId);
    CREATE INDEX IF NOT EXISTS idx_leads_visualizado ON leads(visualizado);
  `);
};

export default db;
