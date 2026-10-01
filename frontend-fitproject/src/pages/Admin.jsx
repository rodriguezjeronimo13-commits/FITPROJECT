import { useEffect, useState } from 'react';
import { api } from '../api';
import { MOMENTO_LABEL, SEDES, todayISO } from '../lib/dates';

const EMPTY_FOOD = {
  nombre: '',
  id_categoria: '',
  calorias: '',
  proteinas: '',
  carbohidratos: '',
  grasas: '',
  descripcion: '',
  momento: 'almuerzo',
  horario: '12:00—15:00',
  sede: 'Cafetería Central',
  alergenos: '',
};

export default function Admin() {
  const [tab, setTab] = useState('alimentos');
  const [alimentos, setAlimentos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [food, setFood] = useState(EMPTY_FOOD);
  const [editId, setEditId] = useState(null);
  const [reco, setReco] = useState({ titulo: '', contenido: '', categoria: 'Alimentación', fecha_publicacion: todayISO() });
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  async function cargar() {
    const [foods, cats, users, tips] = await Promise.all([
      api('/api/alimentos'),
      api('/api/categorias'),
      api('/api/admin/usuarios'),
      api('/api/recomendaciones'),
    ]);
    setAlimentos(foods.alimentos);
    setCategorias(cats.categorias);
    setUsuarios(users.usuarios);
    setRecomendaciones(tips.recomendaciones);
    setFood((current) => ({ ...current, id_categoria: current.id_categoria || cats.categorias[0]?.id_categoria || '' }));
  }

  useEffect(() => {
    cargar().catch((err) => setError(err.message));
  }, []);

  async function guardarAlimento(event) {
    event.preventDefault();
    setError('');
    setMensaje('');
    const body = {
      ...food,
      id_categoria: Number(food.id_categoria),
      calorias: Number(food.calorias),
      proteinas: Number(food.proteinas),
      carbohidratos: Number(food.carbohidratos),
      grasas: Number(food.grasas),
    };
    try {
      if (editId) await api(`/api/alimentos/${editId}`, { method: 'PUT', body });
      else await api('/api/alimentos', { method: 'POST', body });
      setMensaje(editId ? 'Alimento actualizado.' : 'Alimento creado.');
      setEditId(null);
      setFood({ ...EMPTY_FOOD, id_categoria: categorias[0]?.id_categoria || '' });
      await cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function eliminarAlimento(id) {
    setError('');
    try {
      await api(`/api/alimentos/${id}`, { method: 'DELETE' });
      setMensaje('Alimento eliminado.');
      await cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function cambiarRol(id, rol) {
    try {
      await api(`/api/admin/usuarios/${id}`, { method: 'PATCH', body: { rol } });
      await cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function guardarReco(event) {
    event.preventDefault();
    setError('');
    try {
      await api('/api/recomendaciones', { method: 'POST', body: reco });
      setReco({ titulo: '', contenido: '', categoria: 'Alimentación', fecha_publicacion: todayISO() });
      setMensaje('Recomendación publicada.');
      await cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function eliminarReco(id) {
    try {
      await api(`/api/recomendaciones/${id}`, { method: 'DELETE' });
      await cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1 className="text-3xl md:text-[46px] md:leading-none">Administración</h1>
      <div className="mt-4 flex gap-2">
        {['alimentos', 'usuarios', 'recomendaciones'].map((item) => (
          <button key={item} type="button" onClick={() => setTab(item)} className={`h-10 rounded-full px-4 text-sm capitalize ${tab === item ? 'bg-[#187a57] text-white' : 'bg-white text-[#687b73]'}`}>
            {item}
          </button>
        ))}
      </div>
      {error && <p className="mt-4 text-sm text-[#9a3412]">{error}</p>}
      {mensaje && <p className="mt-4 text-sm text-[#187a57]">{mensaje}</p>}

      {tab === 'alimentos' && (
        <div className="mt-6 grid gap-4 lg:grid-cols-[360px_1fr]">
          <form onSubmit={guardarAlimento} className="rounded-[22px] bg-white p-5">
            <h2 className="text-xl">{editId ? 'Editar alimento' : 'Nuevo alimento'}</h2>
            <Field label="Nombre" value={food.nombre} onChange={(value) => setFood({ ...food, nombre: value })} />
            <label className="mt-3 block text-sm">
              Categoría
              <select value={food.id_categoria} onChange={(event) => setFood({ ...food, id_categoria: event.target.value })} className="mt-1 w-full rounded-[14px] border border-[#dde6df] px-3 py-2">
                {categorias.map((item) => <option key={item.id_categoria} value={item.id_categoria}>{item.nombre}</option>)}
              </select>
            </label>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {['calorias', 'proteinas', 'carbohidratos', 'grasas'].map((key) => (
                <Field key={key} label={key} value={food[key]} onChange={(value) => setFood({ ...food, [key]: value })} />
              ))}
            </div>
            <label className="mt-3 block text-sm">
              Momento
              <select value={food.momento} onChange={(event) => setFood({ ...food, momento: event.target.value })} className="mt-1 w-full rounded-[14px] border border-[#dde6df] px-3 py-2">
                {Object.entries(MOMENTO_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="mt-3 block text-sm">
              Sede
              <select value={food.sede} onChange={(event) => setFood({ ...food, sede: event.target.value })} className="mt-1 w-full rounded-[14px] border border-[#dde6df] px-3 py-2">
                {SEDES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <Field label="Horario" value={food.horario} onChange={(value) => setFood({ ...food, horario: value })} />
            <Field label="Alérgenos" value={food.alergenos} onChange={(value) => setFood({ ...food, alergenos: value })} />
            <label className="mt-3 block text-sm">
              Descripción
              <textarea value={food.descripcion} onChange={(event) => setFood({ ...food, descripcion: event.target.value })} className="mt-1 w-full rounded-[14px] border border-[#dde6df] px-3 py-2" rows={3} />
            </label>
            <button type="submit" className="mt-4 h-[46px] w-full rounded-[14px] bg-[#187a57] text-sm text-white">Guardar</button>
          </form>
          <div className="flex flex-col gap-3">
            {alimentos.map((item) => (
              <article key={item.id_alimento} className="flex items-center justify-between gap-3 rounded-[22px] bg-white p-4">
                <div>
                  <p className="text-base">{item.nombre}</p>
                  <p className="text-xs text-[#687b73]">{item.sede} · {item.calorias} kcal</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="text-sm text-[#187a57]" onClick={() => { setEditId(item.id_alimento); setFood(item); }}>Editar</button>
                  <button type="button" className="text-sm text-[#9a3412]" onClick={() => eliminarAlimento(item.id_alimento)}>Eliminar</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {tab === 'usuarios' && (
        <div className="mt-6 flex flex-col gap-3">
          {usuarios.map((item) => (
            <article key={item.id_usuario} className="flex items-center justify-between gap-3 rounded-[22px] bg-white p-4">
              <div>
                <p>{item.nombre}</p>
                <p className="text-xs text-[#687b73]">{item.correo}</p>
              </div>
              <select value={item.rol} onChange={(event) => cambiarRol(item.id_usuario, event.target.value)} className="rounded-[14px] border border-[#dde6df] px-3 py-2 text-sm">
                <option value="usuario">usuario</option>
                <option value="administrador">administrador</option>
              </select>
            </article>
          ))}
        </div>
      )}

      {tab === 'recomendaciones' && (
        <div className="mt-6 grid gap-4 lg:grid-cols-[360px_1fr]">
          <form onSubmit={guardarReco} className="rounded-[22px] bg-white p-5">
            <h2 className="text-xl">Nueva recomendación</h2>
            <Field label="Título" value={reco.titulo} onChange={(value) => setReco({ ...reco, titulo: value })} />
            <Field label="Categoría" value={reco.categoria} onChange={(value) => setReco({ ...reco, categoria: value })} />
            <label className="mt-3 block text-sm">
              Contenido
              <textarea value={reco.contenido} onChange={(event) => setReco({ ...reco, contenido: event.target.value })} className="mt-1 w-full rounded-[14px] border border-[#dde6df] px-3 py-2" rows={4} />
            </label>
            <label className="mt-3 block text-sm">
              Fecha
              <input type="date" value={reco.fecha_publicacion} onChange={(event) => setReco({ ...reco, fecha_publicacion: event.target.value })} className="mt-1 w-full rounded-[14px] border border-[#dde6df] px-3 py-2" />
            </label>
            <button type="submit" className="mt-4 h-[46px] w-full rounded-[14px] bg-[#187a57] text-sm text-white">Publicar</button>
          </form>
          <div className="flex flex-col gap-3">
            {recomendaciones.map((item) => (
              <article key={item.id_recomendacion} className="rounded-[22px] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase text-[#187a57]">{item.categoria}</p>
                    <h3 className="text-lg">{item.titulo}</h3>
                    <p className="mt-1 text-sm text-[#687b73]">{item.contenido}</p>
                  </div>
                  <button type="button" className="text-sm text-[#9a3412]" onClick={() => eliminarReco(item.id_recomendacion)}>Eliminar</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <label className="mt-3 block text-sm capitalize">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-[14px] border border-[#dde6df] px-3 py-2" />
    </label>
  );
}
