const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { query } = require('./db');
const { requireAuth, optionalAuth, requireAdmin } = require('./middleware/auth');
const { withNutrition } = require('./healthScore');

const app = express();
const MOMENTOS = ['desayuno', 'almuerzo', 'cena', 'merienda'];
const SEDES = ['Cafetería Central', 'Cafetería Norte'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

const allowedOrigins = new Set([
  'http://localhost:5173',
  'https://fitproject-n99s.vercel.app',
  'http://fitproject-n99s.vercel.app',
  ...(process.env.CORS_ORIGIN || '').split(',').map((item) => item.trim()).filter(Boolean),
]);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
}));
app.use(express.json({ limit: '1mb' }));

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function fail(res, status, message) {
  return res.status(status).json({ message });
}

function signToken(user) {
  return jwt.sign(
    { id_usuario: user.id_usuario, rol: user.rol },
    process.env.JWT_SECRET,
    { expiresIn: '7d' },
  );
}

function publicUser(user) {
  return {
    id_usuario: user.id_usuario,
    nombre: user.nombre,
    correo: user.correo,
    rol: user.rol,
    fecha_registro: user.fecha_registro,
    meta_calorias: user.meta_calorias,
    sede: user.sede,
    alergenos: user.alergenos || '',
  };
}

function momentoPorHora() {
  const hour = Number(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    hour: '2-digit',
    hourCycle: 'h23',
  }).format(new Date()));
  if (hour < 11) return 'desayuno';
  if (hour < 15) return 'almuerzo';
  if (hour < 18) return 'merienda';
  return 'cena';
}

function parseAlergenos(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

async function favoriteIds(userId) {
  if (!userId) return new Set();
  const rows = await query('SELECT id_alimento FROM favoritos WHERE id_usuario = ?', [userId]);
  return new Set(rows.map((row) => row.id_alimento));
}

function presentFood(food, favorites) {
  const item = withNutrition(food);
  item.favorito = favorites.has(food.id_alimento);
  item.calorias = Number(item.calorias);
  item.proteinas = Number(item.proteinas);
  item.carbohidratos = Number(item.carbohidratos);
  item.grasas = Number(item.grasas);
  return item;
}

app.get('/', (req, res) => {
  res.json({
    ok: true,
    nombre: 'FitProject',
    mensaje: 'La API está en línea. Las rutas empiezan en /api.',
  });
});

app.get('/api/health', wrap(async (req, res) => {
  await query('SELECT 1');
  res.json({ ok: true });
}));

app.post('/api/auth/register', wrap(async (req, res) => {
  const nombre = String(req.body.nombre || '').trim();
  const correo = String(req.body.correo || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (nombre.length < 2) return fail(res, 400, 'Escribe tu nombre.');
  if (!EMAIL.test(correo)) return fail(res, 400, 'Escribe un correo válido.');
  if (password.length < 6) return fail(res, 400, 'La contraseña debe tener al menos 6 caracteres.');

  const existing = await query('SELECT id_usuario FROM usuarios WHERE correo = ?', [correo]);
  if (existing.length) return fail(res, 409, 'Ese correo ya está registrado.');

  const hash = await bcrypt.hash(password, 10);
  const result = await query(
    'INSERT INTO usuarios (nombre, correo, password) VALUES (?, ?, ?)',
    [nombre, correo, hash],
  );
  const [user] = await query('SELECT * FROM usuarios WHERE id_usuario = ?', [result.insertId]);
  res.status(201).json({ token: signToken(user), usuario: publicUser(user) });
}));

app.post('/api/auth/login', wrap(async (req, res) => {
  const correo = String(req.body.correo || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!correo || !password) return fail(res, 400, 'Escribe el correo y la contraseña.');

  const [user] = await query('SELECT * FROM usuarios WHERE correo = ?', [correo]);
  if (!user) return fail(res, 401, 'Correo o contraseña incorrectos.');

  const matches = await bcrypt.compare(password, user.password);
  if (!matches) return fail(res, 401, 'Correo o contraseña incorrectos.');

  res.json({ token: signToken(user), usuario: publicUser(user) });
}));

app.get('/api/auth/me', requireAuth, wrap(async (req, res) => {
  const [user] = await query('SELECT * FROM usuarios WHERE id_usuario = ?', [req.user.id_usuario]);
  if (!user) return fail(res, 401, 'La cuenta ya no existe.');
  res.json({ usuario: publicUser(user) });
}));

app.put('/api/perfil', requireAuth, wrap(async (req, res) => {
  const nombre = String(req.body.nombre || '').trim();
  const sede = String(req.body.sede || '').trim();
  const alergenos = String(req.body.alergenos || '').trim();
  const meta = Number(req.body.meta_calorias);

  if (nombre.length < 2) return fail(res, 400, 'Escribe tu nombre.');
  if (!SEDES.includes(sede)) return fail(res, 400, 'Elige una sede válida.');
  if (!Number.isFinite(meta) || meta < 800 || meta > 5000) {
    return fail(res, 400, 'La meta de calorías debe estar entre 800 y 5000.');
  }

  await query(
    'UPDATE usuarios SET nombre = ?, sede = ?, alergenos = ?, meta_calorias = ? WHERE id_usuario = ?',
    [nombre, sede, alergenos, Math.round(meta), req.user.id_usuario],
  );
  const [user] = await query('SELECT * FROM usuarios WHERE id_usuario = ?', [req.user.id_usuario]);
  res.json({ usuario: publicUser(user) });
}));

app.get('/api/sedes', (req, res) => {
  res.json({ sedes: SEDES });
});

app.get('/api/alimentos', optionalAuth, wrap(async (req, res) => {
  const q = String(req.query.q || '').trim();
  const sede = String(req.query.sede || '').trim();
  const momento = String(req.query.momento || '').trim();
  const filters = [];
  const params = [];

  if (q) {
    filters.push('(a.nombre LIKE ? OR a.descripcion LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  if (sede) {
    if (!SEDES.includes(sede)) return fail(res, 400, 'La sede no existe.');
    filters.push('a.sede = ?');
    params.push(sede);
  }
  if (momento) {
    if (!MOMENTOS.includes(momento)) return fail(res, 400, 'El momento del día no es válido.');
    filters.push('a.momento = ?');
    params.push(momento);
  }

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const rows = await query(
    `SELECT a.*, c.nombre AS categoria
     FROM alimentos a
     JOIN categorias_alimentos c ON c.id_categoria = a.id_categoria
     ${where}
     ORDER BY FIELD(a.momento, 'desayuno', 'almuerzo', 'merienda', 'cena'), a.nombre`,
    params,
  );
  const favorites = await favoriteIds(req.user?.id_usuario);
  res.json({ alimentos: rows.map((row) => presentFood(row, favorites)) });
}));

app.get('/api/alimentos/:id', optionalAuth, wrap(async (req, res) => {
  const [food] = await query(
    `SELECT a.*, c.nombre AS categoria
     FROM alimentos a
     JOIN categorias_alimentos c ON c.id_categoria = a.id_categoria
     WHERE a.id_alimento = ?`,
    [req.params.id],
  );
  if (!food) return fail(res, 404, 'No encontramos ese alimento.');
  const favorites = await favoriteIds(req.user?.id_usuario);
  res.json({ alimento: presentFood(food, favorites) });
}));

app.get('/api/categorias', wrap(async (req, res) => {
  const categorias = await query('SELECT * FROM categorias_alimentos ORDER BY nombre');
  res.json({ categorias });
}));

app.get('/api/menu', optionalAuth, wrap(async (req, res) => {
  const sede = SEDES.includes(req.query.sede) ? req.query.sede : 'Cafetería Central';
  const rows = await query(
    `SELECT a.*, c.nombre AS categoria
     FROM alimentos a
     JOIN categorias_alimentos c ON c.id_categoria = a.id_categoria
     WHERE a.sede = ?
     ORDER BY FIELD(a.momento, 'desayuno', 'almuerzo', 'merienda', 'cena'), a.nombre`,
    [sede],
  );
  const favorites = await favoriteIds(req.user?.id_usuario);
  const alimentos = rows.map((row) => presentFood(row, favorites));
  const momento = momentoPorHora();
  const destacado = alimentos.find((item) => item.momento === momento)
    || alimentos.find((item) => item.momento === 'almuerzo')
    || alimentos[0]
    || null;

  let avisoAlergenos = null;
  if (destacado && req.user) {
    const [user] = await query('SELECT alergenos FROM usuarios WHERE id_usuario = ?', [req.user.id_usuario]);
    const propios = parseAlergenos(user?.alergenos);
    const delPlato = parseAlergenos(destacado.alergenos);
    const cruce = propios.filter((item) => delPlato.includes(item));
    avisoAlergenos = cruce.length
      ? { seguro: false, texto: `Este plato contiene ${cruce.join(' y ')}.` }
      : { seguro: true, texto: propios.length ? `Este plato no contiene ${propios.join(' ni ')}.` : 'No tienes alérgenos registrados.' };
  }

  res.json({ sede, momento, destacado, alimentos, avisoAlergenos });
}));

app.post('/api/favoritos/:id', requireAuth, wrap(async (req, res) => {
  const [food] = await query('SELECT id_alimento FROM alimentos WHERE id_alimento = ?', [req.params.id]);
  if (!food) return fail(res, 404, 'No encontramos ese alimento.');
  await query(
    'INSERT IGNORE INTO favoritos (id_usuario, id_alimento) VALUES (?, ?)',
    [req.user.id_usuario, food.id_alimento],
  );
  res.status(201).json({ message: 'Guardado en favoritos.' });
}));

app.delete('/api/favoritos/:id', requireAuth, wrap(async (req, res) => {
  await query(
    'DELETE FROM favoritos WHERE id_usuario = ? AND id_alimento = ?',
    [req.user.id_usuario, req.params.id],
  );
  res.json({ message: 'Quitado de favoritos.' });
}));

app.get('/api/favoritos', requireAuth, wrap(async (req, res) => {
  const rows = await query(
    `SELECT a.*, c.nombre AS categoria
     FROM favoritos f
     JOIN alimentos a ON a.id_alimento = f.id_alimento
     JOIN categorias_alimentos c ON c.id_categoria = a.id_categoria
     WHERE f.id_usuario = ?
     ORDER BY a.nombre`,
    [req.user.id_usuario],
  );
  const favorites = new Set(rows.map((row) => row.id_alimento));
  res.json({ alimentos: rows.map((row) => presentFood(row, favorites)) });
}));

app.post('/api/registros', requireAuth, wrap(async (req, res) => {
  const idAlimento = Number(req.body.id_alimento);
  const cantidad = Number(req.body.cantidad);
  const momento = String(req.body.momento || '');
  const fecha = String(req.body.fecha || '');

  if (!Number.isInteger(idAlimento)) return fail(res, 400, 'Elige un alimento.');
  if (!Number.isFinite(cantidad) || cantidad <= 0 || cantidad > 20) {
    return fail(res, 400, 'La cantidad debe ser mayor que 0 y menor que 20.');
  }
  if (!MOMENTOS.includes(momento)) return fail(res, 400, 'Elige desayuno, almuerzo, cena o merienda.');
  if (!FECHA.test(fecha)) return fail(res, 400, 'La fecha no es válida.');

  const [food] = await query('SELECT id_alimento FROM alimentos WHERE id_alimento = ?', [idAlimento]);
  if (!food) return fail(res, 404, 'No encontramos ese alimento.');

  const result = await query(
    'INSERT INTO registros_alimentos (id_usuario, id_alimento, cantidad, momento, fecha) VALUES (?, ?, ?, ?, ?)',
    [req.user.id_usuario, idAlimento, cantidad, momento, fecha],
  );
  res.status(201).json({ id_registro: result.insertId, message: 'Alimento registrado.' });
}));

app.get('/api/registros', requireAuth, wrap(async (req, res) => {
  const fecha = String(req.query.fecha || '');
  if (!FECHA.test(fecha)) return fail(res, 400, 'Indica la fecha del día.');
  const rows = await query(
    `SELECT r.id_registro, r.cantidad, r.momento, r.fecha,
            a.id_alimento, a.nombre, a.calorias, a.proteinas, a.carbohidratos, a.grasas, a.descripcion, a.imagen
     FROM registros_alimentos r
     JOIN alimentos a ON a.id_alimento = r.id_alimento
     WHERE r.id_usuario = ? AND r.fecha = ?
     ORDER BY FIELD(r.momento, 'desayuno', 'almuerzo', 'merienda', 'cena'), r.id_registro`,
    [req.user.id_usuario, fecha],
  );
  res.json({
    registros: rows.map((row) => ({
      ...row,
      cantidad: Number(row.cantidad),
      calorias: Number(row.calorias) * Number(row.cantidad),
      proteinas: Number(row.proteinas) * Number(row.cantidad),
      carbohidratos: Number(row.carbohidratos) * Number(row.cantidad),
      grasas: Number(row.grasas) * Number(row.cantidad),
    })),
  });
}));

app.delete('/api/registros/:id', requireAuth, wrap(async (req, res) => {
  const result = await query(
    'DELETE FROM registros_alimentos WHERE id_registro = ? AND id_usuario = ?',
    [req.params.id, req.user.id_usuario],
  );
  if (!result.affectedRows) return fail(res, 404, 'No encontramos ese registro.');
  res.json({ message: 'Registro eliminado.' });
}));

app.post('/api/agua', requireAuth, wrap(async (req, res) => {
  const cantidad = Number(req.body.cantidad_ml);
  const fecha = String(req.body.fecha || '');
  if (!Number.isInteger(cantidad) || cantidad < 50 || cantidad > 2000) {
    return fail(res, 400, 'La cantidad de agua debe estar entre 50 y 2000 ml.');
  }
  if (!FECHA.test(fecha)) return fail(res, 400, 'La fecha no es válida.');
  const result = await query(
    'INSERT INTO registros_agua (id_usuario, cantidad_ml, fecha) VALUES (?, ?, ?)',
    [req.user.id_usuario, cantidad, fecha],
  );
  res.status(201).json({ id_registro_agua: result.insertId, message: 'Agua registrada.' });
}));

app.get('/api/actividades', wrap(async (req, res) => {
  const actividades = await query('SELECT * FROM actividades_fisicas ORDER BY nombre');
  res.json({ actividades });
}));

app.post('/api/actividad', requireAuth, wrap(async (req, res) => {
  const idActividad = Number(req.body.id_actividad);
  const duracion = Number(req.body.duracion_minutos);
  const fecha = String(req.body.fecha || '');
  if (!Number.isInteger(idActividad)) return fail(res, 400, 'Elige una actividad.');
  if (!Number.isInteger(duracion) || duracion < 5 || duracion > 300) {
    return fail(res, 400, 'La duración debe estar entre 5 y 300 minutos.');
  }
  if (!FECHA.test(fecha)) return fail(res, 400, 'La fecha no es válida.');
  const [activity] = await query('SELECT id_actividad FROM actividades_fisicas WHERE id_actividad = ?', [idActividad]);
  if (!activity) return fail(res, 404, 'No encontramos esa actividad.');
  const result = await query(
    'INSERT INTO registros_actividad (id_usuario, id_actividad, duracion_minutos, fecha) VALUES (?, ?, ?, ?)',
    [req.user.id_usuario, idActividad, duracion, fecha],
  );
  res.status(201).json({ id_registro: result.insertId, message: 'Actividad registrada.' });
}));

app.get('/api/resumen', requireAuth, wrap(async (req, res) => {
  const fecha = String(req.query.fecha || '');
  if (!FECHA.test(fecha)) return fail(res, 400, 'Indica la fecha del resumen.');

  const [user] = await query('SELECT meta_calorias FROM usuarios WHERE id_usuario = ?', [req.user.id_usuario]);
  const [totales] = await query(
    `SELECT COALESCE(SUM(a.calorias * r.cantidad), 0) AS calorias,
            COALESCE(SUM(a.proteinas * r.cantidad), 0) AS proteinas,
            COALESCE(SUM(a.carbohidratos * r.cantidad), 0) AS carbohidratos,
            COALESCE(SUM(a.grasas * r.cantidad), 0) AS grasas
     FROM registros_alimentos r
     JOIN alimentos a ON a.id_alimento = r.id_alimento
     WHERE r.id_usuario = ? AND r.fecha = ?`,
    [req.user.id_usuario, fecha],
  );
  const [agua] = await query(
    'SELECT COALESCE(SUM(cantidad_ml), 0) AS ml FROM registros_agua WHERE id_usuario = ? AND fecha = ?',
    [req.user.id_usuario, fecha],
  );
  const [actividad] = await query(
    'SELECT COALESCE(SUM(duracion_minutos), 0) AS minutos FROM registros_actividad WHERE id_usuario = ? AND fecha = ?',
    [req.user.id_usuario, fecha],
  );
  const registros = await query(
    `SELECT r.id_registro, r.cantidad, r.momento, a.nombre,
            (a.calorias * r.cantidad) AS calorias
     FROM registros_alimentos r
     JOIN alimentos a ON a.id_alimento = r.id_alimento
     WHERE r.id_usuario = ? AND r.fecha = ?
     ORDER BY FIELD(r.momento, 'desayuno', 'almuerzo', 'merienda', 'cena')`,
    [req.user.id_usuario, fecha],
  );
  const actividades = await query(
    `SELECT r.id_registro, r.duracion_minutos, f.nombre
     FROM registros_actividad r
     JOIN actividades_fisicas f ON f.id_actividad = r.id_actividad
     WHERE r.id_usuario = ? AND r.fecha = ?`,
    [req.user.id_usuario, fecha],
  );

  const calorias = Number(totales.calorias);
  const meta = user?.meta_calorias || 2000;
  res.json({
    fecha,
    meta_calorias: meta,
    calorias,
    proteinas: Number(totales.proteinas),
    carbohidratos: Number(totales.carbohidratos),
    grasas: Number(totales.grasas),
    restante: Math.max(meta - calorias, 0),
    agua_ml: Number(agua.ml),
    actividad_minutos: Number(actividad.minutos),
    registros: registros.map((row) => ({ ...row, cantidad: Number(row.cantidad), calorias: Number(row.calorias) })),
    actividades,
  });
}));

app.get('/api/historial', requireAuth, wrap(async (req, res) => {
  const comidas = await query(
    `SELECT r.fecha, SUM(a.calorias * r.cantidad) AS calorias, COUNT(*) AS platos
     FROM registros_alimentos r
     JOIN alimentos a ON a.id_alimento = r.id_alimento
     WHERE r.id_usuario = ?
     GROUP BY r.fecha
     ORDER BY r.fecha DESC
     LIMIT 30`,
    [req.user.id_usuario],
  );
  const agua = await query(
    `SELECT fecha, SUM(cantidad_ml) AS ml
     FROM registros_agua
     WHERE id_usuario = ?
     GROUP BY fecha
     ORDER BY fecha DESC
     LIMIT 30`,
    [req.user.id_usuario],
  );
  const actividad = await query(
    `SELECT fecha, SUM(duracion_minutos) AS minutos
     FROM registros_actividad
     WHERE id_usuario = ?
     GROUP BY fecha
     ORDER BY fecha DESC
     LIMIT 30`,
    [req.user.id_usuario],
  );
  res.json({
    alimentacion: comidas.map((row) => ({ ...row, calorias: Number(row.calorias) })),
    agua,
    actividad,
  });
}));

app.get('/api/recomendaciones', wrap(async (req, res) => {
  const recomendaciones = await query(
    'SELECT * FROM recomendaciones ORDER BY fecha_publicacion DESC, id_recomendacion DESC',
  );
  res.json({ recomendaciones });
}));

function validateFood(body) {
  const nombre = String(body.nombre || '').trim();
  const descripcion = String(body.descripcion || '').trim();
  const momento = String(body.momento || '');
  const sede = String(body.sede || '');
  const horario = String(body.horario || '').trim();
  const alergenos = String(body.alergenos || '').trim();
  const idCategoria = Number(body.id_categoria);
  const calorias = Number(body.calorias);
  const proteinas = Number(body.proteinas);
  const carbohidratos = Number(body.carbohidratos);
  const grasas = Number(body.grasas);

  if (nombre.length < 2) return 'Escribe el nombre del alimento.';
  if (!Number.isInteger(idCategoria)) return 'Elige una categoría.';
  if (!MOMENTOS.includes(momento)) return 'Elige el momento del día.';
  if (!SEDES.includes(sede)) return 'Elige una sede.';
  for (const [label, value] of [
    ['calorías', calorias],
    ['proteínas', proteinas],
    ['carbohidratos', carbohidratos],
    ['grasas', grasas],
  ]) {
    if (!Number.isFinite(value) || value < 0 || value > 5000) {
      return `Revisa el valor de ${label}.`;
    }
  }

  return {
    nombre,
    descripcion,
    momento,
    sede,
    horario,
    alergenos,
    idCategoria,
    calorias,
    proteinas,
    carbohidratos,
    grasas,
  };
}

app.post('/api/alimentos', requireAuth, requireAdmin, wrap(async (req, res) => {
  const data = validateFood(req.body);
  if (typeof data === 'string') return fail(res, 400, data);
  const [category] = await query('SELECT id_categoria FROM categorias_alimentos WHERE id_categoria = ?', [data.idCategoria]);
  if (!category) return fail(res, 400, 'La categoría no existe.');
  const result = await query(
    `INSERT INTO alimentos
      (id_categoria, nombre, calorias, proteinas, carbohidratos, grasas, descripcion, momento, horario, sede, alergenos)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.idCategoria, data.nombre, data.calorias, data.proteinas, data.carbohidratos, data.grasas,
      data.descripcion, data.momento, data.horario, data.sede, data.alergenos,
    ],
  );
  res.status(201).json({ id_alimento: result.insertId, message: 'Alimento creado.' });
}));

app.put('/api/alimentos/:id', requireAuth, requireAdmin, wrap(async (req, res) => {
  const data = validateFood(req.body);
  if (typeof data === 'string') return fail(res, 400, data);
  const result = await query(
    `UPDATE alimentos SET
      id_categoria = ?, nombre = ?, calorias = ?, proteinas = ?, carbohidratos = ?, grasas = ?,
      descripcion = ?, momento = ?, horario = ?, sede = ?, alergenos = ?
     WHERE id_alimento = ?`,
    [
      data.idCategoria, data.nombre, data.calorias, data.proteinas, data.carbohidratos, data.grasas,
      data.descripcion, data.momento, data.horario, data.sede, data.alergenos, req.params.id,
    ],
  );
  if (!result.affectedRows) return fail(res, 404, 'No encontramos ese alimento.');
  res.json({ message: 'Alimento actualizado.' });
}));

app.delete('/api/alimentos/:id', requireAuth, requireAdmin, wrap(async (req, res) => {
  const used = await query('SELECT id_registro FROM registros_alimentos WHERE id_alimento = ? LIMIT 1', [req.params.id]);
  if (used.length) return fail(res, 409, 'No se puede eliminar: hay estudiantes que ya lo registraron.');
  await query('DELETE FROM favoritos WHERE id_alimento = ?', [req.params.id]);
  const result = await query('DELETE FROM alimentos WHERE id_alimento = ?', [req.params.id]);
  if (!result.affectedRows) return fail(res, 404, 'No encontramos ese alimento.');
  res.json({ message: 'Alimento eliminado.' });
}));

app.get('/api/admin/usuarios', requireAuth, requireAdmin, wrap(async (req, res) => {
  const usuarios = await query(
    `SELECT id_usuario, nombre, correo, rol, fecha_registro, meta_calorias, sede
     FROM usuarios ORDER BY fecha_registro DESC`,
  );
  res.json({ usuarios });
}));

app.patch('/api/admin/usuarios/:id', requireAuth, requireAdmin, wrap(async (req, res) => {
  const rol = String(req.body.rol || '');
  if (!['usuario', 'administrador'].includes(rol)) return fail(res, 400, 'El rol no es válido.');
  if (Number(req.params.id) === req.user.id_usuario && rol !== 'administrador') {
    return fail(res, 400, 'No puedes quitarte el rol de administrador.');
  }
  const result = await query('UPDATE usuarios SET rol = ? WHERE id_usuario = ?', [rol, req.params.id]);
  if (!result.affectedRows) return fail(res, 404, 'No encontramos ese usuario.');
  res.json({ message: 'Usuario actualizado.' });
}));

function validateRecommendation(body) {
  const titulo = String(body.titulo || '').trim();
  const contenido = String(body.contenido || '').trim();
  const categoria = String(body.categoria || '').trim();
  const fecha = String(body.fecha_publicacion || '');
  if (titulo.length < 3) return 'Escribe un título.';
  if (contenido.length < 10) return 'Escribe el contenido de la recomendación.';
  if (categoria.length < 3) return 'Escribe la categoría.';
  if (!FECHA.test(fecha)) return 'La fecha de publicación no es válida.';
  return { titulo, contenido, categoria, fecha };
}

app.post('/api/recomendaciones', requireAuth, requireAdmin, wrap(async (req, res) => {
  const data = validateRecommendation(req.body);
  if (typeof data === 'string') return fail(res, 400, data);
  const result = await query(
    'INSERT INTO recomendaciones (titulo, contenido, categoria, fecha_publicacion) VALUES (?, ?, ?, ?)',
    [data.titulo, data.contenido, data.categoria, data.fecha],
  );
  res.status(201).json({ id_recomendacion: result.insertId, message: 'Recomendación creada.' });
}));

app.put('/api/recomendaciones/:id', requireAuth, requireAdmin, wrap(async (req, res) => {
  const data = validateRecommendation(req.body);
  if (typeof data === 'string') return fail(res, 400, data);
  const result = await query(
    `UPDATE recomendaciones SET titulo = ?, contenido = ?, categoria = ?, fecha_publicacion = ?
     WHERE id_recomendacion = ?`,
    [data.titulo, data.contenido, data.categoria, data.fecha, req.params.id],
  );
  if (!result.affectedRows) return fail(res, 404, 'No encontramos esa recomendación.');
  res.json({ message: 'Recomendación actualizada.' });
}));

app.delete('/api/recomendaciones/:id', requireAuth, requireAdmin, wrap(async (req, res) => {
  const result = await query('DELETE FROM recomendaciones WHERE id_recomendacion = ?', [req.params.id]);
  if (!result.affectedRows) return fail(res, 404, 'No encontramos esa recomendación.');
  res.json({ message: 'Recomendación eliminada.' });
}));

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  console.error(error);
  const tooMany = error && (error.code === 'ER_CON_COUNT_ERROR' || error.code === 'PROTOCOL_CONNECTION_LOST');
  res.status(tooMany ? 503 : 500).json({
    message: tooMany
      ? 'La base de datos está ocupada. Espera un momento e inténtalo de nuevo.'
      : 'No se pudo completar la operación. Inténtalo de nuevo.',
  });
});

if (!process.env.VERCEL) {
  const port = Number(process.env.PORT || 4000);
  app.listen(port, () => {
    console.log(`API FitProject en http://localhost:${port}`);
  });
}

module.exports = app;
