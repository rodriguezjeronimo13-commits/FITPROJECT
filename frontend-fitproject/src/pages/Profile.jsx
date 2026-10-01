import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { SEDES } from '../lib/dates';

export default function Profile() {
  const { usuario, actualizar, salir } = useAuth();
  const [form, setForm] = useState({
    nombre: usuario?.nombre || '',
    sede: usuario?.sede || SEDES[0],
    alergenos: usuario?.alergenos || '',
    meta_calorias: usuario?.meta_calorias || 2000,
  });
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!usuario) return;
    setForm({
      nombre: usuario.nombre,
      sede: usuario.sede,
      alergenos: usuario.alergenos || '',
      meta_calorias: usuario.meta_calorias,
    });
  }, [usuario]);

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    setMensaje('');
    try {
      const data = await api('/api/perfil', {
        method: 'PUT',
        body: { ...form, meta_calorias: Number(form.meta_calorias) },
      });
      actualizar(data.usuario);
      setMensaje('Perfil actualizado.');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-3xl md:text-[46px] md:leading-none">Perfil</h1>
      <p className="mt-2 text-sm text-[#687b73]">{usuario?.correo}</p>
      <form onSubmit={onSubmit} className="mt-6 rounded-[22px] bg-white p-6">
        <label className="block text-sm">
          Nombre
          <input name="nombre" value={form.nombre} onChange={update} className="mt-2 w-full rounded-[14px] border border-[#dde6df] px-4 py-3" />
        </label>
        <label className="mt-4 block text-sm">
          Sede habitual
          <select name="sede" value={form.sede} onChange={update} className="mt-2 w-full rounded-[14px] border border-[#dde6df] px-4 py-3">
            {SEDES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="mt-4 block text-sm">
          Alérgenos
          <input name="alergenos" value={form.alergenos} onChange={update} placeholder="maní, mariscos" className="mt-2 w-full rounded-[14px] border border-[#dde6df] px-4 py-3" />
        </label>
        <label className="mt-4 block text-sm">
          Meta de calorías
          <input name="meta_calorias" type="number" min="800" max="5000" value={form.meta_calorias} onChange={update} className="mt-2 w-full rounded-[14px] border border-[#dde6df] px-4 py-3" />
        </label>
        {error && <p className="mt-4 text-sm text-[#9a3412]">{error}</p>}
        {mensaje && <p className="mt-4 text-sm text-[#187a57]">{mensaje}</p>}
        <button type="submit" className="mt-6 h-[46px] rounded-[14px] bg-[#187a57] px-5 text-sm text-white">Guardar cambios</button>
      </form>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link to="/progreso" className="inline-flex h-[46px] items-center rounded-[14px] border border-[#dde6df] bg-white px-5 text-sm">Ver mi progreso</Link>
        {usuario?.rol === 'administrador' && (
          <Link to="/admin" className="inline-flex h-[46px] items-center rounded-[14px] border border-[#dde6df] bg-white px-5 text-sm">Administración</Link>
        )}
        <button type="button" onClick={salir} className="h-[46px] rounded-[14px] border border-[#dde6df] bg-white px-5 text-sm">Cerrar sesión</button>
      </div>
    </div>
  );
}
