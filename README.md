# FITPROJECT

FitProject es una PWA para el menú del campus y el seguimiento de alimentación, agua y actividad de los estudiantes.

- Frontend: React, Tailwind CSS y PWA (`frontend-fitproject`)
- Backend: Node.js y Express (`backend-fitproject`)
- Base de datos: MySQL en Clever Cloud, con un pool de 2 conexiones en local y 1 en Vercel (el plan admite máximo 5 sesiones)

## Cuentas de prueba

- Estudiante: `estudiante@nutricampus.edu` / `Estudiante123!`
- Administrador: `admin@nutricampus.edu` / `Admin123!`

## Desarrollo

1. Copia `backend-fitproject/.env.example` a `.env` y completa las credenciales de Clever Cloud y `JWT_SECRET`.
2. En `backend-fitproject`: `npm install`, `npm run seed`, `npm run dev`.
3. En `frontend-fitproject`: copia `.env.example` a `.env`, `npm install`, `npm run dev`.
4. Abre `http://localhost:5173`.

## Vercel

Despliega el frontend y el backend como dos proyectos.

- Frontend: directorio `frontend-fitproject`. Variable `VITE_API_URL` con la URL pública del backend.
- Backend: directorio `backend-fitproject`. Variables `MYSQL_ADDON_*`, `JWT_SECRET` y `CORS_ORIGIN` con la URL del frontend.

No subas el archivo `.env`.
