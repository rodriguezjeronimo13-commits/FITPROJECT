import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Login() {
  const { entrar } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    setCargando(true);
    try {
      await entrar(correo, password);
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
        <img src="/images/logo.png" alt="FitProject. Nutrición, estudiantes, bienestar" className="mb-6 w-full rounded-2xl" />
        <p className="text-center text-sm text-[#687b73]">Inicia sesión para ver el menú y guardar tus registros.</p>
        <label className="mt-6 block text-sm text-[#17352c]">
          Correo
          <input
            type="email"
            required
            value={correo}
            onChange={(event) => setCorreo(event.target.value)}
            className="mt-2 w-full rounded-[14px] border border-[#dde6df] px-4 py-3 outline-none focus:border-[#187a57]"
          />
        </label>
        <label className="mt-4 block text-sm text-[#17352c]">
          Contraseña
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-[14px] border border-[#dde6df] px-4 py-3 outline-none focus:border-[#187a57]"
          />
        </label>
        {error && <p className="mt-4 text-sm text-[#9a3412]">{error}</p>}
        <button
          type="submit"
          disabled={cargando}
          className="mt-6 h-[46px] w-full rounded-[14px] bg-[#187a57] text-sm text-white disabled:opacity-60"
        >
          {cargando ? 'Entrando…' : 'Entrar'}
        </button>
        <p className="mt-4 text-center text-sm text-[#687b73]">
          ¿Aún no tienes cuenta?{' '}
          <Link to="/registro" className="text-[#187a57]">Crear cuenta</Link>
        </p>
      </form>
    </div>
  );
}
