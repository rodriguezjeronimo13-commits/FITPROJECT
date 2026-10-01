import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import Icon from '../components/Icon';
import Nutrient from '../components/Nutrient';
import { formatNumber, MOMENTO_LABEL, todayISO } from '../lib/dates';

export default function FoodDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [alimento, setAlimento] = useState(null);
  const [form, setForm] = useState({ cantidad: 1, momento: 'almuerzo', fecha: todayISO() });
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/api/alimentos/${id}`)
      .then((data) => {
        setAlimento(data.alimento);
        setForm((current) => ({ ...current, momento: data.alimento.momento }));
      })
      .catch((err) => setError(err.message));
  }, [id]);

  async function toggleFavorito() {
    try {
      if (alimento.favorito) await api(`/api/favoritos/${alimento.id_alimento}`, { method: 'DELETE' });
      else await api(`/api/favoritos/${alimento.id_alimento}`, { method: 'POST' });
      setAlimento((current) => ({ ...current, favorito: !current.favorito }));
    } catch (err) {
      setError(err.message);
    }
  }

  async function registrar(event) {
    event.preventDefault();
    setError('');
    setMensaje('');
    try {
      await api('/api/registros', {
        method: 'POST',
        body: { id_alimento: Number(id), cantidad: Number(form.cantidad), momento: form.momento, fecha: form.fecha },
      });
      setMensaje('Alimento registrado en tu día.');
    } catch (err) {
      setError(err.message);
    }
  }

  if (!alimento) {
    return <p className="text-sm text-[#687b73]">{error || 'Cargando plato…'}</p>;
  }

  const factor = Number(form.cantidad) || 1;

  return (
    <div>
      <button type="button" onClick={() => navigate(-1)} className="mb-4 text-sm text-[#187a57]">Volver</button>
      <article className="overflow-hidden rounded-[22px] bg-white shadow-[0_8px_24px_rgba(23,53,44,0.08)]">
        {alimento.imagen ? (
          <img src={alimento.imagen} alt={alimento.nombre} className="h-64 w-full object-cover md:h-[360px]" />
        ) : (
          <div className="flex h-64 items-center justify-center bg-[#187a57] text-6xl text-white md:h-[360px]">
            {alimento.nombre.charAt(0)}
          </div>
        )}
        <div className="p-6 md:p-8">
          <p className="text-xs uppercase text-[#187a57]">{alimento.momento} · {alimento.horario} · {alimento.sede}</p>
          <div className="mt-2 flex items-start justify-between gap-4">
            <h1 className="text-3xl md:text-[40px] md:leading-tight">{alimento.nombre}</h1>
            <button type="button" aria-label="Favorito" onClick={toggleFavorito} className="flex size-[46px] items-center justify-center rounded-[14px] border border-[#dde6df]">
              <Icon name="heart" size={20} />
            </button>
          </div>
          <span className="mt-4 flex w-fit items-center gap-2 rounded-full bg-[#eef4ea] px-3 py-2 text-xs text-[#0e5b3f]">
            <Icon name="status" size={9} />
            {alimento.puntaje}/100 · {alimento.etiqueta}
          </span>
          <p className="mt-4 text-sm leading-relaxed text-[#687b73]">{alimento.descripcion}</p>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Nutrient kind="calorias" label="Calorías" value={`${formatNumber(alimento.calorias * factor)} kcal`} />
            <Nutrient kind="proteinas" label="Proteínas" value={`${formatNumber(alimento.proteinas * factor)} g`} />
            <Nutrient kind="carbohidratos" label="Carbohidratos" value={`${formatNumber(alimento.carbohidratos * factor)} g`} />
            <div className="flex flex-col gap-2 rounded-[14px] border border-[#dde6df] p-4">
              <p className="text-right text-xl">{formatNumber(alimento.grasas * factor)} g</p>
              <p className="text-xs text-[#687b73]">Grasas</p>
            </div>
          </div>
          {alimento.alergenos && <p className="mt-4 text-sm text-[#687b73]">Alérgenos: {alimento.alergenos}</p>}

          <form onSubmit={registrar} className="mt-6 grid gap-3 md:grid-cols-4">
            <label className="text-sm">
              Porciones
              <input type="number" min="0.5" max="20" step="0.5" value={form.cantidad} onChange={(event) => setForm({ ...form, cantidad: event.target.value })} className="mt-2 w-full rounded-[14px] border border-[#dde6df] px-4 py-3" />
            </label>
            <label className="text-sm">
              Momento
              <select value={form.momento} onChange={(event) => setForm({ ...form, momento: event.target.value })} className="mt-2 w-full rounded-[14px] border border-[#dde6df] px-4 py-3">
                {Object.entries(MOMENTO_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="text-sm">
              Fecha
              <input type="date" value={form.fecha} onChange={(event) => setForm({ ...form, fecha: event.target.value })} className="mt-2 w-full rounded-[14px] border border-[#dde6df] px-4 py-3" />
            </label>
            <button type="submit" className="mt-7 h-[46px] rounded-[14px] bg-[#187a57] text-sm text-white">Registrar consumo</button>
          </form>
          {error && <p className="mt-4 text-sm text-[#9a3412]">{error}</p>}
          {mensaje && <p className="mt-4 text-sm text-[#187a57]">{mensaje}</p>}
        </div>
      </article>
    </div>
  );
}
