const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = header.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, role, companyId }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

// Middleware para restringir por papel (ex: só ADMIN ou HR)
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso não autorizado para este recurso' });
    }
    next();
  };
}

module.exports = { authenticate, authorize, JWT_SECRET };
