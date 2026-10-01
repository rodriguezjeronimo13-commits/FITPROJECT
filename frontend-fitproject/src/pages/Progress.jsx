import { useEffect, useState } from 'react';
import { api } from '../api';
import { formatNumber, todayISO } from '../lib/dates';

export default function Progress() {
  const [fecha, setFecha] = useState(todayISO());
  const [resumen, setResumen] = useState(null);
  const [historial, setHistorial] = useState(null);
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [actividad, setActividad] = useState({ id_actividad: '', duracion_minutos: 30 });
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  function cargar() {
    api(`/api/resumen?fecha=${fecha}`).then(setResumen).catch((err) => setError(err.message));
    api('/api/historial').then(setHistorial).catch((err) => setError(err.message));
    api('/api/recomendaciones', { auth: false }).then((data) => setRecomendaciones(data.recomendaciones)).catch(() => {});
    api('/api/actividades', { auth: false }).then((data) => {
      setActividades(data.actividades);
      setActividad((current) => ({
        ...current,
        id_actividad: current.id_actividad || data.actividades[0]?.id_actividad || '',
      }));
    }).catch(() => {});
  }

  useEffect(() => {
    cargar();
  }, [fecha]);

  async function agregarAgua(ml) {
    setError('');
    try {
      await api('/api/agua', { method: 'POST', body: { cantidad_ml: ml, fecha } });
      setMensaje(`Registraste ${ml} ml de agua.`);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function agregarActividad(event) {
    event.preventDefault();
    setError('');
    try {
      await api('/api/actividad', {
        method: 'POST',
        body: { ...actividad, duracion_minutos: Number(actividad.duracion_minutos), fecha },
      });
      setMensaje('Actividad registrada.');
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function quitarRegistro(id) {
    try {
      await api(`/api/registros/${id}`, { method: 'DELETE' });
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  const meta = resumen?.meta_calorias || 2000;
  const progreso = Math.min(100, Math.round(((resumen?.calorias || 0) / meta) * 100));

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl md:text-[46px] md:leading-none">Mi progreso</h1>
          <p className="mt-2 text-sm text-[#687b73]">Alimentación, agua y actividad del día.</p>
        </div>
        <input type="date" value={fecha} onChange={(event) => setFecha(event.target.value)} className="rounded-[14px] border border-[#dde6df] bg-white px-4 py-3 text-sm" />
      </div>
      {error && <p className="mt-4 text-sm text-[#9a3412]">{error}</p>}
      {mensaje && <p className="mt-4 text-sm text-[#187a57]">{mensaje}</p>}

      <section className="mt-6 rounded-[22px] bg-[#183b47] p-6 text-white">
        <div className="flex items-start justify-between">
          <p className="text-xl">Tu objetivo diario</p>
          <p className="text-sm text-[#b9e86a]">{formatNumber(resumen?.calorias)} / {formatNumber(meta)} kcal</p>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e7ece8]">
          <div className="h-2 rounded-full bg-[#b9e86a]" style={{ width: `${progreso}%` }} />
        </div>
        <p className="mt-4 text-sm text-[#c3d3d6]">
          Proteína {formatNumber(resumen?.proteinas)} g · Carbos {formatNumber(resumen?.carbohidratos)} g · Grasas {formatNumber(resumen?.grasas)} g
        </p>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-[22px] bg-white p-6">
          <h2 className="text-xl">Agua</h2>
          <p className="mt-1 text-sm text-[#687b73]">{formatNumber(resumen?.agua_ml)} ml registrados hoy. La meta sugerida es 2000 ml.</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eef4ea]">
            <div className="h-2 rounded-full bg-[#187a57]" style={{ width: `${Math.min(100, ((resumen?.agua_ml || 0) / 2000) * 100)}%` }} />
          </div>
          <div className="mt-4 flex gap-2">
            {[250, 500].map((ml) => (
              <button key={ml} type="button" onClick={() => agregarAgua(ml)} className="h-[46px] rounded-[14px] bg-[#187a57] px-4 text-sm text-white">
                + {ml} ml
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[22px] bg-white p-6">
          <h2 className="text-xl">Actividad física</h2>
          <p className="mt-1 text-sm text-[#687b73]">{resumen?.actividad_minutos || 0} minutos hoy.</p>
          <form onSubmit={agregarActividad} className="mt-4 grid gap-3">
            <select
              value={actividad.id_actividad}
              onChange={(event) => setActividad((current) => ({ ...current, id_actividad: event.target.value }))}
              className="rounded-[14px] border border-[#dde6df] px-4 py-3 text-sm"
            >
              {actividades.map((item) => <option key={item.id_actividad} value={item.id_actividad}>{item.nombre}</option>)}
            </select>
            <input
              type="number"
              min="5"
              max="300"
              value={actividad.duracion_minutos}
              onChange={(event) => setActividad((current) => ({ ...current, duracion_minutos: event.target.value }))}
              className="rounded-[14px] border border-[#dde6df] px-4 py-3 text-sm"
              aria-label="Minutos"
            />
            <button type="submit" className="h-[46px] rounded-[14px] bg-[#187a57] text-sm text-white">Registrar actividad</button>
          </form>
        </section>
      </div>

      <section className="mt-4 rounded-[22px] bg-white p-6">
        <h2 className="text-xl">Alimentos del día</h2>
        <ul className="mt-4 flex flex-col gap-3">
          {(resumen?.registros || []).map((item) => (
            <li key={item.id_registro} className="flex items-center justify-between gap-3 text-sm">
              <span className="capitalize">{item.momento} · {item.nombre} · {formatNumber(item.calorias)} kcal</span>
              <button type="button" onClick={() => quitarRegistro(item.id_registro)} className="text-[#9a3412]">Quitar</button>
            </li>
          ))}
          {!resumen?.registros?.length && <li className="text-sm text-[#687b73]">Todavía no registras alimentos en esta fecha.</li>}
        </ul>
      </section>

      <section className="mt-4 rounded-[22px] bg-white p-6">
        <h2 className="text-xl">Historial</h2>
        <div className="mt-4 grid gap-6 md:grid-cols-3">
          <History title="Alimentación" rows={(historial?.alimentacion || []).map((row) => `${row.fecha}: ${formatNumber(row.calorias)} kcal`)} />
          <History title="Agua" rows={(historial?.agua || []).map((row) => `${row.fecha}: ${formatNumber(row.ml)} ml`)} />
          <History title="Actividad" rows={(historial?.actividad || []).map((row) => `${row.fecha}: ${row.minutos} min`)} />
        </div>
      </section>

      <section className="mt-4 rounded-[22px] bg-[#eef4ea] p-6">
        <h2 className="text-xl">Recomendaciones</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {recomendaciones.map((item) => (
            <article key={item.id_recomendacion}>
              <p className="text-xs uppercase text-[#187a57]">{item.categoria}</p>
              <h3 className="mt-1 text-lg">{item.titulo}</h3>
              <p className="mt-1 text-sm text-[#687b73]">{item.contenido}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function History({ title, rows }) {
  return (
    <div>
      <h3 className="text-sm text-[#17352c]">{title}</h3>
      <ul className="mt-2 flex flex-col gap-1 text-sm text-[#687b73]">
        {rows.slice(0, 7).map((row) => <li key={row}>{row}</li>)}
        {!rows.length && <li>Sin registros.</li>}
      </ul>
    </div>
  );
}
