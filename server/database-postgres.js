import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

let isConnected = false;

export const initializeDatabase = async () => {
  try {
    if (!isConnected) {
      console.log('🔌 Conectando ao PostgreSQL...');
      await client.connect();
      isConnected = true;
      console.log('✓ PostgreSQL conectado');
    }
    
    console.log('📋 Criando tabelas...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS imoveis (
        id TEXT PRIMARY KEY,
        titulo TEXT NOT NULL,
        descricao TEXT,
        categoria TEXT NOT NULL,
        tipo TEXT NOT NULL,
        preco REAL NOT NULL,
        ativo BOOLEAN DEFAULT true,
        
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
        mobiliado BOOLEAN DEFAULT false,
        valorIptu REAL,
        valorItu REAL,
        
        escritorio BOOLEAN DEFAULT false,
        lavabo BOOLEAN DEFAULT false,
        despensa BOOLEAN DEFAULT false,
        areaServico BOOLEAN DEFAULT false,
        jardim BOOLEAN DEFAULT false,
        varandaGourmet BOOLEAN DEFAULT false,
        piscinaPrivativa BOOLEAN DEFAULT false,
        churrasqueiraPrivativa BOOLEAN DEFAULT false,
        
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
        seguranca24h BOOLEAN DEFAULT false,
        portaria BOOLEAN DEFAULT false,
        elevadorCondominio BOOLEAN DEFAULT false,
        quadraEsportiva BOOLEAN DEFAULT false,
        piscina BOOLEAN DEFAULT false,
        salaoDeFestas BOOLEAN DEFAULT false,
        churrasqueira BOOLEAN DEFAULT false,
        playground BOOLEAN DEFAULT false,
        academia BOOLEAN DEFAULT false,
        vagasVisitante BOOLEAN DEFAULT false,
        salaCinema BOOLEAN DEFAULT false,
        hortaComunitaria BOOLEAN DEFAULT false,
        areaGourmetChurrasqueira BOOLEAN DEFAULT false,
        miniMercado BOOLEAN DEFAULT false,
        portariaRemota BOOLEAN DEFAULT false,
        coworking BOOLEAN DEFAULT false,
        
        rio BOOLEAN DEFAULT false,
        piscinaRural BOOLEAN DEFAULT false,
        represa BOOLEAN DEFAULT false,
        lago BOOLEAN DEFAULT false,
        curral BOOLEAN DEFAULT false,
        estabulo BOOLEAN DEFAULT false,
        galinheiro BOOLEAN DEFAULT false,
        pocilga BOOLEAN DEFAULT false,
        silo BOOLEAN DEFAULT false,
        terraceamento BOOLEAN DEFAULT false,
        energia BOOLEAN DEFAULT false,
        agua BOOLEAN DEFAULT false,
        acessoAsfalto BOOLEAN DEFAULT false,
        casariao BOOLEAN DEFAULT false,
        areaAlqueires REAL,
        tipoAlqueire TEXT,
        valorItr REAL,
        
        tipoVenda TEXT,
        aceitaPermuta BOOLEAN DEFAULT false,
        aceitaFinanciamento BOOLEAN DEFAULT false,
        
        fotos TEXT,
        nomeDono TEXT,
        cpfDono TEXT,
        telefoneDono TEXT,
        emailDono TEXT,
        
        criadoEm TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        imovelId TEXT,
        imovelTitulo TEXT,
        clienteNome TEXT,
        clienteEmail TEXT,
        clienteTelefone TEXT,
        mensagem TEXT,
        visualizado BOOLEAN DEFAULT false,
        criadoEm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (imovelId) REFERENCES imoveis(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS contatos_cliente (
        id TEXT PRIMARY KEY,
        nome TEXT,
        email TEXT,
        telefone TEXT,
        criadoEm TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_imoveis_categoria ON imoveis(categoria);
      CREATE INDEX IF NOT EXISTS idx_imoveis_tipo ON imoveis(tipo);
      CREATE INDEX IF NOT EXISTS idx_imoveis_ativo ON imoveis(ativo);
      CREATE INDEX IF NOT EXISTS idx_leads_imovel ON leads(imovelId);
      CREATE INDEX IF NOT EXISTS idx_leads_visualizado ON leads(visualizado);
    `);
    
    console.log('✓ Database PostgreSQL inicializado');
  } catch (error) {
    console.error('Erro ao inicializar database:', error);
    throw error;
  }
};

// Funções de query para compatibilidade com SQLite
export const prepare = (sql) => {
  return {
    run: async (...params) => {
      const result = await client.query(sql, params);
      return result;
    },
    get: async (...params) => {
      const result = await client.query(sql, params);
      return result.rows[0];
    },
    all: async (...params) => {
      const result = await client.query(sql, params);
      return result.rows;
    }
  };
};

export default {
  prepare,
  query: (sql, params) => client.query(sql, params)
};
