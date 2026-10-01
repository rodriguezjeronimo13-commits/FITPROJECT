CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  rol ENUM('usuario', 'administrador') NOT NULL DEFAULT 'usuario',
  meta_calorias INT NOT NULL DEFAULT 2000,
  sede VARCHAR(100) NOT NULL DEFAULT 'Cafetería Central',
  alergenos VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS categorias_alimentos (
  id_categoria INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS alimentos (
  id_alimento INT AUTO_INCREMENT PRIMARY KEY,
  id_categoria INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  calorias DECIMAL(8,2) NOT NULL,
  proteinas DECIMAL(8,2) NOT NULL,
  carbohidratos DECIMAL(8,2) NOT NULL,
  grasas DECIMAL(8,2) NOT NULL,
  descripcion TEXT,
  momento ENUM('desayuno', 'almuerzo', 'cena', 'merienda') NOT NULL DEFAULT 'almuerzo',
  horario VARCHAR(40) NULL,
  sede VARCHAR(100) NOT NULL DEFAULT 'Cafetería Central',
  alergenos VARCHAR(255) NULL,
  imagen VARCHAR(255) NULL,
  CONSTRAINT fk_alimento_categoria FOREIGN KEY (id_categoria) REFERENCES categorias_alimentos(id_categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS registros_alimentos (
  id_registro INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_alimento INT NOT NULL,
  cantidad DECIMAL(8,2) NOT NULL,
  momento ENUM('desayuno', 'almuerzo', 'cena', 'merienda') NOT NULL,
  fecha DATE NOT NULL,
  CONSTRAINT fk_registro_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
  CONSTRAINT fk_registro_alimento FOREIGN KEY (id_alimento) REFERENCES alimentos(id_alimento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS registros_agua (
  id_registro_agua INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  cantidad_ml INT NOT NULL,
  fecha DATE NOT NULL,
  CONSTRAINT fk_agua_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS actividades_fisicas (
  id_actividad INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS registros_actividad (
  id_registro INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_actividad INT NOT NULL,
  duracion_minutos INT NOT NULL,
  fecha DATE NOT NULL,
  CONSTRAINT fk_actividad_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
  CONSTRAINT fk_actividad_tipo FOREIGN KEY (id_actividad) REFERENCES actividades_fisicas(id_actividad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS recomendaciones (
  id_recomendacion INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(150) NOT NULL,
  contenido TEXT NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  fecha_publicacion DATE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS favoritos (
  id_favorito INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_alimento INT NOT NULL,
  UNIQUE KEY uq_favorito (id_usuario, id_alimento),
  CONSTRAINT fk_favorito_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
  CONSTRAINT fk_favorito_alimento FOREIGN KEY (id_alimento) REFERENCES alimentos(id_alimento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
