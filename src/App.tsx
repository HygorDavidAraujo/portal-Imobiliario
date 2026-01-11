
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ImoveisProvider } from './contexts/ImoveisContext';
import { Catalogo } from './pages/Catalogo';
import { DetalhesImovel } from './pages/DetalhesImovel';
import { Admin } from './pages/Admin';
import { GerenciamentoImoveis } from './pages/GerenciamentoImoveis';
import { Leads } from './pages/Leads';
import { AdminLogin } from './pages/AdminLogin';

// Rota protegida para admin
function PrivateRoute({ children }: { children: JSX.Element }) {
  const session = localStorage.getItem('adminSession');
  const token = localStorage.getItem('adminToken');
  let valid = false;
  if (session && token) {
    try {
      const { expires } = JSON.parse(session);
      valid = Date.now() < expires;
    } catch {}
  }
  return valid ? children : <Navigate to="/admin/login" replace />;
}

function App() {
  return (
    <ImoveisProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Catalogo />} />
          <Route path="/imovel/:id" element={<DetalhesImovel />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
          <Route path="/admin/leads" element={<PrivateRoute><Leads /></PrivateRoute>} />
          <Route path="/admin/imovel/novo" element={<PrivateRoute><GerenciamentoImoveis /></PrivateRoute>} />
          <Route path="/admin/imovel/:id" element={<PrivateRoute><GerenciamentoImoveis /></PrivateRoute>} />
        </Routes>
      </Router>
    </ImoveisProvider>
  );
}

export default App;
