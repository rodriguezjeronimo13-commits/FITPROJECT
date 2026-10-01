import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth';
import Layout from './components/Layout';
import PWABadge from './PWABadge.jsx';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Favorites from './pages/Favorites';
import Progress from './pages/Progress';
import Profile from './pages/Profile';
import FoodDetail from './pages/FoodDetail';
import Admin from './pages/Admin';

const TITLES = {
  '/': 'Menú de hoy',
  '/menu': 'Menú semanal',
  '/favoritos': 'Favoritos',
  '/progreso': 'Mi progreso',
  '/perfil': 'Perfil',
  '/admin': 'Administración',
};

function Protegida({ children, admin = false }) {
  const { usuario, listo } = useAuth();
  if (!listo) {
    return <div className="grid min-h-screen place-items-center bg-[#f4f7f2] text-sm text-[#687b73]">Cargando…</div>;
  }
  if (!usuario) return <Navigate to="/login" replace />;
  if (admin && usuario.rol !== 'administrador') return <Navigate to="/" replace />;
  return children;
}

function Shell({ children }) {
  const { pathname } = useLocation();
  const title = TITLES[pathname] || (pathname.startsWith('/alimento') ? 'Plato' : 'FitProject');
  return (
    <Layout title={title}>
      {children}
      <PWABadge />
    </Layout>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Register />} />
      <Route path="/" element={<Protegida><Shell><Home /></Shell></Protegida>} />
      <Route path="/menu" element={<Protegida><Shell><Menu /></Shell></Protegida>} />
      <Route path="/favoritos" element={<Protegida><Shell><Favorites /></Shell></Protegida>} />
      <Route path="/progreso" element={<Protegida><Shell><Progress /></Shell></Protegida>} />
      <Route path="/perfil" element={<Protegida><Shell><Profile /></Shell></Protegida>} />
      <Route path="/alimento/:id" element={<Protegida><Shell><FoodDetail /></Shell></Protegida>} />
      <Route path="/admin" element={<Protegida admin><Shell><Admin /></Shell></Protegida>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
