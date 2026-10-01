const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: 'Inicia sesión para continuar.' });
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ message: 'La sesión no es válida. Vuelve a iniciar sesión.' });
  }
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    req.user = null;
  }
  return next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.rol !== 'administrador') {
    return res.status(403).json({ message: 'Solo un administrador puede hacer esta acción.' });
  }
  return next();
}

module.exports = { requireAuth, optionalAuth, requireAdmin };
