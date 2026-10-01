import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { formatNumber } from '../lib/dates';

export default function Favorites() {
  const navigate = useNavigate();
  const [alimentos, setAlimentos] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/favoritos')
      .then((data) => setAlimentos(data.alimentos))
      .catch((err) => setError(err.message));
  }, []);

  async function quitar(id) {
    try {
      await api(`/api/favoritos/${id}`, { method: 'DELETE' });
      setAlimentos((current) => current.filter((item) => item.id_alimento !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1 className="text-3xl md:text-[46px] md:leading-none">Mis favoritos</h1>
      <p className="mt-2 text-sm text-[#687b73]">Platos que guardaste para volver a ellos rápido.</p>
      {error && <p className="mt-4 text-sm text-[#9a3412]">{error}</p>}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {alimentos.map((item) => (
          <article key={item.id_alimento} className="rounded-[22px] bg-white p-5 shadow-[0_8px_24px_rgba(23,53,44,0.08)]">
            <p className="text-xs uppercase text-[#187a57]">{item.puntaje}/100 · {item.etiqueta}</p>
            <h2 className="mt-1 text-2xl">{item.nombre}</h2>
            <p className="mt-2 text-sm text-[#687b73]">{item.descripcion}</p>
            <p className="mt-3 text-sm">{formatNumber(item.calorias)} kcal · {formatNumber(item.proteinas)} g proteína</p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => navigate(`/alimento/${item.id_alimento}`)} className="h-[46px] rounded-[14px] bg-[#187a57] px-4 text-sm text-white">
                Ver plato
              </button>
              <button type="button" onClick={() => quitar(item.id_alimento)} className="h-[46px] rounded-[14px] border border-[#dde6df] px-4 text-sm">
                Quitar
              </button>
            </div>
          </article>
        ))}
      </div>
      {!alimentos.length && !error && <p className="mt-8 text-sm text-[#687b73]">Aún no tienes favoritos.</p>}
    </div>
  );
}
