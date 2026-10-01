import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Icon from './Icon';
import { api } from '../api';
import { useAuth } from '../auth';

const DESKTOP_LINKS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/menu', label: 'Menú semanal' },
  { to: '/favoritos', label: 'Mis favoritos' },
  { to: '/progreso', label: 'Mi progreso' },
];

const MOBILE_LINKS = [
  { to: '/', label: 'Inicio', icon: 'home', end: true },
  { to: '/menu', label: 'Menú', icon: 'calendar' },
  { to: '/favoritos', label: 'Favoritos', icon: 'heart-nav' },
  { to: '/perfil', label: 'Perfil', icon: 'user-nav' },
];

export default function Layout({ children, title = 'Menú de hoy' }) {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [avisos, setAvisos] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const inicial = (usuario?.nombre || 'U').trim().charAt(0).toUpperCase();

  useEffect(() => {
    api('/api/recomendaciones', { auth: false })
      .then((data) => setAvisos(data.recomendaciones.slice(0, 3)))
      .catch(() => setAvisos([]));
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f7f2] text-[#17352c]">
      <header className="hidden h-[76px] items-center justify-between border-b border-[#dde6df] bg-white px-8 lg:px-16 md:flex">
        <button type="button" onClick={() => navigate('/')} className="flex items-center gap-2">
          <img src="/images/emblem.png" alt="" className="size-11 rounded-[14px] object-cover" />
          <span className="text-xl">FitProject</span>
        </button>
        <nav className="flex items-center gap-8 text-sm">
          {DESKTOP_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => (isActive ? 'text-[#187a57]' : 'text-[#687b73]')}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <button
              type="button"
              aria-label="Recomendaciones"
              onClick={() => setAbierto((value) => !value)}
              className="flex size-[38px] items-center justify-center rounded-full bg-[#eef4ea]"
            >
              <Icon name="bell" size={20} alt="" />
            </button>
            {abierto && (
              <div className="absolute right-0 z-20 mt-2 w-80 rounded-[22px] border border-[#dde6df] bg-white p-4 shadow-[0_8px_24px_rgba(23,53,44,0.08)]">
                <p className="mb-3 text-sm text-[#17352c]">Recomendaciones</p>
                <div className="flex flex-col gap-3">
                  {avisos.map((item) => (
                    <button
                      key={item.id_recomendacion}
                      type="button"
                      className="text-left"
                      onClick={() => {
                        setAbierto(false);
                        navigate('/progreso');
                      }}
                    >
                      <p className="text-sm text-[#17352c]">{item.titulo}</p>
                      <p className="text-xs text-[#687b73]">{item.categoria}</p>
                    </button>
                  ))}
                  {!avisos.length && <p className="text-sm text-[#687b73]">No hay avisos por ahora.</p>}
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => navigate('/perfil')}
            className="flex size-[38px] items-center justify-center rounded-full bg-[#183b47] text-sm text-white"
            aria-label="Perfil"
          >
            {inicial}
          </button>
        </div>
      </header>

      <header className="flex h-[68px] items-center justify-between bg-white px-5 md:hidden">
        <button type="button" onClick={() => navigate('/')} aria-label="Inicio">
          <img src="/images/emblem.png" alt="FitProject" className="size-9 rounded-[14px] object-cover" />
        </button>
        <p className="text-base">{title}</p>
        <button
          type="button"
          onClick={() => navigate('/perfil')}
          className="flex size-9 items-center justify-center rounded-full bg-[#eef4ea]"
          aria-label="Perfil"
        >
          <Icon name="user" size={18} alt="" />
        </button>
      </header>

      <main className="mx-auto w-full max-w-[1368px] px-4 pb-28 pt-4 md:px-8 md:pb-16 md:pt-8 lg:px-16">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 flex items-center justify-between border-t border-[#dde6df] bg-white px-6 py-3 md:hidden">
        {MOBILE_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className="flex w-16 flex-col items-center gap-1"
          >
            {({ isActive }) => (
              <>
                <Icon name={link.icon} size={20} />
                <span className={`text-[10px] ${isActive ? 'text-[#187a57]' : 'text-[#687b73]'}`}>
                  {link.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
