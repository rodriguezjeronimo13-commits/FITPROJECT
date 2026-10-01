import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Register() {
  const { registrar } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', correo: '', password: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setCargando(true);
    try {
      await registrar(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f7f2] px-4 py-10">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-[22px] bg-white p-8 shadow-[0_8px_24px_rgba(23,53,44,0.08)]">
        <img src="/images/logo.png" alt="FitProject" className="mb-6 w-full rounded-2xl" />
        <h1 className="text-3xl text-[#17352c]">Crear cuenta</h1>
        <p className="mt-2 text-sm text-[#687b73]">Registra tu nombre, correo y contraseña para guardar tus hábitos.</p>
        {[
          ['nombre', 'Nombre', 'text'],
          ['correo', 'Correo', 'email'],
          ['password', 'Contraseña', 'password'],
        ].map(([name, label, type]) => (
          <label key={name} className="mt-4 block text-sm text-[#17352c]">
            {label}
            <input
              name={name}
              type={type}
              required
              value={form[name]}
              onChange={update}
              className="mt-2 w-full rounded-[14px] border border-[#dde6df] px-4 py-3 outline-none focus:border-[#187a57]"
            />
          </label>
        ))}
        {error && <p className="mt-4 text-sm text-[#9a3412]">{error}</p>}
        <button
          type="submit"
          disabled={cargando}
          className="mt-6 h-[46px] w-full rounded-[14px] bg-[#187a57] text-sm text-white disabled:opacity-60"
        >
          {cargando ? 'Creando…' : 'Registrarme'}
        </button>
        <p className="mt-4 text-center text-sm text-[#687b73]">
          ¿Ya tienes cuenta? <Link to="/login" className="text-[#187a57]">Iniciar sesión</Link>
        </p>
      </form>
    </div>
  );
}
