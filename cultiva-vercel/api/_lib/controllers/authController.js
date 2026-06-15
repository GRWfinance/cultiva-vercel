const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { JWT_SECRET } = require('../middleware/auth');

async function register(req, res) {
  try {
    const { name, email, password, companyId, role, departmentId, jobTitle } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'E-mail já cadastrado' });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        companyId,
        role: role || 'EMPLOYEE',
        departmentId,
        jobTitle,
        hireDate: new Date(),
      },
    });

    res.status(201).json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' });

    const token = jwt.sign(
      { id: user.id, role: user.role, companyId: user.companyId },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { register, login };
