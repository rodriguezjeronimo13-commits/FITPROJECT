import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import Icon from '../components/Icon';
import Nutrient from '../components/Nutrient';
import { eyebrowDate, formatNumber, SEDES, shiftDate, shortDate, todayISO } from '../lib/dates';

const REQUISITOS = {
  funcionales: [
    'Consultar el menú por fecha y sede',
    'Ver calorías, proteínas y carbohidratos',
    'Mostrar un índice de qué tan saludable es',
    'Guardar platos favoritos y alertas de alérgenos',
  ],
  noFuncionales: [
    'PWA instalable con acceso sin conexión',
    'Diseño responsive y accesible',
    'Carga principal menor a 2 segundos',
    'Datos cifrados y privacidad del estudiante',
  ],
};

export default function Home() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const hoy = todayISO();
  const [fecha, setFecha] = useState(hoy);
  const [sede, setSede] = useState(usuario?.sede || 'Cafetería Central');
  const [menu, setMenu] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (usuario?.sede) setSede(usuario.sede);
  }, [usuario]);

  useEffect(() => {
    let activo = true;
    setError('');
    api(`/api/menu?sede=${encodeURIComponent(sede)}`)
      .then((data) => {
        if (activo) setMenu(data);
      })
      .catch((err) => {
        if (activo) setError(err.message);
      });
    api(`/api/resumen?fecha=${fecha}`)
      .then((data) => {
        if (activo) setResumen(data);
      })
      .catch((err) => {
        if (activo) setError(err.message);
      });
    return () => {
      activo = false;
    };
  }, [sede, fecha]);

  const plato = menu?.destacado;
  const meta = resumen?.meta_calorias || usuario?.meta_calorias || 2000;
  const calorias = resumen?.calorias || 0;
  const progreso = Math.min(100, Math.round((calorias / meta) * 100));
  const aviso = menu?.avisoAlergenos;

  async function toggleFavorito() {
    if (!plato) return;
    try {
      if (plato.favorito) await api(`/api/favoritos/${plato.id_alimento}`, { method: 'DELETE' });
      else await api(`/api/favoritos/${plato.id_alimento}`, { method: 'POST' });
      setMenu((current) => ({
        ...current,
        destacado: { ...current.destacado, favorito: !current.destacado.favorito },
      }));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between md:hidden">
        <button type="button" aria-label="Día anterior" onClick={() => setFecha((value) => shiftDate(value, -1))} className="flex size-[34px] items-center justify-center rounded-full bg-white">
          <Icon name="chevron-left" size={16} />
        </button>
        <div className="text-center">
          <p className="text-base">{shortDate(fecha, hoy)}</p>
          <p className="text-xs text-[#687b73]">{sede}</p>
        </div>
        <button type="button" aria-label="Día siguiente" onClick={() => setFecha((value) => shiftDate(value, 1))} className="flex size-[34px] items-center justify-center rounded-full bg-white">
          <Icon name="chevron-right" size={16} />
        </button>
      </div>

      <div className="mb-8 hidden items-end justify-between md:flex">
        <div>
          <p className="text-sm text-[#187a57]">{eyebrowDate(fecha)}</p>
          <h1 className="mt-2 text-[46px] leading-none text-[#17352c]">¿Qué comerás hoy?</h1>
          <p className="mt-2 text-base text-[#687b73]">Descubre el menú del campus y elige con información clara.</p>
        </div>
        <label className="flex items-center gap-2 rounded-[14px] border border-[#dde6df] bg-white px-4 py-3 text-sm">
          <Icon name="map-pin" size={18} />
          <select
            value={sede}
            onChange={(event) => setSede(event.target.value)}
            className="bg-transparent outline-none"
            aria-label="Sede"
          >
            {SEDES.map((item) => <option key={item}>{item}</option>)}
          </select>
          <Icon name="chevron-down" size={16} />
        </label>
      </div>

      {error && <p className="mb-4 text-sm text-[#9a3412]">{error}</p>}

      {plato && (
        <>
          <article className="hidden overflow-hidden rounded-[22px] bg-white shadow-[0_8px_24px_rgba(23,53,44,0.08)] md:flex">
            <MealImage alimento={plato} className="h-[410px] w-[min(510px,42%)] shrink-0 object-cover" />
            <div className="flex flex-1 flex-col gap-[22px] p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase text-[#187a57]">{plato.momento} · {plato.horario}</p>
                  <h2 className="mt-2 max-w-[470px] text-[30px] leading-tight">{plato.nombre}</h2>
                </div>
                <span className="flex items-center gap-2 rounded-full bg-[#eef4ea] px-3 py-2 text-xs text-[#0e5b3f]">
                  <Icon name="status" size={9} />
                  {plato.puntaje}/100 · {plato.etiqueta}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-[#687b73]">{plato.descripcion}</p>
              <div className="flex gap-3">
                <Nutrient kind="calorias" label="Calorías" value={`${formatNumber(plato.calorias)} kcal`} />
                <Nutrient kind="proteinas" label="Proteínas" value={`${formatNumber(plato.proteinas)} g`} />
                <Nutrient kind="carbohidratos" label="Carbohidratos" value={`${formatNumber(plato.carbohidratos)} g`} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => navigate(`/alimento/${plato.id_alimento}`)} className="h-[46px] w-[190px] rounded-[14px] bg-[#187a57] text-sm text-white">
                  Ver plato completo
                </button>
                <button type="button" aria-label="Favorito" onClick={toggleFavorito} className="flex size-[46px] items-center justify-center rounded-[14px] border border-[#dde6df]">
                  <Icon name="heart" size={20} />
                </button>
              </div>
            </div>
          </article>

          <article className="overflow-hidden rounded-[22px] bg-white shadow-[0_8px_24px_rgba(23,53,44,0.08)] md:hidden">
            <div className="relative h-[214px]">
              <MealImage alimento={plato} className="h-full w-full object-cover" />
              <span className="absolute left-3.5 top-3.5 rounded-full bg-white/90 px-3 py-1.5 text-xs uppercase text-[#187a57]">
                {plato.momento}
              </span>
            </div>
            <div className="flex flex-col gap-3.5 p-[18px]">
              <div className="flex items-start justify-between gap-3">
                <h2 className="max-w-[210px] text-2xl leading-tight">{plato.nombre}</h2>
                <button type="button" aria-label="Favorito" onClick={toggleFavorito} className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-[#eef4ea]">
                  <Icon name="heart" size={18} />
                </button>
              </div>
              <span className="flex w-fit items-center gap-2 rounded-full bg-[#eef4ea] px-3 py-2 text-xs text-[#0e5b3f]">
                <Icon name="status" size={9} />
                {plato.puntaje}/100 · {plato.etiqueta}
              </span>
              <div className="flex gap-2">
                <Nutrient kind="calorias" label="Calorías" value={formatNumber(plato.calorias)} />
                <Nutrient kind="proteinas" label="Proteína" value={`${formatNumber(plato.proteinas)} g`} />
                <Nutrient kind="carbohidratos" label="Carbos" value={`${formatNumber(plato.carbohidratos)} g`} />
              </div>
              <p className="text-xs leading-relaxed text-[#687b73]">{plato.descripcion}</p>
              <button type="button" onClick={() => navigate(`/alimento/${plato.id_alimento}`)} className="h-[46px] rounded-[14px] bg-[#187a57] text-sm text-white">
                Ver plato completo
              </button>
            </div>
          </article>
        </>
      )}

      <section className="mt-6 flex flex-col gap-4 lg:flex-row">
        <div className="flex-1 rounded-[22px] bg-[#183b47] p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <p className="text-xl">Tu objetivo diario</p>
            <p className="text-sm text-[#b9e86a]">{formatNumber(calorias)} / {formatNumber(meta)} kcal</p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e7ece8]">
            <div className="h-2 rounded-full bg-[#b9e86a]" style={{ width: `${progreso}%` }} />
          </div>
          <p className="mt-3 text-xs text-[#c3d3d6]">
            {calorias >= meta
              ? 'Alcanzaste la meta de hoy.'
              : `Vas por buen camino. Te quedan ${formatNumber(resumen?.restante || meta)} kcal para hoy.`}
          </p>
        </div>
        <div className="flex gap-3.5 rounded-[22px] bg-[#fff7e8] p-6 lg:w-[380px]">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#ffe8b8]">
            <Icon name="shield" size={20} />
          </span>
          <div>
            <p className="text-sm">{aviso?.seguro === false ? 'Revisa tus alérgenos' : 'Sin tus alérgenos'}</p>
            <p className="mt-1 text-xs leading-relaxed text-[#687b73]">
              {aviso?.texto || 'Registra tus alérgenos en el perfil para personalizar este aviso.'}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10 hidden md:block">
        <h2 className="text-[30px]">Requisitos del producto</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <RequirementCard title="Requisitos funcionales" items={REQUISITOS.funcionales} soft={false} />
          <RequirementCard title="Requisitos no funcionales" items={REQUISITOS.noFuncionales} soft />
        </div>
      </section>
    </div>
  );
}

function MealImage({ alimento, className }) {
  if (alimento.imagen) {
    return <img src={alimento.imagen} alt={alimento.nombre} className={className} />;
  }
  return (
    <div className={`${className} flex items-center justify-center bg-[#187a57] text-5xl text-white`}>
      {alimento.nombre.charAt(0)}
    </div>
  );
}

function RequirementCard({ title, items, soft }) {
  return (
    <div className={`rounded-[22px] border border-[#dde6df] p-6 ${soft ? 'bg-[#eef4ea]' : 'bg-white'}`}>
      <h3 className="text-xl">{title}</h3>
      <ul className="mt-4 flex flex-col gap-4">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2.5 text-sm text-[#687b73]">
            <Icon name="check" size={20} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
