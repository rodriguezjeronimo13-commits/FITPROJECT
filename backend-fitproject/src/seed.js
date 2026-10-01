const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_ADDON_HOST,
    user: process.env.MYSQL_ADDON_USER,
    password: process.env.MYSQL_ADDON_PASSWORD,
    database: process.env.MYSQL_ADDON_DB,
    port: Number(process.env.MYSQL_ADDON_PORT || 3306),
    multipleStatements: true,
    charset: 'utf8mb4',
    connectTimeout: 20000,
  });

  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await connection.query(schema);

  const [[{ total }]] = await connection.query('SELECT COUNT(*) AS total FROM alimentos');
  if (total > 0) {
    console.log('La base ya tiene alimentos. No se volvió a sembrar.');
    await connection.end();
    return;
  }

  const hoy = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  const adminPass = await bcrypt.hash('Admin123!', 10);
  const studentPass = await bcrypt.hash('Estudiante123!', 10);

  await connection.query(
    `INSERT INTO usuarios (nombre, correo, password, rol, meta_calorias, sede, alergenos) VALUES
     (?, ?, ?, 'administrador', 2000, 'Cafetería Central', 'maní, mariscos'),
     (?, ?, ?, 'usuario', 2000, 'Cafetería Central', 'maní, mariscos')`,
    [
      'Administrador',
      'admin@nutricampus.edu',
      adminPass,
      'Ana Estudiante',
      'estudiante@nutricampus.edu',
      studentPass,
    ],
  );

  await connection.query(
    `INSERT INTO categorias_alimentos (nombre) VALUES
     ('Platos combinados'), ('Cereales'), ('Proteínas'), ('Frutas'), ('Lácteos')`,
  );

  await connection.query(
    `INSERT INTO alimentos
      (id_categoria, nombre, calorias, proteinas, carbohidratos, grasas, descripcion, momento, horario, sede, alergenos, imagen)
     VALUES
     (1, 'Bowl de pollo y vegetales', 540, 38, 62, 16,
       'Pollo a la plancha, arroz integral, aguacate, frijoles negros, maíz y pico de gallo.',
       'almuerzo', '12:00—15:00', 'Cafetería Central', '', '/images/bowl.png'),
     (2, 'Avena con fruta y yogurt', 320, 14, 48, 8,
       'Avena cocida, yogurt natural, banano y fresas.',
       'desayuno', '07:00—10:00', 'Cafetería Central', 'lácteos', NULL),
     (3, 'Ensalada de atún', 410, 32, 18, 16,
       'Atún, lechuga, tomate, maíz y aderezo de limón.',
       'almuerzo', '12:00—15:00', 'Cafetería Central', 'pescado', NULL),
     (1, 'Wrap de pavo', 380, 22, 36, 14,
       'Tortilla integral, pavo, espinaca y queso fresco.',
       'merienda', '15:30—17:30', 'Cafetería Central', 'lácteos', NULL),
     (1, 'Sopa de lentejas', 360, 18, 48, 8,
       'Lentejas, zanahoria, papa y cilantro.',
       'cena', '17:30—20:00', 'Cafetería Central', '', NULL),
     (5, 'Arepa con queso', 290, 10, 32, 12,
       'Arepa de maíz y queso campesino.',
       'desayuno', '07:00—10:00', 'Cafetería Norte', 'lácteos', NULL),
     (1, 'Arroz con pollo', 610, 34, 70, 18,
       'Arroz, pollo desmechado, arveja y zanahoria.',
       'almuerzo', '12:00—15:00', 'Cafetería Norte', '', NULL),
     (4, 'Fruta picada', 120, 1, 28, 0,
       'Papaya, piña y melón.',
       'merienda', '15:30—17:30', 'Cafetería Norte', '', NULL),
     (3, 'Pescado al horno', 430, 36, 12, 18,
       'Filete de pescado, ensalada verde y limón.',
       'cena', '17:30—20:00', 'Cafetería Norte', 'pescado', NULL)`,
  );

  await connection.query(
    `INSERT INTO actividades_fisicas (nombre, descripcion) VALUES
     ('Caminata', 'Caminar a paso constante por el campus.'),
     ('Trote', 'Trote suave en cancha o parque.'),
     ('Fútbol', 'Partido o práctica de fútbol.'),
     ('Bicicleta', 'Recorrido en bicicleta.'),
     ('Estiramiento', 'Movilidad y estiramientos.')`,
  );

  await connection.query(
    `INSERT INTO recomendaciones (titulo, contenido, categoria, fecha_publicacion) VALUES
     ('Arma tu plato', 'Llena la mitad del plato con verduras, un cuarto con proteína y un cuarto con cereal integral.', 'Alimentación', ?),
     ('Agua durante la jornada', 'Lleva una botella y toma agua entre clases. Un vaso equivale a unos 250 ml.', 'Hidratación', ?),
     ('Muévete entre clases', 'Camina 10 minutos después del almuerzo. Ayuda a la digestión y suma actividad del día.', 'Actividad', ?),
     ('Desayuna antes de la primera clase', 'Un desayuno con proteína y fruta sostiene la atención durante la mañana.', 'Hábitos', ?)`,
    [hoy, hoy, hoy, hoy],
  );

  const [[estudiante]] = await connection.query(
    'SELECT id_usuario FROM usuarios WHERE correo = ?',
    ['estudiante@nutricampus.edu'],
  );
  const [[bowl]] = await connection.query(
    'SELECT id_alimento FROM alimentos WHERE nombre = ?',
    ['Bowl de pollo y vegetales'],
  );
  const [[avena]] = await connection.query(
    'SELECT id_alimento FROM alimentos WHERE nombre = ?',
    ['Avena con fruta y yogurt'],
  );
  const [[wrap]] = await connection.query(
    'SELECT id_alimento FROM alimentos WHERE nombre = ?',
    ['Wrap de pavo'],
  );

  await connection.query(
    `INSERT INTO registros_alimentos (id_usuario, id_alimento, cantidad, momento, fecha) VALUES
     (?, ?, 1, 'desayuno', ?),
     (?, ?, 1, 'almuerzo', ?),
     (?, ?, 1, 'merienda', ?)`,
    [
      estudiante.id_usuario, avena.id_alimento, hoy,
      estudiante.id_usuario, bowl.id_alimento, hoy,
      estudiante.id_usuario, wrap.id_alimento, hoy,
    ],
  );

  await connection.query(
    'INSERT INTO registros_agua (id_usuario, cantidad_ml, fecha) VALUES (?, 500, ?)',
    [estudiante.id_usuario, hoy],
  );

  await connection.query(
    'INSERT INTO favoritos (id_usuario, id_alimento) VALUES (?, ?)',
    [estudiante.id_usuario, bowl.id_alimento],
  );

  console.log('Base lista. Cuentas de prueba creadas.');
  await connection.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
