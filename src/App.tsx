import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ImoveisProvider } from './contexts/ImoveisContext';
import { Catalogo } from './pages/Catalogo';
import { DetalhesImovel } from './pages/DetalhesImovel';
import { Admin } from './pages/Admin';
import { GerenciamentoImoveis } from './pages/GerenciamentoImoveis';
import { Leads } from './pages/Leads';

function App() {
  return (
    <ImoveisProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Catalogo />} />
          <Route path="/imovel/:id" element={<DetalhesImovel />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/leads" element={<Leads />} />
          <Route path="/admin/imovel/novo" element={<GerenciamentoImoveis />} />
          <Route path="/admin/imovel/:id" element={<GerenciamentoImoveis />} />
        </Routes>
      </Router>
    </ImoveisProvider>
  );
}

export default App;
