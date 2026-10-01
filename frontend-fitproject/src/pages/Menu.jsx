import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import Nutrient from '../components/Nutrient';
import { formatNumber, MOMENTO_LABEL, SEDES } from '../lib/dates';

export default function Menu() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [sede, setSede] = useState('');
  const [momento, setMomento] = useState('');
  const [alimentos, setAlimentos] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (sede) params.set('sede', sede);
    if (momento) params.set('momento', momento);
    const timer = setTimeout(() => {
      api(`/api/alimentos?${params.toString()}`)
        .then((data) => setAlimentos(data.alimentos))
        .catch((err) => setError(err.message));
    }, 250);
    return () => clearTimeout(timer);
  }, [q, sede, momento]);

  const grupos = ['desayuno', 'almuerzo', 'merienda', 'cena']
    .map((key) => ({ key, items: alimentos.filter((item) => item.momento === key) }))
    .filter((group) => group.items.length);

  return (
    <div>
      <h1 className="text-3xl md:text-[46px] md:leading-none">Menú semanal</h1>
      <p className="mt-2 text-sm text-[#687b73]">Busca un alimento y revisa calorías, proteínas y carbohidratos.</p>
      <div className="mt-6 grid gap-3 md:grid-cols-[1fr_220px_180px]">
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Buscar alimento"
          className="rounded-[14px] border border-[#dde6df] bg-white px-4 py-3 text-sm outline-none focus:border-[#187a57]"
        />
        <select value={sede} onChange={(event) => setSede(event.target.value)} className="rounded-[14px] border border-[#dde6df] bg-white px-4 py-3 text-sm">
          <option value="">Todas las sedes</option>
          {SEDES.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={momento} onChange={(event) => setMomento(event.target.value)} className="rounded-[14px] border border-[#dde6df] bg-white px-4 py-3 text-sm">
          <option value="">Todo el día</option>
          {Object.entries(MOMENTO_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      {error && <p className="mt-4 text-sm text-[#9a3412]">{error}</p>}
      <div className="mt-8 flex flex-col gap-8">
        {grupos.map((group) => (
          <section key={group.key}>
            <h2 className="text-xl capitalize">{MOMENTO_LABEL[group.key]}</h2>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {group.items.map((item) => (
                <button
                  key={item.id_alimento}
                  type="button"
                  onClick={() => navigate(`/alimento/${item.id_alimento}`)}
                  className="rounded-[22px] bg-white p-5 text-left shadow-[0_8px_24px_rgba(23,53,44,0.08)]"
                >
                  <p className="text-xs uppercase text-[#187a57]">{item.sede} · {item.horario}</p>
                  <h3 className="mt-1 text-2xl">{item.nombre}</h3>
                  <p className="mt-2 text-sm text-[#687b73]">{item.descripcion}</p>
                  <div className="mt-4 flex gap-2">
                    <Nutrient kind="calorias" label="Calorías" value={formatNumber(item.calorias)} />
                    <Nutrient kind="proteinas" label="Proteína" value={`${formatNumber(item.proteinas)} g`} />
                    <Nutrient kind="carbohidratos" label="Carbos" value={`${formatNumber(item.carbohidratos)} g`} />
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}
        {!grupos.length && <p className="text-sm text-[#687b73]">No hay alimentos con esa búsqueda.</p>}
      </div>
    </div>
  );
}
